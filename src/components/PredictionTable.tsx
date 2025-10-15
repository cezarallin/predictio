'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Calendar, Trophy, Trash2, RotateCcw, UserX, EyeOff, Sparkles, RotateCw, Ban } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';
// import SuperSpinWheel from './SuperSpinWheel'; // HIDDEN TEMPORARILY

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
  cancelled?: boolean;
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

// HIDDEN - Second Chance interface
// interface SecondChance {
//   id: number;
//   user_id: number;
//   match_id: string;
//   old_prediction: '1' | 'X' | '2';
//   new_prediction: '1' | 'X' | '2';
//   user_name: string;
//   created_at: string;
// }

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
  const [showPlayTypeModal, setShowPlayTypeModal] = useState(false);
  const [playTypes, setPlayTypes] = useState<Record<number, string>>({});
  const [resultsEnabled, setResultsEnabled] = useState(true);
  // HIDDEN - Second Chance state
  // const [secondChances, setSecondChances] = useState<SecondChance[]>([]);
  // const [hasUsedSecondChance, setHasUsedSecondChance] = useState(false);
  // const [isSecondChanceAvailable, setIsSecondChanceAvailable] = useState(true);
  // const [showSecondChanceModal, setShowSecondChanceModal] = useState<{
  //   matchId: string;
  //   currentPrediction: '1' | 'X' | '2';
  //   newPrediction: '1' | 'X' | '2' | null;
  // } | null>(null);
  // HIDDEN TEMPORARILY - SuperSpin functionality
  // const [showSuperSpinWheel, setShowSuperSpinWheel] = useState(false);
  // const [hasSpinnedToday, setHasSpinnedToday] = useState(false);
  // const [superSpinResult, setSuperSpinResult] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      // HIDDEN - Second Chance API calls commented out
      const [matchesRes, usersRes, predictionsRes, reactionsRes, boostsRes, resultsSettingRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/users'),
        fetch('/api/predictions'),
        fetch('/api/reactions'),
        fetch('/api/boosts'),
        fetch('/api/admin/toggle-results')
        // fetch(`/api/second-chances?userId=${currentUser.id}`) // HIDDEN
        // fetch(`/api/superspin?user=${encodeURIComponent(currentUser.name)}`) // HIDDEN TEMPORARILY
      ]);

      // HIDDEN - Second Chance data processing commented out
      const [matchesData, usersData, predictionsData, reactionsData, boostsData, resultsSettingData] = await Promise.all([
        matchesRes.json(),
        usersRes.json(),
        predictionsRes.json(),
        reactionsRes.json(),
        boostsRes.json(),
        resultsSettingRes.json()
        // secondChancesRes.json() // HIDDEN
        // superSpinRes.json() // HIDDEN TEMPORARILY
      ]);

      setMatches(matchesData.matches || []);
      const userData = usersData.users || [];
      setUsers(userData); // This already excludes admin users
      setPredictions(predictionsData.predictions || []);
      setReactions(reactionsData.reactions || []);
      setPlayerBoosts(boostsData.boosts || []);
      setResultsEnabled(resultsSettingData.resultsEnabled !== false);
      
      // Load play types after users are available
      if (userData.length > 0) {
        const promises = userData.map(async (user: any) => {
          try {
            const response = await fetch(`/api/play-type?userId=${user.id}`);
            const data = await response.json();
            return { userId: user.id, playType: data.playType }; // Keep null if not set
          } catch (error) {
            console.error(`Failed to load play type for user ${user.id}:`, error);
            return { userId: user.id, playType: null}; // No default if error
          }
        });
        
        const results = await Promise.all(promises);
        const playTypesObj = results.reduce((acc, { userId, playType }) => {
          acc[userId] = playType;
          return acc;
        }, {} as Record<number, string>);
        
        setPlayTypes(playTypesObj);
      }
      
      // HIDDEN - Second chance data setting commented out
      // setHasUsedSecondChance(secondChancesData.hasUsedSecondChance || false);
      
      // setIsSecondChanceAvailable(secondChancesData.isSecondChanceAvailable !== false);
      
      // Set super spin data - HIDDEN TEMPORARILY
      // setHasSpinnedToday(superSpinData.hasSpinnedToday || false);
      // if (superSpinData.spins && superSpinData.spins.length > 0) {
      //   const lastSpin = superSpinData.spins[0];
      //   // Map prize types to proper messages
      //   const getPrizeDisplayMessage = (prizeType: string) => {
      //     switch (prizeType) {
      //       case 'double_boost':
      //         return 'Double Boost (2x puncte)!';
      //       case 'triple_boost': 
      //         return 'Triple Boost (3x puncte)!';
      //       case 'no_win':
      //         return 'Necâștigător. Încearcă mâine!';
      //       case 'extra_point':
      //         return '+1 Punct extra!';
      //       case 'five_lei':
      //         return '5 lei de la ceilalți jucători! 💰';
      //       default:
      //         return 'Premiu necunoscut';
      //     }
      //   };
      //   setSuperSpinResult({ prize: { type: lastSpin.prize_type, message: getPrizeDisplayMessage(lastSpin.prize_type) } });
      // }
      
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

  // Check if any user has a play type set (to show/hide the column)
  const hasAnyPlayTypeSet = () => {
    return Object.values(playTypes).some(playType => playType !== null && playType !== undefined);
  };

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

  const generateRandomPredictions = () => {
    if (!isCurrentUserAdmin) {
      // Get matches without results (available for predictions)
      const availableMatches = matches.filter(match => !match.result);
      const randomPredictions: Record<string, '1' | 'X' | '2'> = {};
      
      const options: ('1' | 'X' | '2')[] = ['1', 'X', '2'];
      
      availableMatches.forEach(match => {
        // Don't override if user already has a submitted prediction
        const hasSubmitted = hasUserSubmittedPrediction(match.id, currentUser.id);
        if (!hasSubmitted) {
          const randomIndex = Math.floor(Math.random() * options.length);
          randomPredictions[match.id] = options[randomIndex];
        }
      });
      
      setLocalPredictions(prev => ({
        ...prev,
        ...randomPredictions
      }));
    }
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
        // Show play type selection modal after successful submission
        setShowPlayTypeModal(true);
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

  const handlePlayTypeSelection = async (playType: 'fun' | 'miza') => {
    try {
      const response = await fetch('/api/play-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          playType
        }),
      });

      if (response.ok) {
        setShowPlayTypeModal(false);
        
        // Update the playTypes state immediately for this user
        setPlayTypes(prev => ({
          ...prev,
          [currentUser.id]: playType
        }));
        
        console.log(`Tip de joc selectat: ${playType}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Eroare: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to update play type:', error);
      alert('❌ Nu s-a putut actualiza tipul de joc. Încearcă din nou.');
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
    }
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`⚠️ Ești sigur că vrei să ștergi utilizatorul ${userName}?\n\nAceastă acțiune va șterge:\n- Toate predicțiile\n- Toate boost-urile\n- Toate reacțiile\n- Toate provocările H2H\n- Toate datele asociate\n\nAceastă acțiune NU poate fi anulată!`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
          targetUserId: userId,
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
      console.error('Failed to delete user:', error);
      alert('❌ Nu s-a putut șterge utilizatorul. Încearcă din nou.');
    }
  };

  const toggleResults = async () => {
    try {
      const response = await fetch('/api/admin/toggle-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultsEnabled(data.resultsEnabled);
        console.log(`Results column ${data.resultsEnabled ? 'enabled' : 'disabled'}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle results:', error);
      alert('❌ Nu s-a putut actualiza setarea. Încearcă din nou.');
    }
  };

  const cancelMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      alert('❌ Meciul nu a fost găsit');
      return;
    }

    // Get all predictions for this match
    const matchPredictions = predictions.filter(p => p.match_id === matchId);
    
    if (matchPredictions.length === 0) {
      alert('❌ Nu există predicții pentru acest meci');
      return;
    }

    // Check if all predictions are the same
    const firstPrediction = matchPredictions[0].prediction;
    const allSamePrediction = matchPredictions.every(p => p.prediction === firstPrediction);
    
    if (!allSamePrediction) {
      const predictionSummary = matchPredictions.map(p => `${p.user_name}: ${p.prediction}`).join(', ');
      alert(`❌ Nu toate predicțiile sunt identice.\n\nPredicții: ${predictionSummary}\n\nMeciul poate fi anulat doar când toți jucătorii au aceeași predicție.`);
      return;
    }

    if (!confirm(`⚠️ Ești sigur că vrei să anulezi meciul?\n\n${match.home_team} vs ${match.away_team}\n\nToți ${matchPredictions.length} jucătorii au predicția: ${firstPrediction}\n\nAceastă acțiune nu poate fi anulată!`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cancel-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
          matchId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to cancel match:', error);
      alert('❌ Nu s-a putut anula meciul. Încearcă din nou.');
    }
  };

  const uncancelMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      alert('❌ Meciul nu a fost găsit');
      return;
    }

    if (!match.cancelled) {
      alert('❌ Meciul nu este anulat');
      return;
    }

    if (!confirm(`⚠️ Ești sigur că vrei să dezanulezi meciul?\n\n${match.home_team} vs ${match.away_team}\n\nCotele utilizatorilor vor fi restaurate în calculul scorului.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/uncancel-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.name,
          matchId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to uncancel match:', error);
      alert('❌ Nu s-a putut dezanula meciul. Încearcă din nou.');
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

  // HIDDEN - Second Chance function commented out
  // const useSecondChance = async (matchId: string, oldPrediction: '1' | 'X' | '2', newPrediction: '1' | 'X' | '2') => {
  //   try {
  //     const response = await fetch('/api/second-chances', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         userId: currentUser.id,
  //         matchId,
  //         oldPrediction,
  //         newPrediction,
  //       }),
  //     });
  //
  //     if (response.ok) {
  //       loadData(); // Reload data to reflect changes
  //       setShowSecondChanceModal(null);
  //     } else {
  //       const errorData = await response.json();
  //       alert(`❌ ${errorData.error}`);
  //     }
  //   } catch (error) {
  //     console.error('Failed to use second chance:', error);
  //     alert('❌ Nu s-a putut folosi Second Chance. Încearcă din nou.');
  //   }
  // };

  // HIDDEN - Second Chance check function commented out
  // const canUseSecondChance = (): boolean => {
  //   return !isCurrentUserAdmin && isSecondChanceAvailable && !hasUsedSecondChance;
  // };

  // HIDDEN TEMPORARILY - SuperSpin handler
  // const handleSuperSpinComplete = (result: any) => {
  //   setSuperSpinResult(result);
  //   setHasSpinnedToday(true);
  //   setShowSuperSpinWheel(false);
  //   
  //   // Refresh data to get updated spin status
  //   loadData();
  // };

  const isMobileDevice = () => {
    return window.innerWidth <= 768;
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
        // Only consider matches that have been played (have results) and are not cancelled
        if (match.result && !match.cancelled) {
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
    // Get matches without results (available for predictions) and not cancelled
    const availableMatches = matches.filter(match => !match.result && !match.cancelled);
    
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

  const hasUserCompletedAllPredictions = (userId: number): boolean => {
    // Get matches without results (available for predictions) and not cancelled
    const availableMatches = matches.filter(match => !match.result && !match.cancelled);
    
    // Count how many of these matches the user has SUBMITTED
    let submittedCount = 0;
    availableMatches.forEach(match => {
      const hasSubmitted = hasUserSubmittedPrediction(match.id, userId);
      if (hasSubmitted) {
        submittedCount++;
      }
    });

    return submittedCount === availableMatches.length;
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
                onClick={toggleResults}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: resultsEnabled 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
                  e.currentTarget.style.boxShadow = resultsEnabled 
                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                    : '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={resultsEnabled ? 'Dezactivează butoanele de rezultate' : 'Activează butoanele de rezultate'}
              >
                <span style={{ fontSize: '16px' }}>{resultsEnabled ? '🔓' : '🔒'}</span>
                <span className="hidden-mobile-text">{resultsEnabled ? 'Rezultate ON' : 'Rezultate OFF'}</span>
                <span className="show-mobile-text">{resultsEnabled ? 'ON' : 'OFF'}</span>
              </button>
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
            {/* Random predictions banner - only show if user hasn't completed all predictions */}
            {!predictionStatus.completed && (
              <div className="superbet-card" style={{ 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: '12px'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.4)'
                }}>
                  <Sparkles style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#065f46',
                    marginBottom: '4px'
                  }}>
                    🎲 Te simți norocos astăzi?
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#047857',
                    lineHeight: 1.4,
                    marginBottom: '12px'
                  }}>
                    Lasă norocul să decidă! Generează predicții random pentru toate meciurile și ajustează-le după cum simți! 🍀
                  </div>
                  <button
                    onClick={generateRandomPredictions}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobileDevice()) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobileDevice()) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎲</span>
                    Generează Predicții Random!
                  </button>
                </div>
              </div>
              </div>
            )}

            {/* HIDDEN TEMPORARILY - SuperSpin banner - show always for non-admin users */}
            {false && !isCurrentUserAdmin && (
              <div className={`superbet-card superspin-banner-card`} style={{ 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                border: '2px solid #9ca3af',
                borderRadius: '12px'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 3px 8px rgba(156, 163, 175, 0.4)'
                }}>
                  <span style={{ fontSize: '20px' }}>🎰</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#4b5563',
                    marginBottom: '4px'
                  }}>
                    🎰 Ai învârtit roata etapa asta!
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    marginBottom: '8px' 
                  }}>
                    Revino la următoarea etapă! 🌟
                  </div>
                  {/* HIDDEN - Button removed */}
                  {false && (
                    <button
                      onClick={() => {/* setShowSuperSpinWheel(true) - HIDDEN */}}
                      style={{
                        background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 3px 8px rgba(185, 28, 28, 0.4)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(185, 28, 28, 0.6)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(185, 28, 28, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
                      }}
                  >
                      <span style={{ fontSize: '16px' }}>🎯</span>
                      Învârte Predictio Wheel!
                    </button>
                  )}
                </div>
              </div>
              </div>
            )}
            
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
                {hasAnyPlayTypeSet() && (
                  <th style={{ textAlign: 'center', width: '80px' }}>Tip Joc</th>
                )}
                {isCurrentUserAdmin && (
                  <th style={{ textAlign: 'center', width: '60px' }}>Acțiuni</th>
                )}
              </tr>
            </thead>
            <tbody>
              {getLeaderboardData().map((player, index) => {
                const position = index + 1;
                const isCurrentUser = player.userId === currentUser.id;
                
                
                
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
                        {/* Show total odds only if current user has completed all predictions OR for the current user themselves */}
                        {(hasCurrentUserCompletedAllPredictions().completed || isCurrentUser) && hasUserCompletedAllPredictions(player.userId) 
                          ? player.totalOdds.toFixed(2) 
                          : '?'}
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
                    {hasAnyPlayTypeSet() && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: playTypes[player.userId] === 'miza' 
                            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' 
                            : playTypes[player.userId] === 'fun' 
                              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                              : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', // Default for null
                          color: playTypes[player.userId] === 'miza' 
                            ? '#991b1b' 
                            : playTypes[player.userId] === 'fun' 
                              ? '#065f46'
                              : '#6b7280', // Default for null
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          border: `1px solid ${playTypes[player.userId] === 'miza' 
                            ? '#dc2626' 
                            : playTypes[player.userId] === 'fun' 
                              ? '#10b981'
                              : '#9ca3af'}`, // Default for null
                          minWidth: '50px'
                        }}>
                          {playTypes[player.userId] === 'miza' 
                            ? '💰' 
                            : playTypes[player.userId] === 'fun' 
                              ? '🎉' 
                              : '❓'} {/* Default for null */}
                          <span style={{ fontSize: '10px' }}>
                            {playTypes[player.userId] === 'miza' 
                              ? 'Mizã' 
                              : playTypes[player.userId] === 'fun' 
                                ? 'Fun'
                                : '-'} {/* Default for null */}
                          </span>
                        </div>
                      </td>
                    )}
                    {isCurrentUserAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        {!isCurrentUser && (
                          <button
                            onClick={() => deleteUser(player.userId, player.name)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobileDevice()) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobileDevice()) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                              }
                            }}
                            title={`Șterge utilizatorul ${player.name}`}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    )}
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
              fontSize: '14px', 
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
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          <table className="superbet-table">
            <thead>
              <tr>
                <th 
                  style={{ 
                    textAlign: 'left', 
                    minWidth: '160px',
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    backgroundColor: 'var(--superbet-card-bg)',
                    zIndex: 20,
                    borderRight: '2px solid var(--superbet-border)',
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
                  }} 
                >
                  Meci
                </th>
                {users.map(user => (
                  <th 
                    key={user.id} 
                    style={{ 
                      textAlign: 'center', 
                      minWidth: '80px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'var(--superbet-card-bg)',
                      zIndex: 15,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }} 
                    title={user.name}
                  >
                    {user.name.length > 8 ? `${user.name.substring(0, 8)}...` : user.name}
                  </th>
                ))}
                <th 
                  style={{ 
                    textAlign: 'center', 
                    width: window.innerWidth <= 768 ? '80px' : '85px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--superbet-card-bg)',
                    zIndex: 15,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Rezultat
                </th>
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
                    if (canBoostThisMatch && !isMobileDevice()) {
                      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canBoostThisMatch && !isMobileDevice()) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <td style={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor: match.cancelled ? 'rgba(239, 68, 68, 0.1)' : 'var(--superbet-card-bg)',
                    zIndex: 9,
                    borderRight: '2px solid var(--superbet-border)',
                    minWidth: '160px',
                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                    opacity: match.cancelled ? 0.7 : 1
                  }}>
                    {match.cancelled && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                        zIndex: 10
                      }}>
                        <Ban size={10} />
                        ANULAT
                      </div>
                    )}
                    <div style={{ 
                      filter: match.cancelled ? 'grayscale(50%)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: match.cancelled ? '#6b7280' : 'var(--superbet-text)', 
                        marginBottom: '4px',
                        textDecoration: match.cancelled ? 'line-through' : 'none'
                      }}>
                        {match.home_team} <span style={{ fontWeight: 400, fontSize: '0.85em', color: 'var(--superbet-gray)' }}>vs</span> {match.away_team}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: match.cancelled ? '#9ca3af' : 'var(--superbet-gray)', 
                        marginBottom: '6px' 
                      }} className="match-league-date">
                        {match.league} • {format(new Date(new Date(match.match_date).getTime() - 3 * 60 * 60 * 1000), 'dd MMM, HH:mm')}
                      </div>
                      {/* Odds under match details */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        alignItems: 'center',
                        flexWrap: 'nowrap'
                      }} className="odds-row">
                        <div className="odds-container" style={{ 
                          opacity: match.cancelled ? 0.5 : 1,
                          color: match.cancelled ? '#9ca3af' : 'var(--superbet-text)'
                        }}>
                          {match.odds_1?.toFixed(2) || '-'}
                        </div>
                        <div className="odds-container" style={{ 
                          opacity: match.cancelled ? 0.5 : 1,
                          color: match.cancelled ? '#9ca3af' : 'var(--superbet-text)'
                        }}>
                          {match.odds_x?.toFixed(2) || '-'}
                        </div>
                        <div className="odds-container" style={{ 
                          opacity: match.cancelled ? 0.5 : 1,
                          color: match.cancelled ? '#9ca3af' : 'var(--superbet-text)'
                        }}>
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
                      <td key={user.id} style={{ 
                        textAlign: 'center',
                        backgroundColor: match.cancelled ? 'rgba(239, 68, 68, 0.1)' : undefined,
                        opacity: match.cancelled ? 0.7 : 1
                      }}>
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
                                  // HIDDEN - Second Chance functionality disabled
                                  if (isCurrentUser && false && userPrediction && !match.result) {
                                    // Current user can use second chance on their own prediction - DISABLED
                                    // setShowSecondChanceModal({
                                    //   matchId: match.id,
                                    //   currentPrediction: userPrediction,
                                    //   newPrediction: null
                                    // });
                                  } else if (!isCurrentUser && !isCurrentUserAdmin && userPrediction) {
                                    // Other users - show reaction dropdown
                                    const dropdownKey = `${match.id}-${user.id}`;
                                    setShowReactionDropdown(showReactionDropdown === dropdownKey ? null : dropdownKey);
                                  }
                                }}
                                style={{ 
                                  cursor: (false && userPrediction && !match.result) || // HIDDEN - Second Chance disabled
                                          (!isCurrentUser && !isCurrentUserAdmin && userPrediction) ? 'pointer' : 'default',
                                  transition: 'all 0.2s ease',
                                  position: 'relative',
                                  touchAction: 'manipulation', // Better touch handling on mobile
                                  minHeight: '32px', // Larger touch target on mobile
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  // HIDDEN - Second Chance styling disabled
                                  // ...(isCurrentUser && false && userPrediction && !match.result && {
                                  //   boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.3)',
                                  //   borderRadius: '4px'
                                  // })
                                }}
                                onTouchStart={(e) => {
                                  // Better mobile touch feedback
                                  if (isCurrentUser && false && userPrediction && !match.result) {
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                                  }
                                }}
                                onTouchEnd={(e) => {
                                  // Reset mobile touch feedback
                                  if (isCurrentUser && false && userPrediction && !match.result) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.backgroundColor = '';
                                  }
                                }}
                              >
                                {userPrediction || '-'}
                                {/* Show Second Chance indicator for current user on mobile */}
                                {isCurrentUser && false && userPrediction && !match.result && window.innerWidth <= 768 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: '-6px',
                                    width: '12px',
                                    height: '12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    animation: 'pulse 2s infinite'
                                  }}>
                                    ⚡
                                  </span>
                                )}
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
                                  minWidth: window.innerWidth <= 768 ? '200px' : '240px'
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
                            {!isCurrentUserAdmin && userPrediction && (() => {
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
                                  bottom: window.innerWidth <= 768 ? '-12px' : '-16px',
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
                                  zIndex: 5,
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
                  <td style={{ 
                    textAlign: 'center',
                    backgroundColor: match.cancelled ? 'rgba(239, 68, 68, 0.1)' : undefined,
                    opacity: match.cancelled ? 0.7 : 1
                  }}>
                    {match.result ? (
                      <>
                        {/* Modern result badge with gradient */}
                        <div style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderRadius: '8px',
                          padding: window.innerWidth <= 768 ? '5px 10px' : '6px 12px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          minWidth: window.innerWidth <= 768 ? '60px' : '65px',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          position: 'relative',
                          overflow: 'hidden',
                          height: window.innerWidth <= 768 ? '28px' : '32px'
                        }}>
                          {/* Shine effect */}
                          <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                            animation: 'shine 3s infinite',
                            pointerEvents: 'none'
                          }} />
                          <CheckCircle style={{ 
                            width: window.innerWidth <= 768 ? '14px' : '16px', 
                            height: window.innerWidth <= 768 ? '14px' : '16px', 
                            color: 'white', 
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                            flexShrink: 0
                          }} />
                          <span style={{ 
                            fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                            fontWeight: 700, 
                            color: 'white',
                            lineHeight: 1,
                            textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}>{match.result}</span>
                        </div>
                        {isCurrentUserAdmin && !match.cancelled && (
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
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {match.cancelled ? (
                          /* Show disabled icons for canceled matches */
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '4px', 
                            flexDirection: 'column' 
                          }}>
                            {/* Show disabled result buttons */}
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {(['1', 'X', '2'] as const).map(option => (
                                <div
                                  key={option}
                                  style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    fontSize: '10px',
                                    padding: '0',
                                    background: '#f3f4f6',
                                    color: '#9ca3af',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '50%',
                                    fontWeight: 600,
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                  }}
                                  title="Meciul este anulat - nu se poate adăuga rezultat"
                                >
                                  {option}
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) rotate(45deg)',
                                    width: '20px',
                                    height: '1px',
                                    backgroundColor: '#ef4444',
                                    zIndex: 1
                                  }} />
                                </div>
                              ))}
                            </div>
                            {/* Show uncancel button for admin */}
                            {isCurrentUserAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  uncancelMatch(match.id);
                                }}
                                style={{ 
                                  fontSize: '10px',
                                  padding: '4px 8px',
                                  marginTop: '4px',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Dezanulează meciul pentru a permite adăugarea rezultatelor"
                                onMouseEnter={(e) => {
                                  if (!isMobileDevice()) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isMobileDevice()) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                                  }
                                }}
                              >
                                <RotateCcw style={{ width: '12px', height: '12px' }} />
                                Dezanulează
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Normal result buttons for non-canceled matches */
                          <>
                            {(resultsEnabled || isCurrentUserAdmin) ? (
                              <>
                                {(['1', 'X', '2'] as const).map(option => (
                                  <button
                                    key={option}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void (isCurrentUserAdmin ? overrideResult(match.id, option) : setMatchResult(match.id, option));
                                    }}
                                    style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      fontSize: '12px',
                                      padding: '0',
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '50%',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isMobileDevice()) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isMobileDevice()) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.2)';
                                      }
                                    }}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </>
                            ) : (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px 12px',
                                fontSize: '12px',
                                color: '#9ca3af',
                                fontWeight: 600
                              }}>
                                🔒
                              </div>
                            )}
                            
                            {/* Admin Cancel Match Button - only visible to admin when no result */}
                            {isCurrentUserAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelMatch(match.id);
                                }}
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  fontSize: '10px',
                                  padding: '0',
                                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginLeft: '8px'
                                }}
                            onMouseEnter={(e) => {
                              if (!isMobileDevice()) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobileDevice()) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                              }
                            }}
                            title="Anulează meciul (doar dacă toți jucătorii au aceeași predicție)"
                          >
                            🚫
                          </button>
                        )}
                          </>
                        )}
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

      {/* HIDDEN - Modern Second Chance Confirmation Modal */}
      {false && false && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '320px',
            width: '100%',
            boxShadow: `
              0 20px 40px rgba(139, 92, 246, 0.15),
              0 8px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            textAlign: 'center',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Decorative background gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              borderRadius: '16px 16px 0 0',
              zIndex: -1
            }} />
            
            {(() => {
              // HIDDEN - Second Chance modal content removed
              const selectedMatch = null; // matches.find(m => m.id === showSecondChanceModal.matchId);
              return selectedMatch ? (
                <>
                  {/* Header Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                        animation: 'pulseGlow 2s ease-in-out infinite alternate'
                      }}>
                        <RotateCw style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: 'white',
                          animation: 'spin 3s linear infinite' 
                        }} />
                      </div>
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'var(--modal-text)',
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.025em'
                    }}>
                      Second Chance
                    </h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                      animation: 'bounce 2s ease-in-out infinite'
                    }}>
                      <span>🎯</span>
                      <span>Schimbă predicția ta!</span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div style={{
                    background: 'var(--modal-card-bg)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px',
                    margin: '16px 0',
                    border: '1px solid var(--modal-border)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--modal-text-muted)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '6px'
                    }}>
                      Meciul selectat
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--modal-text)',
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {/* HIDDEN - Static placeholder */}
                      {'Static Team'}
                      <span style={{ 
                        color: '#8b5cf6', 
                        margin: '0 6px',
                        fontSize: '12px'
                      }}>
                        ⚡
                      </span>
                      {'Static Team 2'}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--modal-text-muted)',
                      fontWeight: '500'
                    }}>
                      {/* HIDDEN - Static placeholder */}
                      {'Static League'}
                    </div>
                  </div>

                  {/* Prediction Change Section */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '20px 0',
                    flexWrap: 'wrap'
                  }}>
                    {/* Current Prediction */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '600',
                        color: 'var(--modal-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Actuala
                      </span>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                      {/* HIDDEN - Static placeholder */}
                      {'1'}
                    </div>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      fontSize: '16px',
                      color: '#8b5cf6',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      →
                    </div>

                    {/* New Prediction Options */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '600',
                        color: 'var(--modal-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Noua predicție
                      </span>
                      <div style={{
                        display: 'flex',
                        gap: '6px'
                      }}>
                        {(['1', 'X', '2'] as const).map(option => (
                          <button
                            key={option}
                            onClick={() => {
                              // HIDDEN - Second Chance functionality disabled
                              // setShowSecondChanceModal(prev => prev ? {
                              //   ...prev,
                              //   newPrediction: option
                              // } : null);
                            }}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              border: '2px solid',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              position: 'relative',
                              overflow: 'hidden',
                              // HIDDEN - Static values
                              background: 'var(--modal-input-bg)',
                              color: 'var(--modal-text)',
                              borderColor: 'var(--modal-border)',
                              boxShadow: '0 2px 6px rgba(148, 163, 184, 0.15)'
                            }}
                            onMouseEnter={(e) => {
                              // HIDDEN - Static conditions
                              if (false) {
                                e.currentTarget.style.borderColor = '#8b5cf6';
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              // HIDDEN - Static conditions  
                              if (false) {
                                e.currentTarget.style.borderColor = 'var(--modal-border)';
                                e.currentTarget.style.background = 'var(--modal-input-bg)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(148, 163, 184, 0.15)';
                              }
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: window.innerWidth <= 768 ? '6px 8px' : '8px 16px',
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: window.innerWidth <= 768 ? '10px' : '11px' }}>⚠️</span>
                    <span style={{
                      fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                      color: '#dc2626',
                      fontWeight: '600',
                      whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      Poți folosi Second Chance doar o singură dată!
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginTop: '20px'
                  }}>
                    <button
                      onClick={() => {/* setShowSecondChanceModal(null) - HIDDEN */}}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        background: 'var(--modal-input-bg)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--modal-text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--modal-card-bg)';
                        e.currentTarget.style.borderColor = 'var(--modal-border)';
                        e.currentTarget.style.color = 'var(--modal-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--modal-input-bg)';
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                        e.currentTarget.style.color = 'var(--modal-text-muted)';
                      }}
                    >
                      Anulează
                    </button>
                    <button
                      onClick={async () => {
                        // HIDDEN - Static conditions
                        if (false) {
                          // HIDDEN - Second Chance functionality
                          // await useSecondChance(
                          //   'static-match-id',
                          //   '1',
                          //   '2'
                          // );
                        }
                      }}
                      disabled={true}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(156, 163, 175, 0.5)',
                        color: 'white',
                        cursor: 'not-allowed',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: 'none',
                        minWidth: '120px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        // HIDDEN - Static conditions
                        if (false) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        // HIDDEN - Static conditions
                        if (false) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                        }
                      }}
                    >
                      🎯 Confirmă
                    </button>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Modern Boost Confirmation Modal */}
      {showBoostConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '320px',
            width: '100%',
            boxShadow: `
              0 20px 40px rgba(251, 191, 36, 0.15),
              0 8px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            textAlign: 'center',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Decorative background gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              borderRadius: '16px 16px 0 0',
              zIndex: -1
            }} />
            
            {(() => {
              const selectedMatch = matches.find(m => m.id === showBoostConfirmModal);
              return selectedMatch ? (
                <>
                  {/* Header Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4)',
                        animation: 'pulseGlow 2s ease-in-out infinite alternate'
                      }}>
                        <span style={{ 
                          fontSize: '16px',
                          color: 'white'
                        }}>
                          🚀
                        </span>
                      </div>
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'var(--modal-text)',
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.025em'
                    }}>
                      Boost x2
                    </h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      animation: 'bounce 2s ease-in-out infinite'
                    }}>
                      <span>⚡</span>
                      <span>Dublează punctajul!</span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div style={{
                    background: 'var(--modal-card-bg)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px',
                    margin: '16px 0',
                    border: '1px solid var(--modal-border)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--modal-text-muted)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '6px'
                    }}>
                      Meciul selectat
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--modal-text)',
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {selectedMatch.home_team}
                      <span style={{ 
                        color: '#fbbf24', 
                        margin: '0 6px',
                        fontSize: '12px'
                      }}>
                        🚀
                      </span>
                      {selectedMatch.away_team}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--modal-text-muted)',
                      fontWeight: '500'
                    }}>
                      {selectedMatch.league}
                    </div>
                  </div>

                  {/* Warning */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: window.innerWidth <= 768 ? '6px 8px' : '6px 10px',
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: window.innerWidth <= 768 ? '10px' : '11px' }}>⚠️</span>
                    <span style={{
                      fontSize: window.innerWidth <= 768 ? '10px' : '11px',
                      color: '#dc2626',
                      fontWeight: '600',
                      whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      Nu poți schimba boost-ul după confirmare!
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginTop: '20px'
                  }}>
                    <button
                      onClick={() => setShowBoostConfirmModal(null)}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        background: 'var(--modal-input-bg)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--modal-text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--modal-card-bg)';
                        e.currentTarget.style.borderColor = 'var(--modal-border)';
                        e.currentTarget.style.color = 'var(--modal-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--modal-input-bg)';
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                        e.currentTarget.style.color = 'var(--modal-text-muted)';
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
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4)',
                        minWidth: '120px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(251, 191, 36, 0.4)';
                      }}
                    >
                      🚀 Confirmă
                    </button>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Play Type Selection Modal */}
      {showPlayTypeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'var(--modal-bg)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--modal-border)',
            backdropFilter: 'blur(20px)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '24px',
                marginBottom: '8px'
              }}>🎮</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--modal-text)',
                margin: '0 0 8px 0'
              }}>
                Alege tipul de joc
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--modal-text-muted)',
                margin: 0,
                lineHeight: 1.4
              }}>
                Cum vrei să joci în această rundă?
              </p>
            </div>

            {/* Play Type Options */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <button
                onClick={() => handlePlayTypeSelection('fun')}
                style={{
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  color: '#065f46',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🎉 Pentru distracție
              </button>
              
              <button
                onClick={() => handlePlayTypeSelection('miza')}
                style={{
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #dc2626',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#991b1b',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                💰 Cu mizã
              </button>
            </div>

            {/* Skip Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowPlayTypeModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--modal-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--modal-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--modal-text-muted)';
                }}
              >
                Mai târziu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN TEMPORARILY - SuperSpin Wheel Modal */}
      {/*
      {showSuperSpinWheel && (
        <SuperSpinWheel
          userName={currentUser.name}
          onSpinComplete={handleSuperSpinComplete}
          onClose={() => setShowSuperSpinWheel(false)}
        />
      )}
      */}
      
      <style jsx>{`
        /* Modern modal animations */
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
          }
          100% {
            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.6), 0 0 12px rgba(139, 92, 246, 0.3);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
            transform: translate3d(0, -6px, 0);
          }
          70% {
            animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
            transform: translate3d(0, -3px, 0);
          }
          90% {
            transform: translate3d(0, -1px, 0);
          }
        }
        
        /* Spin animation for Second Chance icon */
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Shine animation for finished match results */
        @keyframes shine {
          0% {
            transform: translate(-100%, -100%) rotate(45deg);
          }
          100% {
            transform: translate(100%, 100%) rotate(45deg);
          }
        }
        
        /* Dark theme custom properties for modals */
        :global(html.dark) {
          --boost-highlight-color: #fbbf24;
          --boost-highlight-bg: rgba(251, 191, 36, 0.15);
          --warning-color: #fb7185;
          --reaction-bg: var(--superbet-card-bg);
          --reaction-text: var(--superbet-text);
          --reaction-border: var(--superbet-border);
          --reaction-dropdown-bg: var(--superbet-card-bg);
          --reaction-dropdown-border: var(--superbet-border);
          --modal-bg: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
          --modal-text: #f1f5f9;
          --modal-text-muted: #94a3b8;
          --modal-card-bg: rgba(30, 41, 59, 0.8);
          --modal-border: rgba(100, 116, 139, 0.3);
          --modal-input-bg: rgba(51, 65, 85, 0.6);
        }
        
        /* Light theme custom properties for modals */
        :global(html:not(.dark)) {
          --modal-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
          --modal-text: #1e293b;
          --modal-text-muted: #64748b;
          --modal-card-bg: rgba(15, 23, 42, 0.05);
          --modal-border: rgba(148, 163, 184, 0.2);
          --modal-input-bg: rgba(255, 255, 255, 0.8);
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
        }
        
        @media (max-width: 480px) {
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
        }
        
        /* Landscape mode on mobile devices */
        @media (max-height: 500px) and (orientation: landscape) {
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
        }
      `}</style>
    </div>
  );
}
