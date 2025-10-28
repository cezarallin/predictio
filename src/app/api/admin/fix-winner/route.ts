import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { gameweek, oldWinnerName, newWinnerName } = await request.json();

    if (!gameweek || !oldWinnerName || !newWinnerName) {
      return NextResponse.json(
        { error: 'Missing required fields: gameweek, oldWinnerName, newWinnerName' },
        { status: 400 }
      );
    }

    console.log(`🔧 Fixing winner for ${gameweek}: ${oldWinnerName} → ${newWinnerName}`);

    // Get the finalized gameweek record
    const getFinalizedGameweek = db.prepare(`
      SELECT * FROM finalized_gameweeks WHERE gameweek = ?
    `);
    const finalizedRecord = getFinalizedGameweek.get(gameweek) as any;

    if (!finalizedRecord) {
      return NextResponse.json(
        { error: `Gameweek "${gameweek}" not found in finalized_gameweeks` },
        { status: 404 }
      );
    }

    // Get old winner user
    const getOldWinner = db.prepare('SELECT * FROM users WHERE name = ?');
    const oldWinner = getOldWinner.get(oldWinnerName) as any;

    if (!oldWinner) {
      return NextResponse.json(
        { error: `Old winner "${oldWinnerName}" not found` },
        { status: 404 }
      );
    }

    // Get new winner user
    const getNewWinner = db.prepare('SELECT * FROM users WHERE name = ?');
    const newWinner = getNewWinner.get(newWinnerName) as any;

    if (!newWinner) {
      return NextResponse.json(
        { error: `New winner "${newWinnerName}" not found` },
        { status: 404 }
      );
    }

    const totalPot = finalizedRecord.total_pot;

    // Start transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // 1. Remove old winner's payout entry
      const deleteOldPayout = db.prepare(`
        DELETE FROM bank_entries 
        WHERE user_id = ? 
        AND entry_type = 'in' 
        AND gameweek = ? 
        AND amount = ?
      `);
      const deletedRows = deleteOldPayout.run(oldWinner.id, gameweek, totalPot);
      
      console.log(`   Deleted ${deletedRows.changes} payout entry for ${oldWinnerName}`);

      // 2. Add new winner's payout entry
      const addNewPayout = db.prepare(`
        INSERT INTO bank_entries (user_id, user_name, entry_type, amount, gameweek, notes)
        VALUES (?, ?, 'in', ?, ?, ?)
      `);
      addNewPayout.run(
        newWinner.id,
        newWinner.name,
        totalPot,
        gameweek,
        `Câștig ${gameweek} (Rang 1) - CORECTAT`
      );

      console.log(`   Added payout entry for ${newWinnerName}: ${totalPot} RON`);

      // 3. Update finalized_gameweeks record
      const updateFinalizedGameweek = db.prepare(`
        UPDATE finalized_gameweeks
        SET winner_id = ?,
            winner_name = ?
        WHERE gameweek = ?
      `);
      updateFinalizedGameweek.run(newWinner.id, newWinner.name, gameweek);

      console.log(`   Updated finalized_gameweeks record`);

      // Commit transaction
      db.exec('COMMIT');

      console.log(`✅ Successfully fixed winner for ${gameweek}: ${oldWinnerName} → ${newWinnerName}`);

      return NextResponse.json({
        success: true,
        message: `Winner corrected successfully`,
        gameweek,
        oldWinner: oldWinnerName,
        newWinner: newWinnerName,
        amount: totalPot
      });

    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error fixing winner:', error);
    return NextResponse.json(
      { error: 'Failed to fix winner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

