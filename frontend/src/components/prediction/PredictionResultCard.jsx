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
  const neut = factors.filter(f => f.effect === 'neutral').map(f => f.feature);

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
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">

            <div>
              <p className="text-xs text-gray-500 mb-0.5">Current Selling Price</p>
              <p className="font-medium text-gray-200">{formatINR(data.current_price)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">AI Recommended Price</p>
              <p className="text-2xl font-bold text-blue-400">{formatINR(data.optimal_price)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">Price Change</p>
              <p className={`font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}>
                {isUp ? '+' : ''}{formatINR(diff)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">% Change</p>
              <p className={`font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'}`}>
                {isUp ? '+' : ''}{pct.toFixed(2)}%
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. Factor Analysis Table ── */}
      <div>
        <SectionHead>Why did the AI recommend this price?</SectionHead>
        <div className="px-5 py-3">
          {factors.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-500 font-medium w-[26%]">Factor</th>
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
                      <td className="py-2 text-gray-500 leading-relaxed">{f.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Fallback: legacy factor lists */
            <div className="space-y-2">
              {(data.factors_increasing || []).map((f, i) => (
                <div key={i} className="flex gap-3 text-xs py-1 border-b border-gray-800">
                  <span className="text-green-400 font-medium w-28 flex-shrink-0">{f.title}</span>
                  <span className="text-gray-500">{f.description}</span>
                </div>
              ))}
              {(data.factors_reducing || []).map((f, i) => (
                <div key={i} className="flex gap-3 text-xs py-1 border-b border-gray-800">
                  <span className="text-red-400 font-medium w-28 flex-shrink-0">{f.title}</span>
                  <span className="text-gray-500">{f.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Final Recommendation ── */}
      <div>
        <SectionHead>Final Recommendation</SectionHead>
        <div className="px-5 py-4">
          <div className={`border rounded px-5 py-4 ${recColor}`}>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-widest">AI Recommendation</p>
            <p className="text-xl font-bold mb-2">{data.recommendation}</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {data.recommendation_reason || data.overall_decision_summary || '—'}
            </p>
          </div>

          {/* Factor summary row */}
          {(pos.length > 0 || neg.length > 0 || neut.length > 0) && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              {pos.length > 0 && (
                <div>
                  <p className="text-green-500 font-medium mb-1">Positive ({pos.length})</p>
                  {pos.map((f, i) => <p key={i} className="text-gray-500">{f}</p>)}
                </div>
              )}
              {neg.length > 0 && (
                <div>
                  <p className="text-red-500 font-medium mb-1">Negative ({neg.length})</p>
                  {neg.map((f, i) => <p key={i} className="text-gray-500">{f}</p>)}
                </div>
              )}
              {neut.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Neutral ({neut.length})</p>
                  {neut.map((f, i) => <p key={i} className="text-gray-600">{f}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Business Impact ── */}
      <div>
        <SectionHead>Business Impact</SectionHead>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">

            <div className="border-l-2 border-gray-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5">Current Revenue</p>
              <p className="font-medium text-gray-200">{formatINR(data.current_revenue)}</p>
            </div>

            <div className="border-l-2 border-gray-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5">Expected Revenue</p>
              <p className="font-medium text-gray-200">{formatINR(data.expected_revenue)}</p>
            </div>

            <div className="border-l-2 border-blue-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5">Estimated Gain / Loss</p>
              <p className={`font-bold ${data.revenue_impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.revenue_impact >= 0 ? '+' : ''}{formatINR(data.revenue_impact)}
              </p>
            </div>

            <div className="border-l-2 border-blue-700 pl-3">
              <p className="text-xs text-gray-500 mb-0.5">Prediction Confidence</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-200">
                  {data.prediction_stability ? `${data.prediction_stability.toFixed(1)}%` : 'N/A'}
                </p>
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-1 bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(data.prediction_stability || 0, 100)}%` }}
                  />
                </div>
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
              Trained on 183,168 retail records using gradient boosting with sequential residual correction.
              Predictions reflect learned patterns from historical pricing data.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Distribution Shift', 'Model trained on historical data. Significant market disruptions (e.g., new competitor entry) may not be reflected.'],
                ['Seasonal Awareness', 'Season is a categorical input, not a time-series signal. The model cannot predict future seasonal trends.'],
                ['Promotion Coverage', 'New promotion types not seen during training are handled by a deterministic fallback rule.'],
                ['Demand–Inventory Interaction', 'Individual moderate demand/inventory values carry less weight; the model mainly reacts to extreme combinations.'],
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
