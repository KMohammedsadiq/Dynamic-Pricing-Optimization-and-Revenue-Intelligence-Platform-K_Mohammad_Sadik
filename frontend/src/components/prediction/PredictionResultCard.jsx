import React from 'react';

const PredictionResultCard = ({ predictedPrice, differencePercent, currency }) => {
  const isPositive = differencePercent >= 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Optimal AI Price</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-blue-700">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(predictedPrice || 0)}
          </span>
        </div>
      </div>
      
      <div className="mt-6">
        {differencePercent !== null && differencePercent !== undefined ? (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${isPositive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
            <svg className={`w-4 h-4 ${isPositive ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {isPositive ? '+' : ''}{differencePercent}% vs Historical
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
            No historical baseline
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 text-right">Predicted just now</p>
      </div>
    </div>
  );
};

export default PredictionResultCard;
