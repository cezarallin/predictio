import { NextResponse } from 'next/server';

// Date H2H din fotografii - actualizează aici când ai noi dueluri finalizate
// NOTĂ: Pentru a adăuga dueluri noi, adaugă obiecte în acest array
const H2H_HISTORICAL_DATA = [
  {
    challenger: "Cezar",
    challenged: "Tone Andrei",
    winner: "Cezar",
    challengerScore: 5,
    challengedScore: 4,
    challengerOdds: 7.80,
    challengedOdds: 6.99,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 5,
    challengedScore: 5,
    challengerOdds: 11.57,
    challengedOdds: 7.80,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 4,
    challengedScore: 4,
    challengerOdds: 4.67,
    challengedOdds: 6.99,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 3,
    challengedScore: 5,
    challengerOdds: 3.20,
    challengedOdds: 8.80,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 5.67,
    challengedOdds: 8.40,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 5.67,
    challengedOdds: 8.80,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "Egalitate",
    challengerScore: 6,
    challengedScore: 6,
    challengerOdds: 7.29,
    challengedOdds: 7.29,
    matchDate: "2025-10-11",
    completedAt: "2025-10-11"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Dew",
    challengerScore: 7,
    challengedScore: 5,
    challengerOdds: 15.04,
    challengedOdds: 6.31,
    matchDate: "2025-10-12",
    completedAt: "2025-10-12"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 7.52,
    challengedOdds: 10.87,
    matchDate: "2025-10-13",
    completedAt: "2025-10-13"
  }
];

// Date exacte din fotografiile clasamentelor
// NOTĂ: Pentru a adăuga o nouă săptămână, doar adaugă un nou obiect în HISTORICAL_DATA
const HISTORICAL_DATA = {
  week1: {
    name: "Săptămâna 1 (Sep 16-22)",
    totalMatches: 18,
    players: {
      "Tony": { rank: 1, points: 24.38, odds: 42.49, correct: 11, accuracy: 61, total: 18 },
      "mihai94": { rank: 2, points: 24.04, odds: 49.76, correct: 10, accuracy: 56, total: 18 },
      "Tone Andrei": { rank: 3, points: 21.33, odds: 52.89, correct: 8, accuracy: 44, total: 18 },
      "Cezar": { rank: 4, points: 17.71, odds: 43.70, correct: 8, accuracy: 44, total: 18 },
      "Dew": { rank: 5, points: 15.86, odds: 48.86, correct: 7, accuracy: 39, total: 18 },
      "Flo": { rank: 6, points: 9.09, odds: 55.28, correct: 4, accuracy: 22, total: 18 }
    }
  },
  week2: {
    name: "Săptămâna 2 (Sep 23-29)",
    totalMatches: 56,
    players: {
      "Tone Andrei": { rank: 1, points: 60.72, odds: 202.22, correct: 19, accuracy: 34, total: 56 },
      "mihai94": { rank: 2, points: 51.95, odds: 140.72, correct: 23, accuracy: 41, total: 56 },
      "Tony": { rank: 3, points: 51.17, odds: 155.06, correct: 20, accuracy: 39, total: 56 },
      "Dew": { rank: 4, points: 47.49, odds: 131.48, correct: 22, accuracy: 39, total: 56 },
      "Cezar": { rank: 5, points: 44.34, odds: 159.92, correct: 18, accuracy: 32, total: 56 }
    }
  },
  week3: {
    name: "Săptămâna 3 (Sep 30 - Oct 2)",
    totalMatches: 36, // Numărul total de meciuri din săptămâna 3
    players: {
      "Dew": { rank: 1, points: 46.87, odds: 81.17, correct: 21, accuracy: 58, total: 36 },
      "Tony": { rank: 2, points: 42.57, odds: 115.21, correct: 17, accuracy: 47, total: 36 },
      "Tone Andrei": { rank: 3, points: 37.53, odds: 129.58, correct: 14, accuracy: 39, total: 36 },
      "mihai94": { rank: 4, points: 36.90, odds: 88.14, correct: 18, accuracy: 50, total: 36 },
      "Cezar": { rank: 5, points: 31.20, odds: 79.98, correct: 18, accuracy: 50, total: 36 },
      "Flo": { rank: 6, points: 30.93, odds: 99.98, correct: 16, accuracy: 44, total: 36 }
    }
  },
  week4: {
    name: "Săptămâna 4 (Oct 3-6)",
    totalMatches: 56,
    players: {
      "Cezar": { rank: 1, points: 54.63, odds: 153.26, correct: 24, accuracy: 43, total: 56 },
      "Tone Andrei": { rank: 2, points: 52.07, odds: 156.59, correct: 24, accuracy: 43, total: 56 },
      "Tony": { rank: 3, points: 47.30, odds: 214.05, correct: 14, accuracy: 25, total: 56 },
      "Dew": { rank: 4, points: 43.48, odds: 128.91, correct: 24, accuracy: 43, total: 56 },
      "mihai94": { rank: 5, points: 43.19, odds: 136.74, correct: 23, accuracy: 41, total: 56 }
    }
  },
  week5: {
    name: "Săptămâna 5 (Oct 7-13)",
    totalMatches: 48,
    players: {
      "Flo": { rank: 1, points: 66.47, odds: 110.18, correct: 34, accuracy: 71, total: 48 },
      "Tone Andrei": { rank: 2, points: 61.91, odds: 97.53, correct: 33, accuracy: 69, total: 48 },
      "mihai94": { rank: 3, points: 55.64, odds: 89.94, correct: 33, accuracy: 69, total: 48 },
      "Dew": { rank: 4, points: 50.09, odds: 81.99, correct: 32, accuracy: 67, total: 48 },
      "Cezar": { rank: 5, points: 47.71, odds: 87.18, correct: 31, accuracy: 65, total: 48 },
      "Tony": { rank: 6, points: 40.57, odds: 87.86, correct: 29, accuracy: 60, total: 48 }
    }
  }
};

