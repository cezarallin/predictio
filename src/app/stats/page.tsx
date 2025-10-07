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
  weeklyWinners: Record<string, number>;
  lastWeekWinnerName: string;
  mostH2HWins?: string;
  mostH2HPlayed?: string;
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
  const [selectedBadge, setSelectedBadge] = useState<{emoji: string, label: string, color: string} | null>(null);

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

  const navigateToH2H = () => {
    window.location.href = '/?openH2H=true';
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

  const getPlayerBadges = (playerName: string) => {
    const badges = [];
    
    // Badge pentru cele mai multe puncte (rank 1)
    const topPlayer = statsData?.playerStats.find(p => p.rank === 1);
    if (topPlayer?.name === playerName) {
      badges.push({ emoji: '👑', label: 'Cele Mai Multe Puncte', color: '#ffd700' });
    }
    
    // Badge pentru cel mai precis
    if (statsData?.overallStats.mostAccuratePlayer === playerName) {
      badges.push({ emoji: '🎯', label: 'Cel Mai Precis', color: '#10b981' });
    }
    
    // Badge pentru cea mai bună performanță săptămânală
    if (statsData?.overallStats.bestWeeklyPlayer === playerName) {
      badges.push({ emoji: '⚡', label: 'Cea Mai Bună Performanță', color: '#f59e0b' });
    }
    
    // Badge pentru câștigător ultima săptămână
    if (statsData?.overallStats.lastWeekWinnerName === playerName) {
      badges.push({ emoji: '🏆', label: 'Câștigător Ultimul Turneu', color: '#dc2626' });
    }
    
    // Badge pentru numărul de turnee câștigate
    const tournamentsWon = statsData?.overallStats.weeklyWinners[playerName] || 0;
    if (tournamentsWon > 0) {
      badges.push({ 
        emoji: '🏅', 
        label: `${tournamentsWon} ${tournamentsWon === 1 ? 'Turneu Câștigat' : 'Turnee Câștigate'}`, 
        color: '#8b5cf6' 
      });
    } else {
      // Badge de clovn pentru cei care nu au câștigat niciodată
      badges.push({ 
        emoji: '🤡', 
        label: 'Niciun Turneu Câștigat', 
        color: '#ef4444' 
      });
    }
    
    // Badge pentru cei care au jucat în toate turneele
    const player = statsData?.playerStats.find(p => p.name === playerName);
    if (player && player.weeksPlayed === statsData?.overallStats.totalWeeks) {
      badges.push({ 
        emoji: '💪', 
        label: 'Prezență Perfectă', 
        color: '#3b82f6' 
      });
    }
    
    // Badge pentru cel cu cele mai multe victorii H2H
    if (statsData?.overallStats.mostH2HWins === playerName) {
      badges.push({ 
        emoji: '⚔️', 
        label: 'Campion H2H', 
        color: '#dc2626' 
      });
    }
    
    // Badge pentru cel mai activ în H2H
    if (statsData?.overallStats.mostH2HPlayed === playerName) {
      badges.push({ 
        emoji: '🎮', 
        label: 'Cel Mai Activ H2H', 
        color: '#8b5cf6' 
      });
    }
    
    return badges;
  };

  if (!currentUser) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)' }}>
        <Header currentUser={currentUser} onLogout={handleLogout} onOpenH2H={navigateToH2H} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)' }}>
        <Header currentUser={currentUser} onLogout={handleLogout} onOpenH2H={navigateToH2H} />
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
      <Header currentUser={currentUser} onLogout={handleLogout} onOpenH2H={navigateToH2H} />
      
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
                  <th className="table-header" style={{ textAlign: 'left', minWidth: '140px' }}>Badge-uri</th>
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
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: player.rank <= 3 ? rankBadge.color : 'var(--superbet-text)',
                          fontSize: '18px'
                        }}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div style={{ 
                          fontWeight: isCurrentUser ? 'bold' : '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {player.name}
                          {isCurrentUser && <span style={{ color: 'var(--superbet-red)', marginLeft: '8px' }}>TU</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                          {getPlayerBadges(player.name).map((badge, idx) => (
                            <div
                              key={idx}
                              title={badge.label}
                              style={{
                                fontSize: '18px',
                                cursor: 'pointer',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                                transition: 'transform 0.2s ease',
                              }}
                              onClick={() => setSelectedBadge(badge)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {badge.emoji}
                            </div>
                          ))}
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
                          color: player.weeksPlayed === statsData.overallStats.totalWeeks ? '#10b981' : '#f59e0b',
                          whiteSpace: 'nowrap'
                        }}>
                          {player.weeksPlayed}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--superbet-gray)',
                          whiteSpace: 'nowrap'
                        }}>
                          din {statsData.overallStats.totalWeeks} săptămâni
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Badge Explanations */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          border: '2px solid var(--superbet-border)'
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
            Legendă Badge-uri
          </h2>
          
          <div className="badge-legend-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>👑</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '14px' }}>Cele Mai Multe Puncte</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Jucătorul cu cele mai multe puncte în total
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎯</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>Cel Mai Precis</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Cea mai mare acuratețe generală
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⚡</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '14px' }}>Cea Mai Bună Performanță</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Cea mai bună acuratețe într-o săptămână
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🏆</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>Câștigător Ultimul Turneu</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Câștigătorul săptămânii precedente
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🏅</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6', fontSize: '14px' }}>Turnee Câștigate</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Numărul total de săptămâni câștigate
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🤡</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>Niciun Turneu Câștigat</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Încă nu a câștigat o săptămână
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💪</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>Prezență Perfectă</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  A participat în toate turneele
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⚔️</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>Campion H2H</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Cele mai multe victorii H2H
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--superbet-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎮</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6', fontSize: '14px' }}>Cel Mai Activ H2H</div>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                  Cele mai multe challenge-uri H2H
                </div>
              </div>
            </div>
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

      {/* Badge Info Popup (Mobile) */}
      {selectedBadge && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '2px solid var(--superbet-border)',
              animation: 'slideInUp 0.3s ease-out',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '16px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>
              {selectedBadge.emoji}
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: selectedBadge.color,
              marginBottom: '8px'
            }}>
              {selectedBadge.label}
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--superbet-gray)',
              marginBottom: '20px',
              lineHeight: 1.5
            }}>
              {(() => {
                switch(selectedBadge.emoji) {
                  case '👑': return 'Jucătorul cu cele mai multe puncte în total';
                  case '🎯': return 'Cea mai mare acuratețe generală';
                  case '⚡': return 'Cea mai bună acuratețe într-o săptămână';
                  case '🏆': return 'Câștigătorul săptămânii precedente';
                  case '🏅': return 'Numărul total de săptămâni câștigate';
                  case '🤡': return 'Încă nu a câștigat o săptămână';
                  case '💪': return 'A participat în toate turneele';
                  case '⚔️': return 'Cele mai multe victorii H2H';
                  case '🎮': return 'Cele mai multe challenge-uri H2H';
                  default: return selectedBadge.label;
                }
              })()}
            </p>
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                background: 'var(--superbet-red)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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
        
        @media (max-width: 600px) {
          main {
            padding: 12px !important;
          }
          
          /* Badge legend: 3 per row on mobile */
          .badge-legend-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          
          .badge-legend-grid > div {
            padding: 12px 8px !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 8px !important;
          }
          
          .badge-legend-grid > div > div:first-child {
            font-size: 24px !important;
          }
          
          .badge-legend-grid > div > div:last-child > div:first-child {
            font-size: 11px !important;
          }
          
          .badge-legend-grid > div > div:last-child > div:last-child {
            font-size: 10px !important;
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
