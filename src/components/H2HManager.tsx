'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Clock, CheckCircle, XCircle, Calendar, Target, ChevronDown, ChevronUp, Swords } from 'lucide-react';

interface H2HChallenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  challenger_name: string;
  challenged_name: string;
  match_date: string;
  status: string;
  winner_id?: number;
  winner_name?: string;
  challenger_score: number;
  challenged_score: number;
  challenger_odds_total: number;
  challenged_odds_total: number;
  created_at: string;
  completed_at?: string;
}

interface MatchResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  result?: string;
  cancelled: boolean;
  hasResult: boolean;
  challenger: {
    prediction?: string;
    correct: boolean;
    odds: number;
    hasBoost?: boolean;
  };
  challenged: {
    prediction?: string;
    correct: boolean;
    odds: number;
    hasBoost?: boolean;
  };
}

interface DetailedResults {
  matches: MatchResult[];
  challengerScore: number;
  challengedScore: number;
  challengerOddsTotal: number;
  challengedOddsTotal: number;
  winnerId?: number;
  canCalculate: boolean;
  completedMatches: number;
  totalMatches: number;
}

interface User {
  id: number;
  name: string;
}

interface H2HManagerProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function H2HManager({ currentUser, isOpen, onClose }: H2HManagerProps) {
  const [challenges, setChallenges] = useState<H2HChallenge[]>([]);
  const [otherChallenges, setOtherChallenges] = useState<H2HChallenge[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedChallenges, setExpandedChallenges] = useState<Set<number>>(new Set());
  const [detailedResults, setDetailedResults] = useState<Map<number, DetailedResults>>(new Map());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [userCompletedPredictions, setUserCompletedPredictions] = useState<Map<string, boolean>>(new Map());

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Golim cache-ul de detailed results pentru a forța refresh
      setDetailedResults(new Map());
      setExpandedChallenges(new Set());
      fetchData();
    } else {
      // Clear interval when modal closes
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's challenges
      const challengesRes = await fetch(`/api/h2h?userId=${currentUser.id}`);
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        const fetchedChallenges = challengesData.challenges || [];
        setChallenges(fetchedChallenges);
        
        // Pentru challenges accepted/completed, încărcăm automat detailed results
        // pentru a avea valorile corecte și status-ul
        for (const challenge of fetchedChallenges) {
          if (challenge.status === 'accepted' || challenge.status === 'completed') {
            try {
              // Check if current user has completed all predictions for this challenge date
              const hasCompleted = await hasCurrentUserCompletedAllPredictionsForDate(challenge.match_date);
              setUserCompletedPredictions(prev => {
                const newMap = new Map(prev);
                newMap.set(challenge.match_date, hasCompleted);
                return newMap;
              });
              
              // Auto-calculate pentru challenges accepted
              if (challenge.status === 'accepted') {
                await fetch(`/api/h2h?action=calculate_results&challengeId=${challenge.id}`);
              }
              
              const detailsRes = await fetch(`/api/h2h?action=get_detailed_results&challengeId=${challenge.id}`);
              if (detailsRes.ok) {
                const detailsData = await detailsRes.json();
                setDetailedResults(prev => {
                  const newMap = new Map(prev);
                  newMap.set(challenge.id, detailsData.detailedResults);
                  return newMap;
                });
              }
            } catch (error) {
              console.error(`Error loading details for challenge ${challenge.id}:`, error);
            }
          }
        }
      }

      // Fetch all challenges from other players
      const allChallengesRes = await fetch('/api/h2h');
      if (allChallengesRes.ok) {
        const allChallengesData = await allChallengesRes.json();
        const allChallenges = allChallengesData.challenges || [];
        // Filter to get only challenges where current user is not involved
        const otherPlayersChallenges = allChallenges.filter((challenge: H2HChallenge) => 
          challenge.challenger_id !== currentUser.id && challenge.challenged_id !== currentUser.id
        );
        setOtherChallenges(otherPlayersChallenges);
        
        // Load detailed results for other challenges that are accepted/completed too
        for (const challenge of otherPlayersChallenges) {
          if (challenge.status === 'accepted' || challenge.status === 'completed') {
            try {
              // Auto-calculate pentru challenges accepted
              if (challenge.status === 'accepted') {
                await fetch(`/api/h2h?action=calculate_results&challengeId=${challenge.id}`);
              }
              
              const detailsRes = await fetch(`/api/h2h?action=get_detailed_results&challengeId=${challenge.id}`);
              if (detailsRes.ok) {
                const detailsData = await detailsRes.json();
                setDetailedResults(prev => {
                  const newMap = new Map(prev);
                  newMap.set(challenge.id, detailsData.detailedResults);
                  return newMap;
                });
              }
            } catch (error) {
              console.error(`Error loading details for other challenge ${challenge.id}:`, error);
            }
          }
        }
      }

      // Fetch all users
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

      // Fetch available dates
      const datesRes = await fetch('/api/h2h?action=available_dates');
      if (datesRes.ok) {
        const datesData = await datesRes.json();
        setAvailableDates(datesData.dates || []);
      }
    } catch (error) {
      console.error('Error fetching H2H data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    if (!selectedUser || !selectedDate) return;

    try {
      const response = await fetch('/api/h2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_challenge',
          challengerId: currentUser.id,
          challengedId: parseInt(selectedUser),
          matchDate: selectedDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateForm(false);
          setSelectedUser('');
          setSelectedDate('');
          fetchData(); // Refresh challenges
        }
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const respondToChallenge = async (challengeId: number, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch('/api/h2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          challengeId,
          status
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchData(); // Refresh challenges
        }
      }
    } catch (error) {
      console.error('Error responding to challenge:', error);
    }
  };

  const toggleExpanded = async (challengeId: number) => {
    const newExpanded = new Set(expandedChallenges);
    
    if (expandedChallenges.has(challengeId)) {
      newExpanded.delete(challengeId);
      setExpandedChallenges(newExpanded);
    } else {
      newExpanded.add(challengeId);
      setExpandedChallenges(newExpanded);
      
      // Forțăm re-încărcarea detailed results de fiecare dată când expandăm
      // pentru a avea datele cel mai recente
      try {
        // Auto-calculate results for accepted challenges when expanding
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge && challenge.status === 'accepted') {
          await fetch(`/api/h2h?action=calculate_results&challengeId=${challengeId}`);
        }
        
        const response = await fetch(`/api/h2h?action=get_detailed_results&challengeId=${challengeId}`);
        if (response.ok) {
          const data = await response.json();
          const newDetailedResults = new Map(detailedResults);
          newDetailedResults.set(challengeId, data.detailedResults);
          setDetailedResults(newDetailedResults);
        }
      } catch (error) {
        console.error('Error loading detailed results:', error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'var(--superbet-yellow)';
      case 'accepted': return 'var(--superbet-green)';
      case 'declined': return 'var(--superbet-red)';
      case 'completed': return 'var(--superbet-blue)';
      default: return 'var(--superbet-gray)';
    }
  };

  const getDisplayStatus = (challenge: H2HChallenge) => {
    // Pentru challenges care sunt tehnic 'completed' în DB, 
    // verificăm dacă într-adevăr toate meciurile sunt terminate
    if (challenge.status === 'completed') {
      const detailedResult = detailedResults.get(challenge.id);
      if (detailedResult) {
        // Dacă avem detailed results, verificăm dacă toate meciurile sunt complete
        if (detailedResult.completedMatches === detailedResult.totalMatches) {
          return 'Finalizată';
        } else {
          return 'În derulare';
        }
      }
      // Dacă nu avem detailed results, să nu afișăm finalizată
      return 'Acceptată';
    }
    
    // Pentru celelalte statusuri, afișăm normal
    if (challenge.status === 'pending') return 'În așteptare';
    if (challenge.status === 'accepted') return 'Acceptată';
    if (challenge.status === 'declined') return 'Refuzată';
    
    return 'Acceptată';
  };

  // Helper functions pentru a folosi valorile corecte
  const getChallengerScore = (challenge: H2HChallenge) => {
    const detailedResult = detailedResults.get(challenge.id);
    return detailedResult ? detailedResult.challengerScore : challenge.challenger_score;
  };

  const getChallengedScore = (challenge: H2HChallenge) => {
    const detailedResult = detailedResults.get(challenge.id);
    return detailedResult ? detailedResult.challengedScore : challenge.challenged_score;
  };

  const getChallengerOdds = (challenge: H2HChallenge) => {
    const detailedResult = detailedResults.get(challenge.id);
    return detailedResult ? (detailedResult.challengerOddsTotal || 0) : challenge.challenger_odds_total;
  };

  const getChallengedOdds = (challenge: H2HChallenge) => {
    const detailedResult = detailedResults.get(challenge.id);
    return detailedResult ? (detailedResult.challengedOddsTotal || 0) : challenge.challenged_odds_total;
  };

  // Determină câștigătorul bazat pe cota totală (odds) mai mare
  const getWinner = (challenge: H2HChallenge) => {
    const challengerScore = getChallengerScore(challenge);
    const challengedScore = getChallengedScore(challenge);
    const challengerOdds = getChallengerOdds(challenge);
    const challengedOdds = getChallengedOdds(challenge);

    // Câștigătorul este determinat pe baza cotei totale (odds), nu a numărului de predicții corecte
    if (challengerOdds > challengedOdds) {
      return {
        winnerId: challenge.challenger_id,
        winnerName: challenge.challenger_id === currentUser.id ? currentUser.name : challenge.challenger_name
      };
    } else if (challengedOdds > challengerOdds) {
      return {
        winnerId: challenge.challenged_id,  
        winnerName: challenge.challenged_id === currentUser.id ? currentUser.name : challenge.challenged_name
      };
    } else {
      // Egalitate perfectă
      return {
        winnerId: null,
        winnerName: 'Egalitate'
      };
    }
  };

  // Verifică dacă challenge-ul este într-adevăr finalizat (toate meciurile terminate)
  const isTrulyCompleted = (challenge: H2HChallenge) => {
    const detailedResult = detailedResults.get(challenge.id);
    if (detailedResult) {
      return detailedResult.completedMatches === detailedResult.totalMatches && detailedResult.totalMatches > 0;
    }
    return false;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'accepted': return <CheckCircle size={16} />;
      case 'declined': return <XCircle size={16} />;
      case 'completed': return <Trophy size={16} />;
      default: return null;
    }
  };

  // Helper function to check if current user has completed all predictions for a specific date
  const hasCurrentUserCompletedAllPredictionsForDate = async (matchDate: string): Promise<boolean> => {
    try {
      // Fetch matches for the specific date
      const matchesRes = await fetch('/api/matches');
      if (!matchesRes.ok) return false;
      
      const matchesData = await matchesRes.json();
      const matches = matchesData.matches || [];
      
      // Get matches for the specific date that don't have results yet
      const availableMatches = matches.filter((match: any) => 
        match.match_date.startsWith(matchDate) && !match.result && !match.cancelled
      );
      
      if (availableMatches.length === 0) return true; // No matches to predict
      
      // Fetch current user's predictions
      const predictionsRes = await fetch(`/api/predictions?userId=${currentUser.id}`);
      if (!predictionsRes.ok) return false;
      
      const predictionsData = await predictionsRes.json();
      const userPredictions = predictionsData.predictions || [];
      
      // Count how many of the available matches the user has predicted
      let predictedCount = 0;
      availableMatches.forEach((match: any) => {
        const hasPrediction = userPredictions.some((pred: any) => pred.match_id === match.id);
        if (hasPrediction) predictedCount++;
      });
      
      return predictedCount === availableMatches.length;
    } catch (error) {
      console.error('Error checking user predictions completion:', error);
      return false;
    }
  };

  const renderDetailedResults = (challenge: H2HChallenge, results: DetailedResults) => {
    const challengerName = challenge.challenger_id === currentUser.id ? currentUser.name : challenge.challenger_name;
    const challengedName = challenge.challenged_id === currentUser.id ? currentUser.name : challenge.challenged_name;
    
    // Check if current user has completed all predictions for this challenge date
    const hasCompletedPredictions = userCompletedPredictions.get(challenge.match_date) || false;
    
    // Determine which prediction belongs to the opponent
    const isCurrentUserChallenger = challenge.challenger_id === currentUser.id;

    return (
      <div style={{
        background: 'var(--superbet-card-bg)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '12px',
        border: '1px solid var(--superbet-border)',
        overflow: 'hidden',
        maxWidth: '100%'
      }}>
        {/* Header with totals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          background: 'var(--superbet-light-gray)',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--superbet-text)', fontSize: '16px' }}>
              {challengerName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
              {results.challengerScore} corecte
            </div>
            <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
              {(results.challengerOddsTotal || 0).toFixed(2)}
            </div>
          </div>
          
          <div style={{
            background: 'transparent',
            color: 'var(--superbet-text)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '18px',
            border: '2px solid var(--superbet-border)'
          }}>
            {results.challengerScore} - {results.challengedScore}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--superbet-text)', fontSize: '16px' }}>
              {challengedName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
              {results.challengedScore} corecte
            </div>
            <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
              {(results.challengedOddsTotal || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="h2h-table-header" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 60px 60px',
          gap: '6px',
          padding: '12px 6px',
          background: 'var(--superbet-light-gray)',
          borderRadius: '8px 8px 0 0',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--superbet-text)',
          borderBottom: '2px solid var(--superbet-border)',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <div>Meci</div>
          <div style={{ textAlign: 'center' }}>{challengerName.slice(0, 6)}</div>
          <div style={{ textAlign: 'center' }}>{challengedName.slice(0, 6)}</div>
        </div>

        {/* Match Rows */}
        <div>
          {results.matches.map((match, index) => (
            <div
              key={match.matchId}
              className="h2h-table-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 60px 60px',
                gap: '6px',
                padding: '12px 6px',
                background: index % 2 === 0 ? 'var(--superbet-card-bg)' : 'var(--superbet-light-gray)',
                borderBottom: '1px solid var(--superbet-border)',
                fontSize: '13px',
                alignItems: 'center',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              {/* Match info */}
              <div className="h2h-match-info">
                <div style={{ color: 'var(--superbet-text)', marginBottom: '2px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 'bold' }}>{match.homeTeam}</span>
                  <span style={{ fontWeight: 'normal' }}> vs </span>
                  <span style={{ fontWeight: 'bold' }}>{match.awayTeam}</span>
                </div>
                <div className="h2h-match-status" style={{ fontSize: '10px', color: 'var(--superbet-gray)' }}>
                  {match.hasResult ? `Rezultat: ${match.result}` : 
                   match.cancelled ? 'ANULAT' : 'În curs...'}
                </div>
              </div>

              {/* Challenger prediction */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="h2h-prediction-box" style={{
                  padding: '6px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  width: '50px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (!hasCompletedPredictions && !isCurrentUserChallenger) ? 'var(--superbet-light-gray)' :
                             !match.challenger.prediction ? 'var(--superbet-light-gray)' :
                             match.challenger.correct && match.hasResult ? '#16a34a' : 
                             match.challenger.prediction && match.hasResult && !match.challenger.correct ? '#dc2626' :
                             'var(--superbet-blue)',
                  color: (!hasCompletedPredictions && !isCurrentUserChallenger) ? 'var(--superbet-gray)' :
                         !match.challenger.prediction ? 'var(--superbet-gray)' : 'white'
                }}>
                  {(!hasCompletedPredictions && !isCurrentUserChallenger) ? '?' : (match.challenger.prediction || '-')}
                </div>
                <div style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  {hasCompletedPredictions && match.challenger.correct && match.hasResult && (
                    <div style={{ fontSize: '9px', color: '#16a34a', fontWeight: 'bold' }}>
                      +{match.challenger.odds.toFixed(2)}
                    </div>
                  )}
                  {hasCompletedPredictions && match.challenger.hasBoost && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#fbbf24',
                      fontWeight: 700,
                      lineHeight: 1
                    }} title="Boost (x2)">
                      🚀
                    </span>
                  )}
                </div>
              </div>

              {/* Challenged prediction */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="h2h-prediction-box" style={{
                  padding: '6px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  width: '50px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (!hasCompletedPredictions && isCurrentUserChallenger) ? 'var(--superbet-light-gray)' :
                             !match.challenged.prediction ? 'var(--superbet-light-gray)' :
                             match.challenged.correct && match.hasResult ? '#16a34a' : 
                             match.challenged.prediction && match.hasResult && !match.challenged.correct ? '#dc2626' :
                             'var(--superbet-blue)',
                  color: (!hasCompletedPredictions && isCurrentUserChallenger) ? 'var(--superbet-gray)' :
                         !match.challenged.prediction ? 'var(--superbet-gray)' : 'white'
                }}>
                  {(!hasCompletedPredictions && isCurrentUserChallenger) ? '?' : (match.challenged.prediction || '-')}
                </div>
                <div style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  {hasCompletedPredictions && match.challenged.correct && match.hasResult && (
                    <div style={{ fontSize: '9px', color: '#16a34a', fontWeight: 'bold' }}>
                      +{match.challenged.odds.toFixed(2)}
                    </div>
                  )}
                  {hasCompletedPredictions && match.challenged.hasBoost && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#fbbf24',
                      fontWeight: 700,
                      lineHeight: 1
                    }} title="Boost (x2)">
                      🚀
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="h2h-progress" style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--superbet-light-gray)',
          borderRadius: '0 0 8px 8px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--superbet-text)',
          fontWeight: 'bold'
        }}>
          Progres: {results.completedMatches} din {results.totalMatches} meciuri finalizate
          <div style={{ 
            background: 'var(--superbet-card-bg)', 
            borderRadius: '10px', 
            height: '8px', 
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'var(--superbet-green)',
              height: '100%',
              width: `${(results.completedMatches / results.totalMatches) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        background: 'var(--superbet-card-bg)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--superbet-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--superbet-red)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--superbet-text)' }}>
                H2H Challenges
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--superbet-gray)' }}>
                Provoacă prietenii la dueluri pe meciuri specifice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--superbet-gray)',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: 'var(--superbet-text)' }}>Se încarcă...</div>
          </div>
        ) : (
          <>
            {!showCreateForm ? (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="superbet-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Swords size={16} />
                  Provoacă
                </button>
              </div>
            ) : (
              <div style={{
                background: 'var(--superbet-light-gray)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--superbet-text)' }}>
                  Creează Provocare Nouă
                </h3>
                
                <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--superbet-text)' }}>
                      Provoacă jucătorul:
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--superbet-border)',
                        borderRadius: '8px',
                        background: 'var(--superbet-card-bg)',
                        color: 'var(--superbet-text)'
                      }}
                    >
                      <option value="">Selectează jucătorul...</option>
                      {allUsers
                        .filter(user => user.id !== currentUser.id)
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--superbet-text)' }}>
                      Data meciurilor:
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--superbet-border)',
                        borderRadius: '8px',
                        background: 'var(--superbet-card-bg)',
                        color: 'var(--superbet-text)'
                      }}
                    >
                      <option value="">Selectează data...</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={createChallenge}
                    disabled={!selectedUser || !selectedDate}
                    className="superbet-button"
                    style={{ opacity: (!selectedUser || !selectedDate) ? 0.5 : 1 }}
                  >
                    Creează Provocarea
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedUser('');
                      setSelectedDate('');
                    }}
                    className="superbet-outline-button"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 style={{ marginBottom: '16px', color: 'var(--superbet-text)' }}>
                Provocările tale
              </h3>
              
              {challenges.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--superbet-gray)',
                  background: 'var(--superbet-light-gray)',
                  borderRadius: '12px'
                }}>
                  <Users size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p>Nu ai încă provocări H2H.</p>
                  <p>Creează prima ta provocare pentru a începe duelul!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {challenges.map(challenge => (
                    <div
                      key={challenge.id}
                      style={{
                        background: 'var(--superbet-card-bg)',
                        border: '2px solid var(--superbet-border)',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: getStatusColor(challenge.status) }}>
                              {getStatusIcon(challenge.status)}
                            </span>
                            <strong style={{ color: 'var(--superbet-text)' }}>
                              {challenge.challenger_id === currentUser.id 
                                ? `${currentUser.name}`
                                : `${challenge.challenger_name}`
                              }
                              <span style={{ fontWeight: 'normal' }}> vs </span>
                              {challenge.challenged_id === currentUser.id 
                                ? `${currentUser.name}`
                                : `${challenge.challenged_name}`
                              }
                            </strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--superbet-gray)', fontSize: '14px' }}>
                            <Calendar size={14} />
                            {formatDate(challenge.match_date)}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            background: getStatusColor(challenge.status),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {getDisplayStatus(challenge)}
                          </div>
                        </div>
                      </div>

                      {(challenge.status === 'accepted' || challenge.status === 'completed') && (
                        <div style={{
                          background: 'var(--superbet-card-bg)',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>Rezultate:</span>
                            <button
                              onClick={() => toggleExpanded(challenge.id)}
                              style={{
                                background: 'none',
                                border: '1px solid var(--superbet-border)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: 'var(--superbet-text)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {expandedChallenges.has(challenge.id) ? 'Ascunde detalii' : 'Vezi detalii'}
                              {expandedChallenges.has(challenge.id) ? 
                                <ChevronUp size={14} /> : 
                                <ChevronDown size={14} />
                              }
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--superbet-text)' }}>Predicții corecte:</span>
                            <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>
                              {getChallengerScore(challenge)} - {getChallengedScore(challenge)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--superbet-text)' }}>Total cote:</span>
                            <span style={{ 
                              color: 'var(--superbet-text)', 
                              fontWeight: 'bold',
                              display: 'flex',
                              gap: '8px'
                            }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: getChallengerOdds(challenge) > getChallengedOdds(challenge) 
                                  ? '2px solid #22c55e' 
                                  : getChallengerOdds(challenge) < getChallengedOdds(challenge)
                                  ? '1px solid var(--superbet-border)'
                                  : '1px solid var(--superbet-border)',
                                backgroundColor: getChallengerOdds(challenge) > getChallengedOdds(challenge)
                                  ? '#22c55e30'
                                  : 'transparent',
                                fontWeight: getChallengerOdds(challenge) > getChallengedOdds(challenge)
                                  ? 'bold'
                                  : 'normal'
                              }}>
                                {getChallengerOdds(challenge).toFixed(2)}
                              </span>
                              <span>-</span>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                  ? '2px solid #22c55e'
                                  : getChallengedOdds(challenge) < getChallengerOdds(challenge)
                                  ? '1px solid var(--superbet-border)'
                                  : '1px solid var(--superbet-border)',
                                backgroundColor: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                  ? '#22c55e30'
                                  : 'transparent',
                                fontWeight: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                  ? 'bold'
                                  : 'normal'
                              }}>
                                {getChallengedOdds(challenge).toFixed(2)}
                              </span>
                            </span>
                          </div>
                          {isTrulyCompleted(challenge) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--superbet-text)' }}>Câștigător:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Trophy size={16} color="var(--superbet-yellow)" />
                                <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>
                                  {getWinner(challenge).winnerName}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Detailed results when expanded */}
                          {expandedChallenges.has(challenge.id) && detailedResults.has(challenge.id) && 
                            renderDetailedResults(challenge, detailedResults.get(challenge.id)!)
                          }
                        </div>
                      )}

                      {challenge.status === 'pending' && challenge.challenged_id === currentUser.id && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => respondToChallenge(challenge.id, 'accepted')}
                            className="superbet-button"
                            style={{ flex: 1, fontSize: '14px', padding: '8px' }}
                          >
                            Acceptă
                          </button>
                          <button
                            onClick={() => respondToChallenge(challenge.id, 'declined')}
                            className="superbet-outline-button"
                            style={{ flex: 1, fontSize: '14px', padding: '8px' }}
                          >
                            Refuză
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Other Players' Challenges Section */}
              {otherChallenges.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid var(--superbet-border)'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: 'var(--superbet-text)' 
                    }}>
                      Provocările Altor Jucători
                    </h3>
                    <div style={{
                      marginLeft: '8px',
                      background: 'var(--superbet-light-gray)',
                      color: 'var(--superbet-gray)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {otherChallenges.length}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {otherChallenges.map(challenge => (
                      <div
                        key={challenge.id}
                        style={{
                          background: 'var(--superbet-light-gray)',
                          border: '1px solid var(--superbet-border)',
                          borderRadius: '12px',
                          padding: '16px',
                          opacity: '0.8'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ color: getStatusColor(challenge.status) }}>
                                {getStatusIcon(challenge.status)}
                              </span>
                              <strong style={{ color: 'var(--superbet-text)' }}>
                                {challenge.challenger_name}
                                <span style={{ fontWeight: 'normal' }}> vs </span>
                                {challenge.challenged_name}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--superbet-gray)', fontSize: '14px' }}>
                              <Calendar size={14} />
                              {formatDate(challenge.match_date)}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              background: getStatusColor(challenge.status),
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {getDisplayStatus(challenge)}
                            </div>
                          </div>
                        </div>

                        {(challenge.status === 'accepted' || challenge.status === 'completed') && (
                          <div style={{
                            background: 'var(--superbet-card-bg)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>Rezultate:</span>
                              <button
                                onClick={() => toggleExpanded(challenge.id)}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--superbet-border)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  color: 'var(--superbet-text)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px'
                                }}
                              >
                                {expandedChallenges.has(challenge.id) ? 'Ascunde detalii' : 'Vezi detalii'}
                                {expandedChallenges.has(challenge.id) ? 
                                  <ChevronUp size={14} /> : 
                                  <ChevronDown size={14} />
                                }
                              </button>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: 'var(--superbet-text)' }}>Predicții corecte:</span>
                              <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>
                                {getChallengerScore(challenge)} - {getChallengedScore(challenge)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: 'var(--superbet-text)' }}>Total cote:</span>
                              <span style={{ 
                                color: 'var(--superbet-text)', 
                                fontWeight: 'bold',
                                display: 'flex',
                                gap: '8px'
                              }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: getChallengerOdds(challenge) > getChallengedOdds(challenge) 
                                    ? '2px solid #22c55e' 
                                    : getChallengerOdds(challenge) < getChallengedOdds(challenge)
                                    ? '1px solid var(--superbet-border)'
                                    : '1px solid var(--superbet-border)',
                                  backgroundColor: getChallengerOdds(challenge) > getChallengedOdds(challenge)
                                    ? '#22c55e30'
                                    : 'transparent',
                                  fontWeight: getChallengerOdds(challenge) > getChallengedOdds(challenge)
                                    ? 'bold'
                                    : 'normal'
                                }}>
                                  {getChallengerOdds(challenge).toFixed(2)}
                                </span>
                                <span>-</span>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                    ? '2px solid #22c55e'
                                    : getChallengedOdds(challenge) < getChallengerOdds(challenge)
                                    ? '1px solid var(--superbet-border)'
                                    : '1px solid var(--superbet-border)',
                                  backgroundColor: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                    ? '#22c55e30'
                                    : 'transparent',
                                  fontWeight: getChallengedOdds(challenge) > getChallengerOdds(challenge)
                                    ? 'bold'
                                    : 'normal'
                                }}>
                                  {getChallengedOdds(challenge).toFixed(2)}
                                </span>
                              </span>
                            </div>
                            {isTrulyCompleted(challenge) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--superbet-text)' }}>Câștigător:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Trophy size={16} color="var(--superbet-yellow)" />
                                  <span style={{ color: 'var(--superbet-text)', fontWeight: 'bold' }}>
                                    {getWinner(challenge).winnerName}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Detailed results when expanded */}
                            {expandedChallenges.has(challenge.id) && detailedResults.has(challenge.id) && 
                              renderDetailedResults(challenge, detailedResults.get(challenge.id)!)
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Bottom navigation button */}
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--superbet-border)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            className="superbet-button"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px 24px',
              fontSize: '16px'
            }}
          >
            <svg 
              style={{ width: '16px', height: '16px' }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Înapoi la Predicții
          </button>
        </div>
      </div>
      
      {/* Mobile responsive styles for H2H table */}
      <style jsx>{`
        @media (max-width: 768px) {
          .modal-content {
            margin: 10px !important;
            padding: 16px !important;
            max-height: 75vh !important;
          }
          
          .h2h-table-header {
            grid-template-columns: 1.8fr 70px 70px !important;
            padding: 8px 4px !important;
            font-size: 10px !important;
            gap: 4px !important;
          }
          
          .h2h-table-row {
            grid-template-columns: 1.8fr 70px 70px !important;
            padding: 8px 4px !important;
            gap: 4px !important;
          }
          
          .h2h-match-info div:first-child {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          
          .h2h-match-status {
            font-size: 8px !important;
          }
          
          .h2h-prediction-box {
            padding: 4px !important;
            font-size: 10px !important;
          }
          
          .h2h-odds {
            font-size: 7px !important;
          }
          
          .h2h-progress {
            font-size: 12px !important;
            padding: 8px !important;
          }
        }
        
        @media (max-width: 480px) {
          .modal-content {
            margin: 5px !important;
            padding: 12px !important;
            max-height: 70vh !important;
          }
          
          .h2h-table-header {
            grid-template-columns: 1.5fr 60px 60px !important;
            font-size: 9px !important;
            padding: 6px 2px !important;
            gap: 2px !important;
          }
          
          .h2h-table-row {
            grid-template-columns: 1.5fr 60px 60px !important;
            padding: 6px 2px !important;
            gap: 2px !important;
          }
          
          .h2h-match-info div:first-child {
            font-size: 9px !important;
            line-height: 1.1 !important;
          }
          
          .h2h-match-status {
            font-size: 7px !important;
          }
          
          .h2h-prediction-box {
            padding: 3px !important;
            font-size: 9px !important;
          }
          
          .h2h-odds {
            font-size: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
