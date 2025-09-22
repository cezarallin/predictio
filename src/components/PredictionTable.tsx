'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Users, Calendar, Trophy, CalendarDays, Trash2, RotateCcw } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };


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
        const errorData = await response.json();
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

  const getUserPrediction = (matchId: string, userId: number): '1' | 'X' | '2' | null => {
    const prediction = predictions.find(p => p.match_id === matchId && p.user_id === userId);
    return prediction ? prediction.prediction : null;
  };

  const calculateUserScore = (userId: number): number => {
    let totalOdds = 0;
    let correctPredictions = 0;

    matches.forEach(match => {
      if (match.result) {
        const userPrediction = getUserPrediction(match.id, userId);
        if (userPrediction === match.result) {
          correctPredictions++;
          const odds = userPrediction === '1' ? match.odds_1 : 
                      userPrediction === 'X' ? match.odds_x : 
                      match.odds_2;
          totalOdds += odds || 0;
        }
      }
    });

    return totalOdds;
  };

  const getPredictionColor = (matchId: string, userId: number, prediction: '1' | 'X' | '2' | null): string => {
    const match = matches.find(m => m.id === matchId);
    if (!match?.result || !prediction) return '';
    
    return prediction === match.result 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600'
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--superbet-gray)', fontSize: '14px' }}>
              <Users style={{ width: '16px', height: '16px' }} />
              {users.length} jucători
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
            </div>
          )}
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
                    const colorClass = getPredictionColor(match.id, user.id, userPrediction);
                    const hasExistingPrediction = userPrediction !== null;
                    
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
                        ) : (
                          // Show locked prediction or empty state
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
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Result column */}
                  <td style={{ textAlign: 'center' }}>
                    {match.result ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        <span style={{ fontWeight: 600, color: '#10b981' }}>{match.result}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {(['1', 'X', '2'] as const).map(option => (
                          <button
                            key={option}
                            onClick={() => setMatchResult(match.id, option)}
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
