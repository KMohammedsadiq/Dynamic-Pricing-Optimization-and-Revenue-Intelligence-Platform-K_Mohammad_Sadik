import React, { useState, useEffect } from "react";
import { LineChart, Search, Calendar, Loader2, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Minus, Info, SunSnow } from "lucide-react";
import { getDemandForecast, getAvailableProducts } from "../services/predictionApi";
import DemandForecastChart from "../components/charts/DemandForecastChart";

export default function Forecasts() {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    // Fetch available products on component mount
    const fetchProducts = async () => {
      try {
        const products = await getAvailableProducts();
        setAvailableProducts(products);
      } catch (err) {
        console.error("Failed to load products list:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleGenerateForecast = async () => {
    if (!selectedTarget) {
      setError("Please select or enter a Product Name or ID");
      return;
    }
    
    // Resolve the input (which might be a name) back to a product ID
    let targetId = null;
    const matchedProduct = availableProducts.find(
      p => p.name.toLowerCase() === selectedTarget.toLowerCase() || 
           p.id.toLowerCase() === selectedTarget.toLowerCase()
    );
    
    if (matchedProduct) {
      targetId = matchedProduct.id;
    } else {
      // Try to find a partial match to be helpful, or just reject
      const partialMatches = availableProducts.filter(p => p.name.toLowerCase().includes(selectedTarget.toLowerCase()));
      if (partialMatches.length === 1) {
        targetId = partialMatches[0].id;
      } else {
        setError(`Product "${selectedTarget}" not recognized. Please click a valid option from the dropdown list.`);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setForecast(null);
    
    try {
      const data = await getDemandForecast(targetId, parseInt(period, 10));
      setForecast(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (status) => {
    if (status === "Production Ready") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (status === "Limited") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-rose-400 bg-rose-400/10 border-rose-400/20";
  };

  const getTrendIcon = (trend) => {
    if (trend === "Increasing") return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (trend === "Decreasing") return <TrendingDown className="w-5 h-5 text-rose-400" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Demand Forecast Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Generate production-validated time-series demand forecasts for specific products.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Selection & Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              1. Product
            </p>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                list="product-list"
                placeholder="Search by Name or ID..."
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="ent-input w-full !pl-10"
              />
              <datalist id="product-list">
                {availableProducts.map(prod => (
                  <option key={prod.id} value={prod.name}>
                    {prod.id}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              2. Forecast Horizon
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "7", label: "7 Days" },
                { value: "14", label: "14 Days" },
                { value: "30", label: "30 Days" },
                { value: "90", label: "3 Months" },
                { value: "180", label: "6 Months" },
                { value: "365", label: "12 Months" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-[#374151]/50 cursor-pointer border border-transparent hover:border-[#374151] transition-colors">
                  <input
                    type="radio"
                    name="period"
                    value={opt.value}
                    checked={period === opt.value}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 bg-[#111827] border-[#374151]"
                  />
                  <span className="text-sm text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
            
            <button 
              onClick={handleGenerateForecast}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Forecast"}
            </button>
          </div>
        </div>

        {/* Right Column: Results & Visualization */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {error && (
            <div className="ent-panel p-4 border border-rose-500/20 bg-rose-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400">Forecast Error</p>
                <p className="text-sm text-rose-300/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!forecast && !loading && !error && (
            <div className="ent-panel p-8 flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-50 mb-1">
                  Ready for Prediction
                </p>
                <p className="text-sm text-gray-400 max-w-md leading-relaxed mx-auto">
                  Select a Product ID and horizon to generate a machine learning demand forecast based on the latest available genuine observations.
                </p>
              </div>
            </div>
          )}
          
          {loading && (
             <div className="ent-panel p-8 flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-gray-400 text-sm">Constructing features and evaluating XGBoost pipeline...</p>
             </div>
          )}

          {forecast && (
            <>
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ent-panel p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Predicted Demand</p>
                    <p className="text-3xl font-bold text-gray-50">{forecast.predicted_demand_units} <span className="text-sm text-gray-400 font-normal">units</span></p>
                    <p className="text-xs text-gray-400 mt-1">Over the next {forecast.forecast_period}</p>
                  </div>
                </div>

                <div className="ent-panel p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Average Weekly Demand</p>
                    <p className="text-3xl font-bold text-gray-50">{forecast.predicted_weekly_demand} <span className="text-sm text-gray-400 font-normal">units/wk</span></p>
                    <div className="flex items-center gap-2 mt-2">
                      {getTrendIcon(forecast.demand_trend)}
                      <p className="text-sm text-gray-300">{forecast.demand_trend} Trend</p>
                    </div>
                  </div>
                </div>

                <div className={`ent-panel p-5 flex flex-col justify-between border ${getReadinessColor(forecast.readiness_status)}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Model Readiness</p>
                    <p className="text-xl font-bold">{forecast.readiness_status}</p>
                    <div className="flex items-start gap-2 mt-3">
                      {forecast.validation.status === "Validated" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <p className="text-xs opacity-90 leading-relaxed">
                        {forecast.validation.status === "Validated" 
                          ? `Validated on genuine historical data (R²: ${forecast.validation.r2}). Highly reliable.` 
                          : "Experimental horizon due to lack of extensive real-world historical validation."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="ent-panel p-5 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Demand Forecast Visualization
                  </p>
                  <p className="text-xs text-gray-400">
                    Latest Observation: {forecast.latest_observation_date}
                  </p>
                </div>
                <div className="h-[350px] w-full">
                  <DemandForecastChart 
                    historicalData={forecast.historical_data} 
                    forecastData={{
                      horizon: forecast.horizon,
                      predicted_weekly_demand: forecast.predicted_weekly_demand,
                      forecast_period: forecast.forecast_period
                    }} 
                  />
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-400">Historical Actuals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 opacity-20"></div>
                    <span className="text-xs text-gray-400">Forecast Window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t-2 border-dashed border-purple-500"></div>
                    <span className="text-xs text-gray-400">Predicted Weekly Average</span>
                  </div>
                </div>
              </div>

              {/* Demand Insights, Reporting, and Seasonal Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Insights */}
                <div className="ent-panel p-5 flex flex-col gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4" /> AI Demand Insights
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Demand is projected to be <strong className="text-gray-100">{forecast.demand_trend.toLowerCase()}</strong> compared with recent historical averages, moving to an average of {forecast.predicted_weekly_demand} units per week.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {forecast.validation.status === "Validated" 
                            ? "This short-term forecast has strong validation support and is safe to use for active inventory and pricing decisions."
                            : "This long-term forecast is experimental due to limited real-world history in this time scale. Use for broad directional planning only."}
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                      <SunSnow className="w-4 h-4" /> Seasonal Analysis
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1f2937]/50 p-3 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Quarter</p>
                        <p className="text-sm font-semibold text-gray-200">Q{forecast.seasonal_context.quarter}</p>
                      </div>
                      <div className="bg-[#1f2937]/50 p-3 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Upcoming Events</p>
                        <p className="text-sm font-semibold text-gray-200">
                          {forecast.seasonal_context.festival_flag ? "Festival Approaching" : 
                           forecast.seasonal_context.holiday_flag ? "Holiday Approaching" : 
                           "Standard Period"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Metrics */}
                <div className="ent-panel p-5 bg-[#1f2937]/30 border border-[#374151]/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                    Prediction Report Metrics
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">R² (Accuracy)</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.r2 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">sMAPE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.smape ? `${forecast.validation.smape}%` : "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">MAE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.mae || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">RMSE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.rmse || "N/A"}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-4 border-t border-[#374151]/50">
                      <p className="text-xs text-gray-500 mb-1">Model Origin File</p>
                      <p className="text-xs font-mono text-gray-400 truncate" title={forecast.model_file}>{forecast.model_file}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
