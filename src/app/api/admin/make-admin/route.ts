import { NextRequest, NextResponse } from 'next/server';
import { makeUserAdmin, getUserByName } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userName, secretKey } = await request.json();
    
    if (!userName || !secretKey) {
      return NextResponse.json({ error: 'Missing userName or secretKey' }, { status: 400 });
    }

    // Simple secret key check (for initial setup only)
    if (secretKey !== 'admin-setup-2024') {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 });
    }

    // Check if user exists
    const user = getUserByName.get(userName);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Make user admin
    makeUserAdmin.run(userName);
    
    console.log(`🛡️ User ${userName} has been made admin`);

    return NextResponse.json({ 
      message: `User ${userName} is now an admin`,
      user: getUserByName.get(userName)
    });

  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json({ error: 'Failed to make user admin' }, { status: 500 });
  }
}
