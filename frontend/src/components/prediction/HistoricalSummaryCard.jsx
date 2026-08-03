import React from 'react';

const formatINR = (val) => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
};

const Row = ({ label, value, accent }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-bold ${accent ? 'text-black' : 'text-gray-700'}`}>{value}</span>
  </div>
);

const HistoricalSummaryCard = ({ summary, currency }) => {
  if (!summary) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center">
      <p className="text-sm text-gray-400 italic">No historical data available.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historical Market</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">Comparable Transactions</p>
        </div>
        <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
          {summary.matching_records} matches
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3">
        <Row label="Average Price" value={formatINR(summary.average_price)} accent />
        <Row label="Highest Price" value={formatINR(summary.highest_price)} />
        <Row label="Lowest Price"  value={formatINR(summary.lowest_price)} />
        <Row label="Median Price"  value={formatINR(summary.median_price || summary.average_price)} />
      </div>

      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400">All values in native {currency || 'INR'} · Model trained on INR dataset</p>
      </div>
    </div>
  );
};

export default HistoricalSummaryCard;
