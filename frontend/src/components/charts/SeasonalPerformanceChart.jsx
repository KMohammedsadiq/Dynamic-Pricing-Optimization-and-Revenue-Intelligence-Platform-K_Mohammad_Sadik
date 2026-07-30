import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SEASON_CONFIG = {
  spring: { emoji: '🌸', color: '#ec4899', gradStart: '#ec4899', gradEnd: '#8b5cf6' },
  summer: { emoji: '☀️', color: '#f59e0b', gradStart: '#f59e0b', gradEnd: '#f97316' },
  autumn: { emoji: '🍂', color: '#f97316', gradStart: '#f97316', gradEnd: '#ef4444' },
  fall: { emoji: '🍁', color: '#f97316', gradStart: '#f97316', gradEnd: '#ef4444' },
  winter: { emoji: '❄️', color: '#38bdf8', gradStart: '#38bdf8', gradEnd: '#8b5cf6' },
};

const getSeason = (name = '') => {
  const lower = name.toLowerCase();
  for (const [key, cfg] of Object.entries(SEASON_CONFIG)) {
    if (lower.includes(key)) return cfg;
  }
  return { emoji: '📅', color: '#8b5cf6', gradStart: '#8b5cf6', gradEnd: '#38bdf8' };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const cfg = getSeason(label);
    return (
      <div
        className="p-4 rounded-2xl min-w-[180px]"
        style={{
          background: 'rgba(5,5,5,0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid rgba(255,255,255,0.15)`,
          boxShadow: `0 0 30px rgba(0,0,0,0.5), 0 0 15px ${cfg.color}30`,
        }}
      >
        <p className="font-black text-white text-xl mb-1">
          {cfg.emoji} <span className="capitalize">{label}</span>
        </p>
        <p className="font-bold text-base">
          {payload[0].payload._isEmpty ? (
            <span className="text-white/30 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"></div> Awaiting Data</span>
          ) : (
            <>
              <span className="text-white/50 text-sm font-semibold mr-2 uppercase tracking-wide">Revenue</span> 
              <span className="price-inline">${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </>
          )}
        </p>
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload }) => {
  const cfg = getSeason(payload.value);
  const label = payload.value
    ? payload.value.charAt(0).toUpperCase() + payload.value.slice(1)
    : '';
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={24} style={{ userSelect: 'none' }}>
        {cfg.emoji}
      </text>
      <text x={0} y={0} dy={34} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={13} fontWeight={700}>
        {label}
      </text>
    </g>
  );
};

const formatCompact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

export default function SeasonalPerformanceChart({ data }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-white/50">No data available</div>;

  const ALL_SEASONS = ['winter', 'spring', 'summer', 'autumn'];
  
  const fullData = ALL_SEASONS.map(s => {
    const existing = data.find(d => d.season && d.season.toLowerCase() === s);
    return existing ? { ...existing, season: s } : { season: s, total_revenue: 0, _isEmpty: true };
  });

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={fullData} margin={{ top: 20, right: 20, left: 10, bottom: 55 }}>
          <defs>
            <linearGradient id="seasonAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="season"
            tick={<CustomXAxisTick />}
            stroke="rgba(255,255,255,0.08)"
            height={60}
          />
          <YAxis
            tickFormatter={(v) => `$${formatCompact(v)}`}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            stroke="rgba(255,255,255,0.08)"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="total_revenue"
            stroke="#38bdf8"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#seasonAreaGrad)"
            dot={{ fill: '#38bdf8', r: 7, strokeWidth: 3, stroke: '#050505' }}
            activeDot={{ r: 10, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px #38bdf8)' } }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
