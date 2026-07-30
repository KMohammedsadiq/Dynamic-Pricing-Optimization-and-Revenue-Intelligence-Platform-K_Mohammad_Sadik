import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, TrendingUp, BarChart3, LineChart, Target, Zap, Activity, ArrowRight, BrainCircuit } from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const features = [
    {
      title: "Price Prediction",
      description: "Generate highly accurate, optimal pricing recommendations dynamically based on real-time demand and shifting market conditions.",
      icon: <Target className="w-8 h-8 text-brand-400" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-1"
    },
    {
      title: "Demand Forecasting",
      description: "Predict product demand and seasonal trends with incredible forecasting accuracy using time-series AI models.",
      icon: <LineChart className="w-8 h-8 text-accent-400" />,
      colSpan: "col-span-1"
    },
    {
      title: "Competitor Analysis",
      description: "Monitor competitor pricing, compare market positioning, and automatically detect prime pricing opportunities before your competition does.",
      icon: <Activity className="w-8 h-8 text-pink-400" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2"
    },
    {
      title: "Revenue Optimization",
      description: "Improve overall profitability through intelligent, automated pricing strategies and advanced margin optimization simulations.",
      icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2"
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative flex flex-col font-sans">
      {/* Background */}
      <div className="cyber-grid-bg"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="w-full relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Hexagon className="text-brand-400 w-8 h-8" />
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 tracking-tight">
            PricePilot AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-white/70 hover:text-white font-medium transition-colors">
            Sign In
          </Link>
          <Link to="/dashboard" className="px-6 py-2.5 rounded-full bg-white text-black font-bold hover:bg-brand-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center z-10 w-full max-w-7xl mx-auto px-6 relative">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col items-center justify-center pt-20 pb-32 text-center"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI-Powered Platform</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight mb-8 max-w-6xl mx-auto">
            Dynamic Pricing Optimization & <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-500">
              Revenue Intelligence System
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-white/50 font-medium max-w-3xl mb-12 leading-relaxed">
            Maximize your revenue, improve profitability, and dominate market competitiveness with our machine learning driven demand forecasting and pricing platform.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/login" className="px-8 py-4 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 text-white font-bold text-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-105 transition-all flex items-center gap-2">
              Launch Platform <ArrowRight size={20} />
            </Link>
            <a href="#features" className="px-8 py-4 rounded-full glass-panel text-white font-bold text-lg hover:bg-white/10 transition-all border border-white/10">
              Explore Modules
            </a>
          </motion.div>
        </motion.div>

        {/* Bento Grid Features */}
        <div id="features" className="w-full pt-20 pb-32 scroll-mt-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">The Intelligence Core</h2>
            <p className="text-white/50 text-lg font-medium max-w-2xl mx-auto">
              Our platform combines four powerful AI modules to handle everything from competitor analysis to future demand prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`glass-panel p-10 rounded-[2rem] flex flex-col justify-between group hover:bg-white/[0.08] transition-colors border border-white/10 relative overflow-hidden ${feature.colSpan}`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-brand-500/10 to-transparent pointer-events-none"></div>
                
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed font-medium">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Architecture Flow Visual */}
        <div className="w-full py-32 border-t border-white/10">
           <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
              <BrainCircuit className="text-brand-400 w-10 h-10" /> Architecture Flow
            </h2>
            <p className="text-white/50 font-medium">How data translates into higher profitability.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-5xl mx-auto">
            
            {/* Data Sources */}
            <div className="flex-1 glass-card p-6 border border-white/10 text-center relative w-full md:w-auto">
              <div className="text-brand-400 font-bold mb-2">1. Data Sources</div>
              <p className="text-sm text-white/50">Historical Sales, Inventory, Competitor Feeds</p>
            </div>

            <ArrowRight className="text-white/20 hidden md:block w-8 h-8 flex-shrink-0" />
            <div className="h-8 w-[2px] bg-white/20 md:hidden flex-shrink-0 my-2"></div>

            {/* AI Engine */}
            <div className="flex-1 glass-card p-8 border border-brand-500/30 bg-brand-500/5 text-center relative shadow-[0_0_30px_rgba(56,189,248,0.1)] w-full md:w-auto">
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 font-bold text-lg mb-2">2. ML Engine</div>
              <p className="text-sm text-white/60">Prophet, XGBoost, Random Forest</p>
            </div>

            <ArrowRight className="text-white/20 hidden md:block w-8 h-8 flex-shrink-0" />
            <div className="h-8 w-[2px] bg-white/20 md:hidden flex-shrink-0 my-2"></div>

            {/* Business Outcomes */}
            <div className="flex-1 glass-card p-6 border border-emerald-500/20 bg-emerald-500/5 text-center relative w-full md:w-auto">
              <div className="text-emerald-400 font-bold mb-2">3. Business Outcomes</div>
              <p className="text-sm text-white/50">Higher Revenue, Strategic Pricing Decisions</p>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/5 flex items-center justify-center relative z-10 bg-black/50 backdrop-blur-md">
        <p className="text-white/30 text-sm font-medium flex items-center gap-2">
          <Hexagon className="w-4 h-4" /> PricePilot AI © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
