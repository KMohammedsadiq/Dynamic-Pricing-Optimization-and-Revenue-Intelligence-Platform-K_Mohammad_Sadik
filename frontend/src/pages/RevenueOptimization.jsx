import React from "react";
import { TrendingUp, CheckCircle, Clock } from "lucide-react";

export default function RevenueOptimization() {
  return (
    <div className="w-full max-w-[900px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Revenue Optimization</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Run pricing simulations and estimate the profit impact of price changes.
        </p>
      </div>

      <div className="ent-panel p-12 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <TrendingUp className="w-7 h-7 text-green-500" />
        </div>
        
        <div>
          <p className="text-lg font-bold text-gray-50 mb-2">
            Optimization Engine — Milestone 3
          </p>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Revenue Optimization is the final stage of the dynamic pricing workflow. It relies on the outputs of several prerequisite modules which must be completed first.
          </p>
        </div>

        <div className="w-full max-w-md mt-2 text-left bg-[#111827] rounded-lg p-5 border border-[#374151]">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Prerequisite Checklist
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Milestone 1: Catalog & Analytics (Completed)</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Milestone 2: Price Prediction Engine (Pending)</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Milestone 2: Demand Forecasting (Pending)</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Milestone 3: Competitor Analysis (Planned)</span>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[#374151] mt-1">
              <div className="w-4 h-4 rounded-full border-2 border-green-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-100">Milestone 3: Revenue Optimization Simulation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
