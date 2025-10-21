'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, TrendingUp, Calendar, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import H2HManager from '@/components/H2HManager';

interface StatsData {
  weeklyStats: WeeklyStats[];
  playerStats: PlayerStats[];
  overallStats: OverallStats;
  headToHead: HeadToHeadStats[];
  h2hChallenges: H2HChallenge[];
  h2hPlayerStats: Record<string, { wins: number; total: number }>;
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

interface H2HChallenge {
  challenger: string;
  challenged: string;
  winner: string;
  challengerScore: number;
  challengedScore: number;
  challengerOdds: number;
  challengedOdds: number;
  matchDate: string;
  completedAt: string;
}

export default function StatsPage() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<{emoji: string, label: string, color: string} | null>(null);
  const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(false);
  const [isH2HExpanded, setIsH2HExpanded] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [showBadgeLegend, setShowBadgeLegend] = useState(false);
  const [showH2HManager, setShowH2HManager] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

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
      fetchPendingChallengesCount();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleOpenH2HEvent = () => {
      setShowH2HManager(true);
      fetchPendingChallengesCount();
    };

    window.addEventListener('openH2H', handleOpenH2HEvent);
    return () => window.removeEventListener('openH2H', handleOpenH2HEvent);
  }, []);

  const fetchPendingChallengesCount = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/h2h?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const challenges = data.challenges || [];
        const pendingForUser = challenges.filter((challenge: any) => 
          challenge.status === 'pending' && challenge.challenged_id === currentUser.id
        );
        setPendingChallengesCount(pendingForUser.length);
      }
    } catch (error) {
      console.error('Error fetching pending challenges count:', error);
      setPendingChallengesCount(0);
    }
  };

  const loadStatsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
        if (data.weeklyStats && data.weeklyStats.length > 0) {
          const firstWeek = data.weeklyStats[0].week;
          setExpandedWeeks(new Set([firstWeek]));
        }
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
    setShowH2HManager(true);
    fetchPendingChallengesCount();
  };

  const handleCloseH2H = () => {
    setShowH2HManager(false);
    fetchPendingChallengesCount();
  };

  const toggleWeek = (weekName: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekName)) {
        newSet.delete(weekName);
      } else {
        newSet.add(weekName);
      }
      return newSet;
    });
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
      badges.push({ emoji: '👑', label: 'Cele Mai Multe Puncte', color: '#ffd700', count: undefined });
    }
    
    // Badge pentru cel mai precis
    if (statsData?.overallStats.mostAccuratePlayer === playerName) {
      badges.push({ emoji: '🎯', label: 'Cel Mai Precis', color: '#10b981', count: undefined });
    }
    
    // Badge pentru cea mai bună performanță săptămânală
    if (statsData?.overallStats.bestWeeklyPlayer === playerName) {
      badges.push({ emoji: '⚡', label: 'Cea Mai Bună Performanță', color: '#f59e0b', count: undefined });
    }
    
    // Badge pentru câștigător ultima săptămână
    if (statsData?.overallStats.lastWeekWinnerName === playerName) {
      badges.push({ emoji: '🏆', label: 'Câștigător Ultimul Turneu', color: '#dc2626', count: undefined });
    }
    
    // Badge pentru cele mai multe predicții câștigătoare
    if (statsData?.overallStats.mostCorrectPlayer === playerName) {
      badges.push({ 
        emoji: '🌟', 
        label: 'Cele Mai Multe Predicții Câștigătoare', 
        color: '#a855f7',
        count: undefined
      });
    }
    
    // Badge pentru numărul de turnee câștigate
    const tournamentsWon = statsData?.overallStats.weeklyWinners[playerName] || 0;
    if (tournamentsWon > 0) {
      badges.push({ 
        emoji: '🏅', 
        label: `${tournamentsWon} ${tournamentsWon === 1 ? 'Turneu Câștigat' : 'Turnee Câștigate'}`, 
        color: '#8b5cf6',
        count: tournamentsWon
      });
    } else {
      // Badge de clovn pentru cei care nu au câștigat niciodată
      badges.push({ 
        emoji: '🤡', 
        label: 'Niciun Turneu Câștigat', 
        color: '#ef4444',
        count: 0
      });
    }
    
    // Badge pentru cei care au jucat în toate turneele
    const player = statsData?.playerStats.find(p => p.name === playerName);
    if (player && player.weeksPlayed === statsData?.overallStats.totalWeeks) {
      badges.push({ 
        emoji: '💪', 
        label: 'Prezență Perfectă', 
        color: '#3b82f6',
        count: undefined
      });
    }
    
    // Badge pentru cel cu cele mai multe victorii H2H
    if (statsData?.overallStats.mostH2HWins === playerName) {
      badges.push({ 
        emoji: '⚔️', 
        label: 'Campion H2H', 
        color: '#dc2626',
        count: undefined
      });
    }
    
    // Badge pentru cel mai activ în H2H
    if (statsData?.overallStats.mostH2HPlayed === playerName) {
      badges.push({ 
        emoji: '🎮', 
        label: 'Cel Mai Activ H2H', 
        color: '#8b5cf6',
        count: undefined
      });
    }
    
    // Badge pentru statistici H2H individuale
    const h2hStats = statsData?.h2hPlayerStats?.[playerName];
    if (h2hStats && h2hStats.total > 0) {
      const winRate = (h2hStats.wins / h2hStats.total) * 100;
      if (winRate >= 70) {
        badges.push({ 
          emoji: '🔥', 
          label: `Dominare H2H (${winRate.toFixed(0)}%)`, 
          color: '#f97316',
          count: undefined
        });
      }
      
      // Badge pentru numărul de victorii H2H (minim 1 victorie)
      if (h2hStats.wins >= 1) {
        badges.push({ 
          emoji: '🗡️', 
          label: `${h2hStats.wins} ${h2hStats.wins === 1 ? 'Victorie H2H' : 'Victorii H2H'}`, 
          color: '#dc2626',
          count: h2hStats.wins
        });
      }
    }
    
    return badges;
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
    <div style={{ minHeight: '100vh', background: 'var(--superbet-light-gray)', paddingBottom: '80px' }}>
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

        {/* Player Rankings */}
        <div style={{ 
          background: 'var(--superbet-card-bg)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          border: '1px solid var(--superbet-border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'var(--superbet-text)', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Trophy style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              Clasament General
            </h2>
            <button
              onClick={() => setShowBadgeLegend(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                border: '2px solid var(--superbet-red)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--superbet-red)',
                flexShrink: 0
              }}
              className="badge-legend-button"
              title="Legendă Badge-uri"
            >
              ?
            </button>
          </div>
          
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
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                          {getPlayerBadges(player.name).map((badge, idx) => (
                            <div
                              key={idx}
                              title={badge.label}
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                              }}
                              onClick={() => setSelectedBadge(badge)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <div style={{
                                fontSize: '20px',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                background: `linear-gradient(135deg, ${badge.color}20 0%, ${badge.color}40 100%)`,
                                borderRadius: '50%',
                                width: '34px',
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px solid ${badge.color}`,
                              }}>
                                {badge.emoji}
                              </div>
                              {badge.count !== undefined && badge.count > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  background: badge.color,
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  {badge.count}
                                </div>
                              )}
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


        {/* Weekly Performance */}
        <div style={{ 
          background: 'var(--superbet-card-bg)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          border: '1px solid var(--superbet-border)'
        }}>
          <div 
            onClick={() => setIsWeeklyExpanded(!isWeeklyExpanded)}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: isWeeklyExpanded ? '20px' : '0'
            }}
          >
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'var(--superbet-text)', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }} className="collapsible-header">
              <Calendar style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} className="header-icon" />
              Performanța Săptămânală
            </h2>
            <div style={{
              background: 'var(--superbet-light-gray)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease'
            }} className="collapse-button">
              {isWeeklyExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
          
          {isWeeklyExpanded && statsData.weeklyStats.map((week) => {
            const sortedPlayers = Object.entries(week.players).sort(([, a], [, b]) => b.points - a.points);
            const topThree = sortedPlayers.slice(0, 3);
            const restPlayers = sortedPlayers.slice(3);
            const isWeekExpanded = expandedWeeks.has(week.week);
            
            return (
            <div 
              key={week.week}
              className="weekly-section"
              style={{
                border: '1px solid var(--superbet-border)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, var(--superbet-card-bg) 0%, var(--superbet-light-gray) 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                onClick={() => toggleWeek(week.week)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: isWeekExpanded ? '32px' : '0',
                  paddingBottom: isWeekExpanded ? '16px' : '0',
                  borderBottom: isWeekExpanded ? '2px solid var(--superbet-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  margin: 0, 
                  color: 'var(--superbet-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Trophy style={{ width: '20px', height: '20px', color: 'var(--superbet-red)' }} />
                  {week.week}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="matches-badge" style={{ 
                    fontSize: '13px', 
                    color: 'white',
                    background: 'var(--superbet-red)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                  }}>
                    {week.totalMatches} meciuri
                  </div>
                  <div style={{
                    background: 'var(--superbet-card-bg)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s ease'
                  }} className="collapse-button">
                    {isWeekExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>
              
              {isWeekExpanded && (
              <>
              
              {/* Podium */}
              <div className="podium-container" style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '32px',
                minHeight: '240px'
              }}>
                {topThree.length >= 2 && topThree[1] && (() => {
                  const [playerName, stats] = topThree[1];
                  const isCurrentUser = playerName === currentUser.name;
                  const accuracyColor = stats.accuracy >= 70 ? '#10b981' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div className="podium-place podium-second" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: '1',
                      maxWidth: '160px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 100%)',
                        border: isCurrentUser ? '4px solid var(--superbet-red)' : '4px solid #a8a8a8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        boxShadow: '0 4px 12px rgba(192, 192, 192, 0.4)',
                        position: 'relative'
                      }}>
                        <span style={{ fontSize: '36px' }}>🥈</span>
                        {isCurrentUser && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--superbet-red)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: '2px solid white'
                          }}>TU</div>
                        )}
                      </div>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '16px',
                          color: 'var(--superbet-text)',
                          marginBottom: '4px'
                        }}>
                          {playerName}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--superbet-gray)',
                          marginBottom: '4px'
                        }}>
                          {stats.correct}/{stats.total} corecte
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: accuracyColor,
                          background: `${accuracyColor}15`,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {stats.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '100px',
                        background: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 100%)',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #a8a8a8',
                        borderBottom: 'none',
                        boxShadow: '0 -2px 8px rgba(192, 192, 192, 0.3)'
                      }}>
                        <Trophy style={{ width: '24px', height: '24px', color: '#8a8a8a', marginBottom: '4px', marginTop: '6px' }} />
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold',
                          color: '#6a6a6a'
                        }}>
                          {stats.points}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8a8a8a', fontWeight: '600' }}>puncte</div>
                      </div>
                    </div>
                  );
                })()}
                
                {topThree.length >= 1 && topThree[0] && (() => {
                  const [playerName, stats] = topThree[0];
                  const isCurrentUser = playerName === currentUser.name;
                  const accuracyColor = stats.accuracy >= 70 ? '#10b981' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div className="podium-place podium-first" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: '1',
                      maxWidth: '180px'
                    }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                        border: isCurrentUser ? '4px solid var(--superbet-red)' : '4px solid #daa520',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        boxShadow: '0 6px 20px rgba(255, 215, 0, 0.5)',
                        position: 'relative',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}>
                        <span style={{ fontSize: '48px' }}>👑</span>
                        {isCurrentUser && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--superbet-red)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: '2px solid white'
                          }}>TU</div>
                        )}
                      </div>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '18px',
                          color: 'var(--superbet-text)',
                          marginBottom: '4px'
                        }}>
                          {playerName}
                        </div>
                        <div style={{
                          fontSize: '15px',
                          color: 'var(--superbet-gray)',
                          marginBottom: '4px'
                        }}>
                          {stats.correct}/{stats.total} corecte
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: accuracyColor,
                          background: `${accuracyColor}15`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {stats.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '140px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #daa520',
                        borderBottom: 'none',
                        boxShadow: '0 -4px 16px rgba(255, 215, 0, 0.4)'
                      }}>
                        <Trophy style={{ width: '32px', height: '32px', color: '#b8860b', marginBottom: '6px', marginTop: '8px' }} />
                        <div style={{ 
                          fontSize: '32px', 
                          fontWeight: 'bold',
                          color: '#b8860b'
                        }}>
                          {stats.points}
                        </div>
                        <div style={{ fontSize: '12px', color: '#c9a00c', fontWeight: '600' }}>puncte</div>
                      </div>
                    </div>
                  );
                })()}
                
                {topThree.length >= 3 && topThree[2] && (() => {
                  const [playerName, stats] = topThree[2];
                  const isCurrentUser = playerName === currentUser.name;
                  const accuracyColor = stats.accuracy >= 70 ? '#10b981' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div className="podium-place podium-third" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: '1',
                      maxWidth: '160px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f4a460 0%, #cd7f32 100%)',
                        border: isCurrentUser ? '4px solid var(--superbet-red)' : '4px solid #a0522d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        boxShadow: '0 4px 12px rgba(205, 127, 50, 0.4)',
                        position: 'relative'
                      }}>
                        <span style={{ fontSize: '36px' }}>🥉</span>
                        {isCurrentUser && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--superbet-red)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: '2px solid white'
                          }}>TU</div>
                        )}
                      </div>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '16px',
                          color: 'var(--superbet-text)',
                          marginBottom: '4px'
                        }}>
                          {playerName}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--superbet-gray)',
                          marginBottom: '4px'
                        }}>
                          {stats.correct}/{stats.total} corecte
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: accuracyColor,
                          background: `${accuracyColor}15`,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {stats.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '80px',
                        background: 'linear-gradient(135deg, #f4a460 0%, #cd7f32 100%)',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #a0522d',
                        borderBottom: 'none',
                        boxShadow: '0 -2px 8px rgba(205, 127, 50, 0.3)'
                      }}>
                        <Trophy style={{ width: '24px', height: '24px', color: '#8b4513', marginBottom: '4px', marginTop: '6px' }} />
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold',
                          color: '#8b4513'
                        }}>
                          {stats.points}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a0522d', fontWeight: '600' }}>puncte</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Rest of players */}
              {restPlayers.length > 0 && (
                <div style={{
                  background: 'var(--superbet-card-bg)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--superbet-border)'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--superbet-gray)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Alți jucători
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '8px'
                  }}>
                    {restPlayers.map(([playerName, stats], index) => {
                      const isCurrentUser = playerName === currentUser.name;
                      const position = index + 4;
                      const accuracyColor = stats.accuracy >= 70 ? '#10b981' : stats.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <div
                          key={playerName}
                          style={{
                            background: isCurrentUser ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                            border: isCurrentUser ? '2px solid var(--superbet-red)' : '1px solid var(--superbet-border)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          className="other-player-row"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <div style={{
                              background: 'var(--superbet-light-gray)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: 'var(--superbet-gray)',
                              flexShrink: 0
                            }}>
                              #{position}
                            </div>
                            <div style={{ 
                              fontWeight: '600',
                              fontSize: '14px',
                              color: 'var(--superbet-text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {playerName}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <div style={{
                              fontSize: '12px',
                              color: 'var(--superbet-gray)'
                            }}>
                              {stats.correct}/{stats.total}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: accuracyColor,
                              background: `${accuracyColor}15`,
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              {stats.accuracy.toFixed(0)}%
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: 'var(--superbet-text)',
                              minWidth: '35px',
                              textAlign: 'right'
                            }}>
                              {stats.points}p
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          );
          })}
        </div>

        {/* H2H Statistics Section */}
        {statsData.h2hChallenges && statsData.h2hChallenges.length > 0 && (
          <div style={{ 
            background: 'var(--superbet-card-bg)', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px',
            border: '1px solid var(--superbet-border)'
          }}>
            <div 
              onClick={() => setIsH2HExpanded(!isH2HExpanded)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: isH2HExpanded ? '20px' : '0'
              }}
            >
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: 'var(--superbet-text)', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }} className="collapsible-header">
                <Target style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} className="header-icon" />
                Statistici Dueluri H2H
              </h2>
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease'
              }} className="collapse-button">
                {isH2HExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </div>

            {isH2HExpanded && (
              <>
            {/* Head-to-Head Records Matrix */}
            {statsData.h2hPlayerStats && Object.keys(statsData.h2hPlayerStats).length > 0 && (
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--superbet-border)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--superbet-text)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <TrendingUp style={{ width: '18px', height: '18px', color: 'var(--superbet-red)' }} />
                  Bilanț Direct (Head-to-Head)
                </h3>
                
                <div className="h2h-records-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  {(() => {
                    const players = Object.keys(statsData.h2hPlayerStats);
                    const h2hRecords: { [key: string]: { wins: number, losses: number, draws: number } } = {};
                    
                    // Calculate head-to-head records between each pair
                    statsData.h2hChallenges.forEach(challenge => {
                      const pair1 = `${challenge.challenger}-${challenge.challenged}`;
                      const pair2 = `${challenge.challenged}-${challenge.challenger}`;
                      
                      if (!h2hRecords[pair1]) {
                        h2hRecords[pair1] = { wins: 0, losses: 0, draws: 0 };
                      }
                      if (!h2hRecords[pair2]) {
                        h2hRecords[pair2] = { wins: 0, losses: 0, draws: 0 };
                      }
                      
                      if (challenge.winner === 'Egalitate') {
                        h2hRecords[pair1].draws++;
                        h2hRecords[pair2].draws++;
                      } else if (challenge.winner === challenge.challenger) {
                        h2hRecords[pair1].wins++;
                        h2hRecords[pair2].losses++;
                      } else {
                        h2hRecords[pair1].losses++;
                        h2hRecords[pair2].wins++;
                      }
                    });
                    
                    const uniquePairs = new Set<string>();
                    return Object.keys(h2hRecords)
                      .filter(key => {
                        const [p1, p2] = key.split('-');
                        const reversePair = `${p2}-${p1}`;
                        if (uniquePairs.has(key) || uniquePairs.has(reversePair)) {
                          return false;
                        }
                        uniquePairs.add(key);
                        return true;
                      })
                      .map(key => {
                        const [player1, player2] = key.split('-');
                        const record = h2hRecords[key];
                        const isCurrentUserInvolved = player1 === currentUser.name || player2 === currentUser.name;
                        
                        return (
                          <div
                            key={key}
                            style={{
                              background: isCurrentUserInvolved ? 'rgba(220, 38, 38, 0.05)' : 'var(--superbet-card-bg)',
                              border: isCurrentUserInvolved ? '2px solid var(--superbet-red)' : '1px solid var(--superbet-border)',
                              borderRadius: '10px',
                              padding: '16px',
                              display: 'grid',
                              gridTemplateColumns: '1fr auto 1fr',
                              alignItems: 'center',
                              gap: '16px'
                            }}
                          >
                            {/* Player 1 */}
                            <div style={{ textAlign: 'center' }} className="h2h-player-section">
                              <div style={{
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: 'var(--superbet-text)',
                                marginBottom: '8px'
                              }} className="h2h-player-name">
                                {player1}
                              </div>
                              <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: record.wins > record.losses ? '#10b981' : record.wins < record.losses ? '#ef4444' : 'var(--superbet-gray)'
                              }} className="h2h-wins-count">
                                {record.wins}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }} className="h2h-wins-label">
                                victorii
                              </div>
                            </div>
                            
                            {/* VS separator with draws */}
                            <div style={{ textAlign: 'center' }} className="h2h-vs-section">
                              <div style={{
                                background: 'var(--superbet-red)',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                marginBottom: record.draws > 0 ? '8px' : '0'
                              }} className="h2h-vs-badge">
                                VS
                              </div>
                              {record.draws > 0 && (
                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--superbet-gray)',
                                  background: 'var(--superbet-light-gray)',
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }} className="h2h-draws-badge">
                                  {record.draws} {record.draws === 1 ? 'egalitate' : 'egalități'}
                                </div>
                              )}
                            </div>
                            
                            {/* Player 2 */}
                            <div style={{ textAlign: 'center' }} className="h2h-player-section">
                              <div style={{
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: 'var(--superbet-text)',
                                marginBottom: '8px'
                              }} className="h2h-player-name">
                                {player2}
                              </div>
                              <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: record.losses > record.wins ? '#10b981' : record.losses < record.wins ? '#ef4444' : 'var(--superbet-gray)'
                              }} className="h2h-wins-count">
                                {record.losses}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }} className="h2h-wins-label">
                                victorii
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            )}

            {/* H2H Performance Stats */}
            {statsData.h2hChallenges && statsData.h2hChallenges.length > 0 && (
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--superbet-border)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--superbet-text)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Trophy style={{ width: '18px', height: '18px', color: 'var(--superbet-red)' }} />
                  Performanțe Notabile
                </h3>
                
                <div className="h2h-performance-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  {(() => {
                    // Find best performances
                    const bestOddsChallenge = [...statsData.h2hChallenges].sort((a, b) => 
                      Math.max(a.challengerOdds, a.challengedOdds) - Math.max(b.challengerOdds, b.challengedOdds)
                    ).reverse()[0];
                    
                    const bestMarginChallenge = [...statsData.h2hChallenges]
                      .filter(c => c.winner !== 'Egalitate')
                      .sort((a, b) => {
                        const marginA = Math.abs(a.challengerOdds - a.challengedOdds);
                        const marginB = Math.abs(b.challengerOdds - b.challengedOdds);
                        return marginB - marginA;
                      })[0];
                    
                    const mostCorrectChallenge = [...statsData.h2hChallenges].sort((a, b) => 
                      Math.max(a.challengerScore, a.challengedScore) - Math.max(b.challengerScore, b.challengedScore)
                    ).reverse()[0];
                    
                    const bestWinner = bestOddsChallenge.challengerOdds > bestOddsChallenge.challengedOdds 
                      ? bestOddsChallenge.challenger 
                      : bestOddsChallenge.challenged;
                    const bestOdds = Math.max(bestOddsChallenge.challengerOdds, bestOddsChallenge.challengedOdds);
                    
                    const marginWinner = bestMarginChallenge?.challengerOdds > bestMarginChallenge?.challengedOdds 
                      ? bestMarginChallenge.challenger 
                      : bestMarginChallenge.challenged;
                    const margin = Math.abs(bestMarginChallenge?.challengerOdds - bestMarginChallenge?.challengedOdds);
                    
                    const mostCorrectPlayer = mostCorrectChallenge.challengerScore > mostCorrectChallenge.challengedScore
                      ? mostCorrectChallenge.challenger
                      : mostCorrectChallenge.challenged;
                    const mostCorrect = Math.max(mostCorrectChallenge.challengerScore, mostCorrectChallenge.challengedScore);
                    
                    return (
                      <>
                        <div className="h2h-perf-card" style={{
                          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                          border: '2px solid #ffd700',
                          borderRadius: '10px',
                          padding: '12px'
                        }}>
                          <div style={{ fontSize: '28px', marginBottom: '6px', textAlign: 'center' }}>🏆</div>
                          <div className="h2h-perf-title" style={{ fontSize: '12px', color: 'var(--superbet-gray)', marginBottom: '4px', textAlign: 'center' }}>
                            Cea Mai Mare Cotă
                          </div>
                          <div className="h2h-perf-value" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700', textAlign: 'center', marginBottom: '4px' }}>
                            {bestOdds.toFixed(2)}
                          </div>
                          <div className="h2h-perf-name" style={{ fontSize: '12px', color: 'var(--superbet-text)', textAlign: 'center' }}>
                            {bestWinner}
                          </div>
                        </div>
                        
                        {bestMarginChallenge && (
                          <div className="h2h-perf-card" style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                            border: '2px solid #ef4444',
                            borderRadius: '10px',
                            padding: '12px'
                          }}>
                            <div style={{ fontSize: '28px', marginBottom: '6px', textAlign: 'center' }}>⚡</div>
                            <div className="h2h-perf-title" style={{ fontSize: '12px', color: 'var(--superbet-gray)', marginBottom: '4px', textAlign: 'center' }}>
                              Cea Mai Mare Diferență
                            </div>
                            <div className="h2h-perf-value" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', textAlign: 'center', marginBottom: '4px' }}>
                              +{margin.toFixed(2)}
                            </div>
                            <div className="h2h-perf-name" style={{ fontSize: '12px', color: 'var(--superbet-text)', textAlign: 'center' }}>
                              {marginWinner}
                            </div>
                          </div>
                        )}
                        
                        <div className="h2h-perf-card" style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                          border: '2px solid #10b981',
                          borderRadius: '10px',
                          padding: '12px'
                        }}>
                          <div style={{ fontSize: '28px', marginBottom: '6px', textAlign: 'center' }}>🎯</div>
                          <div className="h2h-perf-title" style={{ fontSize: '12px', color: 'var(--superbet-gray)', marginBottom: '4px', textAlign: 'center' }}>
                            Cele Mai Multe Corecte
                          </div>
                          <div className="h2h-perf-value" style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginBottom: '4px' }}>
                            {mostCorrect}
                          </div>
                          <div className="h2h-perf-name" style={{ fontSize: '12px', color: 'var(--superbet-text)', textAlign: 'center' }}>
                            {mostCorrectPlayer}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* H2H Player Stats Summary */}
            {statsData.h2hPlayerStats && Object.keys(statsData.h2hPlayerStats).length > 0 && (
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--superbet-border)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--superbet-text)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--superbet-red)' }} />
                  Statistici Generale Jucători
                </h3>
                <div className="h2h-player-stats-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  {Object.entries(statsData.h2hPlayerStats)
                    .sort(([, a], [, b]) => b.wins - a.wins)
                    .map(([playerName, stats]) => {
                      const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
                      const isCurrentUser = playerName === currentUser.name;
                      return (
                        <div
                          key={playerName}
                          style={{
                            background: isCurrentUser ? 'rgba(220, 38, 38, 0.08)' : 'var(--superbet-card-bg)',
                            border: isCurrentUser ? '2px solid var(--superbet-red)' : '1px solid var(--superbet-border)',
                            borderRadius: '10px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: 'var(--superbet-text)',
                              fontSize: '16px'
                            }} className="h2h-stat-player-name">
                              {playerName}
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
                            justifyContent: 'space-between',
                            fontSize: '14px'
                          }} className="h2h-stat-row">
                            <span style={{ color: 'var(--superbet-gray)' }}>Victorii:</span>
                            <span style={{ 
                              color: '#10b981', 
                              fontWeight: 'bold' 
                            }}>
                              {stats.wins}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '14px'
                          }} className="h2h-stat-row">
                            <span style={{ color: 'var(--superbet-gray)' }}>Înfrângeri:</span>
                            <span style={{ 
                              color: '#ef4444', 
                              fontWeight: 'bold' 
                            }}>
                              {stats.total - stats.wins}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--superbet-border)'
                          }} className="h2h-stat-row">
                            <span style={{ color: 'var(--superbet-gray)' }}>Win Rate:</span>
                            <span style={{ 
                              color: winRate >= 70 ? '#10b981' : winRate >= 50 ? '#f59e0b' : '#ef4444',
                              fontWeight: 'bold' 
                            }}>
                              {winRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            </>
            )}
          </div>
        )}
      </main>

      {/* Badge Legend Modal */}
      {showBadgeLegend && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowBadgeLegend(false)}
        >
          <div 
            style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '2px solid var(--superbet-red)',
              animation: 'slideInUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid var(--superbet-border)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--superbet-text)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Trophy style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
                Legendă Badge-uri
              </h2>
              <button
                onClick={() => setShowBadgeLegend(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: 'var(--superbet-gray)',
                  lineHeight: '1',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--superbet-red)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--superbet-gray)'}
              >
                ×
              </button>
            </div>
            
            <div className="badge-legend-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #ffd700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>👑</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '14px' }}>Cele Mai Multe Puncte</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Jucătorul cu cele mai multe puncte în total
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎯</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>Cel Mai Precis</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Cea mai mare acuratețe generală
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⚡</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '14px' }}>Cea Mai Bună Performanță</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Cea mai bună acuratețe într-o săptămână
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🏆</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>Câștigător Ultimul Turneu</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Câștigătorul săptămânii precedente
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #a855f7',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🌟</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#a855f7', fontSize: '14px' }}>Cele Mai Multe Predicții Câștigătoare</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Cele mai multe predicții corecte în total
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #8b5cf6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🏅</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#8b5cf6', fontSize: '14px' }}>Turnee Câștigate</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Numărul total de săptămâni câștigate
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🤡</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>Niciun Turneu Câștigat</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Încă nu a câștigat o săptămână
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💪</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>Prezență Perfectă</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    A participat în toate turneele
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⚔️</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>Campion H2H</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Cele mai multe victorii H2H
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #8b5cf6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎮</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#8b5cf6', fontSize: '14px' }}>Cel Mai Activ H2H</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Cele mai multe challenge-uri H2H
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #f97316',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🔥</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#f97316', fontSize: '14px' }}>Dominare H2H</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Peste 70% rată de victorie H2H
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '10px',
                padding: '16px',
                border: '2px solid #dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🗡️</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>Victorii H2H</div>
                  <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                    Numărul de victorii în dueluri H2H
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  case '🌟': return 'Cele mai multe predicții corecte în total';
                  case '🏅': return 'Numărul total de săptămâni câștigate';
                  case '🤡': return 'Încă nu a câștigat o săptămână';
                  case '💪': return 'A participat în toate turneele';
                  case '⚔️': return 'Cele mai multe victorii H2H';
                  case '🎮': return 'Cele mai multe challenge-uri H2H';
                  case '🔥': return 'Peste 70% rată de victorie H2H';
                  case '🗡️': return 'Numărul de victorii în dueluri H2H';
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
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.7);
          }
        }

        .other-player-row:hover {
          background: var(--superbet-light-gray) !important;
          transform: translateX(4px);
        }

        .badge-legend-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        @media (max-width: 768px) {
          .table-header, .table-cell {
            padding: 8px 6px;
            font-size: 13px;
          }
          
          .weekly-section {
            padding: 16px !important;
            margin-bottom: 20px !important;
          }
          
          .matches-badge {
            font-size: 11px !important;
            padding: 4px 10px !important;
          }

          .podium-container {
            gap: 8px !important;
            min-height: 200px !important;
          }

          .podium-first .podium-avatar {
            width: 70px !important;
            height: 70px !important;
          }

          .podium-first .podium-avatar span {
            font-size: 36px !important;
          }

          .podium-second .podium-avatar,
          .podium-third .podium-avatar {
            width: 60px !important;
            height: 60px !important;
          }

          .podium-second .podium-avatar span,
          .podium-third .podium-avatar span {
            font-size: 28px !important;
          }

          .podium-place {
            max-width: 120px !important;
          }

          .podium-first {
            max-width: 140px !important;
          }

          .podium-first > div:nth-child(1) {
            width: 70px !important;
            height: 70px !important;
          }

          .podium-second > div:nth-child(1),
          .podium-third > div:nth-child(1) {
            width: 60px !important;
            height: 60px !important;
          }

          .podium-first > div:nth-child(1) span {
            font-size: 36px !important;
          }

          .podium-second > div:nth-child(1) span,
          .podium-third > div:nth-child(1) span {
            font-size: 28px !important;
          }

          .podium-first > div:nth-child(2) > div:nth-child(1) {
            font-size: 14px !important;
          }

          .podium-second > div:nth-child(2) > div:nth-child(1),
          .podium-third > div:nth-child(2) > div:nth-child(1) {
            font-size: 13px !important;
          }

          .podium-first > div:nth-child(2) > div:nth-child(2),
          .podium-second > div:nth-child(2) > div:nth-child(2),
          .podium-third > div:nth-child(2) > div:nth-child(2) {
            font-size: 12px !important;
          }

          .podium-first > div:nth-child(2) > div:nth-child(3),
          .podium-second > div:nth-child(2) > div:nth-child(3),
          .podium-third > div:nth-child(2) > div:nth-child(3) {
            font-size: 11px !important;
            padding: 2px 6px !important;
          }

          .podium-first > div:nth-child(3) {
            height: 110px !important;
          }

          .podium-second > div:nth-child(3) {
            height: 80px !important;
          }

          .podium-third > div:nth-child(3) {
            height: 65px !important;
          }

          .podium-first > div:nth-child(3) > svg {
            width: 20px !important;
            height: 20px !important;
          }

          .podium-second > div:nth-child(3) > svg {
            width: 18px !important;
            height: 18px !important;
            margin-bottom: 2px !important;
          }

          .podium-third > div:nth-child(3) > svg {
            width: 18px !important;
            height: 18px !important;
            margin-bottom: 2px !important;
          }

          .podium-first > div:nth-child(3) > div:nth-child(2) {
            font-size: 24px !important;
          }

          .podium-second > div:nth-child(3) > div:nth-child(2) {
            font-size: 18px !important;
          }

          .podium-third > div:nth-child(3) > div:nth-child(2) {
            font-size: 16px !important;
          }

          .podium-first > div:nth-child(3) > div:nth-child(3),
          .podium-second > div:nth-child(3) > div:nth-child(3),
          .podium-third > div:nth-child(3) > div:nth-child(3) {
            font-size: 9px !important;
          }

          .other-player-row {
            padding: 8px 10px !important;
          }
        }
        
        /* H2H Performance Grid - Always 3 columns even on mobile */
        .h2h-performance-grid {
          grid-template-columns: repeat(3, 1fr) !important;
        }
        
        /* H2H Player Stats and Records - 3 columns on desktop */
        .h2h-player-stats-grid,
        .h2h-records-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        
        @media (max-width: 768px) {
          /* Bilanț Direct - 2 columns on mobile to fit properly */
          .h2h-records-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            justify-items: center !important;
            padding: 0 12px !important;
          }
          
          /* Statistici Generale - 3 columns on mobile */
          .h2h-player-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          
          /* Reduce font sizes for collapsible panel titles on mobile */
          .collapsible-header {
            font-size: 16px !important;
            gap: 8px !important;
          }
          
          .header-icon {
            width: 18px !important;
            height: 18px !important;
          }
          
          .collapse-button {
            padding: 6px !important;
          }
          
          .collapse-button svg {
            width: 18px !important;
            height: 18px !important;
          }
          
          h3 {
            font-size: 13px !important;
          }
          
          /* Adjust panel header height on mobile */
          .h2h-records-grid > div,
          .h2h-player-stats-grid > div {
            padding: 8px 6px !important;
          }
          
          /* Bilanț Direct - adjusted for 2 columns on mobile */
          .h2h-player-name {
            font-size: 11px !important;
            margin-bottom: 4px !important;
          }
          
          .h2h-wins-count {
            font-size: 18px !important;
          }
          
          .h2h-wins-label {
            font-size: 9px !important;
          }
          
          .h2h-vs-badge {
            font-size: 10px !important;
            padding: 4px 8px !important;
            margin-bottom: 4px !important;
          }
          
          .h2h-draws-badge {
            font-size: 8px !important;
            padding: 2px 4px !important;
          }
          
          .h2h-records-grid > div {
            padding: 8px 4px !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          
          .h2h-records-grid > div > div {
            gap: 6px !important;
          }
          
          /* Statistici Generale Jucători - reduce font sizes for 3 columns on mobile */
          .h2h-stat-player-name {
            font-size: 12px !important;
          }
          
          .h2h-stat-row {
            font-size: 11px !important;
          }
          
          .h2h-stat-row span {
            font-size: 10px !important;
          }
          
          .h2h-perf-card {
            padding: 8px !important;
          }
          
          .h2h-perf-title {
            font-size: 10px !important;
          }
          
          .h2h-perf-value {
            font-size: 14px !important;
          }
          
          .h2h-perf-name {
            font-size: 10px !important;
          }
          
          .h2h-performance-grid {
            gap: 8px !important;
          }
        }
        
        @media (max-width: 600px) {
          main {
            padding: 12px !important;
          }
          
          /* Badge legend modal - 3 per row on mobile */
          .badge-legend-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }

          .badge-legend-grid > div {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 12px 8px !important;
            gap: 8px !important;
          }

          .badge-legend-grid > div > div:first-child {
            font-size: 28px !important;
          }

          .badge-legend-grid > div > div:last-child > div:first-child {
            font-size: 11px !important;
            line-height: 1.2 !important;
          }

          .badge-legend-grid > div > div:last-child > div:last-child {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }

          .badge-legend-button {
            width: 32px !important;
            height: 32px !important;
            font-size: 14px !important;
          }
        }
        
        @media (max-width: 480px) {
          .badge-legend-grid {
            gap: 6px !important;
          }

          .badge-legend-grid > div {
            padding: 10px 6px !important;
            gap: 6px !important;
          }

          .badge-legend-grid > div > div:first-child {
            font-size: 24px !important;
          }

          .badge-legend-grid > div > div:last-child > div:first-child {
            font-size: 10px !important;
          }

          .badge-legend-grid > div > div:last-child > div:last-child {
            font-size: 8px !important;
          }

          .weekly-section {
            padding: 12px !important;
            border-radius: 12px !important;
          }
          
          .matches-badge {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }

          .podium-container {
            gap: 6px !important;
            min-height: 180px !important;
          }

          .podium-first > div:nth-child(1) {
            width: 60px !important;
            height: 60px !important;
          }

          .podium-second > div:nth-child(1),
          .podium-third > div:nth-child(1) {
            width: 50px !important;
            height: 50px !important;
          }

          .podium-first > div:nth-child(1) span {
            font-size: 30px !important;
          }

          .podium-second > div:nth-child(1) span,
          .podium-third > div:nth-child(1) span {
            font-size: 24px !important;
          }

          .podium-place {
            max-width: 100px !important;
          }

          .podium-first {
            max-width: 120px !important;
          }

          .podium-first > div:nth-child(3) {
            height: 90px !important;
          }

          .podium-second > div:nth-child(3) {
            height: 65px !important;
          }

          .podium-third > div:nth-child(3) {
            height: 55px !important;
          }

          .podium-first > div:nth-child(3) > svg {
            width: 18px !important;
            height: 18px !important;
            margin-bottom: 2px !important;
          }

          .podium-second > div:nth-child(3) > svg {
            width: 16px !important;
            height: 16px !important;
            margin-bottom: 1px !important;
          }

          .podium-third > div:nth-child(3) > svg {
            width: 16px !important;
            height: 16px !important;
            margin-bottom: 1px !important;
          }

          .podium-first > div:nth-child(3) > div:nth-child(2) {
            font-size: 18px !important;
          }

          .podium-second > div:nth-child(3) > div:nth-child(2) {
            font-size: 15px !important;
          }

          .podium-third > div:nth-child(3) > div:nth-child(2) {
            font-size: 14px !important;
          }

          .podium-first > div:nth-child(3) > div:nth-child(3) {
            font-size: 9px !important;
          }

          .podium-second > div:nth-child(3) > div:nth-child(3),
          .podium-third > div:nth-child(3) > div:nth-child(3) {
            font-size: 8px !important;
          }

          .other-player-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 8px !important;
            gap: 6px !important;
          }

          .other-player-row > div {
            width: 100% !important;
          }
        }
      `}</style>

      <footer style={{ background: 'var(--superbet-card-bg)', borderTop: '1px solid var(--superbet-border)', padding: '20px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                background: 'var(--superbet-red)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>P</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
                  Predictio
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--superbet-gray)', margin: 0 }}>
                🏆 Joc de Predicții Fotbal cu Prietenii
              </p>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav pendingChallengesCount={pendingChallengesCount} />

      {showH2HManager && currentUser && (
        <H2HManager 
          currentUser={currentUser}
          isOpen={showH2HManager}
          onClose={handleCloseH2H}
        />
      )}
    </div>
  );
}
