import { useState } from "react";
import { Zap, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, Loader2, Search, ChevronRight } from "lucide-react";
import api from "../services/api";

// ─── Helper formatters ────────────────────────────────────────────────────────
const fmt = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "N/A";
const pct = (v) => v != null ? `${v > 0 ? "+" : ""}${v}%` : "—";

// ─── Trend icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === "Increasing") return <TrendingUp size={16} className="text-green-400" />;
  if (trend === "Decreasing") return <TrendingDown size={16} className="text-red-400" />;
  return <Minus size={16} className="text-yellow-400" />;
}

// ─── Engine step card ─────────────────────────────────────────────────────────
function EngineCard({ step, label, icon: Icon, color, price, adjustment, signal, children }) {
  return (
    <div className={`bg-[#1F2937] border border-[#374151] rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${color}`}>
          {step}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
          {price != null && (
            <p className="text-lg font-semibold text-white">{fmt(price)}</p>
          )}
        </div>
        {adjustment != null && (
          <span className={`ml-auto text-sm font-medium px-2 py-0.5 rounded ${
            adjustment > 0 ? "bg-green-900/40 text-green-400" :
            adjustment < 0 ? "bg-red-900/40 text-red-400" :
            "bg-gray-700 text-gray-400"
          }`}>
            {pct(adjustment)}
          </span>
        )}
      </div>
      {signal && <p className="text-xs text-gray-400 mt-1">{signal}</p>}
      {children}
    </div>
  );
}

