import React, { useEffect, useState } from 'react';
import { getVouchers, redeemVoucher, getRedeemedVouchers } from '../api/client';
import { Star, Gift, CheckCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const categoryColors = {
  shopping:      'bg-blue-100 text-blue-700',
  food:          'bg-orange-100 text-orange-700',
  beauty:        'bg-pink-100 text-pink-700',
  sports:        'bg-green-100 text-green-700',
  entertainment: 'bg-purple-100 text-purple-700',
  travel:        'bg-cyan-100 text-cyan-700',
};

function VoucherCard({ voucher, userPoints, onRedeem }) {
  const canAfford = userPoints >= voucher.pointsCost;
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!canAfford || loading) return;
    setLoading(true);
    try {
      await onRedeem(voucher.voucherId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card flex flex-col gap-3 ${!canAfford ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{voucher.emoji}</span>
          <div>
            <p className="font-semibold text-gray-900">{voucher.brand}</p>
            <p className="text-sm text-gray-500">{voucher.discount}</p>
          </div>
        </div>
        <span className={`badge ${categoryColors[voucher.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {voucher.category}
        </span>
      </div>

      {/* Cost */}
      <div className="flex items-center gap-1.5 text-sm">
        <Star size={14} className="text-yellow-500 fill-yellow-400" />
        <span className={`font-semibold ${canAfford ? 'text-eco-700' : 'text-red-500'}`}>
          {voucher.pointsCost} points
        </span>
        {!canAfford && (
          <span className="text-xs text-red-400 ml-1">
            (need {voucher.pointsCost - userPoints} more)
          </span>
        )}
      </div>

      {/* Redeem button */}
      <button
        onClick={handleRedeem}
        disabled={!canAfford || loading}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          canAfford
            ? 'bg-eco-600 hover:bg-eco-700 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Redeeming…
          </span>
        ) : canAfford ? 'Redeem Now' : 'Not Enough Points'}
      </button>
    </div>
  );
}

function RedeemedCard({ item }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(item.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card bg-eco-50 border-eco-200 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CheckCircle size={20} className="text-eco-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-gray-900">{item.brand} — {item.discount}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Spent {item.pointsSpent} pts · {new Date(item.redeemedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-white border border-eco-200 px-2 py-1 rounded font-mono text-eco-800">
          {item.code}
        </code>
        <button onClick={copyCode} className="p-1.5 hover:bg-eco-100 rounded transition-colors" title="Copy code">
          {copied
            ? <CheckCircle size={15} className="text-eco-600" />
            : <Copy size={15} className="text-gray-400" />
          }
        </button>
      </div>
    </div>
  );
}

export default function Vouchers() {
  const [vouchers,  setVouchers]  = useState([]);
  const [redeemed,  setRedeemed]  = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('available'); // 'available' | 'redeemed'
  const [filter,    setFilter]    = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([getVouchers(), getRedeemedVouchers()]);
      setVouchers(vRes.data.vouchers ?? []);
      setUserPoints(vRes.data.userPoints ?? 0);
      setRedeemed(rRes.data.redeemed ?? []);
    } catch {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async (voucherId) => {
    try {
      const { data } = await redeemVoucher(voucherId);
      toast.success(`🎉 Redeemed! Your code: ${data.code}`);
      setUserPoints(data.remainingPoints);
      setRedeemed((prev) => [data, ...prev]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    }
  };

  const categories = ['all', ...new Set(vouchers.map((v) => v.category))];
  const filtered = filter === 'all' ? vouchers : vouchers.filter((v) => v.category === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="text-eco-600" size={26} /> Gift Vouchers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Spend your eco points on real rewards</p>
        </div>

        {/* Points balance */}
        <div className="card flex items-center gap-3 px-5 py-3 bg-eco-50 border-eco-200">
          <Star size={20} className="text-yellow-500 fill-yellow-400" />
          <div>
            <p className="text-2xl font-bold text-eco-800">{userPoints}</p>
            <p className="text-xs text-eco-600">available points</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {['available', 'redeemed'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t} {t === 'redeemed' && redeemed.length > 0 && (
              <span className="ml-1 bg-eco-100 text-eco-700 text-xs px-1.5 py-0.5 rounded-full">
                {redeemed.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Available vouchers */}
      {tab === 'available' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === cat
                    ? 'bg-eco-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-eco-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-40 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((v) => (
                <VoucherCard
                  key={v.voucherId}
                  voucher={v}
                  userPoints={userPoints}
                  onRedeem={handleRedeem}
                />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎁</p>
              <p>No vouchers in this category</p>
            </div>
          )}
        </>
      )}

      {/* Redeemed vouchers */}
      {tab === 'redeemed' && (
        <div className="flex flex-col gap-3">
          {redeemed.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎫</p>
              <p className="font-medium">No vouchers redeemed yet</p>
              <p className="text-sm mt-1">Complete challenges to earn points and redeem rewards!</p>
            </div>
          ) : (
            redeemed.map((r) => <RedeemedCard key={r.redemptionId} item={r} />)
          )}
        </div>
      )}
    </div>
  );
}
