import React from 'react';

// Comprehensive country code → flag/color mapping
const REGION_MAP = {
  'IN': { flag: '🇮🇳', name: 'India',          color: '#f59e0b', rgb: '245,158,11' },
  'US': { flag: '🇺🇸', name: 'USA',            color: '#38bdf8', rgb: '56,189,248' },
  'UK': { flag: '🇬🇧', name: 'United Kingdom',  color: '#8b5cf6', rgb: '139,92,246' },
  'GB': { flag: '🇬🇧', name: 'United Kingdom',  color: '#8b5cf6', rgb: '139,92,246' },
  'CA': { flag: '🇨🇦', name: 'Canada',          color: '#ec4899', rgb: '236,72,153' },
  'AU': { flag: '🇦🇺', name: 'Australia',       color: '#10b981', rgb: '16,185,129' },
  'DE': { flag: '🇩🇪', name: 'Germany',         color: '#f43f5e', rgb: '244,63,94'  },
  'FR': { flag: '🇫🇷', name: 'France',          color: '#06b6d4', rgb: '6,182,212'  },
  'JP': { flag: '🇯🇵', name: 'Japan',           color: '#c084fc', rgb: '192,132,252'},
  'BR': { flag: '🇧🇷', name: 'Brazil',          color: '#84cc16', rgb: '132,204,22' },
  'CN': { flag: '🇨🇳', name: 'China',           color: '#fb923c', rgb: '251,146,60' },
  'MX': { flag: '🇲🇽', name: 'Mexico',          color: '#34d399', rgb: '52,211,153' },
  'IT': { flag: '🇮🇹', name: 'Italy',           color: '#a78bfa', rgb: '167,139,250'},
  'ES': { flag: '🇪🇸', name: 'Spain',           color: '#fbbf24', rgb: '251,191,36' },
  'KR': { flag: '🇰🇷', name: 'South Korea',     color: '#f472b6', rgb: '244,114,182'},
};

const FALLBACK_COLORS = [
  { color: '#38bdf8', rgb: '56,189,248' },
  { color: '#8b5cf6', rgb: '139,92,246' },
  { color: '#ec4899', rgb: '236,72,153' },
  { color: '#f59e0b', rgb: '245,158,11' },
  { color: '#10b981', rgb: '16,185,129' },
  { color: '#f43f5e', rgb: '244,63,94'  },
];

const getRegion = (code = '', index = 0) => {
  const upper = code.toUpperCase().trim();
  if (REGION_MAP[upper]) return { ...REGION_MAP[upper], displayCode: upper };
  const fb = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return { flag: '🌐', name: code, displayCode: code, ...fb };
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

const RANK_ICON = ['🥇','🥈','🥉'];

export default function RegionalSalesChart({ data }) {
  if (!data || data.length === 0)
    return <div className="h-64 flex items-center justify-center text-white/50">No data available</div>;

  const sorted = [...data].sort((a, b) => b.total_revenue - a.total_revenue);
  const maxRev = sorted[0]?.total_revenue || 1;
  const totalRev = sorted.reduce((s, d) => s + d.total_revenue, 0);

  return (
    <div className="w-full h-full min-h-[350px] flex flex-col gap-3 py-2">
      {sorted.map((item, index) => {
        const cfg = getRegion(item.region, index);
        const pct = (item.total_revenue / maxRev) * 100;
        const sharePct = ((item.total_revenue / totalRev) * 100).toFixed(1);
        const rankIcon = index < 3 ? RANK_ICON[index] : null;

        return (
          <div key={item.region} className="group flex items-center gap-3 hover:translate-x-1 transition-transform duration-200">
            {/* Rank */}
            <div className="w-7 flex-shrink-0 text-center">
              {rankIcon
                ? <span className="text-xl">{rankIcon}</span>
                : <span className="text-white/20 font-black text-sm">#{index+1}</span>
              }
            </div>

            {/* Flag */}
            <span className="text-3xl flex-shrink-0 leading-none">{cfg.flag}</span>

            {/* Country Name */}
            <div className="w-24 md:w-32 flex-shrink-0">
              <span className="text-sm font-black" style={{ color: cfg.color }}>{cfg.name}</span>
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className="h-6 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-6 rounded-full flex items-center pl-3"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, rgba(${cfg.rgb},0.5), ${cfg.color})`,
                    boxShadow: `0 0 16px rgba(${cfg.rgb},0.35)`,
                    transition: 'width 0.8s ease',
                    minWidth: '40px',
                  }}
                >
                  {pct > 30 && (
                    <span className="text-white/80 font-bold text-xs">{sharePct}%</span>
                  )}
                </div>
                {pct <= 30 && (
                  <span
                    className="absolute left-[calc(${pct}%+8px)] top-1/2 -translate-y-1/2 text-white/50 font-bold text-xs"
                    style={{ left: `calc(${pct}% + 8px)` }}
                  >{sharePct}%</span>
                )}
              </div>
            </div>

            {/* Revenue */}
            <span
              className="text-right font-black text-sm w-16 flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, ${cfg.color}, #c084fc)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ${fmt(item.total_revenue)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
