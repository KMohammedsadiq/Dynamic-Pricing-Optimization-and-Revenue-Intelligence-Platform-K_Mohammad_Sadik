import React, { useState } from 'react';
import PredictionForm        from '../components/prediction/PredictionForm';
import PredictionResultCard  from '../components/prediction/PredictionResultCard';
import LoadingOverlay        from '../components/prediction/LoadingOverlay';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      <LoadingOverlay isVisible={isLoading} />

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Price Prediction &amp; Revenue Intelligence
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">
            Decision support tool for pricing managers to determine optimal market pricing.
          </p>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Left — Form */}
        <div className="xl:col-span-1">
          <PredictionForm onSubmit={handlePredict} onReset={handleReset} isSubmitting={isLoading} />
        </div>

        {/* Right — Results */}
        <div className="xl:col-span-1 space-y-5">

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-3 bg-white border-2 border-red-500 rounded-2xl px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-black">!</div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Prediction Failed</h4>
                <p className="text-sm text-gray-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Results cards */}
          {resultData ? (
            <PredictionResultCard
              basePrice={resultData.input?.base_price || 0}
              currentPrice={resultData.input?.cost_price || resultData.input?.base_price * 0.95 || 0}
              predictedPrice={resultData.predicted_price}
              recommendation={resultData.recommendation}
              reasons={resultData.reasons}
              explanation={resultData.explanation}
              summary={resultData.historical_summary}
            />
          ) : (
            !errorMsg && (
              /* Empty state placeholder */
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center
                border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Awaiting Parameters</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Select a product and adjust market conditions to generate an AI pricing recommendation.
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
