import { NextRequest, NextResponse } from 'next/server';
import { getUserByName } from '@/lib/database';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { adminUserId, targetUserId } = await request.json();
    
    if (!adminUserId || !targetUserId) {
      return NextResponse.json({ error: 'Admin user ID and target user ID are required' }, { status: 400 });
    }
    
    // Verify user is admin
    const adminUser = getUserByName.get(adminUserId) as any;
    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get target user details
    const getTargetUser = db.prepare('SELECT * FROM users WHERE id = ?');
    const targetUser = getTargetUser.get(targetUserId) as any;

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Prevent deleting admin users
    if (targetUser.is_admin) {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    console.log(`🗑️ Admin ${adminUserId} deleting user ${targetUser.name} (ID: ${targetUserId})...`);

    // Use a transaction to ensure all deletions happen atomically
    const transaction = db.transaction(() => {
      // Delete all related data for this user
      const deletePredictions = db.prepare('DELETE FROM predictions WHERE user_id = ?');
      const deleteBoosts = db.prepare('DELETE FROM player_boosts WHERE user_id = ?');
      const deleteReactions = db.prepare('DELETE FROM reactions WHERE user_id = ? OR target_user_id = ?');
      const deleteSecondChances = db.prepare('DELETE FROM second_chances WHERE user_id = ?');
      const deleteSuperSpins = db.prepare('DELETE FROM super_spins WHERE user_id = ?');
      const deleteH2HChallenges = db.prepare('DELETE FROM h2h_challenges WHERE challenger_id = ? OR challenged_id = ?');
      
      // Update/delete foreign key references before deleting user
      // Update H2H winner to NULL (winner_id allows NULL)
      const updateH2HWinner = db.prepare('UPDATE h2h_challenges SET winner_id = NULL WHERE winner_id = ?');
      // Delete finalized gameweeks where user is winner (winner_id is NOT NULL)
      const deleteFinalizedGameweeks = db.prepare('DELETE FROM finalized_gameweeks WHERE winner_id = ?');
      
      deletePredictions.run(targetUserId);
      deleteBoosts.run(targetUserId);
      deleteReactions.run(targetUserId, targetUserId);
      deleteSecondChances.run(targetUserId);
      deleteSuperSpins.run(targetUserId);
      deleteH2HChallenges.run(targetUserId, targetUserId);
      
      // Update/delete winner references before deleting user
      updateH2HWinner.run(targetUserId);
      deleteFinalizedGameweeks.run(targetUserId);
      
      // Finally delete the user
      const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');
      deleteUser.run(targetUserId);
    });

    transaction();
    
    console.log(`✅ Deleted user ${targetUser.name} (ID: ${targetUserId}) and all related data by admin ${adminUserId}`);

    return NextResponse.json({ 
      message: `Successfully deleted user ${targetUser.name} and all related data.`,
      deletedUser: targetUser.name,
      deletedBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    return NextResponse.json({ error: `Failed to delete user: ${errorMessage}` }, { status: 500 });
  }
}

