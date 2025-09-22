import { NextRequest, NextResponse } from 'next/server';
import { resetDatabase, createUser, getUserByName } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json();
    
    if (!secretKey || secretKey !== 'admin-setup-2024') {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 });
    }

    console.log('🔄 Resetting database and creating admin user...');

    // Reset entire database
    resetDatabase();

    // Create admin user
    createUser.run('admin', 1); // 1 = is_admin = true
    
    const adminUser = getUserByName.get('admin');

    console.log('✅ Database reset complete. Admin user created:', adminUser);

    return NextResponse.json({ 
      message: 'Database reset successfully. Admin user created.',
      adminUser
    });

  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
