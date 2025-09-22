'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Calendar, Trophy, Trash2, RotateCcw, UserX, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  odds_1: number | null;
  odds_x: number | null;
  odds_2: number | null;
  result: '1' | 'X' | '2' | null;
}

interface User {
  id: number;
  name: string;
  is_admin?: boolean;
}

interface Prediction {
  id: number;
  user_id: number;
  match_id: string;
  prediction: '1' | 'X' | '2';
  user_name: string;
}

interface PredictionTableProps {
  currentUser: { id: number; name: string };
}

export default function PredictionTable({ currentUser }: PredictionTableProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [matchesRes, usersRes, predictionsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/users'),
        fetch('/api/predictions'),
      ]);

      const [matchesData, usersData, predictionsData] = await Promise.all([
        matchesRes.json(),
        usersRes.json(),
        predictionsRes.json(),
      ]);

      setMatches(matchesData.matches || []);
      setUsers(usersData.users || []); // This already excludes admin users
      setPredictions(predictionsData.predictions || []);
      
      // Check if current user is admin
      const allUsers = usersData.allUsers || [];
      const currentUserData = allUsers.find((u: User) => u.id === currentUser.id);
      setIsCurrentUserAdmin(currentUserData?.is_admin || false);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const makePrediction = async (matchId: string, prediction: '1' | 'X' | '2') => {
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          matchId,
          prediction,
        }),
      });

      if (response.ok) {
        loadData();
      } else if (response.status === 409) {
        // Prediction is locked
        alert('⚠️ Prediction is locked! Once you make a prediction, it cannot be changed.');
        loadData(); // Refresh to show the locked state
      } else {
        console.error('Failed to make prediction:', response.status);
        alert('Failed to make prediction. Please try again.');
      }
    } catch (error) {
      console.error('Failed to make prediction:', error);
      alert('Failed to make prediction. Please try again.');
    }
  };

  const setMatchResult = async (matchId: string, result: '1' | 'X' | '2') => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_result',
          matchId,
          result,
        }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to update match result:', error);
    }
  };

  const clearAllPredictions = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL predictions? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.name, // API expects name as userId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to clear predictions:', error);
      alert('❌ Failed to clear predictions. Please try again.');
    }
  };

  const clearAllResults = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL match results? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.name, // API expects name as userId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to clear results:', error);
      alert('❌ Failed to clear results. Please try again.');
    }
  };

  const overridePrediction = async (targetUserId: number, matchId: string, prediction: '1' | 'X' | '2' | null) => {
    try {
      const response = await fetch('/api/admin/override-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
          targetUserId,
          matchId,
          prediction,
          action: prediction === null ? 'delete' : 'update',
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to override prediction:', error);
      alert('❌ Failed to override prediction. Please try again.');
    }
  };

  const overrideResult = async (matchId: string, result: '1' | 'X' | '2' | null) => {
    try {
      const response = await fetch('/api/admin/override-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
          matchId,
          result,
          action: result === null ? 'clear_result' : 'update_result',
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to override result:', error);
      alert('❌ Failed to override result. Please try again.');
    }
  };

  const clearAllUsers = async () => {
    if (!confirm('⚠️ Ești sigur că vrei să ștergi toți utilizatorii NON-ADMIN și predicțiile lor? Adminii vor fi păstrați!')) {
      return;
    }

    // Double confirmation for this destructive action
    if (!confirm('⚠️ CONFIRMĂ: Vei șterge toți jucătorii (nu adminii). Continuă?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData(); // Just reload data instead of full page refresh
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to clear users:', error);
      alert('❌ Failed to clear users. Please try again.');
    }
  };

  const getUserPrediction = (matchId: string, userId: number): '1' | 'X' | '2' | null => {
    const prediction = predictions.find(p => p.match_id === matchId && p.user_id === userId);
    return prediction ? prediction.prediction : null;
  };

  const calculateUserScore = (userId: number): number => {
    let totalOdds = 0;

    matches.forEach(match => {
      if (match.result) {
        const userPrediction = getUserPrediction(match.id, userId);
        if (userPrediction === match.result) {
          const odds = userPrediction === '1' ? match.odds_1 : 
                      userPrediction === 'X' ? match.odds_x : 
                      match.odds_2;
          totalOdds += odds || 0;
        }
      }
    });

    return totalOdds;
  };

  const getCurrentUserRanking = (): { position: number; total: number } => {
    // Calculate scores for all users (including admins for ranking purposes)
    const allUsersWithScores = users.map(user => ({
      userId: user.id,
      score: calculateUserScore(user.id),
      name: user.name
    }));

    // Sort by score descending
    allUsersWithScores.sort((a, b) => b.score - a.score);

    // Find current user position
    const currentUserIndex = allUsersWithScores.findIndex(user => user.userId === currentUser.id);
    
    return {
      position: currentUserIndex + 1, // 1-based position
      total: allUsersWithScores.length
    };
  };

  const getLeaderboardData = () => {
    return users.map(user => {
      const score = calculateUserScore(user.id);
      
      // Count correct predictions
      let correctPredictions = 0;
      let totalPredictions = 0;
      
      matches.forEach(match => {
        const userPrediction = getUserPrediction(match.id, user.id);
        if (userPrediction) {
          totalPredictions++;
          if (match.result && userPrediction === match.result) {
            correctPredictions++;
          }
        }
      });

      return {
        userId: user.id,
        name: user.name,
        score,
        correctPredictions,
        totalPredictions,
        accuracy: totalPredictions > 0 ? (correctPredictions / totalPredictions * 100) : 0
      };
    }).sort((a, b) => b.score - a.score);
  };

  const hasCurrentUserCompletedAllPredictions = (): { completed: boolean; missing: number; total: number } => {
    // Get matches without results (available for predictions)
    const availableMatches = matches.filter(match => !match.result);
    
    // Count how many of these matches the current user has predicted
    let predictedCount = 0;
    availableMatches.forEach(match => {
      const userPrediction = getUserPrediction(match.id, currentUser.id);
      if (userPrediction) {
        predictedCount++;
      }
    });

    return {
      completed: predictedCount === availableMatches.length,
      missing: availableMatches.length - predictedCount,
      total: availableMatches.length
    };
  };


  if (isLoading) {
    return <LoadingSpinner message="Loading matches and predictions..." />;
  }

  if (matches.length === 0) {
    return (
      <div className="superbet-card" style={{ padding: '48px', textAlign: 'center' }}>
        <Trophy style={{ width: '64px', height: '64px', color: 'var(--superbet-red)', margin: '0 auto 16px' }} />
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          color: '#1a1a1a', 
          margin: '0 0 8px 0' 
        }}>
          Nu sunt Meciuri Disponibile
        </h3>
        <p style={{ 
          color: 'var(--superbet-gray)', 
          margin: 0,
          fontSize: '16px',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Meciurile vor fi încărcate înainte ca perioada de joc să înceapă. Revino în curând pentru a-ți face predicțiile!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with stats */}
      <div className="superbet-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar style={{ width: '20px', height: '20px', color: 'var(--superbet-red)' }} />
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                Predicții Fotbal
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Player ranking badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '6px 12px',
                  background: (() => {
                    const pos = getCurrentUserRanking().position;
                    if (pos === 1) return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; // Gold
                    if (pos === 2) return 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)'; // Silver
                    if (pos === 3) return 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)'; // Bronze
                    return 'linear-gradient(135deg, #475569 0%, #334155 100%)'; // Dark Slate
                  })(),
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: 'fit-content'
                }}>
                  <Trophy style={{ width: '16px', height: '16px' }} />
                  <span>#{getCurrentUserRanking().position}</span>
                  <div style={{
                    width: '1px',
                    height: '14px',
                    background: 'rgba(255,255,255,0.3)'
                  }}></div>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>
                    {currentUser.name}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--superbet-gray)',
                  fontWeight: 500
                }}>
                  din {getCurrentUserRanking().total} jucători
                </div>
              </div>
              
              {isCurrentUserAdmin && (
                <div style={{
                  padding: '4px 12px',
                  background: '#fef2f2',
                  color: 'var(--superbet-red)',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  border: '1px solid #fecaca'
                }}>
                  🛡️ ADMIN
                </div>
              )}
            </div>
          </div>
          
          {/* Admin buttons - visible only to admin */}
          {isCurrentUserAdmin && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={clearAllPredictions}
                className="superbet-outline-button"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                <span className="hidden-mobile-text">Șterge Predicții</span>
                <span className="show-mobile-text">Șterge P.</span>
              </button>
              <button
                onClick={clearAllResults}
                className="superbet-button"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                <span className="hidden-mobile-text">Șterge Rezultate</span>
                <span className="show-mobile-text">Șterge R.</span>
              </button>
              <button
                onClick={clearAllUsers}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <UserX style={{ width: '16px', height: '16px' }} />
                <span className="hidden-mobile-text">Șterge Jucători</span>
                <span className="show-mobile-text">Șterge J.</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prediction Status Banner - only show for non-admin users */}
      {!isCurrentUserAdmin && (() => {
        const predictionStatus = hasCurrentUserCompletedAllPredictions();
        return !predictionStatus.completed ? (
          <div className="superbet-card" style={{ 
            padding: '16px 20px', 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <EyeOff style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: '#92400e',
                  marginBottom: '4px'
                }}>
                  Predicțiile altor jucători sunt ascunse
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#b45309',
                  lineHeight: 1.4
                }}>
                  Completează toate predicțiile tale ({predictionStatus.missing} rămase din {predictionStatus.total}) pentru a vedea predicțiile celorlalți jucători.
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Leaderboard Table - Always visible */}
      <div className="superbet-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--superbet-light-gray)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ width: '20px', height: '20px', color: 'var(--superbet-red)' }} />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
              Clasament
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="superbet-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '60px' }}>Pos</th>
                <th style={{ textAlign: 'left', minWidth: '120px' }}>Jucător</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Scor</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Corecte</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Total</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Acuratețe</th>
              </tr>
            </thead>
            <tbody>
              {getLeaderboardData().map((player, index) => {
                const position = index + 1;
                const isCurrentUser = player.userId === currentUser.id;
                
                // Medal colors based on position
                const getMedalStyle = (pos: number) => {
                  if (pos === 1) return {
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(255, 215, 0, 0.3)'
                  };
                  if (pos === 2) return {
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', // Silver
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(192, 192, 192, 0.3)'
                  };
                  if (pos === 3) return {
                    background: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)', // Bronze
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(205, 127, 50, 0.3)'
                  };
                  return {
                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', // Dark Slate
                    color: 'white',
                    boxShadow: '0 1px 3px rgba(71, 85, 105, 0.3)'
                  };
                };
                
                const medalStyle = getMedalStyle(position);
                
                return (
                  <tr key={player.userId} style={{ 
                    backgroundColor: isCurrentUser ? 'rgba(229, 231, 235, 0.3)' : 'transparent',
                    borderLeft: isCurrentUser ? '3px solid var(--superbet-red)' : '3px solid transparent'
                  }}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '14px',
                        ...medalStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                        margin: '0 auto'
                      }}>
                        {position}
                      </div>
                    </td>
                    <td style={{ fontWeight: isCurrentUser ? 600 : 400 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: isCurrentUser ? 'var(--superbet-red)' : '#1a1a1a' }}>
                          {player.name}
                        </span>
                        {isCurrentUser && (
                          <span style={{ 
                            fontSize: '10px', 
                            background: 'var(--superbet-red)', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '8px',
                            fontWeight: 600
                          }}>
                            TU
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: position === 1 ? '#FFD700' : 
                               position === 2 ? '#C0C0C0' : 
                               position === 3 ? '#CD7F32' : '#475569',
                        fontSize: '14px'
                      }}>
                        {player.score.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: '#10b981' 
                      }}>
                        {player.correctPredictions}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: 'var(--superbet-gray)' }}>
                        {player.totalPredictions}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: player.accuracy >= 60 ? '#dcfce7' : 
                                   player.accuracy >= 40 ? '#fef3c7' : '#fecaca',
                        color: player.accuracy >= 60 ? '#166534' : 
                               player.accuracy >= 40 ? '#92400e' : '#991b1b',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {player.accuracy.toFixed(0)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main prediction table */}
      <div className="superbet-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="superbet-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '200px' }}>Meci</th>
                <th style={{ textAlign: 'center', width: '80px' }}>1</th>
                <th style={{ textAlign: 'center', width: '80px' }}>X</th>
                <th style={{ textAlign: 'center', width: '80px' }}>2</th>
                {users.map(user => (
                  <th key={user.id} style={{ textAlign: 'center', minWidth: '80px' }} title={user.name}>
                    {user.name.length > 8 ? `${user.name.substring(0, 8)}...` : user.name}
                  </th>
                ))}
                <th style={{ textAlign: 'center', width: '100px' }}>Rezultat</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>
                        {match.home_team} vs {match.away_team}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--superbet-gray)', marginBottom: '2px' }}>
                        {match.league}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                        {format(new Date(match.match_date), 'dd MMM, HH:mm')}
                      </div>
                    </div>
                  </td>
                  
                  {/* Odds columns */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a1a1a' }}>
                      {match.odds_1?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a1a1a' }}>
                      {match.odds_x?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a1a1a' }}>
                      {match.odds_2?.toFixed(2) || '-'}
                    </span>
                  </td>

                  {/* User prediction columns */}
                  {users.map(user => {
                    const userPrediction = getUserPrediction(match.id, user.id);
                    const isCurrentUser = user.id === currentUser.id && !isCurrentUserAdmin; // Admins don't make predictions
                    const hasExistingPrediction = userPrediction !== null;
                    
                    // Check if predictions should be hidden
                    const predictionStatus = hasCurrentUserCompletedAllPredictions();
                    const shouldHidePredictions = !isCurrentUserAdmin && !predictionStatus.completed && !isCurrentUser;
                    
                    return (
                      <td key={user.id} style={{ textAlign: 'center' }}>
                        {isCurrentUser && !match.result && !hasExistingPrediction ? (
                          // Show prediction buttons only if no prediction exists yet and user is not admin
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {(['1', 'X', '2'] as const).map(option => (
                              <button
                                key={option}
                                onClick={() => makePrediction(match.id, option)}
                                className="prediction-btn"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : shouldHidePredictions ? (
                          // Hide other players' predictions if current user hasn't completed all
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span style={{
                              fontSize: '16px',
                              color: '#9CA3AF',
                              opacity: 0.6
                            }}>
                              ?
                            </span>
                          </div>
                        ) : (
                          // Show locked prediction or admin controls
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span className={`prediction-btn ${
                              match.result && userPrediction === match.result ? 'correct' :
                              match.result && userPrediction && userPrediction !== match.result ? 'incorrect' :
                              userPrediction ? 'selected' : ''
                            }`}>
                              {userPrediction || '-'}
                            </span>
                            {isCurrentUser && hasExistingPrediction && !match.result && (
                              <span style={{ fontSize: '12px' }} title="Predicția este blocată">
                                🔒
                              </span>
                            )}
                            {isCurrentUserAdmin && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {/* Admin prediction override buttons */}
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {(['1', 'X', '2'] as const).map(option => (
                                    <button
                                      key={option}
                                      onClick={() => overridePrediction(user.id, match.id, option)}
                                      className="admin-mini-btn"
                                      style={{
                                        fontSize: '10px',
                                        padding: '2px 4px',
                                        minWidth: '20px',
                                        minHeight: '16px',
                                        backgroundColor: userPrediction === option ? 'var(--superbet-red)' : 'transparent',
                                        color: userPrediction === option ? 'white' : 'var(--superbet-red)',
                                        border: '1px solid var(--superbet-red)',
                                        borderRadius: '2px'
                                      }}
                                      title={`Set ${user.name}'s prediction to ${option}`}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                  {hasExistingPrediction && (
                                    <button
                                      onClick={() => overridePrediction(user.id, match.id, null)}
                                      className="admin-mini-btn"
                                      style={{
                                        fontSize: '10px',
                                        padding: '2px 4px',
                                        minWidth: '16px',
                                        minHeight: '16px',
                                        backgroundColor: 'transparent',
                                        color: '#dc2626',
                                        border: '1px solid #dc2626',
                                        borderRadius: '2px'
                                      }}
                                      title={`Delete ${user.name}'s prediction`}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Result column */}
                  <td style={{ textAlign: 'center' }}>
                    {match.result ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                          <span style={{ fontWeight: 600, color: '#10b981' }}>{match.result}</span>
                        </div>
                        {isCurrentUserAdmin && (
                          <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                            {(['1', 'X', '2'] as const).map(option => (
                              <button
                                key={option}
                                onClick={() => overrideResult(match.id, option)}
                                className="admin-mini-btn"
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  minWidth: '20px',
                                  minHeight: '16px',
                                  backgroundColor: match.result === option ? 'var(--superbet-red)' : 'transparent',
                                  color: match.result === option ? 'white' : 'var(--superbet-red)',
                                  border: '1px solid var(--superbet-red)',
                                  borderRadius: '2px'
                                }}
                                title={`Change result to ${option}`}
                              >
                                {option}
                              </button>
                            ))}
                            <button
                              onClick={() => overrideResult(match.id, null)}
                              className="admin-mini-btn"
                              style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                minWidth: '16px',
                                minHeight: '16px',
                                backgroundColor: 'transparent',
                                color: '#dc2626',
                                border: '1px solid #dc2626',
                                borderRadius: '2px'
                              }}
                              title="Clear result"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {(['1', 'X', '2'] as const).map(option => (
                          <button
                            key={option}
                            onClick={() => isCurrentUserAdmin ? overrideResult(match.id, option) : setMatchResult(match.id, option)}
                            className="prediction-btn"
                            style={{ minWidth: '28px', minHeight: '28px', fontSize: '12px' }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Totals row */}
              <tr style={{ background: 'var(--superbet-light-gray)', fontWeight: 600 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy style={{ width: '16px', height: '16px', color: 'var(--superbet-red)' }} />
                    <span style={{ color: '#1a1a1a' }}>Scor Total</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}></td>
                <td style={{ textAlign: 'center' }}></td>
                <td style={{ textAlign: 'center' }}></td>
                {users.map(user => (
                  <td key={user.id} style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--superbet-red)', fontSize: '16px' }}>
                      {calculateUserScore(user.id).toFixed(2)}
                    </span>
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
