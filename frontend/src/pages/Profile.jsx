import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Star, CheckCircle, Leaf, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id }   = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile(id)
      .then(({ data }) => setProfile(data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card h-48 animate-pulse bg-gray-100" />
      </div>
    );
  }
  if (!profile) return <p className="text-center py-20 text-gray-400">Profile not found.</p>;

  const isOwn      = user?.userId === id;
  // Show eco-username if available, fall back to name
  const displayName = profile.name || 'EcoChallenger';
  const ecoHandle   = profile.username || displayName;
  // Avatar letter — use first char of name
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Profile header */}
      <div className="card mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-eco-200 flex items-center justify-center text-eco-800 text-2xl font-bold flex-shrink-0">
            {avatarLetter}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {displayName}
              {isOwn && (
                <span className="text-xs text-eco-600 font-normal bg-eco-100 px-2 py-0.5 rounded-full">
                  you
                </span>
              )}
            </h1>

            {/* Eco handle — NOT the email */}
            <p className="flex items-center gap-1 text-sm text-eco-600 font-medium mt-0.5">
              <AtSign size={14} />
              {ecoHandle}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              🌿 EcoChallenger · Member since {profile.joinedDate?.slice(0, 10) ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Points',
            value: (profile.totalPoints ?? 0).toLocaleString(),
            icon:  <Star className="text-yellow-500 fill-yellow-400" size={20} />,
          },
          {
            label: 'Completed',
            value: profile.challengesCompleted ?? 0,
            icon:  <CheckCircle className="text-eco-500" size={20} />,
          },
          {
            label: 'Streak',
            value: `${profile.streakDays ?? 0}d`,
            icon:  <Leaf className="text-green-500" size={20} />,
          },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zero-points notice for new users */}
      {(profile.totalPoints ?? 0) === 0 && (
        <div className="card bg-eco-50 border-eco-200 text-eco-800 text-sm mb-6 flex items-start gap-2">
          <span className="text-xl">🌱</span>
          <div>
            <p className="font-semibold">You're just getting started!</p>
            <p className="text-eco-600 mt-0.5">Join challenges and submit proof to earn your first points.</p>
          </div>
        </div>
      )}

      {/* Recent completions */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">Recent Completions</h2>
      {(profile.recentCompletions ?? []).length === 0 ? (
        <p className="text-sm text-gray-400">No completions yet — submit your first proof to get started!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {profile.recentCompletions.map((c, i) => (
            <div key={c.challengeId + i} className="card flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{c.title}</span>
              <span className="text-eco-600 font-semibold">+{c.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
