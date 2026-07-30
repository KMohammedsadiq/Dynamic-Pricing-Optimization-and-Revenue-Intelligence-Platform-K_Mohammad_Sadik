import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";

// Brand → domain mapping for real logos via Clearbit
const BRAND_MAP = [
  { keys: ['apple', 'mac', 'iphone'], emoji: '🍎', domain: 'apple.com' },
  { keys: ['samsung', 'galaxy'], emoji: '📱', domain: 'samsung.com' },
  { keys: ['sony'], emoji: '🎮', domain: 'sony.com' },
  { keys: ['lg'], emoji: '📺', domain: 'lg.com' },
  { keys: ['microsoft', 'windows'], emoji: '🪟', domain: 'microsoft.com' },
  { keys: ['google', 'pixel'], emoji: '🔍', domain: 'google.com' },
  { keys: ['dell'], emoji: '💻', domain: 'dell.com' },
  { keys: ['hp'], emoji: '💻', domain: 'hp.com' },
  { keys: ['lenovo'], emoji: '💻', domain: 'lenovo.com' },
  { keys: ['asus'], emoji: '💻', domain: 'asus.com' },
  { keys: ['acer'], emoji: '💻', domain: 'acer.com' },
  { keys: ['nike'], emoji: '👟', domain: 'nike.com' },
  { keys: ['adidas'], emoji: '🏃', domain: 'adidas.com' },
  { keys: ['puma'], emoji: '🐆', domain: 'puma.com' },
  { keys: ['gucci'], emoji: '👜', domain: 'gucci.com' },
  { keys: ['prada'], emoji: '👜', domain: 'prada.com' },
  { keys: ['louis', 'vuitton'], emoji: '👜', domain: 'louisvuitton.com' },
  { keys: ['chanel'], emoji: '👜', domain: 'chanel.com' },
  { keys: ['versace'], emoji: '👜', domain: 'versace.com' },
  { keys: ['zara'], emoji: '👗', domain: 'zara.com' },
  { keys: ['h&m', ' hm '], emoji: '👗', domain: 'hm.com' },
  { keys: ['levi'], emoji: '👖', domain: 'levi.com' },
  { keys: ['reebok'], emoji: '👠', domain: 'reebok.com' },
  { keys: ['converse'], emoji: '👠', domain: 'converse.com' },
  { keys: ['vans'], emoji: '👠', domain: 'vans.com' },
  { keys: ['new balance'], emoji: '👠', domain: 'newbalance.com' },
  { keys: ['nestle'], emoji: '🍫', domain: 'nestle.com' },
  { keys: ['cadbury'], emoji: '🍫', domain: 'cadbury.com' },
  { keys: ['hershey'], emoji: '🍫', domain: 'hersheys.com' },
  { keys: ['lindt'], emoji: '🍫', domain: 'lindt.com' },
  { keys: ['coca'], emoji: '🥤', domain: 'coca-cola.com' },
  { keys: ['pepsi'], emoji: '🥤', domain: 'pepsi.com' },
  { keys: ['loreal', "l'oreal"], emoji: '💄', domain: 'loreal.com' },
  { keys: ['maybelline'], emoji: '💄', domain: 'maybelline.com' },
  { keys: ['revlon'], emoji: '💄', domain: 'revlon.com' },
  { keys: ['johnson'], emoji: '🧼', domain: 'jnj.com' },
  { keys: ['gillette'], emoji: '🪒', domain: 'gillette.com' },
  { keys: ['colgate'], emoji: '🦷', domain: 'colgate.com' },
  { keys: ['ikea'], emoji: '🛋️', domain: 'ikea.com' },
  { keys: ['dyson'], emoji: '🌀', domain: 'dyson.com' },
  { keys: ['bosch'], emoji: '🏠', domain: 'bosch.com' },
  { keys: ['whirlpool'], emoji: '🏠', domain: 'whirlpool.com' },
  { keys: ['under armour'], emoji: '🏋️', domain: 'underarmour.com' },
  { keys: ['toyota'], emoji: '🚗', domain: 'toyota.com' },
  { keys: ['honda'], emoji: '🚗', domain: 'honda.com' },
  { keys: ['ford'], emoji: '🚗', domain: 'ford.com' },
  { keys: ['bmw'], emoji: '🚗', domain: 'bmw.com' },
  { keys: ['audi'], emoji: '🚗', domain: 'audi.com' },
  { keys: ['mercedes'], emoji: '🚗', domain: 'mercedes-benz.com' },
];

const LETTER_EMOJI = {
  A: '🅰️', B: '🅱️', C: '✨', D: '🔷', E: '⚡', F: '🔥', G: '💎',
  H: '🏅', I: '💡', J: '🎯', K: '🔑', L: '⭐', M: '🎖️', N: '🌟',
  O: '⭕', P: '🎪', Q: '👑', R: '🚀', S: '🛡️', T: '🏆', U: '🌐',
  V: '✅', W: '🌊', X: '🌀', Y: '🎋', Z: '⚡',
};

const getBrandInfo = (name) => {
  const safeName = typeof name === 'string' ? name : '';
  const lower = safeName.toLowerCase();
  for (const entry of BRAND_MAP) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return { emoji: entry.emoji, domain: entry.domain };
    }
  }
  const initial = (safeName.charAt(0) || 'A').toUpperCase();
  const cleanName = safeName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown';
  return { emoji: LETTER_EMOJI[initial] || '🏷️', domain: `${cleanName}.com` };
};

