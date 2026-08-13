import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

export default function DemandForecastChart({ historicalData, forecastData }) {
  // historicalData is an array: [{ date, units_sold }]
  // forecastData contains: horizon, predicted_weekly_demand, forecast_period

  if (!historicalData || historicalData.length === 0) {
    return <div className="text-gray-500 text-sm p-4">No data available for chart.</div>;
  }

  // Build chart data
  const data = [];
  
  // 1. Add historical data points
  historicalData.forEach(item => {
    data.push({
      date: item.date,
      Actual: item.units_sold,
      Forecast: null
    });
  });

  // 2. Add forecast data points
  // We want to draw a horizontal line or continuous line for the forecast period.
  // The forecast is an aggregate over N weeks, so we plot the `predicted_weekly_demand` 
  // for the next N weeks.
  const lastHistorical = historicalData[historicalData.length - 1];
  const lastDate = new Date(lastHistorical.date);
  
  // Connect the forecast line to the last historical point visually
  const forecastStartIndex = data.length - 1;
  data[forecastStartIndex].Forecast = lastHistorical.units_sold;

  const weeks = parseInt(forecastData.forecast_period.split(' ')[0], 10);
  
  for (let i = 1; i <= weeks; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + (i * 7));
    
    data.push({
      date: futureDate.toISOString().split('T')[0],
      Actual: null,
      Forecast: forecastData.predicted_weekly_demand
    });
  }

  // The area where forecast happens
  const forecastStart = data[forecastStartIndex].date;
  const forecastEnd = data[data.length - 1].date;

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
            itemStyle={{ color: '#f9fafb' }}
            labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
          />
          
          {/* Highlight the Forecast Area */}
          <ReferenceArea 
            x1={forecastStart} 
            x2={forecastEnd} 
            fill="#4f46e5" 
            fillOpacity={0.1} 
          />

          <Line 
            type="monotone" 
            dataKey="Actual" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            name="Historical Actual"
          />
          
          <Line 
            type="stepAfter" 
            dataKey="Forecast" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Predicted Avg Weekly"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
