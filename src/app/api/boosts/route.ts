import { NextRequest, NextResponse } from 'next/server';
import { setPlayerBoost, removePlayerBoost, getAllPlayerBoosts } from '@/lib/database';

export async function GET() {
  try {
    const boosts = getAllPlayerBoosts.all();
    return NextResponse.json({ boosts });
  } catch (error) {
    console.error('Error fetching player boosts:', error);
    return NextResponse.json({ error: 'Failed to fetch player boosts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, matchId } = await request.json();
    
    if (!userId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    setPlayerBoost.run(userId, matchId);
    
    const boosts = getAllPlayerBoosts.all();
    return NextResponse.json({ boosts, success: true });
  } catch (error) {
    console.error('Error setting player boost:', error);
    return NextResponse.json({ error: 'Failed to set player boost' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    removePlayerBoost.run(userId);
    
    const boosts = getAllPlayerBoosts.all();
    return NextResponse.json({ boosts, success: true });
  } catch (error) {
    console.error('Error removing player boost:', error);
    return NextResponse.json({ error: 'Failed to remove player boost' }, { status: 500 });
  }
}
