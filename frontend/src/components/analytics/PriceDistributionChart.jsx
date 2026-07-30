import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceDistributionChart({ filters }) {
  // Generate mock histogram data (bell curve distribution)
  const data = useMemo(() => {
    // Generate buckets based on filters
    const buckets = [
      { range: '$0-$50', count: 120 },
      { range: '$51-$100', count: 350 },
      { range: '$101-$150', count: 680 },
      { range: '$151-$200', count: 890 },
      { range: '$201-$250', count: 540 },
      { range: '$251-$300', count: 210 },
      { range: '$301+', count: 85 },
    ];
    
    return buckets.map(b => {
      const multiplier = filters.category === 'all' ? 1 : 0.3;
      return {
        ...b,
        count: Math.max(10, Math.round(b.count * multiplier + (Math.random() * 50 - 25))),
      };
    });
  }, [filters]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 backdrop-blur-md p-4 border border-white/10 shadow-2xl rounded-2xl min-w-[150px]">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Price Range</p>
          <p className="font-black text-white text-lg mb-3">{label}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-xs font-bold">Products</span>
            <span className="font-black text-emerald-400 text-base">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="range" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
            angle={-35}
            textAnchor="end"
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar 
            dataKey="count" 
            fill="url(#colorDist)" 
            radius={[4, 4, 0, 0]} 
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
