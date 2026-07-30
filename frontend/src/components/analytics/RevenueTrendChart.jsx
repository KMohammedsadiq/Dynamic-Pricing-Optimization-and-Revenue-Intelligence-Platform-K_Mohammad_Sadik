import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueTrendChart({ filters }) {
  // Generate mock time-series data based on filters to simulate interactivity
  const data = useMemo(() => {
    const baseVal = filters.category === 'all' ? 100000 : 40000;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, i) => {
      // Add some random variance based on the filter length to simulate different data sets
      const variance = (i * 1000) + (filters.brand.length * 500) + (Math.random() * 15000 - 5000);
      const isProjected = i > 8; // Simulate future projection
      
      return {
        month,
        revenue: Math.max(0, baseVal + variance),
        projected: isProjected ? Math.max(0, baseVal + variance * 1.2) : null,
      };
    });
  }, [filters]);

  const formatCompact = (n) => 
    new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 backdrop-blur-md p-4 border border-white/10 shadow-2xl rounded-2xl min-w-[160px]">
          <p className="font-black text-white text-sm uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
          
          {payload.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center mt-2">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{entry.name}</span>
              <span className="font-bold text-sm" style={{ color: entry.color }}>${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            tickFormatter={(v) => `$${formatCompact(v)}`} 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            name="Actual Revenue"
            stroke="#38bdf8" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRev)" 
            activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="projected" 
            name="AI Projection"
            stroke="#8b5cf6" 
            strokeWidth={3}
            strokeDasharray="5 5"
            fillOpacity={1} 
            fill="url(#colorProj)" 
            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
