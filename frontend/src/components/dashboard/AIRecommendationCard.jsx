import React from "react";
import { Sparkles, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";

export default function AIRecommendationCard() {
  return (
    <div 
      className="relative w-full rounded-3xl p-[1px] mb-8 overflow-hidden group"
      style={{
        background: 'linear-gradient(90deg, rgba(168,85,247,0.5), rgba(56,189,248,0.5), rgba(168,85,247,0.5))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s linear infinite',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-sky-500/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-[#09090b] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 justify-between z-10 backdrop-blur-xl">
        
        {/* Left Section: AI Insights */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-sky-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                PricePilot AI <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase tracking-widest text-white/50 border border-white/10">Active</span>
              </h2>
            </div>
          </div>
          
          <p className="text-white/70 font-medium text-lg max-w-2xl leading-relaxed">
            <strong className="text-white">Today's Insight:</strong> High demand detected in <strong className="text-sky-400">Apparel</strong> (+14% search volume). We recommend a strategic price increase on premium items to maximize margins before the weekend rush.
          </p>
        </div>

        {/* Right Section: The Recommendation */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/5 border border-white/10 p-5 rounded-2xl w-full md:w-auto">
          
          {/* Prices */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Current</p>
              <p className="text-2xl font-bold text-white/60 line-through decoration-white/30">$198</p>
            </div>
            
            <ArrowRight className="text-white/20 w-6 h-6" />
            
            <div className="text-center">
              <p className="text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">Suggested</p>
              <p className="price-text text-3xl font-black">$212</p>
            </div>
          </div>

          <div className="w-px h-12 bg-white/10 hidden sm:block"></div>

          {/* Impact */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Expected Revenue</span>
              <span className="flex items-center text-emerald-400 font-black bg-emerald-400/10 px-2 py-1 rounded-lg text-sm border border-emerald-400/20">
                <TrendingUp className="w-4 h-4 mr-1" /> +8.2%
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">AI Confidence</span>
              <span className="flex items-center text-purple-400 font-black bg-purple-400/10 px-2 py-1 rounded-lg text-sm border border-purple-400/20">
                <ShieldCheck className="w-4 h-4 mr-1" /> 91%
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
