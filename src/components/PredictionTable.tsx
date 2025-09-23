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
  const [localPredictions, setLocalPredictions] = useState<Record<string, '1' | 'X' | '2'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const makePrediction = (matchId: string, prediction: '1' | 'X' | '2') => {
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }));
  };

  const submitAllPredictions = async () => {
    if (Object.keys(localPredictions).length === 0) {
      alert('Nu ai nicio predicție de trimis!');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/predictions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          predictions: localPredictions
        }),
      });

      if (response.ok) {
        setLocalPredictions({});
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Eroare: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to submit predictions:', error);
      alert('❌ Nu s-au putut trimite predicțiile. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
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
    // For current user, check local predictions first if they exist
    if (userId === currentUser.id && localPredictions[matchId]) {
      return localPredictions[matchId];
    }
    
    const prediction = predictions.find(p => p.match_id === matchId && p.user_id === userId);
    return prediction ? prediction.prediction : null;
  };

  const hasUserSubmittedPrediction = (matchId: string, userId: number): boolean => {
    const prediction = predictions.find(p => p.match_id === matchId && p.user_id === userId);
    return prediction !== undefined;
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

  const calculateUserTotalOdds = (userId: number): number => {
    let totalOdds = 0;

    matches.forEach(match => {
      const userPrediction = getUserPrediction(match.id, userId);
      if (userPrediction) {
        const odds = userPrediction === '1' ? match.odds_1 : 
                    userPrediction === 'X' ? match.odds_x : 
                    match.odds_2;
        totalOdds += odds || 0;
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

  const getMatchesPlayedInfo = (): { played: number; total: number } => {
    const playedMatches = matches.filter(match => match.result !== null).length;
    const totalMatches = matches.length;
    return { played: playedMatches, total: totalMatches };
  };

  const getLeaderboardData = () => {
    return users.map(user => {
      const score = calculateUserScore(user.id);
      const totalOdds = calculateUserTotalOdds(user.id);
      
      // Count correct predictions based on played matches only
      let correctPredictions = 0;
      let playedMatchesPredictedBy = 0;
      
      matches.forEach(match => {
        // Only consider matches that have been played (have results)
        if (match.result) {
          const userPrediction = getUserPrediction(match.id, user.id);
          if (userPrediction) {
            playedMatchesPredictedBy++;
            if (userPrediction === match.result) {
              correctPredictions++;
            }
          }
        }
      });

      return {
        userId: user.id,
        name: user.name,
        score,
        totalOdds,
        correctPredictions,
        playedMatchesPredictedBy,
        accuracy: playedMatchesPredictedBy > 0 ? (correctPredictions / playedMatchesPredictedBy * 100) : 0
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
              <div style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {(() => {
                  const { played, total } = getMatchesPlayedInfo();
                  return `${played}/${total} jucate`;
                })()}
              </div>
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

      {/* Prediction Status Banners - only show for non-admin users */}
      {!isCurrentUserAdmin && (() => {
        const predictionStatus = hasCurrentUserCompletedAllPredictions();
        const localPredictionsCount = Object.keys(localPredictions).length;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Local predictions banner */}
            {localPredictionsCount > 0 && (
              <div className="superbet-card" style={{ 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                border: '1px solid #3b82f6',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '20px' }}>📝</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e40af'
                    }}>
                      Ai {localPredictionsCount} predicții locale netrimise
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Hidden predictions banner */}
            {!predictionStatus.completed && (
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
                      Trimite toate predicțiile tale ({predictionStatus.missing} rămase din {predictionStatus.total}) pentru a vedea predicțiile celorlalți jucători.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
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
                <th style={{ textAlign: 'center', width: '90px' }}>Cota</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Corecte</th>
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
                        fontFamily: 'monospace', 
                        fontWeight: 600, 
                        color: '#1a1a1a',
                        fontSize: '13px'
                      }}>
                        {player.totalOdds.toFixed(2)}
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
                    const hasSubmittedPrediction = hasUserSubmittedPrediction(match.id, user.id);
                    
                    // Check if predictions should be hidden
                    const predictionStatus = hasCurrentUserCompletedAllPredictions();
                    const shouldHidePredictions = !isCurrentUserAdmin && !predictionStatus.completed && !isCurrentUser;
                    
                    return (
                      <td key={user.id} style={{ textAlign: 'center' }}>
                        {isCurrentUser && !match.result && !hasSubmittedPrediction ? (
                          // Show prediction buttons for current user if match has no result and no submitted prediction
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {(['1', 'X', '2'] as const).map(option => (
                              <button
                                key={option}
                                onClick={() => makePrediction(match.id, option)}
                                className={`prediction-btn ${userPrediction === option ? 'selected' : ''}`}
                                style={userPrediction === option ? {
                                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                  color: 'white',
                                  border: '2px solid #d97706',
                                  fontWeight: '700',
                                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                } : {}}
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
                          // Show submitted prediction or admin controls
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span className={`prediction-btn ${
                              match.result && userPrediction === match.result ? 'correct' :
                              match.result && userPrediction && userPrediction !== match.result ? 'incorrect' :
                              userPrediction ? 'selected' : ''
                            }`}>
                              {userPrediction || '-'}
                            </span>
                            {isCurrentUser && hasSubmittedPrediction && !match.result && (
                              <span style={{ fontSize: '12px' }} title="Predicția a fost trimisă și este blocată">
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
                                  {hasSubmittedPrediction && (
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
                            style={{ 
                              minWidth: '28px', 
                              minHeight: '28px', 
                              fontSize: '12px',
                              padding: '6px 8px',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.2)';
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Submit Button - visible when user has local predictions */}
      {!isCurrentUserAdmin && Object.keys(localPredictions).length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <button
            onClick={submitAllPredictions}
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: isSubmitting 
                ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
              minWidth: 'fit-content',
              maxWidth: '90vw',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.4)';
              }
            }}
          >
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {isSubmitting ? 'Se trimite...' : `Trimite Predicțiile (${Object.keys(localPredictions).length})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
