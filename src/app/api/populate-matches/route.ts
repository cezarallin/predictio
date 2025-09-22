import { NextRequest, NextResponse } from 'next/server';
import { getWeekMatches } from '@/lib/football-api';
import { writeFileSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fromDate, toDate } = await request.json();
    
    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'fromDate and toDate are required (format: YYYY-MM-DD)' }, { status: 400 });
    }

    console.log(`🔄 Populating matches from ${fromDate} to ${toDate}...`);

    // Fetch matches from API
    const matches = await getWeekMatches(fromDate, toDate);

    if (matches.length === 0) {
      return NextResponse.json({ 
        message: 'No matches found for the specified period',
        fromDate,
        toDate,
        matches: []
      });
    }

    // Transform matches to include odds in the format we want
    const matchesWithOdds = matches.map(match => ({
      id: match.id,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      league: match.league,
      match_date: match.matchDate,
      odds_1: match.odds?.home || null,
      odds_x: match.odds?.draw || null,
      odds_2: match.odds?.away || null,
      result: null // Will be set later when match finishes
    }));

    // Write to JSON file
    const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
    writeFileSync(matchesPath, JSON.stringify(matchesWithOdds, null, 2));

    console.log(`✅ ${matchesWithOdds.length} matches saved to matches.json`);

    return NextResponse.json({
      message: 'Matches populated successfully',
      fromDate,
      toDate,
      matchesFound: matchesWithOdds.length,
      matches: matchesWithOdds.slice(0, 5) // Show first 5 as preview
    });

  } catch (error) {
    console.error('Error populating matches:', error);
    return NextResponse.json({ error: 'Failed to populate matches' }, { status: 500 });
  }
}
