import { NextRequest, NextResponse } from 'next/server';
import { 
  createH2HChallenge, 
  getH2HChallengeById, 
  getUserH2HChallenges, 
  getAllH2HChallenges,
  updateH2HChallengeStatus,
  completeH2HChallenge,
  deleteH2HChallenge,
  getActiveH2HChallengesByDate,
  getAllPredictions,
  getUserByName,
  getPlayerBoost
} from '@/lib/database';
import fs from 'fs';
import path from 'path';

// Helper function to load matches from JSON
function loadMatches() {
  try {
    const matchesPath = path.join(process.cwd(), 'src/data/matches.json');
    const matchesData = fs.readFileSync(matchesPath, 'utf8');
    const parsedData = JSON.parse(matchesData);
    return parsedData.matches || parsedData || [];
  } catch (error) {
    console.error('Error loading matches:', error);
    return [];
  }
}

// Helper function to get unique dates from matches
function getAvailableDates() {
  try {
    const matches = loadMatches();
    // Extract just the date part (YYYY-MM-DD) from each match_date and make them unique
    const uniqueDates = [...new Set(matches.map((match: any) => {
      const date = new Date(match.match_date);
      // Format as YYYY-MM-DD
      return date.getFullYear() + '-' + 
             String(date.getMonth() + 1).padStart(2, '0') + '-' + 
             String(date.getDate()).padStart(2, '0');
    }))];
    return uniqueDates.sort();
  } catch (error) {
    console.error('Error getting available dates:', error);
    return [];
  }
}

