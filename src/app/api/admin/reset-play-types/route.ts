import { NextResponse } from 'next/server';
import { resetAllPlayTypes } from '@/lib/database';

export async function POST() {
  try {
    resetAllPlayTypes.run();
    return NextResponse.json({ message: 'Toate tipurile de joc au fost resetate la NULL' });
  } catch (error) {
    console.error('Eroare la resetarea tipurilor de joc:', error);
    return NextResponse.json({ error: 'Eroare la resetarea tipurilor de joc' }, { status: 500 });
  }
}
