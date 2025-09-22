import { NextRequest, NextResponse } from 'next/server';
import { insertPrediction, getAllPredictions, getPredictionsByUser, getUserPrediction } from '@/lib/database';
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

// Helper function to combine predictions with match data
function combinePredictionsWithMatches(predictions: any[]) {
  const matches = loadMatches();
  const matchMap = new Map(matches.map((match: any) => [match.id, match]));
  
  return predictions.map((prediction: any) => {
    const match = matchMap.get(prediction.match_id) || {};
    return {
      ...prediction,
      home_team: (match as any)?.home_team || 'Unknown',
      away_team: (match as any)?.away_team || 'Unknown',
      match_date: (match as any)?.match_date,
      odds_1: (match as any)?.odds_1,
      odds_x: (match as any)?.odds_x,
      odds_2: (match as any)?.odds_2,
      result: (match as any)?.result
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const predictions = getPredictionsByUser.all(parseInt(userId));
      const predictionsWithMatches = combinePredictionsWithMatches(predictions);
      return NextResponse.json({ predictions: predictionsWithMatches });
    } else {
      const predictions = getAllPredictions.all();
      const predictionsWithMatches = combinePredictionsWithMatches(predictions);
      return NextResponse.json({ predictions: predictionsWithMatches });
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, matchId, prediction } = await request.json();
    
    if (!userId || !matchId || !prediction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['1', 'X', '2'].includes(prediction)) {
      return NextResponse.json({ error: 'Invalid prediction value' }, { status: 400 });
    }
    
    // Check if user already has a prediction for this match
    const existingPrediction = getUserPrediction.get(userId, matchId);
    if (existingPrediction) {
      return NextResponse.json({ 
        error: 'Prediction already exists and cannot be modified',
        existing: existingPrediction,
        locked: true
      }, { status: 409 }); // 409 Conflict
    }
    
    // Insert new prediction (will fail if somehow a duplicate gets through due to race conditions)
    try {
      insertPrediction.run(userId, matchId, prediction);
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ 
          error: 'Prediction already exists and cannot be modified',
          locked: true
        }, { status: 409 });
      }
      throw dbError; // Re-throw if it's a different error
    }
    
    const predictions = getAllPredictions.all();
    const predictionsWithMatches = combinePredictionsWithMatches(predictions);
    return NextResponse.json({ predictions: predictionsWithMatches, success: true });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  }
}
