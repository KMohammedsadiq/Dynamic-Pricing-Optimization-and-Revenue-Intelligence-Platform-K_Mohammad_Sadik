import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SeasonalPerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-lg">
          <p className="font-semibold text-gray-700 capitalize mb-1">{label}</p>
          <p className="text-teal-600 text-sm">
            Revenue: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {payload[1] && (
            <p className="text-orange-500 text-sm">
              Demand Score: {payload[1].value.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Helper to format large numbers like 600000000 to "600M"
  const formatCompactNumber = (number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(number);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Seasonal Performance</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="season" 
              tick={{ fill: '#475569', fontSize: 12, textTransform: 'capitalize' }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => `$${formatCompactNumber(value)}`}
              tick={{ fill: '#475569', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#475569', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="total_revenue" name="Total Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="average_demand" name="Avg Demand Score" stroke="#f97316" strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
