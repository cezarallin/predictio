import { NextRequest, NextResponse } from 'next/server';
import { getUserByName } from '@/lib/database';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
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

    console.log(`🗑️ Admin ${userId} clearing all match results...`);

    try {
      // Read current matches from JSON file
      const matchesPath = path.join(process.cwd(), 'src', 'data', 'matches.json');
      const matchesData = readFileSync(matchesPath, 'utf8');
      const matches = JSON.parse(matchesData);
      
      // Clear all results (set to null)
      const clearedMatches = matches.map((match: any) => ({
        ...match,
        result: null
      }));
      
      // Save back to file
      writeFileSync(matchesPath, JSON.stringify(clearedMatches, null, 2));
      
      console.log(`✅ All match results cleared by admin ${userId}`);

      return NextResponse.json({ 
        message: 'All match results cleared successfully',
        clearedBy: userId,
        matchesCleared: matches.length,
        timestamp: new Date().toISOString()
      });

    } catch (fileError) {
      console.error('Error clearing match results:', fileError);
      return NextResponse.json({ error: 'Failed to clear match results from file' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error clearing results:', error);
    return NextResponse.json({ error: 'Failed to clear results' }, { status: 500 });
  }
}
