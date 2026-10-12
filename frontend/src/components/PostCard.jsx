import React, { useState } from 'react';
import { Heart, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { likePost } from '../api/client';
import toast from 'react-hot-toast';

export default function PostCard({ post, currentUserId }) {
  const {
    postId,
    userId,
    userName = 'EcoUser',
    content,
    imageUrl,
    likeCount = 0,
    createdAt,
    moderationStatus = 'approved', // 'approved' | 'pending' | 'flagged'
    sentiment,
  } = post;

  const [likes, setLikes] = useState(likeCount);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    try {
      await likePost(postId);
      setLikes((l) => l + 1);
      setLiked(true);
    } catch {
      toast.error('Could not like post');
    }
  };

  // Don't render flagged posts in the main feed
  if (moderationStatus === 'flagged') return null;

  return (
    <div className="card flex flex-col gap-3">
      {/* Author row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-eco-200 flex items-center justify-center text-eco-700 font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{userName}</p>
            <p className="text-xs text-gray-400">
              {createdAt ? formatDistanceToNow(parseISO(createdAt), { addSuffix: true }) : ''}
            </p>
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
        />
      )}

      {/* Text content */}
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>

      {/* Sentiment chip */}
      {sentiment && (
        <span className={`badge w-fit ${
          sentiment === 'POSITIVE' ? 'bg-green-100 text-green-700' :
          sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-600'    :
          'bg-gray-100 text-gray-500'
        }`}>
          {sentiment === 'POSITIVE' ? '😊' : sentiment === 'NEGATIVE' ? '😕' : '😐'} {sentiment.toLowerCase()}
        </span>
      )}

      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={liked || userId === currentUserId}
        className={`flex items-center gap-1.5 text-sm w-fit transition-colors ${
          liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
        }`}
      >
        <Heart size={16} className={liked ? 'fill-red-500' : ''} />
        {likes} {likes === 1 ? 'like' : 'likes'}
      </button>
    </div>
  );
}
