import { NextRequest, NextResponse } from 'next/server';
import { useSecondChance, getUserSecondChance, hasUserUsedSecondChance, getAllSecondChances, updatePrediction } from '@/lib/database';
import fs from 'fs';
import path from 'path';

// Helper function to load matches from JSON
function loadMatches() {
  try {
    const matchesPath = path.join(process.cwd(), 'src/data/matches.json');
    const matchesData = fs.readFileSync(matchesPath, 'utf8');
    return JSON.parse(matchesData);
  } catch (error) {
    console.error('Error loading matches:', error);
    return [];
  }
}

// Check if any match has finished (making second chances unavailable)
function hasAnyMatchFinished() {
  const matches = loadMatches();
  return matches.some((match: any) => match.result !== null);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const secondChance = getUserSecondChance.get(parseInt(userId));
      const hasUsedChance = hasUserUsedSecondChance.get(parseInt(userId));
      const anyMatchFinished = hasAnyMatchFinished();
      
      return NextResponse.json({ 
        secondChance,
        hasUsedSecondChance: (hasUsedChance as { count: number } | undefined)?.count ?? 0 > 0,
        isSecondChanceAvailable: !anyMatchFinished
      });
    } else {
      const allSecondChances = getAllSecondChances.all();
      const anyMatchFinished = hasAnyMatchFinished();
      
      return NextResponse.json({ 
        secondChances: allSecondChances,
        isSecondChanceAvailable: !anyMatchFinished
      });
    }
  } catch (error) {
    console.error('Error fetching second chances:', error);
    return NextResponse.json({ error: 'Failed to fetch second chances' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, matchId, oldPrediction, newPrediction } = await request.json();
    
    if (!userId || !matchId || !oldPrediction || !newPrediction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['1', 'X', '2'].includes(newPrediction) || !['1', 'X', '2'].includes(oldPrediction)) {
      return NextResponse.json({ error: 'Invalid prediction values' }, { status: 400 });
    }
    
    // Check if any match has finished - if so, second chances are not available
    if (hasAnyMatchFinished()) {
      return NextResponse.json({ 
        error: 'Second chances sunt indisponibile - primul meci s-a terminat deja',
        locked: true
      }, { status: 423 }); // 423 Locked
    }
    
    // Check if user has already used their second chance
    const hasUsedChance = hasUserUsedSecondChance.get(userId);
    if ((hasUsedChance as { count: number } | undefined)?.count ?? 0 > 0) {
      return NextResponse.json({ 
        error: 'Ai folosit deja șansa ta de modificare. Poți modifica o singură predicție.',
        locked: true
      }, { status: 409 }); // 409 Conflict
    }
    
    try {
      // Use a transaction to ensure both operations succeed or fail together
      const transaction = () => {
        // Record the second chance usage
        useSecondChance.run(userId, matchId, oldPrediction, newPrediction);
        
        // Update the prediction
        updatePrediction.run(newPrediction, userId, matchId);
      };
      
      // Execute transaction
      transaction();
      
      return NextResponse.json({ 
        success: true,
        message: 'Second chance folosit cu succes! Predicția a fost modificată.' 
      });
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ 
          error: 'Ai folosit deja șansa ta de modificare',
          locked: true
        }, { status: 409 });
      }
      throw dbError;
    }
    
  } catch (error) {
    console.error('Error using second chance:', error);
    return NextResponse.json({ error: 'Failed to use second chance' }, { status: 500 });
  }
}
