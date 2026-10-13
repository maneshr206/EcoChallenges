import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChallenge } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ShareButton from '../components/ShareButton';
import { PlusCircle, Globe, Lock, Clock, CheckCircle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'eco-friendly',   label: 'Eco-Friendly',   emoji: '♻️' },
  { value: 'healthy-living', label: 'Healthy Living', emoji: '🥗' },
  { value: 'community',      label: 'Community',      emoji: '🤝' },
  { value: 'energy',         label: 'Energy',         emoji: '⚡' },
  { value: 'water',          label: 'Water',          emoji: '💧' },
  { value: 'food',           label: 'Food',           emoji: '🍃' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   points: 30, color: 'green',  desc: '30 pts — simple daily habit' },
  { value: 'medium', label: 'Medium', points: 40, color: 'yellow', desc: '40 pts — weekly commitment' },
  { value: 'hard',   label: 'Hard',   points: 50, color: 'red',    desc: '50 pts — sustained effort' },
];

// Points are fixed per difficulty — users cannot set arbitrary points
const POINTS_BY_DIFFICULTY = { easy: 30, medium: 40, hard: 50 };

// Generate a short random invite code
function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CreateChallenge() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [loading,   setLoading]   = useState(false);
  const [created,   setCreated]   = useState(null); // holds the created challenge
  const [codeCopied, setCodeCopied] = useState(false);

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    category:        'eco-friendly',
    difficulty:      'medium',
    daysUntilExpiry: 30,
    visibility:      'public',
  });

  // Points are always derived from difficulty — never entered manually
  const points = POINTS_BY_DIFFICULTY[form.difficulty];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())       { toast.error('Title is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }

    setLoading(true);
    try {
      const expiryDate = new Date(Date.now() + form.daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString();
      const inviteCode = form.visibility === 'private' ? genInviteCode() : null;

      const { data } = await createChallenge({
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        difficulty:  form.difficulty,
        points,          // always the locked value from difficulty
        expiryDate,
        visibility:  form.visibility,
        inviteCode,
        createdBy:   user?.userId,
      });

      setCreated({ ...data, inviteCode });
      toast.success('Challenge created! 🌿');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    const shareUrl = created.inviteCode
      ? `${window.location.origin}/challenges/${created.challengeId}?invite=${created.inviteCode}`
      : `${window.location.origin}/challenges/${created.challengeId}`;

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="card text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-eco-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-eco-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Challenge Created!</h2>
            <p className="text-gray-500 text-sm mt-1">"{created.title}" is now live.</p>
          </div>

          {/* Visibility badge */}
          <span className={`badge flex items-center gap-1.5 text-sm px-3 py-1 ${
            created.visibility === 'private'
              ? 'bg-gray-100 text-gray-600'
              : 'bg-eco-100 text-eco-700'
          }`}>
            {created.visibility === 'private'
              ? <><Lock size={13} /> Private challenge</>
              : <><Globe size={13} /> Public challenge</>
            }
          </span>

          {/* Private invite code */}
          {created.inviteCode && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                🔒 Share this invite code with friends
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-center text-xl font-mono font-bold text-amber-700 tracking-widest">
                  {created.inviteCode}
                </code>
                <button
                  onClick={() => copyInviteCode(created.inviteCode)}
                  className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {codeCopied ? <Check size={18} className="text-amber-700" /> : <Copy size={18} className="text-amber-600" />}
                </button>
              </div>
            </div>
          )}

          {/* Share options */}
          <div className="w-full">
            <p className="text-sm text-gray-500 mb-3">Share the challenge link</p>
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <ShareButton
                challengeId={created.challengeId}
                title={created.title}
                isPrivate={created.visibility === 'private'}
                inviteCode={created.inviteCode}
              />
              <button
                onClick={() => navigate(`/challenges/${created.challengeId}`)}
                className="btn-primary"
              >
                View Challenge →
              </button>
              <button
                onClick={() => { setCreated(null); setForm({ title: '', description: '', category: 'eco-friendly', difficulty: 'medium', daysUntilExpiry: 30, visibility: 'public' }); }}
                className="btn-secondary"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Create form ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PlusCircle className="text-eco-600" size={26} /> Create a Challenge
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up a public challenge for the community or a private one just for your friends.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

        {/* Visibility toggle — shown first */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'public',  icon: <Globe size={18} />,  label: 'Public',  desc: 'Anyone can find & join' },
              { value: 'private', icon: <Lock size={18} />,   label: 'Private', desc: 'Invite-only via code'   },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, visibility: opt.value }))}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                  form.visibility === opt.value
                    ? opt.value === 'private'
                      ? 'border-gray-400 bg-gray-50 text-gray-700'
                      : 'border-eco-500 bg-eco-50 text-eco-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.icon}
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-center opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
          {form.visibility === 'private' && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <Lock size={11} /> An invite code will be generated automatically after creation.
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Challenge Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="title" required maxLength={100}
            value={form.title} onChange={handleChange}
            className="input" placeholder="e.g. 30-Day No-Car Challenge"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description" required maxLength={500} rows={3}
            value={form.description} onChange={handleChange}
            className="input resize-none"
            placeholder="What does this challenge involve? What should participants do?"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-xs font-medium ${
                  form.category === cat.value
                    ? 'border-eco-500 bg-eco-50 text-eco-700'
                    : 'border-gray-200 text-gray-500 hover:border-eco-300'
                }`}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty — points locked per tier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty & Points
            <span className="ml-2 text-xs text-gray-400 font-normal">Points are fixed per difficulty</span>
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, difficulty: d.value }))}
                className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                  form.difficulty === d.value
                    ? d.color === 'green'  ? 'border-green-400 bg-green-50 text-green-800'
                    : d.color === 'yellow' ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                    :                        'border-red-400 bg-red-50 text-red-800'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="font-bold text-sm capitalize">{d.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  form.difficulty === d.value
                    ? d.color === 'green'  ? 'bg-green-200 text-green-700'
                    : d.color === 'yellow' ? 'bg-yellow-200 text-yellow-700'
                    :                        'bg-red-200 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  ⭐ {d.points} pts
                </span>
                <span className="text-xs opacity-60 text-center leading-tight">{d.desc.split('—')[1]?.trim()}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Selected: <strong>{form.difficulty}</strong> → <strong>{points} points</strong> awarded on completion
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Clock size={13} className="inline text-gray-400 mr-1" />
            Duration (days)
          </label>
          <input
            type="number" name="daysUntilExpiry" min={1} max={365}
            value={form.daysUntilExpiry} onChange={handleChange}
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <PlusCircle size={16} />
              {form.visibility === 'private' ? 'Create Private Challenge' : 'Create Public Challenge'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