// ─── Factor badge ─────────────────────────────────────────────────────────────
function FactorBadge({ factor, type }) {
  const colors = {
    increasing: "bg-green-900/30 text-green-400 border-green-800",
    reducing:   "bg-red-900/30 text-red-400 border-red-800",
    neutral:    "bg-gray-700/40 text-gray-400 border-gray-600",
  };
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded border ${colors[type]} mr-1 mb-1`}>
      {factor.title || factor.label || factor}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SmartPriceAdvisor() {
  const [productId, setProductId]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const handleCalculate = async () => {
    if (!productId.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.get(`/predictions/smart-price/${productId.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please check the Product ID.");
    } finally {
      setLoading(false);
    }
  };

  const rec = result?.final_price?.recommendation;
  const recColor =
    rec === "Increase Price" ? "text-green-400" :
    rec === "Decrease Price" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="min-h-screen bg-[#111827] p-6">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Zap size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Smart Price Advisor</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Enter a Product ID — the system will internally run XGBoost price prediction, demand forecasting, and
          competitor analysis, then return a single unified final price with a full breakdown.
        </p>
      </div>

      {/* ── Input ── */}
      <div className="flex gap-3 mb-8 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="smart-price-product-id"
            type="text"
            placeholder="Enter Product ID (e.g. PROD001)"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            className="w-full pl-9 pr-4 py-2.5 bg-[#1F2937] border border-[#374151] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          id="smart-price-calculate-btn"
          onClick={handleCalculate}
          disabled={loading || !productId.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? "Calculating…" : "Get Smart Price"}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6 max-w-xl">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#1F2937] border border-[#374151] rounded-xl h-36" />
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="max-w-5xl space-y-6">

          {/* Product header */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-5 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Product</p>
              <p className="text-white font-semibold text-lg">{result.product.name}</p>
              <p className="text-gray-400 text-sm">{result.product.brand} · {result.product.category}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Price</p>
              <p className="text-white font-semibold text-lg">{fmt(result.product.current_price)}</p>
              <p className="text-gray-500 text-xs">Cost: {fmt(result.product.cost_price)}</p>
            </div>
          </div>

          {/* 3 engine cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* XGBoost */}
            <EngineCard
              step="1"
              label="XGBoost ML Prediction"
              color="bg-blue-600 text-white"
              price={result.engines.xgboost.price}
              signal={`Confidence: ${result.engines.xgboost.stability}%`}
            >
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <span>Stability</span>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 mx-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${result.engines.xgboost.stability}%` }}
                  />
                </div>
                <span className="text-blue-400">{result.engines.xgboost.stability}%</span>
              </div>
            </EngineCard>

            {/* Demand */}
            <EngineCard
              step="2"
              label="30-Day Demand Forecast"
              color="bg-purple-600 text-white"
              adjustment={result.engines.demand.adjustment_pct}
              signal={result.engines.demand.error ? `Note: ${result.engines.demand.error}` : result.engines.demand.adjustment_label}
            >
              <div className="mt-2 flex items-center gap-2">
                <TrendIcon trend={result.engines.demand.trend} />
                <span className="text-sm text-gray-300">{result.engines.demand.trend}</span>
                {result.engines.demand.predicted_units != null && (
                  <span className="text-xs text-gray-500 ml-auto">~{Math.round(result.engines.demand.predicted_units)} units</span>
                )}
              </div>
            </EngineCard>

            {/* Competitor */}
            <EngineCard
              step="3"
              label="Competitor Analysis"
              color="bg-orange-600 text-white"
              adjustment={result.engines.competitor.adjustment_pct}
              signal={result.engines.competitor.adjustment_label}
            >
              <div className="mt-2 space-y-1 text-xs text-gray-400">
                {result.engines.competitor.amazon_price != null && (
                  <div className="flex justify-between"><span>Amazon</span><span className="text-white">{fmt(result.engines.competitor.amazon_price)}</span></div>
                )}
                {result.engines.competitor.flipkart_price != null && (
                  <div className="flex justify-between"><span>Flipkart</span><span className="text-white">{fmt(result.engines.competitor.flipkart_price)}</span></div>
                )}
                {result.engines.competitor.market_average != null && (
                  <div className="flex justify-between"><span>Market Average</span><span className="text-yellow-400">{fmt(result.engines.competitor.market_average)}</span></div>
                )}
                {result.engines.competitor.market_average == null && (
                  <p className="text-gray-600 italic">No competitor data synced yet</p>
                )}
              </div>
            </EngineCard>
          </div>

          {/* Arrow breakdown */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Price Calculation Breakdown</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="bg-[#111827] rounded-lg px-3 py-2 text-blue-400 font-semibold">
                XGBoost: {fmt(result.engines.xgboost.price)}
              </div>
              <ChevronRight size={16} className="text-gray-600" />
              <div className={`bg-[#111827] rounded-lg px-3 py-2 font-medium ${result.engines.demand.adjustment_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                Demand: {pct(result.engines.demand.adjustment_pct)}
              </div>
              <ChevronRight size={16} className="text-gray-600" />
              <div className={`bg-[#111827] rounded-lg px-3 py-2 font-medium ${result.engines.competitor.adjustment_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                Competitor: {pct(result.engines.competitor.adjustment_pct)}
              </div>
              {result.final_price.floor_applied && (
                <>
                  <ChevronRight size={16} className="text-gray-600" />
                  <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg px-3 py-2 text-yellow-400 text-xs">
                    Cost Floor Applied ({fmt(result.final_price.cost_floor)})
                  </div>
                </>
              )}
              <ChevronRight size={16} className="text-gray-600" />
              <div className="bg-blue-600 rounded-lg px-4 py-2 text-white font-bold text-base">
                = {fmt(result.final_price.value)}
              </div>
            </div>
          </div>

          {/* Final price + recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1F2937] border border-blue-600/40 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Final Recommended Price</p>
              <p className="text-4xl font-bold text-white mb-1">{fmt(result.final_price.value)}</p>
              <p className={`text-sm font-medium mb-3 ${result.final_price.change_from_current_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pct(result.final_price.change_from_current_pct)} vs current price
              </p>
              <div className={`flex items-center gap-2 text-sm font-semibold ${recColor}`}>
                <CheckCircle size={16} />
                {rec}
              </div>
              {result.final_price.summary && (
                <p className="text-gray-400 text-xs mt-2">{result.final_price.summary}</p>
              )}
            </div>

            {/* Revenue impact */}
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Revenue Impact</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Revenue</span>
                  <span className="text-white">{fmt(result.revenue.current)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Projected Revenue</span>
                  <span className="text-white">{fmt(result.revenue.projected)}</span>
                </div>
                <div className="border-t border-[#374151] pt-2 flex justify-between font-semibold">
                  <span className="text-gray-300">Revenue Impact</span>
                  <span className={result.revenue.impact >= 0 ? "text-green-400" : "text-red-400"}>
                    {result.revenue.impact != null ? `${result.revenue.impact >= 0 ? "+" : ""}${fmt(result.revenue.impact)}` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Business factors */}
          {(result.factors.increasing.length > 0 || result.factors.reducing.length > 0 || result.factors.neutral.length > 0) && (
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Business Factor Analysis</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-green-400 font-medium mb-2">↑ Price-Increasing Factors</p>
                  <div>{result.factors.increasing.map((f, i) => <FactorBadge key={i} factor={f} type="increasing" />)}</div>
                  {result.factors.increasing.length === 0 && <p className="text-gray-600 text-xs italic">None</p>}
                </div>
                <div>
                  <p className="text-xs text-red-400 font-medium mb-2">↓ Price-Reducing Factors</p>
                  <div>{result.factors.reducing.map((f, i) => <FactorBadge key={i} factor={f} type="reducing" />)}</div>
                  {result.factors.reducing.length === 0 && <p className="text-gray-600 text-xs italic">None</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">→ Neutral Factors</p>
                  <div>{result.factors.neutral.map((f, i) => <FactorBadge key={i} factor={f} type="neutral" />)}</div>
                  {result.factors.neutral.length === 0 && <p className="text-gray-600 text-xs italic">None</p>}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600">Generated at: {new Date(result.generated_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
