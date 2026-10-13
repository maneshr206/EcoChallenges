import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChallenge, getPosts, joinChallenge } from '../api/client';
import PostCard from '../components/PostCard';
import ShareButton from '../components/ShareButton';
import { useAuth } from '../context/AuthContext';
import { Clock, Star, Users, ArrowLeft, PlusCircle, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChallengeDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [joining,   setJoining]   = useState(false);
  const fetchedRef = useRef(false);

  // Reset all state when navigating to a different challenge
  useEffect(() => {
    setChallenge(null);
    setPosts([]);
    setLoading(true);
    setJoining(false);
    fetchedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

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
    // Prevent double-click or re-joining
    if (joining || challenge?.joined) return;
    setJoining(true);
    try {
      const res = await joinChallenge(id);
      toast.success('You joined the challenge! 🌿');
      // Use server-returned count to stay accurate — don't add locally
      setChallenge((c) => ({
        ...c,
        joined:           true,
        participantCount: res.data.participantCount ?? (c.participantCount ?? 0) + 1,
      }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not join';
      if (err.response?.data?.alreadyJoined) {
        // Already joined on server — update UI to reflect that
        setChallenge((c) => ({ ...c, joined: true }));
        toast('You already joined this challenge', { icon: '✅' });
      } else {
        toast.error(msg);
      }
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
        <div className="flex gap-3 flex-wrap items-center">
          {!challenge.joined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary"
            >
              {joining ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining…
                </span>
              ) : 'Join Challenge'}
            </button>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-eco-700 font-medium bg-eco-100 px-3 py-2 rounded-lg">
                <CheckCircle size={16} /> Joined
              </span>
              <Link to={`/challenges/${id}/submit`} className="btn-primary flex items-center gap-1.5">
                <PlusCircle size={16} /> Submit Proof
              </Link>
            </div>
          )}
          {/* Share button always visible */}
          <ShareButton
            challengeId={id}
            title={challenge.title}
            isPrivate={challenge.visibility === 'private'}
            inviteCode={challenge.inviteCode}
          />
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
