import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, upsertPrediction, deletePrediction } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { adminUserId, targetUserId, matchId, prediction, action } = await request.json();
    
    if (!adminUserId || !targetUserId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the requesting user is admin
    const adminUser = getUserByName.get(adminUserId) as any;
    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }
    
    if (action === 'delete') {
      // Delete prediction
      const result = deletePrediction.run(targetUserId, matchId);
      if (result.changes === 0) {
        return NextResponse.json({ error: 'No prediction found to delete' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Prediction deleted successfully' });
    } else {
      // Update or create prediction
      if (!prediction || !['1', 'X', '2'].includes(prediction)) {
        return NextResponse.json({ error: 'Invalid prediction value' }, { status: 400 });
      }
      
      upsertPrediction.run(targetUserId, matchId, prediction);
      return NextResponse.json({ message: 'Prediction updated successfully' });
    }
  } catch (error) {
    console.error('Error handling prediction override:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