// Helper function to get detailed match-by-match results for H2H
function getDetailedH2HResults(challengeId: number, challengerId: number, challengedId: number, matchDate: string) {
  const matches = loadMatches();
  const predictions = getAllPredictions.all();
  
  // Get matches for the specific date
  const dateMatches = matches.filter((match: any) => {
    const matchDateObj = new Date(match.match_date);
    const matchDateStr = matchDateObj.getFullYear() + '-' + 
                        String(matchDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(matchDateObj.getDate()).padStart(2, '0');
    return matchDateStr === matchDate;
  });
  
  if (dateMatches.length === 0) {
    return { matches: [], canCalculate: false };
  }
  
  // Get predictions for both users on this date
  const challengerPredictions = predictions.filter((p: any) => 
    p.user_id === challengerId && 
    dateMatches.some((m: any) => m.id === p.match_id)
  );
  
  const challengedPredictions = predictions.filter((p: any) => 
    p.user_id === challengedId && 
    dateMatches.some((m: any) => m.id === p.match_id)
  );
  
  // Create prediction maps for easier lookup
  const challengerPredMap = new Map(challengerPredictions.map((p: any) => [p.match_id, p.prediction]));
  const challengedPredMap = new Map(challengedPredictions.map((p: any) => [p.match_id, p.prediction]));
  
  // Get boost information for both players
  const challengerBoost = getPlayerBoost.get(challengerId) as any;
  const challengedBoost = getPlayerBoost.get(challengedId) as any;
  
  // Build detailed match results
  const matchResults = dateMatches.map((match: any) => {
    const challengerPred = challengerPredMap.get(match.id);
    const challengedPred = challengedPredMap.get(match.id);
    
    let challengerCorrect = false;
    let challengedCorrect = false;
    let challengerOdds = 0;
    let challengedOdds = 0;
    let challengerHasBoost = false;
    let challengedHasBoost = false;
    
    // Check if players have boost on this match
    if (challengerBoost && challengerBoost.match_id === match.id) {
      challengerHasBoost = true;
    }
    if (challengedBoost && challengedBoost.match_id === match.id) {
      challengedHasBoost = true;
    }
    
    if (match.result && challengerPred) {
      challengerCorrect = match.result === challengerPred;
      if (challengerCorrect) {
        challengerOdds = parseFloat(
          challengerPred === '1' ? match.odds_1 : 
          challengerPred === 'X' ? match.odds_x : match.odds_2
        ) || 0;
        // Apply boost multiplier if player has boost on this match
        if (challengerHasBoost) {
          challengerOdds *= 2;
        }
      }
    }
    
    if (match.result && challengedPred) {
      challengedCorrect = match.result === challengedPred;
      if (challengedCorrect) {
        challengedOdds = parseFloat(
          challengedPred === '1' ? match.odds_1 : 
          challengedPred === 'X' ? match.odds_x : match.odds_2
        ) || 0;
        // Apply boost multiplier if player has boost on this match
        if (challengedHasBoost) {
          challengedOdds *= 2;
        }
      }
    }
    
    return {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      result: match.result,
      cancelled: match.cancelled,
      hasResult: !!match.result && !match.cancelled,
      challenger: {
        prediction: challengerPred,
        correct: challengerCorrect,
        odds: challengerOdds,
        hasBoost: challengerHasBoost
      },
      challenged: {
        prediction: challengedPred,
        correct: challengedCorrect,
        odds: challengedOdds,
        hasBoost: challengedHasBoost
      }
    };
  });
  
  // Calculate totals
  let challengerScore = 0;
  let challengedScore = 0;
  let challengerOddsTotal = 0.0;
  let challengedOddsTotal = 0.0;
  
  matchResults.forEach((match: any) => {
    if (match.challenger.correct) {
      challengerScore++;
      challengerOddsTotal += match.challenger.odds;
    }
    if (match.challenged.correct) {
      challengedScore++;
      challengedOddsTotal += match.challenged.odds;
    }
  });
  
  // Determine winner based on highest odds total (not number of correct predictions)
  let winnerId = null;
  if (challengerOddsTotal > challengedOddsTotal) {
    winnerId = challengerId;
  } else if (challengedOddsTotal > challengerOddsTotal) {
    winnerId = challengedId;
  }
  // If odds are equal, it's a tie (winnerId remains null)
  
  const completedMatches = matchResults.filter((m: any) => m.hasResult).length;
  const canCalculate = completedMatches > 0;
  
  return {
    matches: matchResults,
    challengerScore,
    challengedScore,
    challengerOddsTotal: challengerOddsTotal || 0,
    challengedOddsTotal: challengedOddsTotal || 0,
    winnerId,
    canCalculate,
    completedMatches,
    totalMatches: matchResults.length
  };
}

// Helper function to calculate H2H results
function calculateH2HResults(challengeId: number, challengerId: number, challengedId: number, matchDate: string) {
  const matches = loadMatches();
  const predictions = getAllPredictions.all();
  
  // Get matches for the specific date
  const dateMatches = matches.filter((match: any) => 
    match.match_date === matchDate && match.result
  );
  
  if (dateMatches.length === 0) {
    return null; // No completed matches for this date yet
  }
  
  // Get predictions for both users on this date
  const challengerPredictions = predictions.filter((p: any) => 
    p.user_id === challengerId && 
    dateMatches.some((m: any) => m.id === p.match_id)
  );
  
  const challengedPredictions = predictions.filter((p: any) => 
    p.user_id === challengedId && 
    dateMatches.some((m: any) => m.id === p.match_id)
  );
  
  // Calculate scores and odds totals
  let challengerScore = 0;
  let challengedScore = 0;
  let challengerOddsTotal = 0.0;
  let challengedOddsTotal = 0.0;
  
  // Get boost information for both players
  const challengerBoost = getPlayerBoost.get(challengerId) as any;
  const challengedBoost = getPlayerBoost.get(challengedId) as any;
  
  // Check challenger's predictions
  challengerPredictions.forEach((pred: any) => {
    const match = dateMatches.find((m: any) => m.id === pred.match_id);
    if (match && match.result === pred.prediction) {
      challengerScore++;
      // Add odds based on prediction
      let odds = pred.prediction === '1' ? match.odds_1 : 
                 pred.prediction === 'X' ? match.odds_x : match.odds_2;
      odds = parseFloat(odds) || 0;
      
      // Apply boost multiplier if player has boost on this match
      if (challengerBoost && challengerBoost.match_id === pred.match_id) {
        odds *= 2;
      }
      
      challengerOddsTotal += odds;
    }
  });
  
  // Check challenged user's predictions
  challengedPredictions.forEach((pred: any) => {
    const match = dateMatches.find((m: any) => m.id === pred.match_id);
    if (match && match.result === pred.prediction) {
      challengedScore++;
      // Add odds based on prediction
      let odds = pred.prediction === '1' ? match.odds_1 : 
                 pred.prediction === 'X' ? match.odds_x : match.odds_2;
      odds = parseFloat(odds) || 0;
      
      // Apply boost multiplier if player has boost on this match
      if (challengedBoost && challengedBoost.match_id === pred.match_id) {
        odds *= 2;
      }
      
      challengedOddsTotal += odds;
    }
  });
  
  // Determine winner based on highest odds total (not number of correct predictions)
  let winnerId = null;
  if (challengerOddsTotal > challengedOddsTotal) {
    winnerId = challengerId;
  } else if (challengedOddsTotal > challengerOddsTotal) {
    winnerId = challengedId;
  }
  // If odds are equal, it's a tie (winnerId remains null)
  
  return {
    challengerScore,
    challengedScore,
    challengerOddsTotal,
    challengedOddsTotal,
    winnerId
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const challengeId = searchParams.get('challengeId');
    const matchDate = searchParams.get('date');
    
    if (action === 'available_dates') {
      const dates = getAvailableDates();
      return NextResponse.json({ dates });
    }
    
    if (action === 'get_detailed_results' && challengeId) {
      const challenge = getH2HChallengeById.get(parseInt(challengeId)) as any;
      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
      
      const detailedResults = getDetailedH2HResults(
        challenge.id, 
        challenge.challenger_id, 
        challenge.challenged_id, 
        challenge.match_date
      );
      
      return NextResponse.json({ 
        challenge,
        detailedResults
      });
    }
    
    if (action === 'calculate_results' && challengeId) {
      const challenge = getH2HChallengeById.get(parseInt(challengeId)) as any;
      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
      
      const detailedResults = getDetailedH2HResults(
        challenge.id, 
        challenge.challenger_id, 
        challenge.challenged_id, 
        challenge.match_date
      );
      
      if (!detailedResults.canCalculate) {
        return NextResponse.json({ 
          message: 'Nu sunt încă rezultate pentru această dată',
          canCalculate: false 
        });
      }
      
      // Update challenge with results
      completeH2HChallenge.run(
        detailedResults.winnerId,
        detailedResults.challengerScore,
        detailedResults.challengedScore,
        detailedResults.challengerOddsTotal,
        detailedResults.challengedOddsTotal,
        challenge.id
      );
      
      return NextResponse.json({ 
        detailedResults, 
        challenge: getH2HChallengeById.get(parseInt(challengeId)) as any,
        calculated: true 
      });
    }
    
    if (challengeId) {
      const challenge = getH2HChallengeById.get(parseInt(challengeId)) as any;
      return NextResponse.json({ challenge });
    }
    
    if (userId) {
      const challenges = getUserH2HChallenges.all(parseInt(userId), parseInt(userId));
      return NextResponse.json({ challenges });
    }
    
    if (matchDate) {
      const challenges = getActiveH2HChallengesByDate.all(matchDate);
      return NextResponse.json({ challenges });
    }
    
    // Get all challenges
    const challenges = getAllH2HChallenges.all();
    return NextResponse.json({ challenges });
    
  } catch (error) {
    console.error('Error in H2H GET:', error);
    return NextResponse.json({ error: 'Failed to fetch H2H data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, challengerId, challengedId, matchDate, challengeId, status } = await request.json();
    
    if (action === 'create_challenge') {
      if (!challengerId || !challengedId || !matchDate) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      if (challengerId === challengedId) {
        return NextResponse.json({ error: 'Nu te poți provoca pe tine însuți' }, { status: 400 });
      }
      
      // Check if both users exist
      const challenger = getUserByName.get(''); // We'll need to get by ID instead
      // For now, assume users exist since we have IDs
      
      // Create the challenge
      const result = createH2HChallenge.run(challengerId, challengedId, matchDate);
      const newChallenge = getH2HChallengeById.get(result.lastInsertRowid) as any;
      
      return NextResponse.json({ 
        challenge: newChallenge,
        message: 'Provocare creată cu succes!',
        success: true 
      });
    }
    
    if (action === 'update_status') {
      if (!challengeId || !status) {
        return NextResponse.json({ error: 'Missing challenge ID or status' }, { status: 400 });
      }
      
      if (!['accepted', 'declined'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      
      updateH2HChallengeStatus.run(status, challengeId);
      const updatedChallenge = getH2HChallengeById.get(challengeId) as any;
      
      return NextResponse.json({ 
        challenge: updatedChallenge,
        message: status === 'accepted' ? 'Provocare acceptată!' : 'Provocare refuzată!',
        success: true 
      });
    }
    
    if (action === 'delete_challenge') {
      if (!challengeId) {
        return NextResponse.json({ error: 'Missing challenge ID' }, { status: 400 });
      }
      
      deleteH2HChallenge.run(challengeId);
      
      return NextResponse.json({ 
        message: 'Provocare ștearsă cu succes!',
        success: true 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in H2H POST:', error);
    return NextResponse.json({ error: 'Failed to process H2H request' }, { status: 500 });
  }
}
