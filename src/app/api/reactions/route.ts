import { NextRequest, NextResponse } from 'next/server';
import { addReaction, removeReaction, getAllReactions, getReactionsByMatch } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    
    if (matchId) {
      const reactions = getReactionsByMatch.all(matchId);
      return NextResponse.json({ reactions });
    } else {
      const reactions = getAllReactions.all();
      return NextResponse.json({ reactions });
    }
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, targetUserId, matchId, reaction } = await request.json();
    
    if (!userId || !targetUserId || !matchId || !reaction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['like', 'dislike', 'laugh', 'wow', 'love', 'angry'].includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction value' }, { status: 400 });
    }

    // Prevent self-reactions
    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot react to your own prediction' }, { status: 400 });
    }
    
    addReaction.run(userId, targetUserId, matchId, reaction);
    
    const reactions = getAllReactions.all();
    return NextResponse.json({ reactions, success: true });
  } catch (error) {
    console.error('Error creating reaction:', error);
    return NextResponse.json({ error: 'Failed to create reaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, targetUserId, matchId } = await request.json();
    
    if (!userId || !targetUserId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    removeReaction.run(userId, targetUserId, matchId);
    
    const reactions = getAllReactions.all();
    return NextResponse.json({ reactions, success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}
