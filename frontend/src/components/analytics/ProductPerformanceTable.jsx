import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ProductPerformanceTable({ filters }) {
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  // Generate mock tabular data
  const data = useMemo(() => {
    const products = [
      { id: 'P-1001', name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', brand: 'Sony', price: 299.99, revenue: 145000, margin: 42.5, stock: 1240, velocity: 'High' },
      { id: 'P-1002', name: 'Ultra HD Smart TV 65"', category: 'Electronics', brand: 'Samsung', price: 899.00, revenue: 310000, margin: 28.0, stock: 350, velocity: 'Medium' },
      { id: 'P-1003', name: 'Running Shoes Pro X', category: 'Apparel', brand: 'Nike', price: 129.99, revenue: 85000, margin: 55.2, stock: 85, velocity: 'Critical' },
      { id: 'P-1004', name: 'MacBook Pro M2', category: 'Electronics', brand: 'Apple', price: 1499.00, revenue: 520000, margin: 22.5, stock: 110, velocity: 'High' },
      { id: 'P-1005', name: 'Ergonomic Office Chair', category: 'Home Goods', brand: 'Herman Miller', price: 799.00, revenue: 64000, margin: 35.0, stock: 420, velocity: 'Low' },
      { id: 'P-1006', name: 'Hydrating Face Serum', category: 'Beauty', brand: 'L\'Oreal', price: 34.50, revenue: 12000, margin: 78.4, stock: 3500, velocity: 'Medium' },
      { id: 'P-1007', name: 'PlayStation 5 Console', category: 'Electronics', brand: 'Sony', price: 499.99, revenue: 410000, margin: 15.0, stock: 0, velocity: 'Stockout' },
      { id: 'P-1008', name: 'Yoga Mat Premium', category: 'Apparel', brand: 'Lululemon', price: 88.00, revenue: 24000, margin: 62.0, stock: 890, velocity: 'Low' },
    ];
    
    // Simulate filtering
    let filtered = products;
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(filters.category.toLowerCase()) || filters.category.toLowerCase().includes(p.category.toLowerCase().split(' ')[0]));
    }
    
    // Sort
    return filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filters, sortField, sortOrder]);

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
          {data.length > 0 ? data.map((item, idx) => (
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
