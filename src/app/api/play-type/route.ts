import { NextRequest, NextResponse } from 'next/server';
import { updateUserPlayType, getUserPlayType, addBankEntry } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, playType } = await request.json();

    if (!userId || !playType) {
      return NextResponse.json({ error: 'userId și playType sunt obligatorii' }, { status: 400 });
    }

    if (playType !== 'fun' && playType !== 'miza') {
      return NextResponse.json({ error: 'playType trebuie să fie "fun" sau "miza"' }, { status: 400 });
    }

    updateUserPlayType.run(playType, userId);

    // Automatically deduct 50 RON from bank when user chooses 'miza'
    if (playType === 'miza') {
      addBankEntry.run(userId, userId, 'out', 50, null, 'Participare miza automată');
      console.log(`✅ Automatically deducted 50 RON from bank for user ${userId} (miza)`);
    }

    return NextResponse.json({ success: true, message: 'Tipul de joc a fost actualizat cu succes' });
  } catch (error) {
    console.error('Eroare la actualizarea tipului de joc:', error);
    return NextResponse.json({ error: 'Eroare la actualizarea tipului de joc' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId este obligatoriu' }, { status: 400 });
    }

    const result = getUserPlayType.get(parseInt(userId)) as { play_type?: string } | undefined;
    const playType = result?.play_type || null; // Return null if not set

    return NextResponse.json({ playType });
  } catch (error) {
    console.error('Eroare la obținerea tipului de joc:', error);
    return NextResponse.json({ error: 'Eroare la obținerea tipului de joc' }, { status: 500 });
  }
}
