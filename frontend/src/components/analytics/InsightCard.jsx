import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Minus } from 'lucide-react';

export default function InsightCard({ insight, delay = 0 }) {
  
  const getStyle = () => {
    switch (insight.type) {
      case 'positive':
        return {
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/20',
          icon: <ArrowUpRight className="text-emerald-400" size={18} />,
          title: 'text-emerald-400',
          gradient: 'from-emerald-500/10 to-transparent'
        };
      case 'negative':
        return {
          bg: 'bg-pink-500/5',
          border: 'border-pink-500/20',
          icon: <ArrowRight className="text-pink-400 rotate-45" size={18} />,
          title: 'text-pink-400',
          gradient: 'from-pink-500/10 to-transparent'
        };
      case 'neutral':
      default:
        return {
          bg: 'bg-brand-500/5',
          border: 'border-brand-500/20',
          icon: <Minus className="text-brand-400" size={18} />,
          title: 'text-brand-400',
          gradient: 'from-brand-500/10 to-transparent'
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative p-5 rounded-3xl border ${style.border} ${style.bg} overflow-hidden group cursor-default hover:scale-[1.02] transition-transform`}
    >
      <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${style.gradient} opacity-50`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-xs font-black uppercase tracking-widest ${style.title}`}>{insight.title}</h4>
          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
            {style.icon}
          </div>
        </div>
        
        <p className="text-white/90 font-medium text-sm leading-relaxed flex-1">
          {insight.text}
        </p>
      </div>
    </motion.div>
  );
}
