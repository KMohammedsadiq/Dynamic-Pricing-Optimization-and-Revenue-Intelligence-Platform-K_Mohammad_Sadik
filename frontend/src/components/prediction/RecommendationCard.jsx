import React from 'react';
import ReasonList from './ReasonList';

const formatINR = (val) => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
};

const CONFIG = {
  'Increase Price':          { icon: '↑', label: 'Increase Price',         border: 'border-black',    bg: 'bg-black',    text: 'text-white', badge: 'bg-white text-black' },
  'Reduce Price':            { icon: '↓', label: 'Reduce Price',           border: 'border-gray-300', bg: 'bg-gray-800', text: 'text-white', badge: 'bg-white text-gray-800' },
  'Maintain Current Pricing':{ icon: '=', label: 'Maintain Pricing',       border: 'border-gray-200', bg: 'bg-gray-100', text: 'text-gray-900', badge: 'bg-black text-white' },
  'Trust ML Prediction':     { icon: '◆', label: 'Trust ML Prediction',    border: 'border-gray-200', bg: 'bg-gray-50',  text: 'text-gray-900', badge: 'bg-black text-white' },
};
const DEFAULT = CONFIG['Trust ML Prediction'];

const RecommendationCard = ({ recommendation, priceDifference, currency, reasons }) => {
  const cfg = CONFIG[recommendation] || DEFAULT;

  return (
    <div className={`md:col-span-2 rounded-2xl border-2 overflow-hidden shadow-sm ${cfg.border}`}>
      {/* Colored header */}
      <div className={`${cfg.bg} px-6 py-5 flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${cfg.text} leading-none`}>{cfg.icon}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${cfg.text}`}>Strategy</p>
            <p className={`text-lg font-extrabold ${cfg.text}`}>{cfg.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {priceDifference !== null && priceDifference !== undefined && (
            <div className="text-right">
              <p className={`text-xs opacity-60 ${cfg.text}`}>Gap vs Historical</p>
              <p className={`text-xl font-extrabold ${cfg.text}`}>
                {priceDifference >= 0 ? '+' : ''}{formatINR(priceDifference)}
              </p>
            </div>
          )}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${cfg.badge}`}>
            {recommendation || 'Analysis'}
          </span>
        </div>
      </div>

      {/* Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="bg-white px-6 py-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Supporting Insights</p>
          <ReasonList reasons={reasons} />
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
