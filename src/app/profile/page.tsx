'use client';

import { useEffect, useState } from 'react';
import { User, Award, TrendingUp, Target } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import H2HManager from '@/components/H2HManager';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface WeekData {
  week: string;
  totalMatches: number;
  players: Record<string, {
    correct: number;
    total: number;
    accuracy: number;
    points: number;
  }>;
}

interface PlayerStats {
  name: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalPoints: number;
  rank: number;
  weeksPlayed: number;
}

const ANIMAL_AVATARS = [
  { name: 'Tony', emoji: '🦁', color: '#f59e0b' },
  { name: 'mihai94', emoji: '🐺', color: '#3b82f6' },
  { name: 'Tone Andrei', emoji: '🦊', color: '#f97316' },
  { name: 'Cezar', emoji: '🐻', color: '#8b5cf6' },
  { name: 'Dew', emoji: '🦅', color: '#06b6d4' },
  { name: 'Flo', emoji: '🐯', color: '#ef4444' }
];

interface OverallStats {
  totalWeeks: number;
  mostAccuratePlayer: string;
  bestWeeklyPlayer: string;
  lastWeekWinnerName: string;
  mostCorrectPlayer: string;
  weeklyWinners: Record<string, number>;
  mostH2HWins?: string;
  mostH2HPlayed?: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeekData[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [h2hPlayerStats, setH2hPlayerStats] = useState<Record<string, { wins: number; total: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showH2HManager, setShowH2HManager] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

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

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      fetchStats(parsedUser.name);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPendingChallengesCount();
      const interval = setInterval(fetchPendingChallengesCount, 30000);
      return () => clearInterval(interval);
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

  const fetchStats = async (userName: string) => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setWeeklyStats(data.weeklyStats);
      setPlayerStats(data.playerStats);
      setOverallStats(data.overallStats);
      setH2hPlayerStats(data.h2hPlayerStats || {});
      
      const userStat = data.playerStats.find((p: PlayerStats) => p.name === userName);
      setUserStats(userStat || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('predictio_user');
    window.location.href = '/';
  };

  const handleCloseH2H = () => {
    setShowH2HManager(false);
    fetchPendingChallengesCount();
  };

  const getUserAvatar = (name: string) => {
    return ANIMAL_AVATARS.find(a => a.name === name) || ANIMAL_AVATARS[0];
  };

  const getUserBadges = (playerName: string, stats: PlayerStats) => {
    const badges: Array<{ emoji: string; label: string; color: string }> = [];
    
    if (!overallStats) return badges;
    
    if (stats.rank === 1) {
      badges.push({ emoji: '👑', label: 'Cele Mai Multe Puncte', color: '#ffd700' });
    }
    
    if (overallStats.mostAccuratePlayer === playerName) {
      badges.push({ emoji: '🎯', label: 'Cel Mai Precis', color: '#10b981' });
    }
    
    if (overallStats.bestWeeklyPlayer === playerName) {
      badges.push({ emoji: '⚡', label: 'Cea Mai Bună Performanță', color: '#f59e0b' });
    }
    
    if (overallStats.lastWeekWinnerName === playerName) {
      badges.push({ emoji: '🏆', label: 'Câștigător Ultimul Turneu', color: '#dc2626' });
    }
    
    if (overallStats.mostCorrectPlayer === playerName) {
      badges.push({ emoji: '🌟', label: 'Cele Mai Multe Predicții Câștigătoare', color: '#a855f7' });
    }
    
    const tournamentsWon = overallStats.weeklyWinners[playerName] || 0;
    if (tournamentsWon > 0) {
      badges.push({ 
        emoji: '🏅', 
        label: `${tournamentsWon} ${tournamentsWon === 1 ? 'Turneu Câștigat' : 'Turnee Câștigate'}`, 
        color: '#8b5cf6'
      });
    } else {
      badges.push({ emoji: '🤡', label: 'Niciun Turneu Câștigat', color: '#ef4444' });
    }
    
    if (stats.weeksPlayed === overallStats.totalWeeks) {
      badges.push({ emoji: '💪', label: 'Prezență Perfectă', color: '#3b82f6' });
    }
    
    if (overallStats.mostH2HWins === playerName) {
      badges.push({ emoji: '⚔️', label: 'Campion H2H', color: '#dc2626' });
    }
    
    if (overallStats.mostH2HPlayed === playerName) {
      badges.push({ emoji: '🎮', label: 'Cel Mai Activ H2H', color: '#8b5cf6' });
    }
    
    const h2hStats = h2hPlayerStats[playerName];
    if (h2hStats && h2hStats.total > 0) {
      const winRate = (h2hStats.wins / h2hStats.total) * 100;
      if (winRate >= 70) {
        badges.push({ emoji: '🔥', label: `Dominare H2H (${winRate.toFixed(0)}%)`, color: '#f97316' });
      }
      
      if (h2hStats.wins >= 1) {
        badges.push({ 
          emoji: '🗡️', 
          label: `${h2hStats.wins} ${h2hStats.wins === 1 ? 'Victorie H2H' : 'Victorii H2H'}`, 
          color: '#dc2626'
        });
      }
    }
    
    return badges;
  };

  const getRankData = () => {
    if (!userStats) return [];
    
    return weeklyStats.map((week, index) => {
      const playerData = week.players[userStats.name];
      if (!playerData) return { week: `W${index + 1}`, rank: 6 };
      
      const ranks = Object.entries(week.players)
        .sort((a, b) => b[1].points - a[1].points)
        .map(([name]) => name);
      
      return {
        week: `W${index + 1}`,
        rank: ranks.indexOf(userStats.name) + 1
      };
    });
  };

  const getAccuracyData = () => {
    if (!userStats) return [];
    
    return weeklyStats.map((week, index) => {
      const playerData = week.players[userStats.name];
      return {
        week: `W${index + 1}`,
        accuracy: playerData?.accuracy || 0
      };
    });
  };

  if (isLoading || !currentUser || !userStats) {
    return (
      <ThemeProvider>
        <div style={{ 
          minHeight: '100vh', 
          background: 'var(--superbet-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>Se încarcă...</div>
        </div>
      </ThemeProvider>
    );
  }

  const avatar = getUserAvatar(currentUser.name);
  const badges = getUserBadges(currentUser.name, userStats);
  const rankData = getRankData();
  const accuracyData = getAccuracyData();

  return (
    <ThemeProvider>
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--superbet-bg)',
        paddingBottom: '80px'
      }}>
        <Header currentUser={currentUser} onLogout={handleLogout} />
        
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          padding: '24px 20px' 
        }}>
          <div style={{
            background: 'var(--superbet-card-bg)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid var(--superbet-border)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatar.color}22 0%, ${avatar.color}44 100%)`,
              border: `4px solid ${avatar.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              margin: '0 auto 20px',
              boxShadow: `0 8px 24px ${avatar.color}33`
            }}>
              {avatar.emoji}
            </div>
            
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--superbet-text)',
              marginBottom: '8px'
            }}>
              {currentUser.name}
            </h1>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--superbet-red)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '24px'
            }}>
              <Award style={{ width: '20px', height: '20px' }} />
              Loc #{userStats.rank}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '20px',
              marginTop: '24px'
            }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--superbet-red)' }}>
                  {userStats.totalPoints.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>Puncte Totale</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                  {userStats.accuracy.toFixed(0)}%
                </div>
                <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>Acuratețe</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {userStats.correctPredictions}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>Predicții Corecte</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {userStats.weeksPlayed}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>Săptămâni Jucate</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--superbet-card-bg)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--superbet-border)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Award style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: 'var(--superbet-text)',
                margin: 0
              }}>
                Badges
              </h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {badges.map((badge, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--superbet-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `2px solid ${badge.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ 
                    fontSize: '32px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}>
                    {badge.emoji}
                  </div>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: badge.color, 
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      {badge.label.split(' (')[0]}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--superbet-gray)'
                    }}>
                      {(() => {
                        switch(badge.emoji) {
                          case '👑': return 'Cel mai bun scor total';
                          case '🎯': return 'Cea mai mare acuratețe';
                          case '⚡': return 'Performanță excepțională';
                          case '🏆': return 'Câștigător recent';
                          case '🌟': return 'Cele mai multe corecte';
                          case '🏅': return 'Victorii săptămânale';
                          case '🤡': return 'Fără victorii';
                          case '💪': return 'A jucat în toate turneele';
                          case '⚔️': return 'Cel mai bun la H2H';
                          case '🎮': return 'Cel mai activ H2H';
                          case '🔥': return 'Dominare H2H';
                          case '🗡️': return 'Victorii în dueluri';
                          default: return '';
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              
              {badges.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '32px',
                  color: 'var(--superbet-gray)'
                }}>
                  Continuă să joci pentru a debloca badges! 🎯
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--superbet-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'var(--superbet-text)',
                  margin: 0
                }}>
                  Evoluție Clasament
                </h2>
              </div>
              
              <div style={{ height: '300px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="rankGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--superbet-red)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--superbet-red)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Legendă - Axa Y (Poziție) */}
                  <text 
                    x="40" 
                    y="15" 
                    fill="var(--superbet-gray)" 
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    Poziție
                  </text>
                  
                  {/* Legendă - Axa X (Săptămână) */}
                  <text 
                    x="200" 
                    y="310" 
                    fill="var(--superbet-gray)" 
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Săptămână
                  </text>
                  
                  <line x1="40" y1="250" x2="360" y2="250" stroke="var(--superbet-border)" strokeWidth="2" />
                  <line x1="40" y1="30" x2="40" y2="250" stroke="var(--superbet-border)" strokeWidth="2" />
                  
                  {[1, 2, 3, 4, 5, 6].map(rank => (
                    <g key={rank}>
                      <line 
                        x1="35" 
                        y1={30 + ((rank - 1) * 220 / 5)} 
                        x2="360" 
                        y2={30 + ((rank - 1) * 220 / 5)} 
                        stroke="var(--superbet-border)" 
                        strokeWidth="1" 
                        strokeDasharray="4"
                        opacity="0.3"
                      />
                      <text 
                        x="28" 
                        y={35 + ((rank - 1) * 220 / 5)} 
                        fill="var(--superbet-gray)" 
                        fontSize="12"
                        textAnchor="end"
                      >
                        {rank}
                      </text>
                    </g>
                  ))}
                  
                  {rankData.length > 0 && (
                    <>
                      <polyline
                        points={rankData.map((d, i) => 
                          `${40 + (i * 320 / (rankData.length - 1))},${30 + ((d.rank - 1) * 220 / 5)}`
                        ).join(' ')}
                        fill="url(#rankGradient)"
                        stroke="none"
                      />
                      
                      <polyline
                        points={rankData.map((d, i) => 
                          `${40 + (i * 320 / (rankData.length - 1))},${30 + ((d.rank - 1) * 220 / 5)}`
                        ).join(' ')}
                        fill="none"
                        stroke="var(--superbet-red)"
                        strokeWidth="3"
                      />
                      
                      {rankData.map((d, i) => (
                        <g key={i}>
                          <circle
                            cx={40 + (i * 320 / (rankData.length - 1))}
                            cy={30 + ((d.rank - 1) * 220 / 5)}
                            r="5"
                            fill="var(--superbet-red)"
                          />
                          <text
                            x={40 + (i * 320 / (rankData.length - 1))}
                            y="275"
                            fill="var(--superbet-gray)"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            {d.week}
                          </text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </div>

            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--superbet-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Target style={{ width: '24px', height: '24px', color: '#10b981' }} />
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'var(--superbet-text)',
                  margin: 0
                }}>
                  Evoluție Acuratețe
                </h2>
              </div>
              
              <div style={{ height: '300px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Legendă - Axa Y (Acuratețe) */}
                  <text 
                    x="40" 
                    y="15" 
                    fill="var(--superbet-gray)" 
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    Acuratețe (%)
                  </text>
                  
                  {/* Legendă - Axa X (Săptămână) */}
                  <text 
                    x="200" 
                    y="310" 
                    fill="var(--superbet-gray)" 
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Săptămână
                  </text>
                  
                  <line x1="40" y1="250" x2="360" y2="250" stroke="var(--superbet-border)" strokeWidth="2" />
                  <line x1="40" y1="30" x2="40" y2="250" stroke="var(--superbet-border)" strokeWidth="2" />
                  
                  {[0, 25, 50, 75, 100].map(acc => (
                    <g key={acc}>
                      <line 
                        x1="35" 
                        y1={250 - (acc * 220 / 100)} 
                        x2="360" 
                        y2={250 - (acc * 220 / 100)} 
                        stroke="var(--superbet-border)" 
                        strokeWidth="1" 
                        strokeDasharray="4"
                        opacity="0.3"
                      />
                      <text 
                        x="28" 
                        y={255 - (acc * 220 / 100)} 
                        fill="var(--superbet-gray)" 
                        fontSize="12"
                        textAnchor="end"
                      >
                        {acc}%
                      </text>
                    </g>
                  ))}
                  
                  {accuracyData.length > 0 && (
                    <>
                      <polyline
                        points={accuracyData.map((d, i) => 
                          `${40 + (i * 320 / (accuracyData.length - 1))},${250 - (d.accuracy * 220 / 100)}`
                        ).join(' ')}
                        fill="url(#accuracyGradient)"
                        stroke="none"
                      />
                      
                      <polyline
                        points={accuracyData.map((d, i) => 
                          `${40 + (i * 320 / (accuracyData.length - 1))},${250 - (d.accuracy * 220 / 100)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      
                      {accuracyData.map((d, i) => (
                        <g key={i}>
                          <circle
                            cx={40 + (i * 320 / (accuracyData.length - 1))}
                            cy={250 - (d.accuracy * 220 / 100)}
                            r="5"
                            fill="#10b981"
                          />
                          <text
                            x={40 + (i * 320 / (accuracyData.length - 1))}
                            y="275"
                            fill="var(--superbet-gray)"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            {d.week}
                          </text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        <BottomNav pendingChallengesCount={pendingChallengesCount} />

        {showH2HManager && currentUser && (
          <H2HManager 
            currentUser={currentUser}
            isOpen={showH2HManager}
            onClose={handleCloseH2H}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

