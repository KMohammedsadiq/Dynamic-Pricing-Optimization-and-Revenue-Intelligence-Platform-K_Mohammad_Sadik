import React, { useState } from "react";
import { LineChart, Search, Calendar } from "lucide-react";

export default function Forecasts() {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [period, setPeriod] = useState("30");

  return (
    <div className="w-full max-w-[1000px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Demand Forecast</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Generate time-series demand forecasts for specific products or categories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selection */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Target Selection */}
          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              1. Select Target
            </p>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Product or Category..."
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="ent-input w-full pl-9"
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Select a specific SKU for item-level forecasting or a category name for aggregated trend forecasting.
            </p>
          </div>

          {/* Period Selection */}
          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              2. Forecast Period
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "7", label: "7 Days (Short-term)" },
                { value: "30", label: "30 Days (1 Month)" },
                { value: "90", label: "90 Days (3 Months)" },
                { value: "180", label: "180 Days (6 Months)" },
                { value: "365", label: "365 Days (12 Months)" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-[#374151]/50 cursor-pointer border border-transparent hover:border-[#374151] transition-colors">
                  <input
                    type="radio"
                    name="period"
                    value={opt.value}
                    checked={period === opt.value}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-[#111827] border-[#374151]"
                  />
                  <span className="text-sm text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Results Placeholder */}
        <div className="lg:col-span-2">
          <div className="ent-panel p-8 h-full flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <LineChart className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-50 mb-1">
                Forecasting Engine Pending
              </p>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed mx-auto">
                The UI workflow is configured. Once the time-series model is connected in Milestone 2, this section will render the projected demand curve and confidence intervals for the selected period.
              </p>
            </div>
            
            <button disabled className="mt-4 px-6 py-2.5 bg-[#374151] text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Generate Forecast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
