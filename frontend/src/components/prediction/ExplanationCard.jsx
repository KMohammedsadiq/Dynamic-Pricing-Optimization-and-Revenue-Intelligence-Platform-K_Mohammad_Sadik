import React from 'react';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const ExplanationCard = ({ explanation }) => {
  if (!explanation) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Factors Influencing Price Recommendation
        </h3>
        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">
          Confidence (R²): {explanation.confidence_r2}
        </span>
      </div>

      <div className="p-6 space-y-6 flex-grow">
        
        {/* Business Summary Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Business Summary</h4>
          <ul className="space-y-2 mb-4">
            {explanation.business_summary_checklist?.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span> {item}
              </li>
            ))}
          </ul>
          {explanation.final_recommendation && (
            <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-3">
              Recommendation: <span className="text-indigo-600">{explanation.final_recommendation}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Top Positive Factors */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              Positive Influencing Factors
            </h4>
            <div className="space-y-3">
              {explanation.top_positive_factors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between bg-green-50/50 px-3 py-2 rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-gray-800">{factor.feature}</span>
                  <span className="text-sm font-bold text-green-600">+{formatINR(factor.impact)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Negative Factors */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-500 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              Negative Influencing Factors
            </h4>
            <div className="space-y-3">
              {explanation.top_negative_factors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between bg-red-50/50 px-3 py-2 rounded-lg border border-red-100">
                  <span className="text-sm font-medium text-gray-800">{factor.feature}</span>
                  <span className="text-sm font-bold text-red-600">{formatINR(factor.impact)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Disclaimer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{explanation.disclaimer}</span>
        </p>
      </div>
    </div>
  );
};

export default ExplanationCard;
