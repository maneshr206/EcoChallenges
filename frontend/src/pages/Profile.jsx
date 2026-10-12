import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Star, CheckCircle, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
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

  const isOwn = user?.userId === id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-eco-200 flex items-center justify-center text-eco-800 text-2xl font-bold">
          {profile.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">
            {profile.name} {isOwn && <span className="text-sm text-eco-600 font-normal">(you)</span>}
          </h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-xs text-gray-400 mt-1">Member since {profile.joinedDate?.slice(0, 10) ?? '—'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Points', value: (profile.totalPoints ?? 0).toLocaleString(), icon: <Star className="text-yellow-500 fill-yellow-400" size={20} /> },
          { label: 'Challenges',   value: profile.challengesCompleted ?? 0,             icon: <CheckCircle className="text-eco-500" size={20} /> },
          { label: 'Streak',       value: `${profile.streakDays ?? 0}d`,               icon: <Leaf className="text-green-500" size={20} /> },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent completions */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">Recent Completions</h2>
      {(profile.recentCompletions ?? []).length === 0 ? (
        <p className="text-sm text-gray-400">No completions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {profile.recentCompletions.map((c) => (
            <div key={c.challengeId} className="card flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{c.title}</span>
              <span className="text-eco-600 font-semibold">+{c.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
