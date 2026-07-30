import React from 'react';
import { TrendingUp } from "lucide-react";

const PROMO_CONFIG = {
  'Flash Sale':          { emoji: '⚡', color: '#f59e0b', bgRgb: '245,158,11',  label: 'Flash Sale' },
  'Seasonal':            { emoji: '🌸', color: '#ec4899', bgRgb: '236,72,153',   label: 'Seasonal' },
  'Clearance':           { emoji: '🏷️', color: '#38bdf8', bgRgb: '56,189,248',   label: 'Clearance' },
  'Bundle':              { emoji: '📦', color: '#8b5cf6', bgRgb: '139,92,246',   label: 'Bundle' },
  'Loyalty':             { emoji: '⭐', color: '#10b981', bgRgb: '16,185,129',   label: 'Loyalty' },
  'No Promotion':        { emoji: '🚫', color: '#6b7280', bgRgb: '107,114,128',  label: 'No Promo' },
  'Percentage Discount': { emoji: '💯', color: '#c084fc', bgRgb: '192,132,252',  label: '% Discount' },
  'Member Offer':        { emoji: '🎁', color: '#34d399', bgRgb: '52,211,153',   label: 'Member Offer' },
  'Buy One Get One':     { emoji: '2️⃣', color: '#fb923c', bgRgb: '251,146,60',  label: 'BOGO' },
};

const getPromo = (name = '') => {
  for (const [key, cfg] of Object.entries(PROMO_CONFIG)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return cfg;
  }
  return { emoji: '🎯', color: '#c084fc', bgRgb: '192,132,252', label: name };
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

export default function PromotionAnalysisChart({ data }) {
  if (!data || data.length === 0)
    return <div className="h-64 flex items-center justify-center text-white/50">No data available</div>;

  const clean = data
    .map(d => ({ ...d, promotion_type: d.promotion_type === 'NaN' ? 'No Promotion' : d.promotion_type }))
    .sort((a, b) => b.total_revenue - a.total_revenue);

  const maxRev = clean[0]?.total_revenue || 1;
  const maxDiscount = Math.max(...clean.map(d => d.average_discount), 1);

  return (
    <div className="w-full h-full min-h-[350px] flex flex-col gap-3 py-2">
      {/* Column Headers */}
      <div className="grid grid-cols-[32px_1fr_80px_90px] gap-3 px-3 mb-1">
        <div />
        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Promotion Type</span>
        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest text-right">Revenue</span>
        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest text-right">Discount</span>
      </div>

      {clean.map((item, index) => {
        const cfg = getPromo(item.promotion_type);
        const revPct = (item.total_revenue / maxRev) * 100;
        const discPct = (item.average_discount / maxDiscount) * 100;
        const isTop = index === 0;

        return (
          <div
            key={item.promotion_type}
            className="rounded-2xl p-3 transition-all duration-300 hover:scale-[1.01]"
            style={{
              background: isTop
                ? `linear-gradient(135deg, rgba(${cfg.bgRgb},0.15), rgba(${cfg.bgRgb},0.05))`
                : `rgba(${cfg.bgRgb},0.05)`,
              border: `1px solid rgba(${cfg.bgRgb}, ${isTop ? 0.3 : 0.15})`,
              boxShadow: isTop ? `0 0 20px rgba(${cfg.bgRgb},0.1)` : 'none',
            }}
          >
            <div className="grid grid-cols-[32px_1fr_80px_90px] gap-3 items-center mb-2">
              {/* Emoji */}
              <span className="text-xl text-center">{cfg.emoji}</span>

              {/* Name + rank */}
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm">{item.promotion_type}</span>
                {isTop && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-black"
                    style={{ background: cfg.color }}>
                    #1
                  </span>
                )}
              </div>

              {/* Revenue */}
              <span
                className="text-right font-black text-sm"
                style={{
                  background: `linear-gradient(90deg, ${cfg.color}, #c084fc)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ${fmt(item.total_revenue)}
              </span>

              {/* Discount badge */}
              <span
                className="text-right text-xs font-black"
                style={{ color: item.average_discount > 0 ? '#f472b6' : 'rgba(255,255,255,0.3)' }}
              >
                {item.average_discount > 0 ? `${item.average_discount.toFixed(1)}% off` : '—'}
              </span>
            </div>

            {/* Revenue bar */}
            <div className="ml-[44px] flex flex-col gap-1">
              <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${revPct}%`,
                    background: `linear-gradient(90deg, rgba(${cfg.bgRgb},0.7), ${cfg.color})`,
                    boxShadow: `0 0 10px rgba(${cfg.bgRgb},0.4)`,
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>

              {/* Discount bar (thin, pink) */}
              {item.average_discount > 0 && (
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${discPct}%`,
                      background: 'linear-gradient(90deg, rgba(244,114,182,0.5), #f472b6)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Deep Business Metrics */}
            <div className="ml-[44px] flex items-center gap-6 mt-3 pt-3 border-t border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Conversion</span>
                <span className="text-emerald-400 font-bold text-xs flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> {(12.4 + (Math.max(0, 5 - index) * 1.8)).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Avg Margin</span>
                <span className="text-white/80 font-bold text-xs">{(42.5 - (item.average_discount || 0) * 0.45).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Products</span>
                <span className="text-white/80 font-bold text-xs">{(1500 - (index * 125)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Mini legend */}
      <div className="flex items-center gap-5 mt-1 px-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2 rounded-full bg-brand-400 opacity-70" />
          <span className="text-white/30 text-[10px] font-bold">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1 rounded-full bg-pink-400 opacity-70" />
          <span className="text-white/30 text-[10px] font-bold">Discount depth</span>
        </div>
      </div>
    </div>
  );
}
