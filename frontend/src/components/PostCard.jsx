import React, { useState } from 'react';
import { Heart, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { likePost } from '../api/client';
import toast from 'react-hot-toast';

// Safely format a date string — returns '' if invalid
function safeTimeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
  } catch {
    return '';
  }
}

export default function PostCard({ post, currentUserId }) {
  const {
    postId,
    userId,
    userName         = 'EcoUser',
    content,
    imageUrl,
    likeCount        = 0,
    createdAt,
    moderationStatus = 'approved',
    sentiment,
  } = post;

  const [likes, setLikes]   = useState(Number(likeCount) || 0);
  const [liked, setLiked]   = useState(false);
  const isOwner = userId === currentUserId;

  const handleLike = async () => {
    if (liked || isOwner) return;
    try {
      await likePost(postId);
      setLikes((l) => l + 1);
      setLiked(true);
    } catch {
      toast.error('Could not like post');
    }
  };

  // Never render flagged posts in the feed
  if (moderationStatus === 'flagged') return null;

  return (
    <div className="card flex flex-col gap-3">
      {/* Author row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-eco-200 flex items-center justify-center text-eco-700 font-semibold text-sm select-none">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{userName}</p>
            <p className="text-xs text-gray-400">{safeTimeAgo(createdAt)}</p>
          </div>
        </div>

        {/* Moderation badge */}
        {moderationStatus === 'approved' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <ShieldCheck size={13} /> Verified
          </span>
        )}
        {moderationStatus === 'pending' && (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle size={13} /> Under review
          </span>
        )}
      </div>

      {/* Image proof */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Proof"
          className="rounded-xl w-full object-cover max-h-64"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Text content */}
      <p className="text-sm text-gray-700 leading-relaxed break-words">{content}</p>

      {/* Sentiment chip — only show POSITIVE/NEGATIVE, skip NEUTRAL/MIXED */}
      {sentiment && sentiment !== 'NEUTRAL' && sentiment !== 'MIXED' && (
        <span className={`badge w-fit ${
          sentiment === 'POSITIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {sentiment === 'POSITIVE' ? '😊' : '😕'} {sentiment.toLowerCase()}
        </span>
      )}

      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={liked || isOwner}
        title={isOwner ? "You can't like your own post" : liked ? 'Already liked' : 'Like this post'}
        className={`flex items-center gap-1.5 text-sm w-fit transition-colors ${
          liked      ? 'text-red-500 cursor-default'  :
          isOwner    ? 'text-gray-300 cursor-not-allowed' :
                       'text-gray-400 hover:text-red-400 cursor-pointer'
        }`}
      >
        <Heart size={16} className={liked ? 'fill-red-500' : ''} />
        {likes} {likes === 1 ? 'like' : 'likes'}
      </button>
    </div>
  );
}
