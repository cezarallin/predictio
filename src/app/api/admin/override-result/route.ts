import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { getUserByName } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { adminUserId, matchId, result, action } = await request.json();
    
    if (!adminUserId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the requesting user is admin
    const adminUser = getUserByName.get(adminUserId) as any;
    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }
    
    const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
    const matchesData = readFileSync(matchesPath, 'utf8');
    const matches = JSON.parse(matchesData);
    
    const matchIndex = matches.findIndex((m: any) => m.id === matchId);
    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    if (action === 'clear_result') {
      // Clear the result
      const previousResult = matches[matchIndex].result;
      matches[matchIndex].result = null;
      
      // Save back to file
      writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
      
      return NextResponse.json({ 
        message: `Result cleared for match ${matchId}`,
        previousResult,
        matches
      });
    } else {
      // Set result
      if (!result || !['1', 'X', '2'].includes(result)) {
        return NextResponse.json({ error: 'Invalid result value' }, { status: 400 });
      }
      
      const previousResult = matches[matchIndex].result;
      matches[matchIndex].result = result;
      
      // Save back to file
      writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
      
      // Note: The scoring will be automatically recalculated on the frontend
      // based on the new result when the component refreshes
      
      return NextResponse.json({ 
        message: `Result updated for match ${matchId}`,
        previousResult,
        newResult: result,
        matches
      });
    }
  } catch (error) {
    console.error('Error handling result override:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
