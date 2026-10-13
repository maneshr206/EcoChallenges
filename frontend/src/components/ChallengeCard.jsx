import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, ArrowRight, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import ShareButton from './ShareButton';

const categoryColors = {
  'healthy-living': 'bg-green-100 text-green-700',
  'eco-friendly':   'bg-teal-100 text-teal-700',
  'community':      'bg-blue-100 text-blue-700',
  'energy':         'bg-yellow-100 text-yellow-700',
  'water':          'bg-cyan-100 text-cyan-700',
  'food':           'bg-orange-100 text-orange-700',
};

const categoryEmojis = {
  'healthy-living': '🥗',
  'eco-friendly':   '♻️',
  'community':      '🤝',
  'energy':         '⚡',
  'water':          '💧',
  'food':           '🍃',
};

export default function ChallengeCard({ challenge }) {
  const {
    challengeId,
    title,
    description,
    category    = 'eco-friendly',
    points      = 10,
    expiryDate,
    participantCount = 0,
    difficulty  = 'medium',
    visibility  = 'public',   // 'public' | 'private'
    inviteCode,
  } = challenge;

  const expiresIn = expiryDate
    ? formatDistanceToNow(parseISO(expiryDate), { addSuffix: true })
    : 'No expiry';

  const isExpiringSoon = expiryDate &&
    (new Date(expiryDate) - new Date()) < 3 * 24 * 60 * 60 * 1000;

  const difficultyColor = {
    easy:   'bg-green-100 text-green-600',
    medium: 'bg-yellow-100 text-yellow-700',
    hard:   'bg-red-100 text-red-600',
  }[difficulty] ?? 'bg-gray-100 text-gray-600';

  const isPrivate = visibility === 'private';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{categoryEmojis[category] ?? '🌿'}</span>
          <span className={`badge ${categoryColors[category] ?? 'bg-gray-100 text-gray-600'}`}>
            {category.replace(/-/g, ' ')}
          </span>
          {isPrivate && (
            <span className="badge bg-gray-100 text-gray-500 flex items-center gap-1">
              <Lock size={10} /> Private
            </span>
          )}
        </div>
        <span className={`badge ${difficultyColor} flex-shrink-0`}>{difficulty}</span>
      </div>

      {/* Title & description */}
      <div>
        <h3 className="font-semibold text-gray-900 leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Star size={13} className="text-yellow-500 fill-yellow-400" />
          <span className="font-semibold text-gray-700">{points} pts</span>
        </span>
        <span className="flex items-center gap-1">
          <Users size={13} />
          {participantCount} joined
        </span>
        <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-500 font-medium' : ''}`}>
          <Clock size={13} />
          {expiresIn}
        </span>
      </div>

      {/* CTA row — View + Share */}
      <div className="mt-auto flex items-center gap-2">
        <Link
          to={`/challenges/${challengeId}`}
          className="flex-1 btn-primary flex items-center justify-center gap-1 text-sm"
        >
          View Challenge <ArrowRight size={15} />
        </Link>
        <ShareButton
          challengeId={challengeId}
          title={title}
          isPrivate={isPrivate}
          inviteCode={inviteCode}
        />
      </div>
    </div>
  );
}
