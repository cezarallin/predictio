import { NextRequest, NextResponse } from 'next/server';
import { insertMatch, getAllMatches, updateMatchResult } from '@/lib/database';
import { getWeekendFixtures } from '@/lib/football-api';

export async function GET() {
  try {
    const matches = getAllMatches.all();
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    console.log('🔄 POST /api/matches called with action:', body?.action);
    
    if (body.action === 'update_result') {
      const { matchId, result } = body;
      
      if (!matchId || !result || !['1', 'X', '2'].includes(result)) {
        return NextResponse.json({ error: 'Invalid match ID or result' }, { status: 400 });
      }
      
      updateMatchResult.run(result, matchId);
      
      const matches = getAllMatches.all();
      return NextResponse.json({ matches, updated: true });
    }
    
    // No more refresh action - only admin can load matches via /api/admin/load-week
    return NextResponse.json({ 
      error: 'Invalid action. Only "update_result" is allowed. Use admin controls to load matches.' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error processing matches request:', error);
    return NextResponse.json({ error: 'Failed to process request', details: error }, { status: 500 });
  }
}
