import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, clearAllPredictions } from '@/lib/database';
import { getWeekMatches } from '@/lib/football-api';
import { format, startOfWeek, addDays } from 'date-fns';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

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
    console.log(`🗑️ Clearing previous predictions...`);

    // Clear all existing predictions (start fresh period)
    clearAllPredictions.run();
    
    console.log(`✅ Previous predictions cleared. Making ONE API call for new period...`);

    // Fetch matches for this specific week (ONE TIME ONLY)
    const weekMatches = await getWeekMatches(fromDate, toDate);

    if (weekMatches.length > 0) {
      // Transform matches to the JSON format
      const matchesWithOdds = weekMatches.map(match => ({
        id: match.id,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        league: match.league,
        match_date: match.matchDate,
        odds_1: match.odds?.home || null,
        odds_x: match.odds?.draw || null,
        odds_2: match.odds?.away || null,
        result: null
      }));

      // Save matches to JSON file
      const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
      writeFileSync(matchesPath, JSON.stringify(matchesWithOdds, null, 2));

      console.log(`✅ NEW GAME PERIOD: ${weekMatches.length} matches loaded and saved`);
      console.log(`📊 Users will see these matches until admin selects new period`);
    } else {
      console.log(`⚠️ No matches found for selected period ${fromDate} to ${toDate}`);
    }

    // Read matches from JSON file to return
    const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
    let matches = [];
    try {
      const matchesData = readFileSync(matchesPath, 'utf8');
      matches = JSON.parse(matchesData);
    } catch (error) {
      console.warn('No matches file found or invalid JSON');
      matches = [];
    }
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
