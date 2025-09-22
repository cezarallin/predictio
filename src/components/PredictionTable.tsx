'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Users, Calendar, Trophy, CalendarDays } from 'lucide-react';
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
      setUsers(usersData.users || []);
      setPredictions(predictionsData.predictions || []);
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
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
        <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Matches Available
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
        Matches will be loaded before the game period starts. Come back soon to make your predictions!
      </p>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No matches available yet. Matches will be loaded before game starts!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Football Predictions
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4" />
              {users.length} players
            </div>
          </div>
        </div>
      </div>


      {/* Main prediction table */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  Match
                </th>
                <th className="px-3 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  1
                </th>
                <th className="px-3 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  X
                </th>
                <th className="px-3 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  2
                </th>
                {users.map(user => (
                  <th key={user.id} className="px-3 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                    {user.name}
                  </th>
                ))}
                <th className="px-3 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-4 border-r border-gray-200 dark:border-gray-600">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {match.home_team} vs {match.away_team}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {match.league}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {format(new Date(match.match_date), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </td>
                  
                  {/* Odds columns */}
                  <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {match.odds_1?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {match.odds_x?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {match.odds_2?.toFixed(2) || '-'}
                    </span>
                  </td>

                  {/* User prediction columns */}
                  {users.map(user => {
                    const userPrediction = getUserPrediction(match.id, user.id);
                    const isCurrentUser = user.id === currentUser.id;
                    const colorClass = getPredictionColor(match.id, user.id, userPrediction);
                    const hasExistingPrediction = userPrediction !== null;
                    
                    return (
                      <td key={user.id} className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                        {isCurrentUser && !match.result && !hasExistingPrediction ? (
                          // Show prediction buttons only if no prediction exists yet
                          <div className="flex gap-1 justify-center">
                            {(['1', 'X', '2'] as const).map(option => (
                              <button
                                key={option}
                                onClick={() => makePrediction(match.id, option)}
                                className="w-8 h-8 text-xs font-semibold rounded border-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : (
                          // Show locked prediction or empty state
                          <div className="flex items-center justify-center">
                            <span className={`inline-block w-8 h-8 text-xs font-semibold rounded border-2 leading-7 ${
                              colorClass || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                            }`}>
                              {userPrediction || '-'}
                            </span>
                            {isCurrentUser && hasExistingPrediction && !match.result && (
                              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400" title="Prediction is locked">
                                🔒
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Result column */}
                  <td className="px-3 py-4 text-center">
                    {match.result ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        {match.result}
                      </span>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        {(['1', 'X', '2'] as const).map(option => (
                          <button
                            key={option}
                            onClick={() => setMatchResult(match.id, option)}
                            className="w-6 h-6 text-xs font-semibold rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors duration-200"
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
              <tr className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 font-semibold">
                <td className="px-4 py-4 border-r border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-900 dark:text-white">Total Score</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600"></td>
                <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600"></td>
                <td className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600"></td>
                {users.map(user => (
                  <td key={user.id} className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {calculateUserScore(user.id).toFixed(2)}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-4 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
