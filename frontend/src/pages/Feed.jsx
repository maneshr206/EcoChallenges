import React, { useEffect, useState, useCallback } from 'react';
import { getChallenges } from '../api/client';
import ChallengeCard from '../components/ChallengeCard';
import CategoryFilter from '../components/CategoryFilter';
import { Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Feed() {
  const [challenges, setChallenges]   = useState([]);
  const [filtered,   setFiltered]     = useState([]);
  const [category,   setCategory]     = useState('all');
  const [search,     setSearch]       = useState('');
  const [loading,    setLoading]      = useState(true);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getChallenges({ active: true });
      setChallenges(data.challenges ?? data);
    } catch (err) {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  // Filter client-side
  useEffect(() => {
    let result = [...challenges];
    if (category !== 'all') result = result.filter((c) => c.category === category);
    if (search)             result = result.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [challenges, category, search]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challenge Feed 🌍</h1>
          <p className="text-sm text-gray-500 mt-0.5">Active challenges, sorted by newest</p>
        </div>
        <button onClick={fetchChallenges} className="btn-secondary flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
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
          <p className="text-5xl mb-4">🌵</p>
          <p className="font-medium">No challenges found</p>
          <p className="text-sm mt-1">Try a different category or search term.</p>
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