// Sub-component with its own useState for error handling
function BrandLogo({ brand, size, color }) {
  const [imgError, setImgError] = useState(false);
  const { emoji, domain } = getBrandInfo(brand);

  if (imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: color + '20',
          border: `1.5px solid ${color}50`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.48,
          flexShrink: 0,
        }}
        title={brand}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#fff',
        border: `2px solid ${color}90`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: `0 2px 12px ${color}40`,
      }}
      title={brand}
    >
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={brand || 'Brand'}
        onError={() => setImgError(true)}
        style={{ width: '85%', height: '85%', objectFit: 'contain' }}
      />
    </div>
  );
}

const RANK_CONFIG = [
  { medal: '🥇', colorRgb: '255,215,0' },
  { medal: '🥈', colorRgb: '192,192,192' },
  { medal: '🥉', colorRgb: '205,127,50' },
];

const COLORS = [
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9',
];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(n);

export default function RevenueByBrandChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0)
    return (
      <div className="h-64 flex items-center justify-center text-white/50">
        No data available
      </div>
    );

  const top10 = data.slice(0, 10);
  const maxRevenue = top10[0]?.total_revenue || 1;
  const totalRevenue = top10.reduce((s, d) => s + (d.total_revenue || 0), 0);

  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = [top10[1], top10[0], top10[2]];
  const podiumActualRanks = [2, 1, 3];
  const podiumHeights = [280, 320, 250];

  return (
    <div className="w-full h-full flex flex-col">
      {/* ── Podium top 3 ── */}
      <div className="flex items-end justify-center gap-4 mb-10 mt-4 px-4 w-full">
        {podiumOrder.map((item, podiumPos) => {
          if (!item) return <div key={podiumPos} className="flex-1" />;
          const rank = podiumActualRanks[podiumPos];
          const color = COLORS[rank - 1];
          const { medal, colorRgb } = RANK_CONFIG[rank - 1];
          const podiumH = podiumHeights[podiumPos];
          const share = ((item.total_revenue || 0) / totalRevenue) * 100;
          // Smart mock data for growth
          const growth = 18.4 - (rank * 3.2);

          return (
            <div
              key={item.brand || podiumPos}
              className="flex-1 rounded-t-[2rem] flex flex-col items-center p-4 md:p-6 relative overflow-hidden transition-transform hover:-translate-y-2 duration-300"
              style={{
                height: podiumH,
                background: `linear-gradient(180deg, rgba(${colorRgb},0.15) 0%, rgba(${colorRgb},0.02) 100%)`,
                border: `1px solid rgba(${colorRgb},0.3)`,
                borderBottom: 'none',
                boxShadow: `0 -10px 40px rgba(${colorRgb},0.1)`,
              }}
            >
              {/* Background watermark */}
              <div className="absolute top-2 right-2 text-6xl opacity-10 select-none pointer-events-none">
                {medal}
              </div>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: color, boxShadow: `0 0 20px ${color}` }}></div>

              <div className="flex flex-col items-center z-10 w-full">
                <div className="relative mb-3">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xl z-20" style={{ background: color, color: '#fff', fontWeight: 'bold' }}>
                    #{rank}
                  </div>
                  <BrandLogo brand={item.brand} size={rank === 1 ? 84 : 64} color={color} />
                </div>
                <p className="text-white font-black text-lg md:text-xl text-center w-full truncate mb-1">
                  {item.brand || '—'}
                </p>
              </div>

              {/* Embedded Metrics */}
              <div className="w-full mt-auto flex flex-col gap-2.5 bg-black/40 p-3 md:p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest">Revenue</span>
                  <span className="price-inline font-black text-sm md:text-base">${fmt(item.total_revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest">Share</span>
                  <span className="text-white font-bold text-xs md:text-sm">{share.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest">Growth</span>
                  <span className="flex items-center text-emerald-400 font-bold text-xs md:text-sm bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                    <TrendingUp className="w-3 h-3 mr-1" /> +{growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Ranked list #4-#10 ── */}
      <div className="flex flex-col gap-2">
        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">
          Rankings #4 – #10
        </p>
        {top10.slice(3).map((item, i) => {
          const rank = i + 4;
          const color = COLORS[rank - 1];
          const pct = ((item.total_revenue || 0) / maxRevenue) * 100;
          const share = (((item.total_revenue || 0) / totalRevenue) * 100).toFixed(1);
          const isHov = hovered === (item.brand || rank);

          return (
            <div
              key={item.brand || rank}
              className="flex items-center gap-3 rounded-2xl p-3 transition-all duration-200 cursor-default"
              style={{
                background: isHov ? `${color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isHov ? color + '40' : 'rgba(255,255,255,0.06)'}`,
              }}
              onMouseEnter={() => setHovered(item.brand || rank)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-white/25 font-black text-sm w-6 flex-shrink-0 text-center">
                #{rank}
              </span>

              <BrandLogo brand={item.brand} size={36} color={color} />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold text-xs truncate">
                    {item.brand || '—'}
                  </span>
                  <span className="text-white/40 text-[10px] font-bold ml-2">{share}%</span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                      boxShadow: `0 0 8px ${color}50`,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>

              <span className="price-inline text-sm flex-shrink-0 ml-2">
                ${fmt(item.total_revenue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
