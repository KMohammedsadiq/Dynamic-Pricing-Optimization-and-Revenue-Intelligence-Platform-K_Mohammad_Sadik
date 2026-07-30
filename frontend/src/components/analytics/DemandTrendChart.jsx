import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DemandTrendChart({ filters }) {
  // Generate mock time-series demand index data
  const data = useMemo(() => {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    
    return weeks.map((week, i) => {
      // Base index around 100
      let overall = 100 + (Math.sin(i * 0.5) * 15) + (i * 1.5) + (Math.random() * 8 - 4);
      let category = overall + (Math.cos(i * 0.8) * 20) + (Math.random() * 12 - 6);
      
      // If a category is selected, the category line diverges more
      if (filters.category !== 'all') {
        category += (i * 3);
      }
      
      return {
        week,
        'Overall Market Demand': Math.round(overall),
        'Category Demand': Math.round(category),
      };
    });
  }, [filters]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 backdrop-blur-md p-4 border border-white/10 shadow-2xl rounded-2xl min-w-[160px]">
          <p className="font-black text-white text-sm uppercase tracking-widest mb-3 border-b border-white/10 pb-2 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-[9px] text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 rounded">INDEX</span>
          </p>
          
          {payload.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center mt-2 gap-4">
              <span className="text-white/50 text-xs font-bold">{entry.name}</span>
              <span className="font-black text-sm" style={{ color: entry.color }}>{entry.value}</span>
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
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="week" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            domain={['auto', 'auto']}
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            formatter={(value) => <span className="text-white/70 text-xs font-semibold mr-4">{value}</span>}
          />
          <Line 
            type="monotone" 
            dataKey="Category Demand" 
            stroke="#f472b6" 
            strokeWidth={3} 
            dot={{ fill: '#f472b6', r: 4, strokeWidth: 2, stroke: '#000' }} 
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
          />
          <Line 
            type="monotone" 
            dataKey="Overall Market Demand" 
            stroke="#38bdf8" 
            strokeWidth={2} 
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
