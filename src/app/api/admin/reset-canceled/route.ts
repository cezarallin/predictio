import { NextRequest, NextResponse } from 'next/server';
import { getUserByName } from '@/lib/database';
import fs from 'fs';
import path from 'path';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  odds_1: number | null;
  odds_x: number | null;
  odds_2: number | null;
  result: '1' | 'X' | '2' | null;
  cancelled?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { adminUserId } = await request.json();
    
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID este necesar' }, { status: 400 });
    }
    
    // Verify user is admin
    const user = await new Promise((resolve, reject) => {
      try {
        const result = getUserByName.get(adminUserId);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    if (!user || !(user as any).is_admin) {
      return NextResponse.json({ error: 'Acces admin necesar' }, { status: 403 });
    }

    // Load matches from JSON file
    const matchesPath = path.join(process.cwd(), 'src/data/matches.json');
    let matchesData;
    try {
      const data = fs.readFileSync(matchesPath, 'utf8');
      matchesData = JSON.parse(data);
    } catch (error) {
      return NextResponse.json({ error: 'Nu s-au putut încărca meciurile' }, { status: 500 });
    }

    const matches: Match[] = matchesData.matches || [];
    
    // Find and count canceled matches
    const canceledMatches = matches.filter(match => match.cancelled === true);
    
    if (canceledMatches.length === 0) {
      return NextResponse.json({ 
        message: 'Nu există meciuri anulate de resetat.',
        canceledCount: 0 
      });
    }

    // Reset all canceled matches - remove the cancelled property
    const resetMatches = matches.map(match => {
      if (match.cancelled === true) {
        const { cancelled, ...resetMatch } = match;
        return resetMatch;
      }
      return match;
    });
    
    // Save updated matches back to file
    const updatedData = { matches: resetMatches };
    try {
      fs.writeFileSync(matchesPath, JSON.stringify(updatedData, null, 2));
    } catch (error) {
      return NextResponse.json({ error: 'Nu s-au putut salva modificările' }, { status: 500 });
    }

    console.log(`🔄 Admin ${adminUserId} a resetat ${canceledMatches.length} meciuri anulate`);
    console.log(`   Meciuri resetate: ${canceledMatches.map(m => `${m.home_team} vs ${m.away_team}`).join(', ')}`);

    return NextResponse.json({ 
      message: `Au fost resetate cu succes ${canceledMatches.length} meciuri anulate.`,
      canceledCount: canceledMatches.length,
      resetMatches: canceledMatches.map(m => ({
        id: m.id,
        match: `${m.home_team} vs ${m.away_team}`,
        league: m.league
      })),
      resetBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting canceled matches:', error);
    return NextResponse.json({ error: 'Nu s-au putut reseta meciurile anulate' }, { status: 500 });
  }
}

