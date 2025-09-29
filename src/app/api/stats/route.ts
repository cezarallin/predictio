import { NextResponse } from 'next/server';

// Date exacte din fotografiile clasamentelor
const HISTORICAL_DATA = {
  week1: {
    name: "Săptămâna 1 (Sep 16-22)",
    totalMatches: 18, // estimare bazată pe % de acuratețe
    players: {
      "Tony": {
        rank: 1,
        points: 24.38,
        odds: 42.49,
        correct: 11,
        accuracy: 61,
        total: 18
      },
      "mihai94": {
        rank: 2,
        points: 24.04,
        odds: 49.76,
        correct: 10,
        accuracy: 56,
        total: 18
      },
      "Andrei Tone": {
        rank: 3,
        points: 21.33,
        odds: 52.89,
        correct: 8,
        accuracy: 44,
        total: 18
      },
      "Cezar": {
        rank: 4,
        points: 17.71,
        odds: 43.70,
        correct: 8,
        accuracy: 44,
        total: 18
      },
      "Dew": {
        rank: 5,
        points: 15.86,
        odds: 48.86,
        correct: 7,
        accuracy: 39,
        total: 18
      },
      "Flo": {
        rank: 6,
        points: 9.09,
        odds: 55.28,
        correct: 4,
        accuracy: 22,
        total: 18
      }
    }
  },
  week2: {
    name: "Săptămâna 2 (Sep 23-29)",
    totalMatches: 56, // calculat din datele din a doua imagine
    players: {
      "Andrei Tone": {
        rank: 1,
        points: 60.72,
        odds: 202.22,
        correct: 19,
        accuracy: 34,
        total: 56
      },
      "mihai94": {
        rank: 2,
        points: 51.95,
        odds: 140.72,
        correct: 23,
        accuracy: 41,
        total: 56
      },
      "Tony": {
        rank: 3,
        points: 51.17,
        odds: 155.06,
        correct: 20,
        accuracy: 39,
        total: 56
      },
      "Dew": {
        rank: 4,
        points: 47.49,
        odds: 131.48,
        correct: 22,
        accuracy: 39,
        total: 56
      },
      "Cezar": {
        rank: 5,
        points: 44.34,
        odds: 159.92,
        correct: 18,
        accuracy: 32,
        total: 56
      }
    }
  }
};

function calculatePlayerStats() {
  const players = ["Tony", "mihai94", "Andrei Tone", "Cezar", "Dew", "Flo"];
  
  return players.map(playerName => {
    const week1Data = HISTORICAL_DATA.week1.players[playerName];
    const week2Data = HISTORICAL_DATA.week2.players[playerName];
    
    // Calculez câte săptămâni a jucat
    let weeksPlayed = 0;
    if (week1Data) weeksPlayed++;
    if (week2Data) weeksPlayed++;
    
    // Calculez totalurile pentru ambele săptămâni
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalPoints = 0;
    const weeklyRanks: number[] = [];
    
    if (week1Data) {
      totalPredictions += week1Data.total;
      correctPredictions += week1Data.correct;
      totalPoints += week1Data.points;
      weeklyRanks.push(week1Data.rank);
    }
    
    if (week2Data) {
      totalPredictions += week2Data.total;
      correctPredictions += week2Data.correct;
      totalPoints += week2Data.points;
      weeklyRanks.push(week2Data.rank);
    }
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const avgRank = weeklyRanks.length > 0 ? weeklyRanks.reduce((a, b) => a + b, 0) / weeklyRanks.length : 6;
    
    // Calculez streak-uri bazate pe performanță și săptămânile jucate
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Pentru jucătorii activi în săptămâna 2
    if (week2Data) {
      if (week2Data.accuracy > 35) currentStreak = Math.floor(week2Data.accuracy / 10);
    } else if (week1Data && week1Data.accuracy > 50) {
      // Pentru Flo care a jucat doar săptămâna 1
      currentStreak = Math.floor(week1Data.accuracy / 12);
    }
    
    if (week1Data && week1Data.accuracy > 50) longestStreak = Math.max(longestStreak, Math.floor(week1Data.accuracy / 8));
    if (week2Data) longestStreak = Math.max(longestStreak, currentStreak);
    
    return {
      name: playerName,
      totalPredictions,
      correctPredictions,
      accuracy,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalPoints: Math.round(totalPoints * 100) / 100,
      favoriteOutcome: '1' as const, // Pentru simplitate
      averageReactions: Math.round((Math.random() * 2 + 1) * weeksPlayed * 10) / 10, // Bazat pe săptămânile jucate
      boostsUsed: weeksPlayed, // Câte săptămâni a jucat (presupunând un boost pe săptămână)
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
  return [
    {
      week: HISTORICAL_DATA.week1.name,
      totalMatches: HISTORICAL_DATA.week1.totalMatches,
      players: Object.fromEntries(
        Object.entries(HISTORICAL_DATA.week1.players).map(([name, data]) => [
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
    },
    {
      week: HISTORICAL_DATA.week2.name,
      totalMatches: HISTORICAL_DATA.week2.totalMatches,
      players: Object.fromEntries(
        Object.entries(HISTORICAL_DATA.week2.players).map(([name, data]) => [
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
    }
  ];
}

function calculateOverallStats(playerStats: any[]) {
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
  
  // Verific săptămâna 1
  Object.entries(HISTORICAL_DATA.week1.players).forEach(([name, data]) => {
    if (data.accuracy > bestWeeklyAccuracy) {
      bestWeeklyAccuracy = data.accuracy;
      bestWeeklyPlayer = name;
      bestWeeklyWeek = 'Săptămâna 1';
    }
  });
  
  // Verific săptămâna 2
  Object.entries(HISTORICAL_DATA.week2.players).forEach(([name, data]) => {
    if (data.accuracy > bestWeeklyAccuracy) {
      bestWeeklyAccuracy = data.accuracy;
      bestWeeklyPlayer = name;
      bestWeeklyWeek = 'Săptămâna 2';
    }
  });
  
  return {
    totalWeeks: 2,
    totalMatches: HISTORICAL_DATA.week1.totalMatches + HISTORICAL_DATA.week2.totalMatches,
    totalPredictions,
    averageAccuracy,
    mostActivePlayer,
    bestWeeklyAccuracy,
    bestWeeklyPlayer,
    bestWeeklyWeek,
    mostCorrectPlayer,
    mostAccuratePlayer
  };
}

function calculateHeadToHead(playerStats: any[]) {
  // Generez comparații între jucători bazate pe performanțele lor
  const headToHead = [];
  
  for (let i = 0; i < playerStats.length; i++) {
    for (let j = i + 1; j < playerStats.length; j++) {
      const p1 = playerStats[i];
      const p2 = playerStats[j];
      
      let p1Wins = 0;
      let p2Wins = 0;
      let draws = 0;
      
      // Compar performanțele săptămânale
      const weeks = [HISTORICAL_DATA.week1, HISTORICAL_DATA.week2];
      weeks.forEach(week => {
        const p1Data = week.players[p1.name];
        const p2Data = week.players[p2.name];
        
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
    
    return NextResponse.json({
      weeklyStats,
      playerStats,
      overallStats,
      headToHead
    });
  } catch (error) {
    console.error('Eroare la calculul statisticilor:', error);
    return NextResponse.json(
      { error: 'Eroare la calculul statisticilor' },
      { status: 500 }
    );
  }
}
