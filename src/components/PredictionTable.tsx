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

interface Reaction {
  id: number;
  user_id: number;
  target_user_id: number;
  match_id: string;
  reaction: 'like' | 'dislike' | 'laugh' | 'wow' | 'love' | 'angry';
  user_name: string;
  target_user_name: string;
}

interface PlayerBoost {
  id: number;
  user_id: number;
  match_id: string;
  user_name: string;
}

interface PredictionTableProps {
  currentUser: { id: number; name: string };
}

const REACTION_OPTIONS = [
  { type: 'like' as const, emoji: '👍', label: 'Like' },
  { type: 'dislike' as const, emoji: '👎', label: 'Dislike' },
  { type: 'laugh' as const, emoji: '😂', label: 'Laugh' },
  { type: 'wow' as const, emoji: '😮', label: 'Wow' },
  { type: 'love' as const, emoji: '❤️', label: 'Love' },
  { type: 'angry' as const, emoji: '😡', label: 'Angry' }
];

export default function PredictionTable({ currentUser }: PredictionTableProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [playerBoosts, setPlayerBoosts] = useState<PlayerBoost[]>([]);
  const [localPredictions, setLocalPredictions] = useState<Record<string, '1' | 'X' | '2'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactionDropdown, setShowReactionDropdown] = useState<string | null>(null);
  const [showBoostConfirmModal, setShowBoostConfirmModal] = useState<string | null>(null); // matchId-userId format

  const loadData = useCallback(async () => {
    try {
      const [matchesRes, usersRes, predictionsRes, reactionsRes, boostsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/users'),
        fetch('/api/predictions'),
        fetch('/api/reactions'),
        fetch('/api/boosts'),
      ]);

      const [matchesData, usersData, predictionsData, reactionsData, boostsData] = await Promise.all([
        matchesRes.json(),
        usersRes.json(),
        predictionsRes.json(),
        reactionsRes.json(),
        boostsRes.json(),
      ]);

      setMatches(matchesData.matches || []);
      setUsers(usersData.users || []); // This already excludes admin users
      setPredictions(predictionsData.predictions || []);
      setReactions(reactionsData.reactions || []);
      setPlayerBoosts(boostsData.boosts || []);
      
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


  // Close reaction dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showReactionDropdown && !target?.closest('[data-reaction-dropdown]')) {
        setShowReactionDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionDropdown]);

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


  const setPlayerBoost = async (matchId: string) => {
    // If this match is already our boost, do nothing
    if (getCurrentUserBoostMatch() === matchId) {
      return;
    }
    
    try {
      const response = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          matchId,
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to set player boost:', error);
      alert('❌ Failed to set player boost. Please try again.');
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

  const addReaction = async (targetUserId: number, matchId: string, reactionType: 'like' | 'dislike' | 'love' | 'laugh' | 'wow' | 'angry' | 'party' | 'fire') => {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId,
          matchId,
          reaction: reactionType,
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        console.error('Failed to add reaction:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const removeReaction = async (targetUserId: number, matchId: string) => {
    try {
      const response = await fetch('/api/reactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId,
          matchId,
        }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        console.error('Failed to remove reaction:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const getUserReaction = (matchId: string, targetUserId: number): 'like' | 'dislike' | 'love' | 'laugh' | 'wow' | 'angry' | 'party' | 'fire' | null => {
    const reaction = reactions.find(r => r.match_id === matchId && r.target_user_id === targetUserId && r.user_id === currentUser.id);
    return reaction ? reaction.reaction : null;
  };

  const getReactionCounts = (matchId: string, targetUserId: number) => {
    const userReactions = reactions.filter(r => r.match_id === matchId && r.target_user_id === targetUserId);
    const counts: Record<string, number> = {};
    
    REACTION_OPTIONS.forEach(option => {
      counts[option.type] = userReactions.filter(r => r.reaction === option.type).length;
    });
    
    return counts;
  };

  const getPlayerBoostMatch = (userId: number): string | null => {
    const boost = playerBoosts.find(b => b.user_id === userId);
    return boost ? boost.match_id : null;
  };

  const getCurrentUserBoostMatch = (): string | null => {
    return getPlayerBoostMatch(currentUser.id);
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
    const userBoostMatch = getPlayerBoostMatch(userId);

    matches.forEach(match => {
      if (match.result) {
        const userPrediction = getUserPrediction(match.id, userId);
        if (userPrediction === match.result) {
          const odds = userPrediction === '1' ? match.odds_1 : 
                      userPrediction === 'X' ? match.odds_x : 
                      match.odds_2;
          let matchOdds = odds || 0;
          
          // Double points for user's boost match
          if (userBoostMatch && match.id === userBoostMatch) {
            matchOdds *= 2;
          }
          
          totalOdds += matchOdds;
        }
      }
    });

    return totalOdds;
  };

  const calculateUserTotalOdds = (userId: number): number => {
    let totalOdds = 0;
    const userBoostMatch = getPlayerBoostMatch(userId);

    matches.forEach(match => {
      const userPrediction = getUserPrediction(match.id, userId);
      if (userPrediction) {
        const odds = userPrediction === '1' ? match.odds_1 : 
                    userPrediction === 'X' ? match.odds_x : 
                    match.odds_2;
        let matchOdds = odds || 0;
        
        // Double odds for user's boost match
        if (userBoostMatch && match.id === userBoostMatch) {
          matchOdds *= 2;
        }
        
        totalOdds += matchOdds;
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
    
    // Count how many of these matches the current user has SUBMITTED (not local)
    let submittedCount = 0;
    availableMatches.forEach(match => {
      // Only count predictions that are actually submitted to the server
      const hasSubmitted = hasUserSubmittedPrediction(match.id, currentUser.id);
      if (hasSubmitted) {
        submittedCount++;
      }
    });

    return {
      completed: submittedCount === availableMatches.length,
      missing: availableMatches.length - submittedCount,
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
        <h3         style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          color: 'var(--superbet-text)', 
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
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--superbet-text)' }}>
                Predicții Fotbal
              </span>
              <div style={{
                padding: '4px 8px',
                background: 'var(--superbet-light-gray)',
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
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--superbet-text)' }}>
              Clasament
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="superbet-table clasament-table">
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
                
                
                return (
                  <tr key={player.userId} style={{ 
                    backgroundColor: isCurrentUser ? 'rgba(229, 231, 235, 0.3)' : 'transparent',
                    borderLeft: isCurrentUser ? '3px solid var(--superbet-red)' : '3px solid transparent'
                  }}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {position === 1 ? '🏆' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🎯'}
                        </span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: position === 1 ? '#ffd700' : position === 2 ? '#c0c0c0' : position === 3 ? '#cd7f32' : '#6b7280'
                        }}>
                          {position}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: isCurrentUser ? 600 : 400 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: isCurrentUser ? 'var(--superbet-red)' : 'var(--superbet-text)' }} className="player-name-clasament">
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
                        color: 'var(--superbet-text)',
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

      {/* Boost info - shown only when user can boost */}
      {!isCurrentUserAdmin && hasCurrentUserCompletedAllPredictions().completed && !getCurrentUserBoostMatch() && (
        <div className="superbet-card" style={{ 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>🚀</span>
            <span style={{ 
              fontSize: '16px', 
              color: '#92400e', 
              fontWeight: 600,
              lineHeight: 1.4
            }}>
              <strong>Perfect! Ai terminat toate predicțiile.</strong> Acum poți să selectezi un meci pentru boost - dă click pe un rând din tabelul de jos pentru a dubla punctajul acelui meci.
            </span>
          </div>
        </div>
      )}

      {/* Main prediction table */}
      <div className="superbet-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="superbet-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '160px' }} className="match-info-header">Meci</th>
                {users.map(user => (
                  <th key={user.id} style={{ textAlign: 'center', minWidth: '80px' }} title={user.name}>
                    {user.name.length > 8 ? `${user.name.substring(0, 8)}...` : user.name}
                  </th>
                ))}
                <th style={{ textAlign: 'center', width: '100px' }}>Rezultat</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const predictionStatus = hasCurrentUserCompletedAllPredictions();
                const canBoostThisMatch = !isCurrentUserAdmin && predictionStatus.completed && !match.result && !getCurrentUserBoostMatch();
                
                return (
                <tr 
                  key={match.id}
                  onClick={() => {
                    if (canBoostThisMatch) {
                      setShowBoostConfirmModal(match.id);
                    }
                  }}
                  style={{
                    cursor: canBoostThisMatch ? 'pointer' : 'default',
                    ...(canBoostThisMatch && {
                      transition: 'background-color 0.2s ease'
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (canBoostThisMatch) {
                      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canBoostThisMatch) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <td className="match-info-cell">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--superbet-text)', marginBottom: '4px' }}>
                        {match.home_team} <span style={{ fontWeight: 400, fontSize: '0.85em', color: 'var(--superbet-gray)' }}>vs</span> {match.away_team}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--superbet-gray)', marginBottom: '6px' }} className="match-league-date">
                        {match.league} • {format(new Date(new Date(match.match_date).getTime() - 60 * 60 * 1000), 'dd MMM, HH:mm')}
                      </div>
                      {/* Odds under match details */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        alignItems: 'center',
                        flexWrap: 'nowrap'
                      }} className="odds-row">
                        <div className="odds-container">
                          {match.odds_1?.toFixed(2) || '-'}
                        </div>
                        <div className="odds-container">
                          {match.odds_x?.toFixed(2) || '-'}
                        </div>
                        <div className="odds-container">
                          {match.odds_2?.toFixed(2) || '-'}
                        </div>
                      </div>
                    </div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              {(['1', 'X', '2'] as const).map(option => (
                                <button
                                  key={option}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    makePrediction(match.id, option);
                                  }}
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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                              <span 
                                className={`prediction-btn ${
                                  match.result && userPrediction === match.result ? 'correct' :
                                  match.result && userPrediction && userPrediction !== match.result ? 'incorrect' :
                                  userPrediction ? 'selected' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isCurrentUser && !isCurrentUserAdmin && userPrediction) {
                                    const dropdownKey = `${match.id}-${user.id}`;
                                    setShowReactionDropdown(showReactionDropdown === dropdownKey ? null : dropdownKey);
                                  }
                                }}
                                style={{ 
                                  cursor: (!isCurrentUser && !isCurrentUserAdmin && userPrediction) ? 'pointer' : 'default',
                                  transition: 'all 0.2s ease',
                                  position: 'relative'
                                }}
                              >
                                {userPrediction || '-'}
                                {/* Show boost indicator for this user - only if current user has also chosen a boost */}
                                {getPlayerBoostMatch(user.id) === match.id && getCurrentUserBoostMatch() && (
                                  <span style={{ 
                                    fontSize: window.innerWidth <= 768 ? '10px' : '12px', 
                                    color: '#fbbf24',
                                    fontWeight: 700,
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    lineHeight: 1
                                  }} title={`${user.name} a ales acest meci pentru boost (x2)`}>
                                    🚀
                                  </span>
                                )}
                              </span>
                            </div>
                            
                            {/* Reaction Dropdown */}
                            {showReactionDropdown === `${match.id}-${user.id}` && !isCurrentUser && !isCurrentUserAdmin && userPrediction && (
                              <div 
                                data-reaction-dropdown
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1000,
                                  background: 'var(--reaction-dropdown-bg, white)',
                                  border: '1px solid var(--reaction-dropdown-border, #d1d5db)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(6, 1fr)',
                                  gridTemplateRows: 'repeat(1, 1fr)',
                                  gap: '4px',
                                  minWidth: window.innerWidth <= 768 ? '220px' : '240px'
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                {REACTION_OPTIONS.map(({ type, emoji }) => {
                                  const currentUserReaction = getUserReaction(match.id, user.id);
                                  const isActive = currentUserReaction === type;
                                  
                                  return (
                                    <button
                                      key={type}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        if (isActive) {
                                          removeReaction(user.id, match.id);
                                        } else {
                                          addReaction(user.id, match.id, type);
                                        }
                                        setShowReactionDropdown(null);
                                      }}
                                      style={{
                                        padding: window.innerWidth <= 768 ? '6px' : '8px',
                                        background: isActive ? '#fbbf24' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: window.innerWidth <= 768 ? '18px' : '18px',
                                        minHeight: window.innerWidth <= 768 ? '32px' : '36px',
                                        aspectRatio: '1'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isActive) {
                                          e.currentTarget.style.backgroundColor = 'var(--superbet-light-gray)';
                                          e.currentTarget.style.transform = 'scale(1.1)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isActive) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.transform = 'scale(1)';
                                        }
                                      }}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Show existing reactions - Instagram/Facebook style */}
                            {!isCurrentUser && !isCurrentUserAdmin && userPrediction && (() => {
                              const reactionCounts = getReactionCounts(match.id, user.id);
                              const activeReactions = REACTION_OPTIONS.filter(option => reactionCounts[option.type] > 0)
                                .sort((a, b) => reactionCounts[b.type] - reactionCounts[a.type]); // Sort by count, most popular first
                              
                              if (activeReactions.length === 0) return null;
                              
                              const totalCount = activeReactions.reduce((sum, reaction) => sum + reactionCounts[reaction.type], 0);
                              const topReactions = activeReactions.slice(0, 2); // Show max 2 top reactions
                              const currentUserReaction = getUserReaction(match.id, user.id);
                              const hasUserReaction = currentUserReaction !== null;
                              
                              return (
                                <div style={{ 
                                  position: 'absolute',
                                  bottom: window.innerWidth <= 768 ? '-12px' : '-8px',
                                  right: window.innerWidth <= 768 ? '-4px' : '-2px',
                                  background: hasUserReaction ? '#fbbf24' : 'var(--reaction-bg, white)',
                                  color: hasUserReaction ? 'white' : 'var(--reaction-text, #6b7280)',
                                  borderRadius: window.innerWidth <= 768 ? '12px' : '14px',
                                  padding: window.innerWidth <= 768 ? '2px 6px' : '3px 8px',
                                  fontSize: window.innerWidth <= 768 ? '9px' : '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: window.innerWidth <= 768 ? '2px' : '3px',
                                  border: hasUserReaction ? 'none' : '1px solid var(--reaction-border, #e5e7eb)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 10,
                                  minHeight: window.innerWidth <= 768 ? '16px' : '20px'
                                }}>
                                  {/* Show top emoji reactions */}
                                  {topReactions.map(({ emoji }, index) => (
                                    <span key={index} style={{ 
                                      fontSize: window.innerWidth <= 768 ? '8px' : '10px',
                                      lineHeight: 1
                                    }}>
                                      {emoji}
                                    </span>
                                  ))}
                                  
                                  {/* Show total count */}
                                  <span style={{ 
                                    fontSize: window.innerWidth <= 768 ? '8px' : '10px',
                                    marginLeft: topReactions.length > 0 ? '1px' : '0'
                                  }}>
                                    {totalCount}
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {isCurrentUserAdmin && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {/* Admin prediction override buttons */}
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {(['1', 'X', '2'] as const).map(option => (
                                    <button
                                      key={option}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        overridePrediction(user.id, match.id, option);
                                      }}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        overridePrediction(user.id, match.id, null);
                                      }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  overrideResult(match.id, option);
                                }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                overrideResult(match.id, null);
                              }}
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
                            onClick={(e) => {
              e.stopPropagation();
              void (isCurrentUserAdmin ? overrideResult(match.id, option) : setMatchResult(match.id, option));
            }}
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
                );
              })}
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

      {/* Boost Confirmation Modal */}
      {showBoostConfirmModal && (
        <div style={{
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
        }}>
          <div style={{
            background: 'var(--superbet-card-bg)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            border: '1px solid var(--superbet-border)'
          }}>
            {(() => {
              const selectedMatch = matches.find(m => m.id === showBoostConfirmModal);
              return selectedMatch ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '24px',
                      marginBottom: '12px'
                    }}>🚀</div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'var(--superbet-text)',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      Confirmă Boost x2
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      color: 'var(--superbet-gray)',
                      lineHeight: 1.5,
                      margin: '0'
                    }}>
                      Vrei să setezi <strong>boost x2</strong> pentru meciul:
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'var(--boost-highlight-color, #fbbf24)',
                      margin: '12px 0',
                      padding: '8px 16px',
                      background: 'var(--boost-highlight-bg, #fef3c7)',
                      borderRadius: '8px',
                      border: '1px solid var(--boost-highlight-color, #fbbf24)'
                    }}>
                      {selectedMatch.home_team} - {selectedMatch.away_team}
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--warning-color, #ef4444)',
                      margin: '8px 0 0 0',
                      fontWeight: 600
                    }}>
                      ⚠️ Nu poți schimba boost-ul după confirmare!
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => setShowBoostConfirmModal(null)}
                      style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid var(--superbet-border)',
                        background: 'var(--superbet-card-bg)',
                        color: 'var(--superbet-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--superbet-light-gray)';
                        e.currentTarget.style.borderColor = 'var(--superbet-gray)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--superbet-card-bg)';
                        e.currentTarget.style.borderColor = 'var(--superbet-border)';
                      }}
                    >
                      Anulează
                    </button>
                    <button
                      onClick={async () => {
                        await setPlayerBoost(selectedMatch.id);
                        setShowBoostConfirmModal(null);
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 191, 36, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
                      }}
                    >
                      🚀 Confirmă Boost x2
                    </button>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}
      
      <style jsx>{`
        /* Dark theme custom properties for boost modal */
        :global(html.dark) {
          --boost-highlight-color: #fbbf24;
          --boost-highlight-bg: rgba(251, 191, 36, 0.15);
          --warning-color: #fb7185;
          --reaction-bg: var(--superbet-card-bg);
          --reaction-text: var(--superbet-text);
          --reaction-border: var(--superbet-border);
          --reaction-dropdown-bg: var(--superbet-card-bg);
          --reaction-dropdown-border: var(--superbet-border);
        }

        .odds-container {
          display: inline-block;
          padding: 2px 6px;
          border: 1px solid var(--superbet-border);
          border-radius: 4px;
          background-color: var(--superbet-light-gray);
          font-family: monospace;
          font-weight: 600;
          color: var(--superbet-text);
          font-size: 11px;
          min-width: auto;
        }
        
        .player-name-clasament {
          font-weight: normal !important;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .match-info-header,
          .match-info-cell {
            position: sticky;
            left: 0;
            background: var(--superbet-card-bg);
            z-index: 10;
            min-width: 150px !important;
          }
          
          .match-info-header {
            background: var(--superbet-light-gray);
            z-index: 11;
          }
          
          .match-league-date {
            font-size: 10px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .player-name-clasament {
            font-size: 15px !important;
            font-weight: normal !important;
          }
          
          tr:hover .match-info-cell,
          tr:active .match-info-cell,
          tr[style*="background-color"] .match-info-cell {
            background: inherit !important;
          }
          
        }
        
        @media (max-width: 480px) {
          .match-info-header,
          .match-info-cell {
            position: sticky;
            left: 0;
            background: var(--superbet-card-bg);
            z-index: 10;
            min-width: 140px !important;
          }
          
          .match-info-header {
            background: var(--superbet-light-gray);
            z-index: 11;
          }
          
          .match-league-date {
            font-size: 9px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .player-name-clasament {
            font-size: 16px !important;
            font-weight: normal !important;
          }
          
          tr:hover .match-info-cell,
          tr:active .match-info-cell,
          tr[style*="background-color"] .match-info-cell {
            background: inherit !important;
          }
          
        }
        
        /* Landscape mode on mobile devices */
        @media (max-height: 500px) and (orientation: landscape) {
          .match-info-header,
          .match-info-cell {
            position: sticky;
            left: 0;
            background: var(--superbet-card-bg);
            z-index: 10;
            min-width: 160px !important;
          }
          
          .match-info-header {
            background: var(--superbet-light-gray);
            z-index: 11;
          }
          
          .match-league-date {
            font-size: 10px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .odds-container {
            font-size: 10px !important;
            padding: 1px 4px !important;
            margin-right: 3px !important;
          }
          
          tr:hover .match-info-cell,
          tr:active .match-info-cell,
          tr[style*="background-color"] .match-info-cell {
            background: inherit !important;
          }
        }
      `}</style>
    </div>
  );
}
