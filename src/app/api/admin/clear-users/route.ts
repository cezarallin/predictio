import { NextRequest, NextResponse } from 'next/server';
import { clearAllPredictions, clearAllPlayerBoosts, clearAllReactions, clearAllSecondChances, clearAllSuperSpins, clearAllH2HChallenges, getUserByName } from '@/lib/database';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { adminUserId } = await request.json();
    
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log(`🗑️ Admin ${adminUserId} clearing all non-admin users and related data...`);

    // Clear all related data first (to avoid foreign key constraints)
    // NOTE: We do NOT clear bank entries - they will be preserved with user_name
    clearAllPredictions.run();
    clearAllPlayerBoosts.run();
    clearAllReactions.run();
    clearAllSecondChances.run();
    clearAllSuperSpins.run();
    clearAllH2HChallenges.run();
    
    // Delete only non-admin users
    // Bank entries will have their user_id set to NULL (ON DELETE SET NULL)
    // but user_name will be preserved for history
    const deleteNonAdminUsers = db.prepare(`
      DELETE FROM users WHERE is_admin = 0 OR is_admin IS NULL
    `);
    const result = deleteNonAdminUsers.run();
    
    console.log(`✅ Deleted ${result.changes} non-admin users and all related data by admin ${adminUserId}`);

    return NextResponse.json({ 
      message: `Successfully deleted ${result.changes} non-admin users and related data (predictions, boosts, reactions, second chances, super spins, H2H challenges). Bank entries preserved with user names. Admin users preserved.`,
      clearedBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing users:', error);
    return NextResponse.json({ error: 'Failed to clear users' }, { status: 500 });
  }
}
