import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, clearAllPredictions } from '@/lib/database';

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

    console.log(`🗑️ Admin ${userId} clearing all predictions...`);

    // Clear all predictions from database
    clearAllPredictions.run();
    
    console.log(`✅ All predictions cleared by admin ${userId}`);

    return NextResponse.json({ 
      message: 'All predictions cleared successfully',
      clearedBy: userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing predictions:', error);
    return NextResponse.json({ error: 'Failed to clear predictions' }, { status: 500 });
  }
}
