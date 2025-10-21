import { NextRequest, NextResponse } from 'next/server';
import db, { createUser, getUserByName, getActiveUsers, getAllActiveUsersIncludingAdmins, isUserWhitelisted, getCurrentWeek, setUserActiveWeek } from '@/lib/database';

export async function GET() {
  try {
    // Get active users for the current week (including admins so they can see the table)
    const allActiveUsers = getAllActiveUsersIncludingAdmins();
    // For public display, filter out admins
    const publicUsers = getActiveUsers();
    
    return NextResponse.json({ users: publicUsers, allUsers: allActiveUsers });
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
    
    // Get current week
    const currentWeekResult = getCurrentWeek.get() as { value: string } | undefined;
    const currentWeek = currentWeekResult ? parseInt(currentWeekResult.value) : 1;
    
    // Check if user already exists
    let existingUser = getUserByName.get(trimmedName) as any;
    if (existingUser) {
      // User exists - check if they need to be updated for the new week
      const needsWeekUpdate = existingUser.active_week !== currentWeek;
      
      if (needsWeekUpdate) {
        // Update their active_week to current week
        setUserActiveWeek.run(currentWeek, existingUser.id);
        
        // Reset play_type to 'fun' for new week
        const resetPlayType = db.prepare('UPDATE users SET play_type = ? WHERE id = ?');
        resetPlayType.run('fun', existingUser.id);
        
        console.log(`✅ User ${trimmedName} logged in for week ${currentWeek}. Play type reset to 'fun'.`);
      } else {
        console.log(`✅ User ${trimmedName} is already active for week ${currentWeek}`);
      }
      
      // Get updated user data
      existingUser = getUserByName.get(trimmedName);
      return NextResponse.json({ user: existingUser });
    }

    // Check if user is whitelisted (POC users that should auto-recreate)
    const whitelisted = isUserWhitelisted.get(trimmedName);
    
    if (whitelisted) {
      // Whitelisted user - auto-recreate without confirmation
      console.log(`🔓 Auto-creating whitelisted POC user: ${trimmedName}`);
      try {
        createUser.run(trimmedName, 0);
        const newUser = getUserByName.get(trimmedName) as any;
        
        // Set active week and play_type to 'fun' for new user
        setUserActiveWeek.run(currentWeek, newUser.id);
        const setPlayType = db.prepare('UPDATE users SET play_type = ? WHERE id = ?');
        setPlayType.run('fun', newUser.id);
        
        console.log(`✅ Whitelisted user ${trimmedName} created and activated for week ${currentWeek} with play_type 'fun'`);
        
        // Get updated user data
        const updatedUser = getUserByName.get(trimmedName);
        return NextResponse.json({ user: updatedUser, whitelisted: true });
      } catch (dbError) {
        console.error('Database error during whitelisted user creation:', dbError);
        throw dbError;
      }
    }

    // Non-whitelisted user - create normally
    console.log('Creating user:', trimmedName);
    
    try {
      createUser.run(trimmedName, 0); // No admin functionality, always 0
      const newUser = getUserByName.get(trimmedName) as any;
      
      // Set active week and play_type to 'fun' for new user
      setUserActiveWeek.run(currentWeek, newUser.id);
      const setPlayType = db.prepare('UPDATE users SET play_type = ? WHERE id = ?');
      setPlayType.run('fun', newUser.id);
      
      console.log(`✅ User ${trimmedName} created and activated for week ${currentWeek} with play_type 'fun'`);
      
      // Get updated user data
      const updatedUser = getUserByName.get(trimmedName);
      return NextResponse.json({ user: updatedUser });
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
