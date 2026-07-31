import React from 'react';
import ReasonList from './ReasonList';

const RecommendationCard = ({ recommendation, priceDifference, currency, reasons }) => {
  const status = recommendation || "Maintain Current Pricing"; 
  
  // Logic for colored badges based on the user's prompt requirements
  const getBadgeStyle = (rec) => {
    switch (rec) {
      case 'Increase Price': return 'bg-green-100 text-green-800 border-green-200';
      case 'Maintain Current Pricing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Reduce Price': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Trust ML Prediction': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formattedDifference = priceDifference !== null && priceDifference !== undefined
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(priceDifference)
    : 'N/A';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Strategy</h3>
          <div className={`inline-flex px-4 py-2 rounded-lg font-bold border ${getBadgeStyle(status)}`}>
            {status}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Difference</p>
          <p className="text-lg font-bold text-gray-800">{formattedDifference}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Reasoning Engine</h4>
        <ReasonList reasons={reasons} />
      </div>
    </div>
  );
};

export default RecommendationCard;
