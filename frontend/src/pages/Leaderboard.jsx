import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const medalEmojis = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user }              = useAuth();
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(({ data }) => setBoard(data.leaderboard ?? data))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">Top eco warriors this month</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-14 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {board.map((entry, i) => {
            const isCurrentUser = entry.userId === user?.userId;
            return (
              <div
                key={entry.userId}
                className={`card flex items-center gap-4 ${
                  isCurrentUser ? 'ring-2 ring-eco-400 bg-eco-50' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-bold text-lg">
                  {i < 3 ? (
                    <span>{medalEmojis[i]}</span>
                  ) : (
                    <span className="text-gray-400">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  isCurrentUser ? 'bg-eco-200 text-eco-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {(entry.userName ?? 'U').charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isCurrentUser ? 'text-eco-800' : 'text-gray-800'}`}>
                    {entry.userName ?? 'Eco User'}
                    {isCurrentUser && <span className="ml-2 text-xs text-eco-600">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.challengesCompleted ?? 0} challenges completed
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className={`font-bold ${i < 3 ? medalColors[i] : 'text-gray-700'}`}>
                    {(entry.totalPoints ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
