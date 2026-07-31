import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, TrendingUp, LineChart, Target, Activity, ArrowRight, BrainCircuit } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      title: "Price Prediction",
      description: "Generate highly accurate, optimal pricing recommendations dynamically based on real-time demand and shifting market conditions.",
      icon: <Target className="w-8 h-8 text-blue-500" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-1"
    },
    {
      title: "Demand Forecasting",
      description: "Predict product demand and seasonal trends with incredible forecasting accuracy using time-series AI models.",
      icon: <LineChart className="w-8 h-8 text-indigo-500" />,
      colSpan: "col-span-1"
    },
    {
      title: "Competitor Analysis",
      description: "Monitor competitor pricing, compare market positioning, and automatically detect prime pricing opportunities before your competition does.",
      icon: <Activity className="w-8 h-8 text-purple-500" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2"
    },
    {
      title: "Revenue Optimization",
      description: "Improve overall profitability through intelligent, automated pricing strategies and advanced margin optimization simulations.",
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2"
    },
  ];

  return (
    <div className="min-h-screen bg-[#111827] text-white overflow-x-hidden relative flex flex-col font-sans">
      
      {/* Navbar */}
      <nav className="w-full relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Hexagon className="text-blue-500 w-8 h-8" />
          <span className="text-2xl font-black text-gray-50 tracking-tight">
            PricePilot AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-gray-400 hover:text-white font-medium transition-colors">
            Sign In
          </Link>
          <Link to="/dashboard" className="px-6 py-2.5 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center z-10 w-full max-w-7xl mx-auto px-6 relative">
        
        <div className="w-full flex flex-col items-center justify-center pt-20 pb-32 text-center">
          {/* Hero Section */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#374151] bg-[#1F2937] mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Enterprise Pricing System</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight mb-8 max-w-6xl mx-auto text-gray-50">
            Dynamic Pricing Optimization & <br className="hidden md:block" />
            <span className="text-blue-500">
              Revenue Intelligence System
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-3xl mb-12 leading-relaxed">
            Maximize your revenue, improve profitability, and dominate market competitiveness with our machine learning driven demand forecasting and pricing platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/login" className="px-8 py-4 rounded-md bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              Launch Platform <ArrowRight size={20} />
            </Link>
            <a href="#features" className="px-8 py-4 rounded-md bg-[#1F2937] text-gray-100 font-bold text-lg hover:bg-[#374151] transition-colors border border-[#374151]">
              Explore Modules
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="w-full pt-20 pb-32 scroll-mt-20 border-t border-[#374151]">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-50">The Intelligence Core</h2>
            <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
              Our platform combines four powerful AI modules to handle everything from competitor analysis to future demand prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`ent-panel p-10 flex flex-col justify-between transition-colors relative overflow-hidden ${feature.colSpan}`}
              >
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-xl bg-[#111827] flex items-center justify-center mb-6 border border-[#374151]">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-100">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-medium">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture Flow Visual */}
        <div className="w-full py-32 border-t border-[#374151]">
           <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3 text-gray-50">
              <BrainCircuit className="text-blue-500 w-10 h-10" /> Architecture Flow
            </h2>
            <p className="text-gray-400 font-medium">How data translates into higher profitability.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-5xl mx-auto">
            
            {/* Data Sources */}
            <div className="flex-1 ent-panel p-6 text-center relative w-full md:w-auto">
              <div className="text-blue-500 font-bold mb-2">1. Data Sources</div>
              <p className="text-sm text-gray-400">Historical Sales, Inventory, Competitor Feeds</p>
            </div>

            <ArrowRight className="text-gray-600 hidden md:block w-8 h-8 flex-shrink-0" />
            <div className="h-8 w-[2px] bg-[#374151] md:hidden flex-shrink-0 my-2"></div>

            {/* AI Engine */}
            <div className="flex-1 ent-panel p-8 text-center relative w-full md:w-auto border-blue-500/50 bg-blue-500/5">
              <div className="text-blue-400 font-bold text-lg mb-2">2. ML Engine</div>
              <p className="text-sm text-gray-400">Prophet, XGBoost, Random Forest</p>
            </div>

            <ArrowRight className="text-gray-600 hidden md:block w-8 h-8 flex-shrink-0" />
            <div className="h-8 w-[2px] bg-[#374151] md:hidden flex-shrink-0 my-2"></div>

            {/* Business Outcomes */}
            <div className="flex-1 ent-panel p-6 text-center relative w-full md:w-auto border-green-500/50 bg-green-500/5">
              <div className="text-green-500 font-bold mb-2">3. Business Outcomes</div>
              <p className="text-sm text-gray-400">Higher Revenue, Strategic Pricing Decisions</p>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-[#374151] flex items-center justify-center relative z-10 bg-[#111827]">
        <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
          <Hexagon className="w-4 h-4" /> PricePilot AI © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
