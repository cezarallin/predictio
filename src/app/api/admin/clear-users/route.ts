import { NextRequest, NextResponse } from 'next/server';
import { clearAllPredictions, getUserByName } from '@/lib/database';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { adminUserId } = await request.json();
    
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID is required' }, { status: 400 });
    }
    
    // Check if the requesting user is admin
    const adminUser = getUserByName.get(adminUserId) as any;
    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    console.log('🔄 Clearing non-admin users and all predictions...');

    // Clear all predictions first
    clearAllPredictions.run();
    
    // Delete only non-admin users
    const deleteNonAdminUsers = db.prepare(`
      DELETE FROM users WHERE is_admin = 0 OR is_admin IS NULL
    `);
    const result = deleteNonAdminUsers.run();
    
    console.log(`✅ Deleted ${result.changes} non-admin users and all predictions`);

    return NextResponse.json({ 
      message: `Successfully deleted ${result.changes} non-admin users and all predictions. Admin users preserved.`
    });

  } catch (error) {
    console.error('Error clearing users:', error);
    return NextResponse.json({ error: 'Failed to clear users' }, { status: 500 });
  }
}
