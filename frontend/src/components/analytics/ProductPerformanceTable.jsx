import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../services/api';

export default function ProductPerformanceTable({ filters }) {
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real data from the PostgreSQL database
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/product-performance', {
          params: {
            category: filters.category,
            brand: filters.brand
          }
        });
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch product performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [filters]);

  // Handle client-side sorting of the fetched data
  const sortedData = useMemo(() => {
    let sorted = [...data];
    return sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <Minus className="inline w-3 h-3 ml-1 opacity-20" />;
    return sortOrder === 'asc' ? <ArrowUpRight className="inline w-3 h-3 ml-1 text-brand-400" /> : <ArrowDownRight className="inline w-3 h-3 ml-1 text-brand-400" />;
  };

  const getVelocityStyle = (v) => {
    switch(v) {
      case 'High': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      case 'Low': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Critical': return 'text-pink-400 bg-pink-400/10 border-pink-400/20 animate-pulse';
      case 'Stockout': return 'text-red-500 bg-red-500/10 border-red-500/20 font-black';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors" onClick={() => handleSort('name')}>
              Product {getSortIcon('name')}
            </th>
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors" onClick={() => handleSort('category')}>
              Category {getSortIcon('category')}
            </th>
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors text-right" onClick={() => handleSort('price')}>
              Price {getSortIcon('price')}
            </th>
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors text-right" onClick={() => handleSort('revenue')}>
              Revenue {getSortIcon('revenue')}
            </th>
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors text-right" onClick={() => handleSort('margin')}>
              Margin {getSortIcon('margin')}
            </th>
            <th className="p-4 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors text-right" onClick={() => handleSort('stock')}>
              Inventory {getSortIcon('stock')}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="p-8 text-center text-white/40 font-semibold">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Crunching data...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length > 0 ? sortedData.map((item, idx) => (
            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td className="p-4">
                <p className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors">{item.name}</p>
                <p className="text-xs text-white/40">{item.brand} • {item.id}</p>
              </td>
              <td className="p-4">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 border border-white/10 text-white/70">{item.category}</span>
              </td>
              <td className="p-4 text-right">
                <span className="font-bold text-sm text-white/90">${item.price.toFixed(2)}</span>
              </td>
              <td className="p-4 text-right">
                <span className="font-black text-sm text-brand-400">${item.revenue.toLocaleString()}</span>
              </td>
              <td className="p-4 text-right">
                <span className={`font-bold text-sm flex items-center justify-end gap-1 ${item.margin > 40 ? 'text-emerald-400' : item.margin < 25 ? 'text-pink-400' : 'text-white/70'}`}>
                  {item.margin}% 
                  {item.margin > 40 ? <TrendingUp size={14} /> : item.margin < 25 ? <TrendingDown size={14} /> : null}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-sm text-white/90">{item.stock.toLocaleString()}</span>
                  <span className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded border ${getVelocityStyle(item.velocity)}`}>
                    {item.velocity} Velocity
                  </span>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" className="p-8 text-center text-white/40 font-semibold">
                No products found matching the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
