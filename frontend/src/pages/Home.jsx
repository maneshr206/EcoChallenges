import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Zap, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: <Leaf className="text-eco-500" size={28} />,
    title: 'Real Challenges',
    desc: 'Take on daily and weekly eco challenges curated by the community.',
  },
  {
    icon: <Zap className="text-yellow-500" size={28} />,
    title: 'Earn Points',
    desc: 'Submit proof, get verified, earn points and climb the leaderboard.',
  },
  {
    icon: <Users className="text-blue-500" size={28} />,
    title: 'Community',
    desc: 'See how others are making a difference and get inspired.',
  },
  {
    icon: <ShieldCheck className="text-green-600" size={28} />,
    title: 'AI Moderation',
    desc: 'AWS Comprehend & Rekognition keep the feed safe and on-topic.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-b from-eco-50 to-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="text-7xl block mb-6">🌿</span>
        <h1 className="text-5xl font-bold text-eco-800 mb-4">
          Make Every Action Count
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Join EcoChallenges and turn everyday sustainable habits into a shared,
          rewarding community experience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Link to="/feed" className="btn-primary text-base px-8 py-3">
              Go to Feed →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary text-base px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-3">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <div key={f.title} className="card text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Stats strip */}
      <section className="bg-eco-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { num: '500+', label: 'Active Challenges' },
            { num: '12K+', label: 'Eco Warriors' },
            { num: '1M+', label: 'Points Earned' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold">{s.num}</p>
              <p className="text-eco-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
