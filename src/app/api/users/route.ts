import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByName, getAllUsers } from '@/lib/database';

export async function GET() {
  try {
    const users = getAllUsers.all();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    
    // Check if user already exists
    const existingUser = getUserByName.get(trimmedName);
    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    // Create new user (admin if name is 'admin')
    const isAdmin = trimmedName.toLowerCase() === 'admin';
    const result = createUser.run(trimmedName, isAdmin);
    const newUser = getUserByName.get(trimmedName);
    
    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
