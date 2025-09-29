'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';

interface StatsData {
  weeklyStats: WeeklyStats[];
  playerStats: PlayerStats[];
  overallStats: OverallStats;
  headToHead: HeadToHeadStats[];
}

interface WeeklyStats {
  week: string;
  totalMatches: number;
  players: {
    [playerName: string]: {
      correct: number;
      total: number;
      accuracy: number;
      points: number;
      boosts: number;
      reactions: number;
    };
  };
}

interface PlayerStats {
  name: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  favoriteOutcome: '1' | 'X' | '2';
  averageReactions: number;
  boostsUsed: number;
  rank: number;
  weeksPlayed: number;
}

interface OverallStats {
  totalWeeks: number;
  totalMatches: number;
  totalPredictions: number;
  averageAccuracy: number;
  mostActivePlayer: string;
  bestWeeklyAccuracy: number;
  bestWeeklyPlayer: string;
  bestWeeklyWeek: string;
  mostCorrectPlayer: string;
  mostAccuratePlayer: string;
}

interface HeadToHeadStats {
  player1: string;
  player2: string;
  player1Wins: number;
  player2Wins: number;
  draws: number;
}

export default function StatsPage() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('predictio_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('predictio_user');
        window.location.href = '/';
      }
    } else {
      // Redirect to home if no user
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadStatsData();
    }
  }, [currentUser]);

  const loadStatsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error('Eroare la încărcarea statisticilor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictio_user');
    window.location.href = '/';
  };

  const navigateHome = () => {
    window.location.href = '/';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return '#10b981'; // green
    if (accuracy >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getRankBadge = (rank: number) => {
    const badges = {
      1: { emoji: '🏆', color: '#ffd700', label: 'Primul' },
      2: { emoji: '🥈', color: '#c0c0c0', label: 'Al doilea' },
      3: { emoji: '🥉', color: '#cd7f32', label: 'Al treilea' }
    };
    return badges[rank as keyof typeof badges] || { emoji: '🎯', color: '#6b7280', label: `${rank}` };
  };

  if (!currentUser) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)' }}>
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)' }}>
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>Nu s-au putut încărca statisticile.</p>
          <button onClick={navigateHome} className="superbet-button">
            Înapoi la Predicții
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--superbet-light-gray)' }}>
      <Header currentUser={currentUser} onLogout={handleLogout} />
      
      <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={navigateHome}
            className="superbet-outline-button"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Înapoi la Predicții
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: 'var(--superbet-text)', 
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <BarChart3 style={{ width: '36px', height: '36px', color: 'var(--superbet-red)' }} />
            Istoricul Competiției
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--superbet-gray)', margin: 0 }}>
            Statistici și performanțe din ultimele {statsData.overallStats.totalWeeks} săptămâni
          </p>
        </div>

        {/* Overall Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div className="stats-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Target style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              <h3>Predicții Totale</h3>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
              {statsData.overallStats.totalPredictions}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
              {statsData.overallStats.totalWeeks} săptămâni • {statsData.overallStats.totalMatches} meciuri
            </div>
          </div>

          <div className="stats-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Trophy style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              <h3>Cele Mai Multe Puncte</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
              {(() => {
                const leader = statsData.playerStats.find(p => p.rank === 1);
                return leader ? leader.name : 'N/A';
              })()}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
              {(() => {
                const leader = statsData.playerStats.find(p => p.rank === 1);
                return leader ? `${leader.totalPoints} puncte` : '';
              })()}
            </div>
          </div>

          <div className="stats-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Target style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              <h3>Cel Mai Precis</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
              {statsData.overallStats.mostAccuratePlayer}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
              {(() => {
                const bestPlayer = statsData.playerStats.find(p => p.name === statsData.overallStats.mostAccuratePlayer);
                return bestPlayer ? `${bestPlayer.accuracy.toFixed(1)}% acuratețe (${bestPlayer.correctPredictions} corecte)` : '';
              })()}
            </div>
          </div>

          <div className="stats-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <TrendingUp style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              <h3>Cea Mai Bună Performanță</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
              {statsData.overallStats.bestWeeklyPlayer}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
              {statsData.overallStats.bestWeeklyAccuracy.toFixed(1)}% - {statsData.overallStats.bestWeeklyWeek}
            </div>
          </div>
        </div>

        {/* Player Rankings */}
        <div style={{ 
          background: 'var(--superbet-card-bg)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          border: '1px solid var(--superbet-border)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'var(--superbet-text)', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Trophy style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
            Clasament General
          </h2>
          
          <div style={{ overflowX: 'auto', minWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header" style={{ textAlign: 'left', minWidth: '120px' }}>Jucător</th>
                  <th className="table-header">Predicții</th>
                  <th className="table-header">Corecte</th>
                  <th className="table-header">Acuratețe</th>
                  <th className="table-header">Puncte</th>
                  <th className="table-header">Săptămâni</th>
                </tr>
              </thead>
              <tbody>
                {statsData.playerStats.map((player) => {
                  const rankBadge = getRankBadge(player.rank);
                  const isCurrentUser = player.name === currentUser.name;
                  
                  return (
                    <tr 
                      key={player.name}
                      style={{ 
                        backgroundColor: isCurrentUser ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                        borderLeft: isCurrentUser ? '3px solid var(--superbet-red)' : '3px solid transparent'
                      }}
                    >
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{rankBadge.emoji}</span>
                          <span style={{ fontWeight: 'bold', color: rankBadge.color }}>
                            {player.rank}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div style={{ 
                          fontWeight: isCurrentUser ? 'bold' : '600',
                          whiteSpace: 'nowrap',
                          minWidth: '120px'
                        }}>
                          {player.name}
                          {isCurrentUser && <span style={{ color: 'var(--superbet-red)', marginLeft: '8px' }}>TU</span>}
                        </div>
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        {player.totalPredictions}
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        {player.correctPredictions}
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: getAccuracyColor(player.accuracy),
                          fontWeight: 'bold'
                        }}>
                          {player.accuracy.toFixed(1)}%
                        </span>
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {player.totalPoints}
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold',
                          color: player.weeksPlayed === 2 ? '#10b981' : '#f59e0b',
                          whiteSpace: 'nowrap'
                        }}>
                          {player.weeksPlayed}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--superbet-gray)',
                          whiteSpace: 'nowrap'
                        }}>
                          din 2 săptămâni
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Performance */}
        <div style={{ 
          background: 'var(--superbet-card-bg)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          border: '1px solid var(--superbet-border)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'var(--superbet-text)', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Calendar style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
            Performanța Săptămânală
          </h2>
          
          {statsData.weeklyStats.map((week) => (
            <div 
              key={week.week}
              className="weekly-section"
              style={{
                border: '1px solid var(--superbet-border)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                background: 'var(--superbet-card-bg)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--superbet-text)' }}>
                  {week.week}
                </h3>
                <div className="matches-badge" style={{ 
                  fontSize: '13px', 
                  color: 'var(--superbet-gray)',
                  background: 'var(--superbet-light-gray)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--superbet-border)',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  {week.totalMatches} meciuri
                </div>
              </div>
              
              <div className="weekly-players-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                gap: '10px' 
              }}>
                {Object.entries(week.players)
                  .sort(([, a], [, b]) => b.points - a.points) // Sort by points descending
                  .map(([playerName, stats], index) => {
                  const isCurrentUser = playerName === currentUser.name;
                  const accuracyColor = stats.accuracy >= 70 ? '#10b981' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  const position = index + 1;
                  const positionColor = position === 1 ? '#ffd700' : position === 2 ? '#c0c0c0' : position === 3 ? '#cd7f32' : 'var(--superbet-gray)';
                  const positionBg = position <= 3 ? `${positionColor}20` : 'transparent';
                  
                  return (
                    <div 
                      key={playerName}
                      className="weekly-player-card"
                      style={{
                        background: isCurrentUser ? 'rgba(220, 38, 38, 0.08)' : 'var(--superbet-card-bg)',
                        border: isCurrentUser ? '2px solid var(--superbet-red)' : '1px solid var(--superbet-border)',
                        borderRadius: '10px',
                        padding: '14px 12px',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{ fontWeight: '600', color: 'var(--superbet-text)', fontSize: '14px' }}>
                          {playerName.length > 10 ? `${playerName.substring(0, 10)}...` : playerName}
                        </div>
                        {isCurrentUser && (
                          <span style={{ 
                            color: 'var(--superbet-red)', 
                            fontSize: '10px',
                            fontWeight: '700',
                            background: 'rgba(220, 38, 38, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '8px'
                          }}>
                            TU
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}>
                        <div style={{ 
                          fontSize: '13px', 
                          color: 'var(--superbet-text)',
                          fontWeight: '500'
                        }}>
                          {stats.correct}/{stats.total}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '600',
                          color: accuracyColor,
                          background: `${accuracyColor}15`,
                          padding: '2px 6px',
                          borderRadius: '6px'
                        }}>
                          {stats.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--superbet-gray)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: positionColor,
                            background: positionBg,
                            padding: '2px 5px',
                            borderRadius: '6px',
                            minWidth: '18px',
                            textAlign: 'center',
                            border: position <= 3 ? `1px solid ${positionColor}40` : `1px solid var(--superbet-border)`
                          }}>
                            #{position}
                          </div>
                          <Trophy style={{ width: '12px', height: '12px' }} />
                          {stats.points} puncte
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .stats-card {
          background: var(--superbet-card-bg);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--superbet-border);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        .stats-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--superbet-text);
          margin: 0;
        }
        
        .table-header {
          background: var(--superbet-light-gray);
          padding: 12px 16px;
          text-align: center;
          font-weight: 600;
          color: var(--superbet-text);
          border-bottom: 1px solid var(--superbet-border);
          white-space: nowrap;
        }
        
        .table-cell {
          padding: 16px;
          border-bottom: 1px solid var(--superbet-border);
          white-space: nowrap;
          color: var(--superbet-text);
        }
        
        @media (max-width: 768px) {
          .table-header, .table-cell {
            padding: 8px 6px;
            font-size: 13px;
          }
          
          .weekly-players-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
            gap: 8px !important;
          }
          
          .weekly-player-card {
            padding: 10px 8px !important;
          }
          
          .weekly-section {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          
          .matches-badge {
            font-size: 11px !important;
            padding: 3px 8px !important;
          }
        }
        
        @media (max-width: 480px) {
          .weekly-players-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          
          .weekly-player-card {
            padding: 10px 6px !important;
            border-radius: 8px !important;
          }
          
          .weekly-section {
            padding: 12px !important;
            border-radius: 10px !important;
          }
          
          .matches-badge {
            font-size: 10px !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
