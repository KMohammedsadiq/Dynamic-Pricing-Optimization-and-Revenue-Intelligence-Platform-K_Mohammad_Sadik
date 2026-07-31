import React from 'react';
import { FilterX, Search, SlidersHorizontal } from 'lucide-react';

export default function AnalyticsFilters({ filters, onApply, onReset, isFiltering }) {
  // We'll keep local state for the form so we don't apply on every click, only when 'Apply Filters' is pressed.
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({
      dateRange: 'this_month',
      category: 'all',
      brand: 'all',
      region: 'all',
      season: 'all',
      promotion: 'all'
    });
    onReset();
  };

  const SelectInput = ({ label, id, options, value, onChange }) => (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[130px]">
      <label htmlFor={id} className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 outline-none focus:border-brand-400 focus:bg-white/10 transition-all appearance-none cursor-pointer"
        style={{ colorScheme: 'dark', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff80\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
      >
        {options.map(opt => <option key={opt.value} value={opt.value} style={{ background: '#0f172a', color: '#fff' }}>{opt.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-400 to-accent-400"></div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="flex-1 w-full flex flex-wrap gap-4">
          
          <SelectInput 
            label="Date Range" id="dateRange" value={localFilters.dateRange} onChange={(val) => handleChange('dateRange', val)}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'this_week', label: 'This Week' },
              { value: 'this_month', label: 'This Month' },
              { value: 'this_quarter', label: 'This Quarter' },
              { value: 'this_year', label: 'This Year' }
            ]}
          />
          
          <SelectInput 
            label="Category" id="category" value={localFilters.category} onChange={(val) => handleChange('category', val)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Accessories', label: 'Accessories' },
              { value: 'Apparel', label: 'Apparel' },
              { value: 'Beauty', label: 'Beauty' },
              { value: 'Electronics', label: 'Electronics' },
              { value: 'Groceries', label: 'Groceries' },
              { value: 'Home', label: 'Home' },
              { value: 'Shoes', label: 'Shoes' },
              { value: 'Sports', label: 'Sports' }
            ]}
          />

          <SelectInput 
            label="Brand" id="brand" value={localFilters.brand} onChange={(val) => handleChange('brand', val)}
            options={[
              { value: 'all', label: 'All Brands' },
              { value: 'Adidas', label: 'Adidas' },
              { value: 'Apple', label: 'Apple' },
              { value: 'Asics', label: 'Asics' },
              { value: 'Bose', label: 'Bose' },
              { value: 'Coach', label: 'Coach' },
              { value: 'DailyFresh', label: 'DailyFresh' },
              { value: 'Decathlon', label: 'Decathlon' },
              { value: 'Dove', label: 'Dove' },
              { value: 'Fitbit', label: 'Fitbit' },
              { value: 'Fossil', label: 'Fossil' },
              { value: 'FreshFarm', label: 'FreshFarm' },
              { value: 'GreatValue', label: 'GreatValue' },
              { value: 'H&M', label: 'H&M' },
              { value: 'HomeGoods', label: 'HomeGoods' },
              { value: 'Ikea', label: 'Ikea' },
              { value: 'Loreal', label: 'Loreal' },
              { value: 'Mainstays', label: 'Mainstays' },
              { value: 'Maybelline', label: 'Maybelline' },
              { value: 'NatureBest', label: 'NatureBest' },
              { value: 'Neutrogena', label: 'Neutrogena' },
              { value: 'New Balance', label: 'New Balance' },
              { value: 'Nike', label: 'Nike' },
              { value: 'Olay', label: 'Olay' },
              { value: 'OrganicCo', label: 'OrganicCo' },
              { value: 'Puma', label: 'Puma' },
              { value: 'Ray-Ban', label: 'Ray-Ban' },
              { value: 'Samsung', label: 'Samsung' },
              { value: 'Sony', label: 'Sony' },
              { value: 'Spalding', label: 'Spalding' },
              { value: 'Target', label: 'Target' },
              { value: 'Under Armour', label: 'Under Armour' },
              { value: 'Wayfair', label: 'Wayfair' },
              { value: 'Wilson', label: 'Wilson' }
            ]}
          />

          <SelectInput 
            label="Region" id="region" value={localFilters.region} onChange={(val) => handleChange('region', val)}
            options={[
              { value: 'all', label: 'Global' },
              { value: 'AU', label: 'AU' },
              { value: 'CA', label: 'CA' },
              { value: 'DE', label: 'DE' },
              { value: 'IN', label: 'IN' },
              { value: 'UK', label: 'UK' },
              { value: 'US', label: 'US' }
            ]}
          />

          <SelectInput 
            label="Season" id="season" value={localFilters.season} onChange={(val) => handleChange('season', val)}
            options={[
              { value: 'all', label: 'All Seasons' },
              { value: 'Spring', label: 'Spring' },
              { value: 'Winter', label: 'Winter' }
            ]}
          />

          <SelectInput 
            label="Promotion" id="promotion" value={localFilters.promotion} onChange={(val) => handleChange('promotion', val)}
            options={[
              { value: 'all', label: 'All Promotions' },
              { value: 'None', label: 'None' },
              { value: 'Holiday', label: 'Holiday' },
              { value: 'Clearance', label: 'Clearance' }
            ]}
          />
          
        </div>

        <div className="flex gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          <button 
            onClick={handleReset}
            disabled={isFiltering}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
          >
            <FilterX size={16} />
            Reset
          </button>
          
          <button 
            onClick={handleApply}
            disabled={isFiltering}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-white transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] text-sm font-bold relative overflow-hidden group"
          >
            {isFiltering ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <SlidersHorizontal size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
            {isFiltering ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}
