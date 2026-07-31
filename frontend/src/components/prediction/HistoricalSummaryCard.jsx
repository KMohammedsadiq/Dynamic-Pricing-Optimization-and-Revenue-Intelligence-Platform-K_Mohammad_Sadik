import React from 'react';

const StatRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>{value}</span>
  </div>
);

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(value);
};

const HistoricalSummaryCard = ({ summary, currency }) => {
  if (!summary) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center h-full">
        <p className="text-sm text-gray-500 italic">No historical data available for comparison.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Historical Market Context</h3>
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {summary.matching_records || 0} Matches
        </span>
      </div>
      
      <div className="space-y-1 mt-4">
        <StatRow label="Average Price" value={formatCurrency(summary.average_price, currency)} highlight />
        <StatRow label="Highest Price" value={formatCurrency(summary.highest_price, currency)} />
        <StatRow label="Lowest Price" value={formatCurrency(summary.lowest_price, currency)} />
        <StatRow label="Median Price" value={formatCurrency(summary.median_price || summary.average_price, currency)} />
      </div>
    </div>
  );
};

export default HistoricalSummaryCard;
