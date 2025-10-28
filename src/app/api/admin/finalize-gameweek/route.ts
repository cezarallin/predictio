import { NextRequest, NextResponse } from 'next/server';
import db, { addBankEntry, getAllUsers, getAllBankEntries, isGameweekFinalized, addFinalizedGameweek } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { standings } = await request.json();

    if (!standings || !Array.isArray(standings)) {
      return NextResponse.json(
        { error: 'Standings array required' },
        { status: 400 }
      );
    }

    // Generate gameweek name automatically using current date
    const currentDate = new Date();
    const gameweek = `Săptămâna ${currentDate.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

    // Check if this gameweek has already been finalized
    const alreadyFinalized = isGameweekFinalized.get(gameweek);
    if (alreadyFinalized) {
      console.log(`⚠️ Week ${gameweek} was already finalized. Recalculating...`);
      
      // Remove old finalization record to recalculate
      const deleteOldFinalization = db.prepare('DELETE FROM finalized_gameweeks WHERE gameweek = ?');
      deleteOldFinalization.run(gameweek);
      
      // Remove old winner's payout for this week to recalculate
      const deleteOldPayout = db.prepare(`DELETE FROM bank_entries WHERE gameweek = ? AND entry_type = 'in'`);
      deleteOldPayout.run(gameweek);
    }

    // Get all users
    const allUsers = getAllUsers.all() as Array<{ 
      id: number; 
      name: string; 
      play_type: string | null;
      is_admin: boolean;
    }>;

    // Get all bank entries to determine who participated with 'miza'
    const allBankEntries = getAllBankEntries.all() as Array<{
      id: number;
      user_id: number;
      user_name: string;
      entry_type: string;
      amount: number;
      gameweek: string | null;
      notes: string | null;
      created_at: string;
    }>;

    // Find users who have 'out' entries (placed miza bets) in this current period
    // (entries without a gameweek assigned yet, meaning they're from current active period)
    const currentPeriodMizaBets = allBankEntries.filter(
      entry => entry.entry_type === 'out' && entry.gameweek === null && entry.amount === 50
    );

    // Get unique user IDs who participated with miza
    const mizaUserIds = [...new Set(currentPeriodMizaBets.map(entry => entry.user_id))];
    
    console.log(`💰 Current period miza bets found: ${currentPeriodMizaBets.length}`);
    console.log(`💰 Unique user IDs with miza: ${mizaUserIds.join(', ')}`);
    console.log(`💰 User names with miza entries:`, currentPeriodMizaBets.map(e => e.user_name).join(', '));
    
    // Filter to get miza players (exclude admins)
    const mizaPlayers = allUsers.filter(
      user => mizaUserIds.includes(user.id) && !user.is_admin
    );

    console.log(`👥 Miza players (excluding admins):`, mizaPlayers.map(p => `${p.name} (ID: ${p.id})`).join(', '));

    if (mizaPlayers.length === 0) {
      return NextResponse.json(
        { message: 'Niciun jucător cu miza în această săptămână', totalPlayers: 0, totalPot: 0 },
        { status: 200 }
      );
    }

    // Find the winner (rank 1 in standings among miza players)
    const mizaPlayerNames = mizaPlayers.map(p => p.name);
    const mizaStandings = standings.filter((player: any) => mizaPlayerNames.includes(player.name));
    
    // Sort by points (descending), then by correct predictions (descending) as tiebreaker
    const sortedMizaStandings = mizaStandings.sort((a: any, b: any) => {
      // First compare by points
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // If points are equal, compare by correct predictions
      return b.correct - a.correct;
    });
    
    const winner = sortedMizaStandings[0];
    
    if (!winner) {
      return NextResponse.json(
        { error: 'No winner found among miza players in standings' },
        { status: 400 }
      );
    }

    console.log(`🏆 Miza players: ${mizaPlayerNames.join(', ')}`);
    console.log(`🏆 Winner among miza players: ${winner.name} with ${winner.points} points (${winner.correct} correct)`);

    const winnerUser = allUsers.find(u => u.name === winner.name);
    
    if (!winnerUser) {
      return NextResponse.json(
        { error: 'Winner user not found in database' },
        { status: 400 }
      );
    }

    // Calculate winnings
    const totalPot = mizaPlayers.length * 50;
    const winnerGetsTotal = totalPot; // Winner gets the entire pot (including their own bet)

    // Add bank entry for winner - money in (entire pot including their own bet)
    addBankEntry.run(
      winnerUser.id,
      winnerUser.id,
      'in',
      winnerGetsTotal,
      gameweek,
      `Câștig ${gameweek} (Rang 1)`
    );

    // Mark this gameweek as finalized
    addFinalizedGameweek.run(
      gameweek,
      winnerUser.id,
      winnerUser.name,
      totalPot,
      mizaPlayers.length
    );

    // Update all 'out' entries from this period to have the gameweek assigned
    const updateEntryGameweek = db.prepare(`
      UPDATE bank_entries 
      SET gameweek = ? 
      WHERE id IN (${currentPeriodMizaBets.map(e => e.id).join(',')})
    `);
    updateEntryGameweek.run(gameweek);

    console.log(`✅ Finalized ${gameweek}:`);
    console.log(`   Winner: ${winnerUser.name}`);
    console.log(`   Winnings: ${winnerGetsTotal} RON`);
    console.log(`   Total pool: ${totalPot} RON`);
    console.log(`   Total players: ${mizaPlayers.length}`);
    console.log(`   Miza players: ${mizaPlayerNames.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `${gameweek} finalized successfully`,
      winner: winnerUser.name,
      winnings: winnerGetsTotal,
      totalPlayers: mizaPlayers.length,
      totalPot,
      details: {
        mizaPlayers: mizaPlayerNames,
        sortedStandings: sortedMizaStandings.map((p: any) => ({
          name: p.name,
          points: p.points,
          correct: p.correct
        }))
      }
    });

  } catch (error) {
    console.error('Error finalizing gameweek:', error);
    return NextResponse.json(
      { error: 'Failed to finalize gameweek' },
      { status: 500 }
    );
  }
}

