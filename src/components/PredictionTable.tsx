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
  currentUser: { id: number; name: string; is_admin?: boolean };
}

export default function PredictionTable({ currentUser }: PredictionTableProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    // Default to current week's Monday
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return format(monday, 'yyyy-MM-dd');
  });

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

  const loadWeekMatches = async (weekStart: string) => {
    if (!currentUser.is_admin) return;
    
    setIsLoadingWeek(true);
    try {
      const response = await fetch('/api/admin/load-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.name,
          weekStartDate: weekStart 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Admin loaded ${data.matchesFound} matches for week ${data.weekRange.from} to ${data.weekRange.to}`);
        loadData();
      }
    } catch (error) {
      console.error('Failed to load week matches:', error);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const handleWeekChange = (newWeekStart: string) => {
    setSelectedWeekStart(newWeekStart);
    if (currentUser.is_admin) {
      loadWeekMatches(newWeekStart);
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
      }
    } catch (error) {
      console.error('Failed to make prediction:', error);
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
          No Real Matches Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          To load real football matches from September 2025, you need to add API keys. 
          This app no longer uses mock data - only real matches from live APIs!
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
            🔑 Get Free API Keys (Takes 2 minutes):
          </h4>
          <div className="space-y-2 text-left text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <div>
                <strong>The Odds API</strong> (500 requests/month free): 
                <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  the-odds-api.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <div>
                <strong>API-Sports</strong> (100 requests/day free): 
                <a href="https://rapidapi.com/api-sports/api/api-football/" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  rapidapi.com/api-sports
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <div>
                Add keys to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env.local</code> file in project root
              </div>
            </div>
          </div>
        </div>
        
        {currentUser.is_admin && (
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Select a week using the date picker above to load matches
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Matches will be loaded from Friday to Monday of the selected week
              </p>
            </div>
          </div>
        )}
        
        {!currentUser.is_admin && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No matches available. Contact an admin to load matches for this week.
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          This ensures you get actual matches like Dinamo vs Universitatea Craiova, not fake data!
        </p>
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
                Football Matches
              </span>
              {currentUser.is_admin && (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-full">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4" />
              {users.length} players
            </div>
          </div>
          
          {currentUser.is_admin && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Week:
                </label>
                <input
                  type="date"
                  value={selectedWeekStart}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  disabled={isLoadingWeek}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
                {isLoadingWeek && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Friday to Monday
              </div>
            </div>
          )}
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
                    
                    return (
                      <td key={user.id} className="px-3 py-4 text-center border-r border-gray-200 dark:border-gray-600">
                        {isCurrentUser && !match.result ? (
                          <div className="flex gap-1 justify-center">
                            {(['1', 'X', '2'] as const).map(option => (
                              <button
                                key={option}
                                onClick={() => makePrediction(match.id, option)}
                                className={`w-8 h-8 text-xs font-semibold rounded border-2 transition-all duration-200 ${
                                  userPrediction === option
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-block w-8 h-8 text-xs font-semibold rounded border-2 leading-7 ${
                            colorClass || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                          }`}>
                            {userPrediction || '-'}
                          </span>
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
