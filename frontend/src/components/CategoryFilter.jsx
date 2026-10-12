import React from 'react';

const CATEGORIES = [
  { value: 'all',            label: 'All',            emoji: '🌍' },
  { value: 'healthy-living', label: 'Healthy Living', emoji: '🥗' },
  { value: 'eco-friendly',   label: 'Eco-Friendly',   emoji: '♻️' },
  { value: 'community',      label: 'Community',      emoji: '🤝' },
  { value: 'energy',         label: 'Energy',         emoji: '⚡' },
  { value: 'water',          label: 'Water',          emoji: '💧' },
  { value: 'food',           label: 'Food',           emoji: '🍃' },
];

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat.value
              ? 'bg-eco-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-eco-300 hover:text-eco-700'
          }`}
        >
          <span>{cat.emoji}</span> {cat.label}
        </button>
      ))}
    </div>
  );
}
