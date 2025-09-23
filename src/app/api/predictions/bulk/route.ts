import { NextRequest, NextResponse } from 'next/server';
import { insertPrediction, getUserPrediction, getAllPredictions } from '../../../../lib/database';

function combinePredictionsWithMatches(predictions: any[]) {
  // This function should match the one from the regular predictions route
  // For now, return predictions as-is since we're focusing on the bulk submission
  return predictions;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, predictions } = await request.json();
    
    if (!userId || !predictions || typeof predictions !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }
    
    const errors: string[] = [];
    const successful: string[] = [];
    
    // Process each prediction
    for (const [matchId, prediction] of Object.entries(predictions)) {
      if (!['1', 'X', '2'].includes(prediction as string)) {
        errors.push(`Invalid prediction value for match ${matchId}: ${prediction}`);
        continue;
      }
      
      // Check if user already has a prediction for this match
      const existingPrediction = getUserPrediction.get(userId, matchId);
      if (existingPrediction) {
        errors.push(`Prediction for match ${matchId} already exists and cannot be modified`);
        continue;
      }
      
      // Insert new prediction
      try {
        insertPrediction.run(userId, matchId, prediction);
        successful.push(matchId);
      } catch (dbError: any) {
        if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
          errors.push(`Prediction for match ${matchId} already exists and cannot be modified`);
        } else {
          errors.push(`Database error for match ${matchId}: ${dbError.message}`);
        }
      }
    }
    
    // If all predictions failed, return error
    if (successful.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: 'Failed to save any predictions', 
        details: errors 
      }, { status: 400 });
    }
    
    // Return success with details
    const predictions_data = getAllPredictions.all();
    const predictionsWithMatches = combinePredictionsWithMatches(predictions_data);
    
    return NextResponse.json({ 
      predictions: predictionsWithMatches, 
      success: true,
      successCount: successful.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error creating bulk predictions:', error);
    return NextResponse.json({ error: 'Failed to create predictions' }, { status: 500 });
  }
}
