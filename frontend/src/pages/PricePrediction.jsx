import React, { useState } from 'react';
import PredictionForm from '../components/prediction/PredictionForm';
import PredictionResultCard from '../components/prediction/PredictionResultCard';
import HistoricalSummaryCard from '../components/prediction/HistoricalSummaryCard';
import RecommendationCard from '../components/prediction/RecommendationCard';
import LoadingOverlay from '../components/prediction/LoadingOverlay';
import { predictOptimalPrice } from '../services/predictionApi';

const PricePrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePredict = async (formData) => {
    setIsLoading(true);
    setResultData(null);
    setErrorMsg(null);
    
    try {
      // Connects to FastAPI /api/v1/business-recommendation
      const data = await predictOptimalPrice(formData);
      setResultData(data);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during prediction.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResultData(null);
    setErrorMsg(null);
    setIsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      <LoadingOverlay isVisible={isLoading} />
      
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Price Prediction & Revenue Intelligence</h1>
        <p className="mt-2 text-lg text-gray-600 max-w-3xl">
          Leverage machine learning and historical analytics to predict the optimal selling price for any product configuration in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Input Form */}
        <div className="xl:col-span-1">
          <PredictionForm onSubmit={handlePredict} onReset={handleReset} isSubmitting={isLoading} />
        </div>
        
        {/* Right Column: Results Dashboard */}
        <div className="xl:col-span-2 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-semibold">Prediction Failed</h4>
                <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {resultData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              <PredictionResultCard 
                predictedPrice={resultData.predicted_price} 
                differencePercent={resultData.difference_percentage} 
                currency={resultData.currency} 
              />
              <HistoricalSummaryCard summary={resultData.historical_summary} currency={resultData.currency} />
              <RecommendationCard 
                recommendation={resultData.recommendation} 
                priceDifference={resultData.price_difference} 
                currency={resultData.currency} 
                reasons={resultData.reasons} 
              />
            </div>
          ) : (
            !errorMsg && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Awaiting Product Parameters</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Enter the product configuration in the form and click "Predict Optimal Price" to generate a business recommendation.
                </p>
              </div>
            )
          )}
        </div>
        
      </div>
    </div>
  );
};

export default PricePrediction;
