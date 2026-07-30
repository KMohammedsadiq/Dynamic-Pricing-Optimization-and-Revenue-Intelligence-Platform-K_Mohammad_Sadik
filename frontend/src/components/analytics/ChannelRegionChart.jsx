import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ChannelRegionChart({ filters }) {
  // Generate mock stacked bar data
  const data = useMemo(() => {
    return [
      { name: 'North America', online: 45000, retail: 22000, wholesale: 15000 },
      { name: 'Europe', online: 32000, retail: 18000, wholesale: 11000 },
      { name: 'Asia Pacific', online: 55000, retail: 28000, wholesale: 21000 },
      { name: 'Latin America', online: 18000, retail: 9000, wholesale: 5000 },
    ].map(d => {
      // Apply some random variance based on filters to simulate interactivity
      const multiplier = filters.category === 'all' ? 1 : 0.4;
      return {
        name: d.name,
        'Online D2C': Math.round(d.online * multiplier + (Math.random() * 5000)),
        'Retail Partners': Math.round(d.retail * multiplier + (Math.random() * 3000)),
        'Wholesale': Math.round(d.wholesale * multiplier + (Math.random() * 2000)),
      };
    });
  }, [filters]);

  const formatCompact = (n) => 
    new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      
      return (
        <div className="bg-black/95 backdrop-blur-md p-4 border border-white/10 shadow-2xl rounded-2xl min-w-[180px]">
          <p className="font-black text-white text-sm uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
          
          {payload.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center mt-2">
              <span className="text-white/50 text-xs font-bold tracking-wider">{entry.name}</span>
              <span className="font-bold text-sm" style={{ color: entry.color }}>${entry.value.toLocaleString()}</span>
            </div>
          ))}
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
            <span className="text-white text-xs font-black uppercase tracking-widest">Total</span>
            <span className="text-white font-black text-sm">${total.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            tickFormatter={(v) => `$${formatCompact(v)}`} 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span className="text-white/70 text-xs font-semibold mr-4">{value}</span>}
          />
          <Bar dataKey="Online D2C" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Retail Partners" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Wholesale" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
