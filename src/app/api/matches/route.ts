import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
    const matchesData = readFileSync(matchesPath, 'utf8');
    const matches = JSON.parse(matchesData);
    
    // Sort matches by date (ascending - earliest first)
    const sortedMatches = matches.sort((a: any, b: any) => {
      return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
    });
    
    return NextResponse.json({ matches: sortedMatches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ matches: [] }); // Return empty array if no matches file
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, matchId, result } = await request.json();
    
    if (action === 'update_result') {
      if (!matchId || !result || !['1', 'X', '2'].includes(result)) {
        return NextResponse.json({ error: 'Invalid match ID or result' }, { status: 400 });
      }
      
      try {
        // Read current matches
        const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
        const matchesData = readFileSync(matchesPath, 'utf8');
        const matches = JSON.parse(matchesData);
        
        // Update match result
        const matchIndex = matches.findIndex((m: any) => m.id === matchId);
        if (matchIndex === -1) {
          return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        
        matches[matchIndex].result = result;
        
        // Save back to file
        writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
        
        return NextResponse.json({ matches, updated: true });
      } catch (fileError) {
        console.error('Error updating match result:', fileError);
        return NextResponse.json({ error: 'Failed to update match result' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action. Only "update_result" is allowed.' }, { status: 400 });
  } catch (error) {
    console.error('Error processing matches request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
