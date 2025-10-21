import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, clearAllPredictions, incrementCurrentWeek, resetAllPlayTypesToFun } from '@/lib/database';

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

    console.log(`🗑️ Admin ${userId} resetting leaderboard (clearing predictions and incrementing week)...`);

    // Clear all predictions from database
    clearAllPredictions.run();
    
    // Reset all play types to 'fun'
    resetAllPlayTypesToFun();
    
    // Increment current week - this will "hide" all users until they login again
    const newWeek = incrementCurrentWeek();
    
    console.log(`✅ Leaderboard reset by admin ${userId}. New week: ${newWeek}. All users hidden until they log in. All play types reset to 'fun'.`);

    return NextResponse.json({ 
      message: `Clasament resetat cu succes. Săptămâna nouă: ${newWeek}. Utilizatorii vor apărea doar după autentificare. Toți joacă pentru 'Fun' până aleg 'Miza'.`,
      clearedBy: userId,
      newWeek: newWeek,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json({ error: 'Failed to reset leaderboard' }, { status: 500 });
  }
}
