import React from "react";
import { Globe, Clock } from "lucide-react";

export default function Competitors() {
  return (
    <div className="w-full max-w-[900px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Competitor Analysis</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Monitor and compare competitor pricing across product categories.
        </p>
      </div>

      <div className="ent-panel p-12 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Globe className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-50 mb-1">
            Competitor Analysis Module — Planned
          </p>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed">
            This module will provide automated competitor price monitoring,
            allowing the pricing team to benchmark their prices against the
            market and identify competitive positioning opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <Clock className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-xs font-semibold text-purple-400">Planned — Future Milestone</span>
        </div>

        <div className="w-full max-w-sm mt-4 border border-[#374151] rounded-lg divide-y divide-[#374151]">
          {[
            "Competitor price tracking",
            "Price gap analysis per category",
            "Market positioning dashboard",
            "Alert system for price changes",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 px-4 py-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-400">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
