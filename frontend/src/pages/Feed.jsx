import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getChallenges } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ChallengeCard from '../components/ChallengeCard';
import CategoryFilter from '../components/CategoryFilter';
import { Search, RefreshCw, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Feed() {
  const { user }                              = useAuth();
  const [challenges,  setChallenges]          = useState([]);
  const [filtered,    setFiltered]            = useState([]);
  const [category,    setCategory]            = useState('all');
  const [search,      setSearch]              = useState('');
  const [loading,     setLoading]             = useState(true);
  const [tab,         setTab]                 = useState('all');

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getChallenges({ active: true });
      setChallenges(data.challenges ?? data);
    } catch {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  // Client-side filter
  useEffect(() => {
    let result = [...challenges];
    // Tab filter
    if (tab === 'mine') result = result.filter((c) => c.createdBy === user?.userId);
    // Category filter
    if (category !== 'all') result = result.filter((c) => c.category === category);
    // Search filter
    if (search) result = result.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [challenges, category, search, tab, user]);

  const myChallenges = challenges.filter((c) => c.createdBy === user?.userId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challenge Feed 🌍</h1>
          <p className="text-sm text-gray-500 mt-0.5">Active challenges, sorted by newest</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchChallenges}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/create" className="btn-primary flex items-center gap-1.5 text-sm">
            <PlusCircle size={15} /> New Challenge
          </Link>
        </div>
      </div>

      {/* Tabs: All / My Challenges */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
        {[
          { key: 'all',  label: 'All Challenges' },
          { key: 'mine', label: `My Challenges${myChallenges.length > 0 ? ` (${myChallenges.length})` : ''}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges…"
          className="input pl-9"
        />
      </div>

      {/* Category pills */}
      <div className="mb-6">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">{tab === 'mine' ? '📝' : '🌵'}</p>
          <p className="font-medium">
            {tab === 'mine' ? "You haven't created any challenges yet" : 'No challenges found'}
          </p>
          {tab === 'mine' ? (
            <Link to="/create" className="inline-flex items-center gap-1 mt-3 text-eco-600 hover:underline text-sm">
              <PlusCircle size={15} /> Create your first challenge
            </Link>
          ) : (
            <p className="text-sm mt-1">Try a different category or search term.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ChallengeCard key={c.challengeId} challenge={c} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Showing {filtered.length} of {challenges.length} challenges
      </p>
    </div>
  );
}
