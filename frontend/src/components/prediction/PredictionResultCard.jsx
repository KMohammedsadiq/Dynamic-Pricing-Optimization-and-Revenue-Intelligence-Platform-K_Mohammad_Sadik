import React from 'react';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const PredictionResultCard = ({ basePrice, currentPrice, predictedPrice, recommendation, reasons, explanation, summary }) => {
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* SECTION 3: Prediction Result */}
      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Results</h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Base Price</span>
            <span className="text-gray-900 font-medium">{formatINR(basePrice)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Current Price</span>
            <span className="text-gray-900 font-medium">{formatINR(currentPrice)}</span>
          </div>
          
          <div className="flex justify-between items-center mt-2 pt-2">
            <span className="text-gray-900 font-bold text-base">AI Predicted Price</span>
            <span className="text-indigo-600 font-bold text-2xl">{formatINR(predictedPrice)}</span>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* SECTION 4: Historical Comparison */}
      <div className="p-6 bg-gray-50">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Historical Comparison</h4>
        
        {summary && summary.matching_records > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Average</p>
              <p className="text-sm font-semibold text-gray-900">{formatINR(summary.average_price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Highest</p>
              <p className="text-sm font-semibold text-gray-900">{formatINR(summary.highest_price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Lowest</p>
              <p className="text-sm font-semibold text-gray-900">{formatINR(summary.lowest_price)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No similar historical products found.</p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* SECTION 5: Business Explanation */}
      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Why?</h4>
        
        <ul className="space-y-3 mb-6">
          {explanation?.business_summary_checklist?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold">✓</span> {item}
            </li>
          ))}
          {(!explanation || !explanation.business_summary_checklist || explanation.business_summary_checklist.length === 0) && (
            reasons && reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span> {reason}
              </li>
            ))
          )}
        </ul>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Recommendation</p>
          <p className="text-indigo-900 font-bold text-lg">{recommendation || 'Maintain Pricing'}</p>
        </div>
      </div>
      
    </div>
  );
};

export default PredictionResultCard;
