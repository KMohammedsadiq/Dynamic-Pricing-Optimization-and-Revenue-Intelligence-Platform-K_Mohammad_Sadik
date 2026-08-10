import React, { useState } from 'react';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

/* ── Effect badge ── */
const EFFECT_META = {
  positive:  { label: 'Increase',  cls: 'text-green-400'  },
  negative:  { label: 'Decrease',  cls: 'text-red-400'    },
  neutral:   { label: 'Neutral',   cls: 'text-gray-400'   },
  reference: { label: 'Reference', cls: 'text-blue-400'   },
};

/* ── Section heading ── */
const SectionHead = ({ children }) => (
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-5 py-3 border-b border-gray-800 bg-gray-900">
    {children}
  </p>
);

/* ── PredictionResultCard ── */
const PredictionResultCard = ({ data }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!data) return null;

  const diff    = (data.optimal_price || 0) - (data.current_price || 0);
  const pct     = data.current_price ? (diff / data.current_price) * 100 : 0;
  const isUp    = diff > 0;
  const isDown  = diff < 0;

  const factors = data.pricing_factors || [];

  const recColor =
    data.recommendation === 'Increase Price' ? 'text-green-400 border-green-800 bg-green-950/40' :
    data.recommendation === 'Decrease Price' ? 'text-red-400 border-red-800 bg-red-950/40'       :
                                               'text-blue-400 border-blue-800 bg-blue-950/40';

  /* group for summary chips */
  const pos  = factors.filter(f => f.effect === 'positive').map(f => f.feature);
  const neg  = factors.filter(f => f.effect === 'negative').map(f => f.feature);
  const neut = factors.filter(f => f.effect === 'neutral' || f.effect === 'reference').map(f => f.feature);

  // Extract cost price from factors
  const costPriceFactor = factors.find(f => f.feature === 'Cost Price');
  let costPriceRaw = 0;
  if (costPriceFactor && typeof costPriceFactor.value === 'string') {
    costPriceRaw = parseInt(costPriceFactor.value.replace(/[^0-9.-]+/g, ""));
  } else if (costPriceFactor) {
    costPriceRaw = Number(costPriceFactor.value) || 0;
  }
  const minAllowedPrice = costPriceRaw * 1.10;

  // Extract inventory level from factors to compute total cost & revenue projections
  const inventoryFactor = factors.find(f => f.feature === 'Inventory');
  let inventoryRaw = 0;
  if (inventoryFactor && typeof inventoryFactor.value === 'string') {
    inventoryRaw = parseInt(inventoryFactor.value.replace(/[^0-9.-]+/g, ""));
  } else if (inventoryFactor) {
    inventoryRaw = Number(inventoryFactor.value) || 0;
  }
  const calculatedInventoryCost = costPriceRaw * inventoryRaw;
  const projectedCurrentRevenue = (data.current_price || 0) * inventoryRaw;
  const projectedExpectedRevenue = (data.optimal_price || 0) * inventoryRaw;
  const projectedGain = projectedExpectedRevenue - projectedCurrentRevenue;

  return (
    <div className="divide-y divide-gray-800">

      {/* ── 1. Prediction Summary ── */}
      <div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Prediction Summary</p>
          {data.product_name && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                data.is_new_product ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {data.is_new_product ? 'New Product' : 'Existing Product'}
              </span>
              <span className="text-xs font-medium text-gray-300">{data.product_name}</span>
            </div>
          )}
        </div>
        <div className="px-5 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Current Price</p>
                <p className="text-2xl font-medium text-gray-300">{formatINR(data.current_price)}</p>
                <p className="text-xs text-gray-500 mt-1">Primary market baseline</p>
              </div>
              
              <div className="hidden md:block text-gray-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>

              <div>
                <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-1">Dynamic Price</p>
                <p className="text-3xl font-bold text-blue-400">{formatINR(data.optimal_price)}</p>
                {costPriceRaw > 0 && (
                   <p className="text-xs text-gray-400 mt-1">Minimum Price (Cost +10%): {formatINR(minAllowedPrice)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:block gap-6">
              <div className="md:mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Price Change</p>
                <p className={`text-lg font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}>
                  {isUp ? '+' : ''}{formatINR(diff)} <span className="text-sm opacity-80">({isUp ? '+' : ''}{pct.toFixed(2)}%)</span>
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Recommendation</p>
                <p className={`font-bold ${
                  data.recommendation === 'Increase Price' ? 'text-green-400' :
                  data.recommendation === 'Decrease Price' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {data.recommendation}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. Why This Price? (Grouped Factors) ── */}
      <div>
        <SectionHead>Why This Price?</SectionHead>
        <div className="px-5 py-4">
          <p className="text-sm text-white leading-relaxed mb-5">
            {data.recommendation_reason || data.overall_decision_summary || '—'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">Factors Pushing Price Up</p>
              {pos.length > 0 ? pos.map((f, i) => (
                <div key={i} className="text-sm text-gray-300 py-1 flex items-center gap-2">
                  <span className="text-green-400">↑</span> {f}
                </div>
              )) : <span className="text-xs text-gray-600 italic">None</span>}
            </div>

            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">Factors Pushing Price Down</p>
              {neg.length > 0 ? neg.map((f, i) => (
                <div key={i} className="text-sm text-gray-300 py-1 flex items-center gap-2">
                  <span className="text-red-400">↓</span> {f}
                </div>
              )) : <span className="text-xs text-gray-600 italic">None</span>}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">NEUTRAL FOR THIS PREDICTION</p>
              {neut.length > 0 ? neut.map((f, i) => (
                <div key={i} className="text-sm text-white py-1 flex items-center gap-2">
                  <span className="text-white">•</span> {f}
                </div>
              )) : <span className="text-xs text-gray-600 italic">None</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Factor Analysis Table ── */}
      <div>
        <SectionHead>Factor Analysis</SectionHead>
        <div className="px-5 py-3">
          {factors.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-500 font-medium w-[20%]">Factor</th>
                  <th className="text-left py-2 text-gray-500 font-medium w-[22%]">Value</th>
                  <th className="text-left py-2 text-gray-500 font-medium w-[16%]">Effect</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {factors.map((f, i) => {
                  const m = EFFECT_META[f.effect] || EFFECT_META.neutral;
                  return (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2 text-gray-300 font-medium pr-2">{f.feature}</td>
                      <td className="py-2 text-gray-300 pr-2 break-words">{f.value}</td>
                      <td className={`py-2 font-medium ${m.cls} pr-2`}>{m.label}</td>
                      <td className="py-2 text-white leading-relaxed">{f.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-gray-500 py-2">Detailed factor analysis is not available for this prediction.</div>
          )}
        </div>
      </div>

      {/* ── 4. Business Impact ── */}
      <div>
        <SectionHead>Business Impact</SectionHead>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
            
            <div className="border-l-2 border-gray-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Current Revenue</p>
              <p className="font-medium text-gray-200">{formatINR(projectedCurrentRevenue)}</p>
            </div>

            <div className="border-l-2 border-gray-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Expected Revenue</p>
              <p className="font-medium text-gray-200">{formatINR(projectedExpectedRevenue)}</p>
            </div>

            <div className="border-l-2 border-blue-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Estimated Gain / Loss</p>
              <p className={`font-bold ${projectedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {projectedGain >= 0 ? '+' : ''}{formatINR(projectedGain)}
              </p>
            </div>

            <div className="border-l-2 border-yellow-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Inventory Cost</p>
              <p className="font-medium text-gray-200">
                {calculatedInventoryCost > 0 ? formatINR(calculatedInventoryCost) : 'N/A'}
              </p>
            </div>

            <div className="border-l-2 border-purple-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Prediction Stability</p>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-gray-200">
                  {data.prediction_stability ? `${data.prediction_stability.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">Measures the stability of the model's prediction across model estimates.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 5. Advanced / Diagnostics ── */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        >
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Advanced — Model Diagnostics</p>
          <svg className={`w-4 h-4 text-gray-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAdvanced && (
          <div className="px-5 pb-5 bg-gray-900/50">
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Model: <span className="text-gray-400 font-mono">{data.model?.name} {data.model?.version}</span>.
              Trained on historical retail records using gradient boosting.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Distribution Shift', 'Model trained on historical data. Significant market disruptions may not be reflected.'],
                ['Seasonal Awareness', 'Season is a categorical input, not a time-series signal. Model cannot predict future trends.'],
                ['Promotion Coverage', 'New promotion types not seen during training are handled by deterministic fallback.'],
                ['Cost Floor Enforcement', 'Hard minimum price floor (Cost + 10%) is strictly enforced by post-processing.'],
              ].map(([title, desc]) => (
                <div key={title} className="border border-gray-800 rounded p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PredictionResultCard;
