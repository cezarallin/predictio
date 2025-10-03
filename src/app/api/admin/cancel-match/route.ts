import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, getAllPredictions } from '@/lib/database';
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
    const { adminUserId, matchId } = await request.json();
    
    if (!adminUserId || !matchId) {
      return NextResponse.json({ error: 'Admin user ID și match ID sunt necesare' }, { status: 400 });
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
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Meciul nu a fost găsit' }, { status: 404 });
    }

    const match = matches[matchIndex];
    
    // Check if match already has a result
    if (match.result) {
      return NextResponse.json({ error: 'Meciul are deja un rezultat. Nu poate fi anulat.' }, { status: 400 });
    }

    // Get all predictions for this match
    const allPredictions = getAllPredictions.all();
    const matchPredictions = allPredictions.filter((p: any) => p.match_id === matchId);
    
    if (matchPredictions.length === 0) {
      return NextResponse.json({ error: 'Nu există predicții pentru acest meci' }, { status: 400 });
    }

    // Check if all predictions are the same
    const firstPrediction = (matchPredictions[0] as any).prediction;
    const allSamePrediction = matchPredictions.every((p: any) => p.prediction === firstPrediction);
    
    if (!allSamePrediction) {
      return NextResponse.json({ 
        error: 'Nu toate predicțiile sunt identice. Meciul poate fi anulat doar când toți jucătorii au aceeași predicție.',
        predictionsCount: matchPredictions.length,
        predictions: matchPredictions.map((p: any) => ({ user: p.user_name, prediction: p.prediction }))
      }, { status: 400 });
    }

    // Mark match as cancelled
    matches[matchIndex].cancelled = true;
    
    // Save updated matches back to file
    const updatedData = { matches };
    try {
      fs.writeFileSync(matchesPath, JSON.stringify(updatedData, null, 2));
    } catch (error) {
      return NextResponse.json({ error: 'Nu s-au putut salva modificările' }, { status: 500 });
    }

    console.log(`🚫 Admin ${adminUserId} a anulat meciul ${match.home_team} vs ${match.away_team} (ID: ${matchId})`);
    console.log(`   Toți ${matchPredictions.length} jucătorii aveau predicția: ${firstPrediction}`);

    return NextResponse.json({ 
      message: `Meciul ${match.home_team} vs ${match.away_team} a fost anulat cu succes.`,
      matchId,
      totalPredictions: matchPredictions.length,
      unifiedPrediction: firstPrediction,
      cancelledBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cancelling match:', error);
    return NextResponse.json({ error: 'Nu s-a putut anula meciul' }, { status: 500 });
  }
}
