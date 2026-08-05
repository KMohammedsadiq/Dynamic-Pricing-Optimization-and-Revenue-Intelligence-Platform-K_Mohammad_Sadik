import React, { useState } from 'react';
import PredictionForm       from '../components/prediction/PredictionForm';
import PredictionResultCard from '../components/prediction/PredictionResultCard';
import { predictOptimalPrice } from '../services/predictionApi';

const PricePrediction = () => {
  const [isLoading,  setIsLoading]  = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg,   setErrorMsg]   = useState(null);

  const handlePredict = async (formData) => {
    setIsLoading(true);
    setResultData(null);
    setErrorMsg(null);
    try {
      const data = await predictOptimalPrice(formData);
      setResultData(data);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => { setResultData(null); setErrorMsg(null); setIsLoading(false); };

  return (
    <div className="h-full flex flex-col bg-gray-950">

      {/* ── Page Header ── */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Price Prediction
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              AI-powered optimal pricing recommendation for retail pricing managers
            </p>
          </div>
          <span className="text-xs text-gray-500 font-mono bg-gray-800 border border-gray-700 px-2 py-1 rounded">
            XGBoost v3.0-XGB
          </span>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto h-full flex flex-col xl:flex-row gap-0 divide-y xl:divide-y-0 xl:divide-x divide-gray-800">

          {/* Left — Input Form */}
          <div className="xl:w-[420px] flex-shrink-0 overflow-y-auto">
            <PredictionForm
              onSubmit={handlePredict}
              onReset={handleReset}
              isSubmitting={isLoading}
            />
          </div>

          {/* Right — Results */}
          <div className="flex-1 overflow-y-auto bg-gray-950">
            {isLoading && (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-400">Analyzing pricing factors…</p>
                </div>
              </div>
            )}

            {!isLoading && errorMsg && (
              <div className="p-6">
                <div className="flex items-start gap-3 bg-red-950/40 border border-red-800 rounded px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-400">Prediction Failed</p>
                    <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !errorMsg && resultData && (
              <PredictionResultCard data={resultData} />
            )}

            {!isLoading && !errorMsg && !resultData && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-8">
                <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p className="text-sm font-medium text-gray-500">No prediction yet</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">
                  Select a product and fill in today's market conditions, then click Predict Optimal Price.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricePrediction;
