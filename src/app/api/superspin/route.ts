import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserByName, 
  addSuperSpinResult, 
  hasUserSpinnedToday,
  getUserSuperSpins,
  getUnusedSuperSpinPrizes
} from '@/lib/database';

const PRIZE_WEIGHTS = {
  'no_win': 2,          // 2 segmente (necâștigător)
  'extra_point': 2,     // 2 segmente (2x +1 punct)
  'five_lei': 1,        // 1 segment (5 lei)
  'double_boost': 2,    // 2 segmente (2x double boost)
  'triple_boost': 1     // 1 segment (triple boost)
};

function getRandomPrize() {
  const prizes = [];
  
  // Construiesc array-ul cu probabilitățile corespunzătoare
  for (const [prize, weight] of Object.entries(PRIZE_WEIGHTS)) {
    for (let i = 0; i < weight; i++) {
      prizes.push(prize);
    }
  }
  
  const randomIndex = Math.floor(Math.random() * prizes.length);
  const selectedPrize = prizes[randomIndex];
  
  // Determin valoarea premiului
  let prizeValue = 0;
  if (selectedPrize === 'extra_point') {
    prizeValue = 1;
  } else if (selectedPrize === 'double_boost') {
    prizeValue = 2;
  } else if (selectedPrize === 'triple_boost') {
    prizeValue = 3;
  } else if (selectedPrize === 'five_lei') {
    prizeValue = 5;
  }
  
  return { type: selectedPrize, value: prizeValue };
}

// GET - obține informații despre super spin-urile utilizatorului
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user');

    if (!userName) {
      return NextResponse.json({ error: 'User name required' }, { status: 400 });
    }

    const user = getUserByName.get(userName) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verifică dacă a învârtit astăzi
    const hasSpinnedResult = hasUserSpinnedToday.get(user.id) as { count: number };
    const hasSpinned = hasSpinnedResult.count > 0;

    // Obține toate spin-urile utilizatorului
    const userSpins = getUserSuperSpins.all(user.id);

    // Obține premiile nefolosite
    const unusedPrizes = getUnusedSuperSpinPrizes.all(user.id);

    return NextResponse.json({
      hasSpinnedToday: hasSpinned,
      spins: userSpins,
      unusedPrizes: unusedPrizes
    });

  } catch (error) {
    console.error('Super spin GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - înregistrează un nou super spin
export async function POST(request: NextRequest) {
  try {
    const { userName } = await request.json();

    if (!userName) {
      return NextResponse.json({ error: 'User name required' }, { status: 400 });
    }

    const user = getUserByName.get(userName) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verifică dacă utilizatorul a mai învârtit astăzi
    const hasSpinnedResult = hasUserSpinnedToday.get(user.id) as { count: number };
    if (hasSpinnedResult.count > 0) {
      return NextResponse.json({ 
        error: 'Ai mai învârtit roata astăzi! Revino mâine pentru o nouă șansă!' 
      }, { status: 400 });
    }

    // Generează premiul aleator
    const prize = getRandomPrize();

    // Salvează în baza de date
    addSuperSpinResult.run(user.id, prize.type, prize.value);

    return NextResponse.json({
      success: true,
      prize: {
        type: prize.type,
        value: prize.value,
        message: getPrizeMessage(prize.type, prize.value)
      }
    });

  } catch (error) {
    console.error('Super spin POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getPrizeMessage(prizeType: string, prizeValue: number): string {
  switch (prizeType) {
    case 'double_boost':
      return 'Felicitări! Ai câștigat un double boost (2x puncte)!';
    case 'triple_boost': 
      return 'Incredibil! Ai câștigat un triple boost (3x puncte)!';
    case 'no_win':
      return 'Din păcate, de data aceasta nu ai câștigat nimic. Încearcă mâine!';
    case 'extra_point':
      return `Bravo! Ai câștigat ${prizeValue} punct extra!`;
    case 'five_lei':
      return 'Fantastic! Ai câștigat 5 lei de la ceilalți jucători! 💰';
    default:
      return 'Premiu necunoscut';
  }
}
