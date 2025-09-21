import { NextRequest, NextResponse } from 'next/server';
import { insertMatch, getAllMatches, getUserByName, clearAllMatches, clearAllPredictions } from '@/lib/database';
import { getWeekMatches } from '@/lib/football-api';
import { format, startOfWeek, addDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { userId, weekStartDate } = await request.json();
    
    if (!userId || !weekStartDate) {
      return NextResponse.json({ error: 'Missing userId or weekStartDate' }, { status: 400 });
    }

    // Verify user is admin
    const user = await new Promise((resolve, reject) => {
      try {
        const result = getUserByName.get(userId);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    if (!user || !(user as any).is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log(`🔧 Admin starting NEW GAME PERIOD for week starting ${weekStartDate}`);

    // Calculate Friday to Monday of the selected week
    const weekStart = new Date(weekStartDate);
    const friday = startOfWeek(weekStart, { weekStartsOn: 1 }); // Monday = 1
    const fridayOfWeek = addDays(friday, 4); // Friday
    const mondayOfWeek = addDays(friday, 7); // Next Monday

    const fromDate = format(fridayOfWeek, 'yyyy-MM-dd');
    const toDate = format(mondayOfWeek, 'yyyy-MM-dd');

    console.log(`📅 NEW PERIOD: ${fromDate} to ${toDate} (Friday to Monday)`);
    console.log(`🗑️ Clearing previous matches and predictions...`);

    // Clear all existing matches and predictions (start fresh period)
    clearAllMatches.run();
    clearAllPredictions.run();
    
    console.log(`✅ Previous period cleared. Making ONE API call for new period...`);

    // Fetch matches for this specific week (ONE TIME ONLY)
    const weekMatches = await getWeekMatches(fromDate, toDate);

    if (weekMatches.length > 0) {
      // Insert matches in database (will persist until admin selects new period)
      for (const match of weekMatches) {
        try {
          insertMatch.run(
            match.id,
            match.homeTeam,
            match.awayTeam,
            match.league,
            match.matchDate,
            match.odds?.home || null,
            match.odds?.draw || null,
            match.odds?.away || null
          );
        } catch (dbError) {
          console.warn(`Failed to insert match ${match.homeTeam} vs ${match.awayTeam}:`, dbError);
        }
      }
      console.log(`✅ NEW GAME PERIOD: ${weekMatches.length} matches loaded and saved`);
      console.log(`📊 Users will see these matches until admin selects new period`);
    } else {
      console.log(`⚠️ No matches found for selected period ${fromDate} to ${toDate}`);
    }

    const matches = getAllMatches.all();
    return NextResponse.json({ 
      matches, 
      weekLoaded: true,
      matchesFound: weekMatches.length,
      weekRange: { from: fromDate, to: toDate }
    });

  } catch (error) {
    console.error('Error loading week matches:', error);
    return NextResponse.json({ error: 'Failed to load week matches' }, { status: 500 });
  }
}
