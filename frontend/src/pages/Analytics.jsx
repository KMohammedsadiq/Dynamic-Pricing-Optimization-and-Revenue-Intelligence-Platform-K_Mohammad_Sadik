import React, { useState } from 'react';
import { Download, Printer, FilterX, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// Component Imports
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';
import RevenueTrendChart from '../components/analytics/RevenueTrendChart';
import ChannelRegionChart from '../components/analytics/ChannelRegionChart';
import PriceDistributionChart from '../components/analytics/PriceDistributionChart';
import DiscountScatterPlot from '../components/analytics/DiscountScatterPlot';
import ProductPerformanceTable from '../components/analytics/ProductPerformanceTable';
import DemandTrendChart from '../components/analytics/DemandTrendChart';
import InsightCard from '../components/analytics/InsightCard';

export default function Analytics() {
  const [filters, setFilters] = useState({
    dateRange: 'this_month',
    category: 'all',
    brand: 'all',
    region: 'all',
    season: 'all',
    promotion: 'all'
  });

  const [isFiltering, setIsFiltering] = useState(false);

  // Mock data for insights
  const insights = [
    { title: "Top Performing Category", text: "Electronics generated 18% higher revenue than the average category.", type: "positive" },
    { title: "Seasonal Demand", text: "Winter season produced the highest sales volume across all regions.", type: "neutral" },
    { title: "Promotion Effectiveness", text: "Flash Sale campaigns generated the highest conversion rate (14.2%).", type: "positive" },
    { title: "Regional Contribution", text: "North America region contributed 42% of the total revenue this quarter.", type: "neutral" }
  ];

  const handleApplyFilters = (newFilters) => {
    setIsFiltering(true);
    setTimeout(() => {
      setFilters(newFilters);
      setIsFiltering(false);
    }, 600); // Simulate API latency
  };

  const handleResetFilters = () => {
    handleApplyFilters({
      dateRange: 'this_month',
      category: 'all',
      brand: 'all',
      region: 'all',
      season: 'all',
      promotion: 'all'
    });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full pb-24 h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">
            Business Intelligence
          </h1>
          <p className="text-white/50 text-sm mt-1">Deep analytics and reporting module.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-all border border-white/10 text-sm font-semibold group relative">
            <Download size={16} className="group-hover:-translate-y-1 transition-transform" />
            Export CSV
            <span className="absolute -top-3 -right-2 bg-brand-500 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full rotate-12 shadow-lg">Soon</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-all border border-white/10 text-sm font-semibold group relative">
            <Download size={16} className="group-hover:-translate-y-1 transition-transform" />
            Export PDF
            <span className="absolute -top-3 -right-2 bg-brand-500 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full rotate-12 shadow-lg">Soon</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-all border border-white/10 text-sm font-semibold group relative">
            <Printer size={16} className="group-hover:scale-110 transition-transform" />
            Print Report
            <span className="absolute -top-3 -right-2 bg-pink-500 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full -rotate-12 shadow-lg">Soon</span>
          </button>
        </div>
      </div>

      {/* Section 1: Business Filters */}
      <div className="mb-8">
        <AnalyticsFilters 
          filters={filters} 
          onApply={handleApplyFilters} 
          onReset={handleResetFilters} 
          isFiltering={isFiltering}
        />
      </div>

      <div className={`transition-opacity duration-500 ${isFiltering ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Section 6: Business Intelligence Insights (Placed at top for quick summary) */}
        <div className="mb-8">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2"><Search className="text-brand-400" size={20} /> Smart Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} delay={idx * 0.1} />
            ))}
          </div>
        </div>

        {/* Section 2: Revenue Analytics */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-4">Revenue Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/10">
              <h3 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-6">Monthly Revenue Trend</h3>
              <RevenueTrendChart filters={filters} />
            </div>
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <h3 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-6">Revenue by Channel & Region</h3>
              <ChannelRegionChart filters={filters} />
            </div>
          </div>
        </div>

        {/* Section 3: Pricing Analytics */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-4">Pricing Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <h3 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-6">Price Distribution</h3>
              <PriceDistributionChart filters={filters} />
            </div>
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <h3 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-6">Discount Effectiveness</h3>
              <DiscountScatterPlot filters={filters} />
            </div>
          </div>
        </div>

        {/* Section 4: Product Performance */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-4">Product Performance</h2>
          <div className="glass-card p-0 rounded-3xl border border-white/10 overflow-hidden">
            <ProductPerformanceTable filters={filters} />
          </div>
        </div>

        {/* Section 5: Demand Analytics */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-4">Demand Analytics (AI Integration)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
              <h3 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-6">Demand Trend Index</h3>
              <DemandTrendChart filters={filters} />
            </div>
            
            {/* Future Integration Placeholders */}
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 rounded-3xl border border-white/10 flex-1 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-accent-500/10 z-0"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h4 className="text-white font-bold mb-1">AI Price Prediction</h4>
                  <p className="text-white/40 text-xs">Forecast module coming soon</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-3xl border border-white/10 flex-1 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 z-0"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h4 className="text-white font-bold mb-1">Forecast Accuracy</h4>
                  <p className="text-white/40 text-xs">ML Validation coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
