import { NextRequest, NextResponse } from 'next/server';
import { insertPrediction, getAllPredictions, getPredictionsByUser } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const predictions = getPredictionsByUser.all(parseInt(userId));
      return NextResponse.json({ predictions });
    } else {
      const predictions = getAllPredictions.all();
      return NextResponse.json({ predictions });
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
    
    insertPrediction.run(userId, matchId, prediction);
    
    const predictions = getAllPredictions.all();
    return NextResponse.json({ predictions, success: true });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  }
}
