import React from 'react';

const STATUS_CONFIG = {
  'Stockout': {
    color: '#ef4444',
    bgRgb: '239,68,68',
    emoji: '🚨',
    desc: 'No stock – urgent restock needed!',
    textColor: '#ef4444',
  },
  'Low Stock': {
    color: '#f59e0b',
    bgRgb: '245,158,11',
    emoji: '⚠️',
    desc: 'Running low – restock soon',
    textColor: '#f59e0b',
  },
  'Normal Stock': {
    color: '#38bdf8',
    bgRgb: '56,189,248',
    emoji: '✅',
    desc: 'Healthy inventory level',
    textColor: '#38bdf8',
  },
  'High Stock': {
    color: '#10b981',
    bgRgb: '16,185,129',
    emoji: '📦',
    desc: 'Excellent stock levels',
    textColor: '#10b981',
  },
  'Low': {
    color: '#f59e0b',
    bgRgb: '245,158,11',
    emoji: '⚠️',
    desc: 'Running low – restock soon',
    textColor: '#f59e0b',
  },
  'Medium': {
    color: '#38bdf8',
    bgRgb: '56,189,248',
    emoji: '✅',
    desc: 'Healthy inventory level',
    textColor: '#38bdf8',
  },
  'High': {
    color: '#10b981',
    bgRgb: '16,185,129',
    emoji: '📦',
    desc: 'Excellent stock levels',
    textColor: '#10b981',
  },
};

const getCfg = (name = '') => {
  // Exact match first
  if (STATUS_CONFIG[name]) return STATUS_CONFIG[name];
  // Partial match
  const lower = name.toLowerCase();
  if (lower.includes('stockout') || lower.includes('(0)')) return STATUS_CONFIG['Stockout'];
  if (lower.includes('low')) return STATUS_CONFIG['Low Stock'];
  if (lower.includes('high')) return STATUS_CONFIG['High Stock'];
  return STATUS_CONFIG['Normal Stock'];
};

export default function InventoryOverviewChart({ data }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-white/50">No data available</div>;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full h-full flex flex-col gap-4 justify-center">
      {/* Warehouse Capacity Header */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 mb-2">
        <div>
          <h3 className="text-white/60 font-black tracking-widest text-xs uppercase mb-1">Warehouse Capacity</h3>
          <p className="text-white font-black text-2xl">71.4% <span className="text-white/30 text-sm">utilized</span></p>
        </div>
        <div className="relative w-14 h-14 flex items-center justify-center drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
            <path className="text-sky-400" strokeDasharray="71.4, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="absolute text-white font-bold text-[11px]">71%</span>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-5 rounded-full overflow-hidden flex gap-[2px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {data.map((item) => {
          const cfg = getCfg(item.name);
          const pct = total ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.name}
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }}
              title={`${item.name}: ${item.value.toLocaleString()}`}
            />
          );
        })}
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item) => {
          const cfg = getCfg(item.name);
          const pct = total ? ((item.value / total) * 100).toFixed(1) : '0';

          return (
            <div
              key={item.name}
              className="rounded-2xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-all duration-300 cursor-default"
              style={{
                background: `rgba(${cfg.bgRgb}, 0.08)`,
                border: `1px solid rgba(${cfg.bgRgb}, 0.25)`,
                boxShadow: `0 0 20px rgba(${cfg.bgRgb}, 0.08)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cfg.emoji}</span>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: `rgba(${cfg.bgRgb}, 0.2)`, color: cfg.color, border: `1px solid rgba(${cfg.bgRgb}, 0.3)` }}
                >
                  {pct}%
                </span>
              </div>
              <div>
                <p className="text-white font-black text-2xl leading-tight">
                  {item.value.toLocaleString()} <span className="text-sm text-white/50 font-medium">Products</span>
                </p>
                <p className="font-bold text-sm mt-0.5" style={{ color: cfg.color }}>{item.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{cfg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
