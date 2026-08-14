import React, { useState, useEffect } from "react";
import { LineChart, Search, Calendar, Loader2, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Minus, Info, SunSnow } from "lucide-react";
import { getDemandForecast, getAvailableProducts, getProductDetails } from "../services/predictionApi";
import DemandForecastChart from "../components/charts/DemandForecastChart";

export default function Forecasts() {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [priceContext, setPriceContext] = useState(null);
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
    setPriceContext(null);
    
    try {
      const data = await getDemandForecast(targetId, parseInt(period, 10));
      setForecast(data);

      try {
        const productData = await getProductDetails(targetId);
        if (productData) {
          setPriceContext({
            current_price: productData.current_price || productData.base_price || productData.cost_price,
            optimal_price: null
          });
        }
      } catch (err) {
        console.warn("Could not fetch pricing context for this product", err);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevel = (status) => {
    if (status.includes("Production Ready")) return "High";
    if (status.includes("Limited")) return "Moderate";
    if (status.includes("Not Ready")) return "Low";
    if (status.includes("Historical Backtest")) return "Unverified";
    return "Unknown";
  };

  const getReadinessColor = (status) => {
    const conf = getConfidenceLevel(status);
    if (conf === "High") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (conf === "Moderate") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (conf === "Low") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-gray-400 bg-gray-400/10 border-gray-400/20";
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
              {/* Pricing Context Section */}
              {priceContext && (
                <div className="ent-panel p-5 border-l-4 border-indigo-500 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pricing Context</p>
                      <p className="text-sm text-gray-400">Current pricing context from Price Prediction module.</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Current Price</p>
                        <p className="text-lg font-bold text-gray-200">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(priceContext.current_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80 leading-tight">
                      Forecast Confidence Score <br/><span className="lowercase normal-case opacity-75">(derived from genuine validation metrics)</span>
                    </p>
                    
                    {forecast.confidence_score !== null && forecast.confidence_score !== undefined ? (
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold">{forecast.confidence_score}</span>
                        <span className="text-sm opacity-80">/ 100</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold mt-2 opacity-70 italic">Not Available</p>
                    )}

                    <p className="text-xl font-bold mt-1">{forecast.confidence_level || getConfidenceLevel(forecast.readiness_status)}</p>
                    <p className="text-xs mt-1 opacity-80 uppercase tracking-wider">{forecast.readiness_status}</p>
                    
                    {forecast.validation && forecast.validation.r2 != null ? (
                      <div className="mt-4 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-x-2 gap-y-1 text-xs opacity-90">
                        <div><span className="opacity-70">R²:</span> {forecast.validation.r2}</div>
                        <div><span className="opacity-70">MAE:</span> {forecast.validation.mae}</div>
                        <div><span className="opacity-70">RMSE:</span> {forecast.validation.rmse}</div>
                        <div><span className="opacity-70">sMAPE:</span> {forecast.validation.smape}%</div>
                      </div>
                    ) : (
                      <p className="text-[10px] mt-3 pt-2 border-t border-gray-700/50 opacity-60 italic">No genuine validation metrics available for this horizon.</p>
                    )}
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
                      <SunSnow className="w-4 h-4" /> Seasonal Context
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#1f2937]/50 p-3 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Season</p>
                        <p className="text-sm font-semibold text-gray-200">{forecast.seasonal_context.season || "Unknown"}</p>
                      </div>
                      <div className="bg-[#1f2937]/50 p-3 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Quarter</p>
                        <p className="text-sm font-semibold text-gray-200">Q{forecast.seasonal_context.quarter}</p>
                      </div>
                      <div className="bg-[#1f2937]/50 p-3 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Upcoming Events</p>
                        <div className="text-sm font-semibold text-gray-200">
                          {forecast.seasonal_context.upcoming_events?.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {forecast.seasonal_context.upcoming_events.map((evt, idx) => (
                                <li key={idx} className="truncate" title={evt}>{evt}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 font-normal">No major holiday/festival detected</span>
                          )}
                        </div>
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
                    {(forecast.validation.r2 === null || forecast.validation.r2 === undefined) && (
                      <p className="text-xs text-amber-500/80 italic">Genuine validation not available for this horizon. Metrics below are not yet verified on real-world data.</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">R² (Accuracy)</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.r2 != null ? forecast.validation.r2 : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">sMAPE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.smape != null ? `${forecast.validation.smape}%` : "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">MAE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.mae != null ? forecast.validation.mae : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">RMSE</p>
                        <p className="text-sm font-mono text-gray-200">{forecast.validation.rmse != null ? forecast.validation.rmse : "—"}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-4 border-t border-[#374151]/50">
                      <p className="text-xs text-gray-500 mb-1">Model Origin File</p>
                      <p className="text-xs font-mono text-gray-400 truncate" title={forecast.model_file}>{forecast.model_file}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonal Trend Analysis Report */}
              <div className="ent-panel p-5 flex flex-col gap-6 mt-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-2">
                    <SunSnow className="w-4 h-4" /> Seasonal Trend Analysis
                  </p>
                  <p className="text-xs text-gray-500">Seasonal demand pattern based on the available dataset.</p>
                </div>
                
                {forecast.seasonal_analysis ? (
                  <SeasonalTrendDashboard forecast={forecast} />
                ) : (
                  <div className="py-6 text-center border border-dashed border-gray-700 rounded bg-[#1f2937]/30">
                    <p className="text-sm text-gray-400">Insufficient seasonal observations for a reliable comparison.</p>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function SeasonalTrendDashboard({ forecast }) {
  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const stats = forecast.seasonal_analysis.historical_seasons;
  const activeSeasons = seasons.filter(s => stats[s]);
  
  if (activeSeasons.length < 2) {
    return (
      <div className="py-6 text-center border border-dashed border-gray-700 rounded bg-[#1f2937]/30">
        <p className="text-sm text-gray-400">Insufficient seasonal observations for a reliable comparison.</p>
      </div>
    );
  }
  
  const ranked = activeSeasons.map(s => ({
    season: s,
    avg: stats[s].dataset_avg || stats[s].avg || 0
  })).sort((a, b) => b.avg - a.avg);
  
  const peakSeason = ranked[0];
  const lowestSeason = ranked[ranked.length - 1];
  const diffPct = lowestSeason.avg > 0 ? ((peakSeason.avg - lowestSeason.avg) / lowestSeason.avg * 100).toFixed(1) : 0;
  
  const maxAvg = peakSeason.avg;
  
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1f2937]/40 p-4 rounded border border-gray-700/30 flex flex-col justify-center">
           <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Peak Season</p>
           <p className="text-xl font-semibold text-green-400">{peakSeason.season}</p>
        </div>
        <div className="bg-[#1f2937]/40 p-4 rounded border border-gray-700/30 flex flex-col justify-center">
           <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lowest Season</p>
           <p className="text-xl font-semibold text-red-400">{lowestSeason.season}</p>
        </div>
        <div className="bg-[#1f2937]/40 p-4 rounded border border-gray-700/30 flex flex-col justify-center">
           <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Seasonal Difference</p>
           <p className="text-xl font-semibold text-gray-200">{diffPct}%</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="flex-1 w-full h-48 flex items-end gap-2 border-b border-gray-700 pb-2">
          {seasons.map(season => {
             const stat = stats[season];
             if (!stat) return (
               <div key={season} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <div className="w-full bg-gray-800 rounded-t opacity-20 h-2"></div>
                  <p className="text-[10px] text-gray-500 uppercase">{season}</p>
               </div>
             );
             
             const avgVal = stat.dataset_avg || stat.avg || 0;
             const heightPct = Math.max(15, (avgVal / maxAvg) * 100);
             const isPeak = season === peakSeason.season;
             const isLowest = season === lowestSeason.season;
             
             return (
               <div key={season} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                  <div className="text-xs font-mono text-gray-300 mb-1">{Math.round(avgVal)}</div>
                  <div 
                    className={`w-full rounded-t transition-all duration-500 ${isPeak ? 'bg-indigo-400' : isLowest ? 'bg-indigo-900/60' : 'bg-indigo-600/80'}`} 
                    style={{height: `${heightPct}%`}}
                  ></div>
                  <p className={`text-[10px] uppercase tracking-wider ${isPeak ? 'text-indigo-300 font-bold' : 'text-gray-400'}`}>{season}</p>
               </div>
             );
          })}
        </div>
        
        <div className="md:w-1/3 flex flex-col gap-4 pb-2">
           <div>
             <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Forecast Horizon: {forecast.horizon_days} Days</p>
             <p className="text-sm font-semibold text-indigo-300">
               {forecast.seasonal_analysis.upcoming_seasons.join(" → ")}
             </p>
           </div>
           <p className="text-xs text-gray-400 leading-relaxed bg-[#1f2937]/30 p-3 rounded border border-gray-700/30">
             The available dataset shows the strongest average demand during <span className="text-gray-300 font-medium">{peakSeason.season}</span> and <span className="text-gray-300 font-medium">{ranked[1] ? ranked[1].season : "None"}</span>, with lower demand during <span className="text-gray-300 font-medium">{lowestSeason.season}</span>.
           </p>
        </div>
      </div>
    </div>
  );
}