function calculatePlayerStats() {
  const players = ["Tony", "mihai94", "Tone Andrei", "Cezar", "Dew", "Flo"];
  const weeks = Object.keys(HISTORICAL_DATA);
  
  return players.map(playerName => {
    // Calculez câte săptămâni a jucat
    let weeksPlayed = 0;
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalPoints = 0;
    const weeklyRanks: number[] = [];
    
    // Iterez prin toate săptămânile din HISTORICAL_DATA
    weeks.forEach(weekKey => {
      const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
      const playerData = weekData.players[playerName as keyof typeof weekData.players];
      
      if (playerData) {
        weeksPlayed++;
        totalPredictions += playerData.total;
        correctPredictions += playerData.correct;
        totalPoints += playerData.points;
        weeklyRanks.push(playerData.rank);
      }
    });
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const avgRank = weeklyRanks.length > 0 ? weeklyRanks.reduce((a, b) => a + b, 0) / weeklyRanks.length : 6;
    
    // Calculez streak-uri bazate pe performanță și săptămânile jucate
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Pentru ultima săptămână disponibilă
    const lastWeekKey = weeks[weeks.length - 1];
    const lastWeekData = HISTORICAL_DATA[lastWeekKey as keyof typeof HISTORICAL_DATA];
    const lastPlayerData = lastWeekData.players[playerName as keyof typeof lastWeekData.players];
    
    if (lastPlayerData && lastPlayerData.accuracy > 35) {
      currentStreak = Math.floor(lastPlayerData.accuracy / 10);
    }
    
    // Calculez cel mai lung streak din toate săptămânile
    weeks.forEach(weekKey => {
      const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
      const playerData = weekData.players[playerName as keyof typeof weekData.players];
      
      if (playerData && playerData.accuracy > 35) {
        longestStreak = Math.max(longestStreak, Math.floor(playerData.accuracy / 8));
      }
    });
    
    return {
      name: playerName,
      totalPredictions,
      correctPredictions,
      accuracy,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalPoints: Math.round(totalPoints * 100) / 100,
      favoriteOutcome: '1' as const, // Pentru simplitate
      averageReactions: Math.round((Math.random() * 2 + 1) * weeksPlayed * 10) / 10,
      boostsUsed: weeksPlayed,
      rank: 0, // Va fi calculat după
      avgRank,
      weeksPlayed
    };
  }).filter(player => player.totalPredictions > 0)
    .sort((a, b) => {
      // Sortez după puncte în primul rând, apoi după acuratețe
      if (Math.abs(a.totalPoints - b.totalPoints) < 0.1) {
        return b.accuracy - a.accuracy;
      }
      return b.totalPoints - a.totalPoints;
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
}

function calculateWeeklyStats() {
  const weeks = Object.keys(HISTORICAL_DATA);
  
  // Inversez ordinea săptămânilor pentru a avea cele mai recente primele (3, 2, 1)
  return weeks.reverse().map(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    
    return {
      week: weekData.name,
      totalMatches: weekData.totalMatches,
      players: Object.fromEntries(
        Object.entries(weekData.players).map(([name, data]) => [
          name,
          {
            correct: data.correct,
            total: data.total,
            accuracy: data.accuracy,
            points: data.points,
            boosts: Math.floor(Math.random() * 2), // Simulat
            reactions: Math.floor(Math.random() * 5) + 1 // Simulat
          }
        ])
      )
    };
  });
}

function calculateRealH2HStats() {
  try {
    // Use historical data instead of database
    const completedChallenges = H2H_HISTORICAL_DATA;
    
    if (completedChallenges.length === 0) {
      return { mostWins: undefined, mostPlayed: undefined, h2hData: [], playerH2HStats: {} };
    }
    
    // Count wins and total challenges per player
    const playerH2HStats: Record<string, { wins: number, total: number }> = {};
    
    completedChallenges.forEach(challenge => {
      const challengerName = challenge.challenger;
      const challengedName = challenge.challenged;
      
      // Initialize stats if not exists
      if (!playerH2HStats[challengerName]) {
        playerH2HStats[challengerName] = { wins: 0, total: 0 };
      }
      if (!playerH2HStats[challengedName]) {
        playerH2HStats[challengedName] = { wins: 0, total: 0 };
      }
      
      // Count total challenges
      playerH2HStats[challengerName].total++;
      playerH2HStats[challengedName].total++;
      
      // Count wins (skip egalitate)
      if (challenge.winner === challengerName) {
        playerH2HStats[challengerName].wins++;
      } else if (challenge.winner === challengedName) {
        playerH2HStats[challengedName].wins++;
      }
      // If winner is "Egalitate", no one gets a win
    });
    
    // Find player with most wins
    let mostWins = undefined;
    let maxWins = 0;
    Object.entries(playerH2HStats).forEach(([name, stats]) => {
      if (stats.wins > maxWins) {
        maxWins = stats.wins;
        mostWins = name;
      }
    });
    
    // Find player with most challenges played
    let mostPlayed = undefined;
    let maxPlayed = 0;
    Object.entries(playerH2HStats).forEach(([name, stats]) => {
      if (stats.total > maxPlayed) {
        maxPlayed = stats.total;
        mostPlayed = name;
      }
    });
    
    // H2H data is already in the correct format
    const h2hData = completedChallenges;
    
    return { 
      mostWins, 
      mostPlayed,
      h2hData,
      playerH2HStats
    };
  } catch (error) {
    console.error('Error calculating H2H stats:', error);
    return { mostWins: undefined, mostPlayed: undefined, h2hData: [], playerH2HStats: {} };
  }
}

function calculateOverallStats(playerStats: any[]) {
  const weeks = Object.keys(HISTORICAL_DATA);
  const totalPredictions = playerStats.reduce((sum, p) => sum + p.totalPredictions, 0);
  const totalCorrect = playerStats.reduce((sum, p) => sum + p.correctPredictions, 0);
  const averageAccuracy = totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0;
  
  // Găsesc jucătorul cu cele mai multe predicții
  const mostActivePlayer = playerStats.reduce((max, p) => 
    p.totalPredictions > max.totalPredictions ? p : max
  ).name;
  
  // Găsesc jucătorul cu cele mai multe predicții corecte
  const mostCorrectPlayer = playerStats.reduce((max, p) => 
    p.correctPredictions > max.correctPredictions ? p : max
  ).name;
  
  // Găsesc jucătorul cu cea mai bună acuratețe
  const mostAccuratePlayer = playerStats.reduce((max, p) => 
    p.accuracy > max.accuracy ? p : max
  ).name;
  
  // Cea mai bună acuratețe săptămânală și jucătorul
  let bestWeeklyAccuracy = 0;
  let bestWeeklyPlayer = '';
  let bestWeeklyWeek = '';
  
  // Iterez prin toate săptămânile pentru a găsi cea mai bună acuratețe
  weeks.forEach(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    
    Object.entries(weekData.players).forEach(([name, data]) => {
      if (data.accuracy > bestWeeklyAccuracy) {
        bestWeeklyAccuracy = data.accuracy;
        bestWeeklyPlayer = name;
        bestWeeklyWeek = weekData.name;
      }
    });
  });
  
  // Calculez totalul de meciuri din toate săptămânile
  const totalMatches = weeks.reduce((sum, weekKey) => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    return sum + weekData.totalMatches;
  }, 0);
  
  // Calculez câștigătorii săptămânali (rank 1 în fiecare săptămână)
  const weeklyWinners: Record<string, number> = {};
  weeks.forEach(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    const winner = Object.entries(weekData.players).find(([_, data]) => data.rank === 1);
    if (winner) {
      const winnerName = winner[0];
      weeklyWinners[winnerName] = (weeklyWinners[winnerName] || 0) + 1;
    }
  });
  
  // Găsesc câștigătorul ultimei săptămâni
  const lastWeekKey = weeks[weeks.length - 1];
  const lastWeekData = HISTORICAL_DATA[lastWeekKey as keyof typeof HISTORICAL_DATA];
  const lastWeekWinner = Object.entries(lastWeekData.players).find(([_, data]) => data.rank === 1);
  const lastWeekWinnerName = lastWeekWinner ? lastWeekWinner[0] : '';
  
  // Calculate H2H statistics from database
  const h2hStats = calculateRealH2HStats();
  const mostH2HWins = h2hStats.mostWins;
  const mostH2HPlayed = h2hStats.mostPlayed;
  
  return {
    totalWeeks: weeks.length,
    totalMatches,
    totalPredictions,
    averageAccuracy,
    mostActivePlayer,
    bestWeeklyAccuracy,
    bestWeeklyPlayer,
    bestWeeklyWeek,
    mostCorrectPlayer,
    mostAccuratePlayer,
    weeklyWinners,
    lastWeekWinnerName,
    mostH2HWins,
    mostH2HPlayed
  };
}

