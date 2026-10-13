import React, { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, MessageCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareButton({ challengeId, title, isPrivate = false, inviteCode = null }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef        = useRef(null);

  const baseUrl  = window.location.origin;
  const shareUrl = isPrivate && inviteCode
    ? `${baseUrl}/challenges/${challengeId}?invite=${inviteCode}`
    : `${baseUrl}/challenges/${challengeId}`;

  const shareText = `Join me on EcoChallenges! 🌿 Take on "${title}" and earn points for sustainable action.`;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');

  const shareEmail = () =>
    window.open(
      `mailto:?subject=${encodeURIComponent('Join my EcoChallenge! 🌿')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
      '_blank'
    );

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `EcoChallenge: ${title}`, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={nativeShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600
                   bg-white border border-gray-200 hover:border-eco-400 hover:text-eco-700 transition-colors"
        title="Share challenge"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Share2 size={15} /> Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Use bottom-full on small screens to avoid overflow */}
          <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Share via</p>

            <button onClick={copyLink} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
              {copied ? <Check size={16} className="text-eco-600" /> : <Copy size={16} className="text-gray-400" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>

            <button onClick={shareWhatsApp} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-green-50 text-sm text-gray-700 transition-colors">
              <MessageCircle size={16} className="text-green-500" />
              Share on WhatsApp
            </button>

            <button onClick={shareEmail} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-sm text-gray-700 transition-colors">
              <Mail size={16} className="text-blue-400" />
              Share via Email
            </button>

            <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Link</p>
              <p className="text-xs text-gray-600 font-mono break-all">{shareUrl}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
