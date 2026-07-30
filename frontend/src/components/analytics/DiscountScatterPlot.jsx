import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function DiscountScatterPlot({ filters }) {
  // Generate mock scatter plot data (Discount % vs Conversion Rate)
  const data = useMemo(() => {
    const points = [];
    for (let i = 0; i < 40; i++) {
      // Simulate correlation: Higher discount -> Higher conversion, but with diminishing returns and noise
      const discount = Math.random() * 50; // 0% to 50%
      const baseConversion = 2 + (discount * 0.15);
      const conversion = Math.max(0.5, baseConversion + (Math.random() * 3 - 1.5));
      const volume = Math.floor(Math.random() * 1000) + 100; // Bubble size
      
      points.push({
        id: `Promo-${i}`,
        discount: parseFloat(discount.toFixed(1)),
        conversion: parseFloat(conversion.toFixed(1)),
        volume,
        category: i % 3 === 0 ? 'Electronics' : i % 3 === 1 ? 'Apparel' : 'Home',
      });
    }
    return points;
  }, [filters]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/95 backdrop-blur-md p-4 border border-white/10 shadow-2xl rounded-2xl min-w-[180px]">
          <p className="font-black text-white text-sm mb-3 border-b border-white/10 pb-2 flex justify-between items-center">
            <span>{data.id}</span>
            <span className="text-[10px] text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{data.category}</span>
          </p>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Discount</span>
              <span className="font-black text-pink-400 text-sm">{data.discount}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Conversion</span>
              <span className="font-black text-emerald-400 text-sm">{data.conversion}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Volume</span>
              <span className="font-bold text-white/80 text-sm">{data.volume} units</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            type="number" 
            dataKey="discount" 
            name="Discount" 
            unit="%" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            type="number" 
            dataKey="conversion" 
            name="Conversion" 
            unit="%" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <ZAxis type="number" dataKey="volume" range={[40, 400]} name="Volume" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
          <Scatter name="Promotions" data={data} fill="#f472b6" fillOpacity={0.6} stroke="#f472b6" strokeWidth={1} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
