import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChallenge, getPosts, joinChallenge } from '../api/client';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Clock, Star, Users, ArrowLeft, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [joining,   setJoining]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, pRes] = await Promise.all([getChallenge(id), getPosts(id)]);
        setChallenge(cRes.data);
        setPosts(pRes.data.posts ?? pRes.data);
      } catch {
        toast.error('Failed to load challenge');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinChallenge(id);
      toast.success('You joined the challenge! 🌿');
      setChallenge((c) => ({ ...c, joined: true, participantCount: (c.participantCount ?? 0) + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card h-64 animate-pulse bg-gray-100" />
      </div>
    );
  }
  if (!challenge) return <p className="text-center py-20 text-gray-400">Challenge not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {/* Challenge card */}
      <div className="card mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{challenge.title}</h1>
        <p className="text-gray-600 leading-relaxed mb-4">{challenge.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
          <span className="flex items-center gap-1">
            <Star size={15} className="text-yellow-500 fill-yellow-400" />
            <strong className="text-gray-800">{challenge.points}</strong> points
          </span>
          <span className="flex items-center gap-1">
            <Users size={15} />
            {challenge.participantCount ?? 0} participants
          </span>
          {challenge.expiryDate && (
            <span className="flex items-center gap-1">
              <Clock size={15} />
              Expires {format(parseISO(challenge.expiryDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!challenge.joined ? (
            <button onClick={handleJoin} disabled={joining} className="btn-primary">
              {joining ? 'Joining…' : 'Join Challenge'}
            </button>
          ) : (
            <Link to={`/challenges/${id}/submit`} className="btn-primary flex items-center gap-1.5">
              <PlusCircle size={16} /> Submit Proof
            </Link>
          )}
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Community Posts ({posts.length})
      </h2>
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No posts yet — be the first to submit proof!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard key={p.postId} post={p} currentUserId={user?.userId} />
          ))}
        </div>
      )}
    </div>
  );
}