function calculateHeadToHead(playerStats: any[]) {
  const weeks = Object.keys(HISTORICAL_DATA);
  const headToHead = [];
  
  for (let i = 0; i < playerStats.length; i++) {
    for (let j = i + 1; j < playerStats.length; j++) {
      const p1 = playerStats[i];
      const p2 = playerStats[j];
      
      let p1Wins = 0;
      let p2Wins = 0;
      let draws = 0;
      
      // Compar performanțele săptămânale din toate săptămânile
      weeks.forEach(weekKey => {
        const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
        const p1Data = weekData.players[p1.name as keyof typeof weekData.players];
        const p2Data = weekData.players[p2.name as keyof typeof weekData.players];
        
        if (p1Data && p2Data) {
          if (p1Data.accuracy > p2Data.accuracy) p1Wins++;
          else if (p2Data.accuracy > p1Data.accuracy) p2Wins++;
          else draws++;
        }
      });
      
      headToHead.push({
        player1: p1.name,
        player2: p2.name,
        player1Wins: p1Wins,
        player2Wins: p2Wins,
        draws
      });
    }
  }
  
  return headToHead;
}

export async function GET() {
  try {
    const playerStats = calculatePlayerStats();
    const weeklyStats = calculateWeeklyStats();
    const overallStats = calculateOverallStats(playerStats);
    const headToHead = calculateHeadToHead(playerStats);
    const h2hRealStats = calculateRealH2HStats();
    
    return NextResponse.json({
      weeklyStats,
      playerStats,
      overallStats,
      headToHead,
      h2hChallenges: h2hRealStats.h2hData,
      h2hPlayerStats: h2hRealStats.playerH2HStats
    });
  } catch (error) {
    console.error('Eroare la calculul statisticilor:', error);
    return NextResponse.json(
      { error: 'Eroare la calculul statisticilor' },
      { status: 500 }
    );
  }
}
