import { NextRequest, NextResponse } from 'next/server';
import { getAllBankEntries, addBankEntry, clearAllBankEntries, getAllUsers } from '@/lib/database';

export async function GET() {
  try {
    const entries = getAllBankEntries.all() as Array<{
      id: number;
      user_id: number;
      user_name: string;
      entry_type: string;
      amount: number;
      gameweek: string | null;
      notes: string | null;
      created_at: string;
    }>;

    const users = (getAllUsers.all() as Array<{ id: number; name: string; is_admin: boolean }>);
    
    const userBalances = users.map(user => {
      const userEntries = entries.filter(e => e.user_id === user.id);
      const moneyIn = userEntries
        .filter(e => e.entry_type === 'in')
        .reduce((sum, e) => sum + e.amount, 0);
      const moneyOut = userEntries
        .filter(e => e.entry_type === 'out')
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        userId: user.id,
        userName: user.name,
        isAdmin: user.is_admin,
        moneyIn,
        moneyOut,
        balance: moneyIn - moneyOut
      };
    });

    return NextResponse.json({ entries, userBalances });
  } catch (error) {
    console.error('Error fetching bank data:', error);
    return NextResponse.json({ error: 'Failed to fetch bank data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, entryType, amount, gameweek, notes } = body;

    if (action === 'add_entry') {
      addBankEntry.run(userId, userId, entryType, amount, gameweek || null, notes || null);
      return NextResponse.json({ success: true });
    }

    if (action === 'clear_all') {
      clearAllBankEntries.run();
      return NextResponse.json({ success: true });
    }
    
    if (action === 'reset_all') {
      // Clear all bank entries completely
      clearAllBankEntries.run();
      return NextResponse.json({ success: true, message: 'Banca a fost resetată complet.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in bank operation:', error);
    return NextResponse.json({ error: 'Failed to perform operation' }, { status: 500 });
  }
}

