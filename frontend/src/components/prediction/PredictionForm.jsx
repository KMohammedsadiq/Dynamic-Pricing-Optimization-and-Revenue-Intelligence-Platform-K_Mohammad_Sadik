import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SEASONS    = ['Spring', 'Summer', 'Autumn', 'Winter'];
const PROMOTIONS = ['No Promotion', 'Festival Offer', 'Flash Sale', 'Clearance', 'Percentage Discount', 'Buy One Get One', 'Member Offer'];
const LIFECYCLES = ['Introduction', 'Growth', 'Maturity', 'Decline', 'End of Life'];

const DEMAND_OPTIONS = [
  { label: 'Low',       value: 30  },
  { label: 'Medium',    value: 60  },
  { label: 'High',      value: 90  },
  { label: 'Very High', value: 120 },
];

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

/* ── shared input style ── */
const INPUT = 'w-full border border-gray-700 bg-gray-800 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500';
const LABEL = 'block text-xs font-medium text-gray-400 mb-1';
const SECTION_TITLE = 'text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3';

const PredictionForm = ({ onSubmit, onReset, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

  // Common State
  const [errors, setErrors] = useState({});

  // Existing Product State
  const [products,        setProducts]        = useState([]);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const initialExistingState = {
    promotion_type:  'No Promotion',
    inventory_level: '',
    demand_level:    'High',
    competitor_price: '',
  };
  const [existingData, setExistingData] = useState(initialExistingState);

  // New Product State
  const initialNewState = {
    product_name: '',
    brand: '',
    category: '',
    product_lifecycle: 'Introduction',
    cost_price: '',
    current_price: '',
    competitor_price: '',
    demand_level: 'High',
    inventory_level: '',
    promotion_type: 'No Promotion',
    season: SEASONS[0],
    historical_sales: '',
    average_rating: ''
  };
  const [newData, setNewData] = useState(initialNewState);

  useEffect(() => {
    api.get('/products?limit=1000')
      .then(r => setProducts(r.data.data || []))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  const handleProductSelect = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const prod = products.find(p => p.product_name === val);
    if (prod) {
      setSelectedProduct(prod);
      setExistingData(prev => ({
        ...prev,
        inventory_level:  prod.initial_inventory   || 120,
        competitor_price: prod.competitor_price     || (prod.base_price ? (prod.base_price * 0.95).toFixed(2) : ''),
      }));
      setErrors({});
    } else {
      setSelectedProduct(null);
    }
  };

  const handleExistingChange = (e) => {
    const { name, value } = e.target;
    setExistingData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (activeTab === 'existing') {
      if (!selectedProduct) e.product = 'Select a valid product';
      if (existingData.inventory_level === '' || +existingData.inventory_level < 0) e.inventory = 'Enter a valid inventory number';
    } else {
      if (!newData.product_name.trim()) e.product_name = 'Required';
      if (!newData.brand.trim()) e.brand = 'Required';
      if (!newData.category.trim()) e.category = 'Required';
      if (!newData.cost_price || +newData.cost_price <= 0) e.cost_price = 'Must be > 0';
      if (!newData.competitor_price || +newData.competitor_price <= 0) e.competitor_price = 'Must be > 0';
      if (newData.inventory_level === '' || +newData.inventory_level < 0) e.inventory_level = 'Must be ≥ 0';
      if (newData.average_rating !== '' && (+newData.average_rating < 0 || +newData.average_rating > 5)) e.average_rating = '0-5 only';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (activeTab === 'existing') {
      const demandObj = DEMAND_OPTIONS.find(d => d.label === existingData.demand_level) || DEMAND_OPTIONS[2];
      onSubmit({
        is_new_product: false,
        product_name:    selectedProduct.product_name,
        current_price:   parseFloat(selectedProduct.current_price || selectedProduct.base_price * 0.95 || 0),
        demand_index:    demandObj.value,
        inventory_level: parseInt(existingData.inventory_level),
        competitor_price: parseFloat(existingData.competitor_price || selectedProduct.base_price * 0.95 || 0),
        promotion_type:  existingData.promotion_type,
      });
    } else {
      const demandObj = DEMAND_OPTIONS.find(d => d.label === newData.demand_level) || DEMAND_OPTIONS[2];
      onSubmit({
        is_new_product: true,
        product_name: newData.product_name,
        brand: newData.brand,
        category: newData.category,
        product_lifecycle: newData.product_lifecycle,
        cost_price: parseFloat(newData.cost_price),
        current_price: newData.current_price ? parseFloat(newData.current_price) : undefined,
        competitor_price: parseFloat(newData.competitor_price),
        demand_index: demandObj.value,
        inventory_level: parseInt(newData.inventory_level),
        promotion_type: newData.promotion_type,
        season: newData.season,
        historical_sales: newData.historical_sales !== '' ? parseInt(newData.historical_sales) : undefined,
        average_rating: newData.average_rating !== '' ? parseFloat(newData.average_rating) : undefined,
      });
    }
  };

  const handleResetClick = () => {
    if (activeTab === 'existing') {
      setExistingData(initialExistingState);
      setSearchQuery('');
      setSelectedProduct(null);
    } else {
      setNewData(initialNewState);
    }
    setErrors({});
    onReset();
  };

  const isSubmitDisabled = isSubmitting || (activeTab === 'existing' && !selectedProduct);

  return (
    <div className="flex flex-col xl:h-full bg-gray-900">
      
      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-800 flex-shrink-0">
        <button
          type="button"
          onClick={() => { setActiveTab('existing'); setErrors({}); }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'existing' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          Existing Product
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('new'); setErrors({}); }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'new' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          New Product
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 xl:overflow-hidden">
        
        <div className="flex-1 xl:overflow-y-auto custom-scrollbar">
          {activeTab === 'existing' ? (
            /* ── EXISTING PRODUCT FLOW ── */
            <>
              {/* Section: Select Product */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-800">
                <p className={SECTION_TITLE}>Select Product</p>
                <input
                  list="product-list"
                  value={searchQuery}
                  onChange={handleProductSelect}
                  placeholder="Type product name…"
                  className={INPUT}
                  id="product-search"
                />
                <datalist id="product-list">
                  {products.map(p => <option key={p.id} value={p.product_name} />)}
                </datalist>
                {errors.product && <p className="text-red-400 text-xs mt-1">{errors.product}</p>}
              </div>

              {/* Section: Product Information */}
              <div className="px-5 py-4 border-b border-gray-800">
                <p className={SECTION_TITLE}>Product Information</p>
                {selectedProduct ? (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="py-1.5 text-xs text-gray-500 w-1/2">Product Name</td>
                        <td className="py-1.5 text-xs font-medium text-gray-200 text-right">{selectedProduct.product_name}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-xs text-gray-500">Brand</td>
                        <td className="py-1.5 text-xs font-medium text-gray-200 text-right">{selectedProduct.brand || '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-xs text-gray-500">Category</td>
                        <td className="py-1.5 text-xs font-medium text-gray-200 text-right">{selectedProduct.category || '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-xs text-gray-500">Cost Price</td>
                        <td className="py-1.5 text-xs font-medium text-gray-200 text-right">{formatINR(selectedProduct.cost_price)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-xs text-gray-500">Current Selling Price</td>
                        <td className="py-1.5 text-xs font-semibold text-blue-400 text-right">{formatINR(selectedProduct.current_price || selectedProduct.base_price * 0.95 || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-600 italic">Select a product above to view details</p>
                )}
              </div>

              {/* Section: Market Conditions */}
              <div className={`px-5 py-4 ${!selectedProduct ? 'opacity-40 pointer-events-none' : ''}`}>
                <p className={SECTION_TITLE}>Today's Market Conditions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Demand</label>
                    <select name="demand_level" value={existingData.demand_level} onChange={handleExistingChange} className={INPUT}>
                      {DEMAND_OPTIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Inventory (units)</label>
                    <input type="number" min="0" name="inventory_level" value={existingData.inventory_level} onChange={handleExistingChange} placeholder="e.g. 120" className={INPUT} />
                    {errors.inventory && <p className="text-red-400 text-xs mt-1">{errors.inventory}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Promotion</label>
                    <select name="promotion_type" value={existingData.promotion_type} onChange={handleExistingChange} className={INPUT}>
                      {PROMOTIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Competitor Price (₹)</label>
                    <input type="number" min="0" step="0.01" name="competitor_price" value={existingData.competitor_price} onChange={handleExistingChange} placeholder="e.g. 15000" className={INPUT} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── NEW PRODUCT FLOW ── */
            <>
              {/* Section: Product Information */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-800">
                <p className={SECTION_TITLE}>Product Information</p>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Product Name</label>
                    <input type="text" name="product_name" value={newData.product_name} onChange={handleNewChange} className={INPUT} placeholder="e.g. Apple iPhone 18 Pro" />
                    {errors.product_name && <p className="text-red-400 text-xs mt-1">{errors.product_name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Brand</label>
                      <input type="text" name="brand" value={newData.brand} onChange={handleNewChange} className={INPUT} placeholder="e.g. Apple" />
                      {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
                    </div>
                    <div>
                      <label className={LABEL}>Category</label>
                      <input type="text" name="category" value={newData.category} onChange={handleNewChange} className={INPUT} placeholder="e.g. Electronics" />
                      {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Product Lifecycle</label>
                    <select name="product_lifecycle" value={newData.product_lifecycle} onChange={handleNewChange} className={INPUT}>
                      {LIFECYCLES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Pricing Information */}
              <div className="px-5 py-4 border-b border-gray-800">
                <p className={SECTION_TITLE}>Pricing Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Cost Price (₹)</label>
                    <input type="number" min="0" step="0.01" name="cost_price" value={newData.cost_price} onChange={handleNewChange} className={INPUT} placeholder="e.g. 75000" />
                    {errors.cost_price && <p className="text-red-400 text-xs mt-1">{errors.cost_price}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Competitor Price (₹)</label>
                    <input type="number" min="0" step="0.01" name="competitor_price" value={newData.competitor_price} onChange={handleNewChange} className={INPUT} placeholder="e.g. 97000" />
                    {errors.competitor_price && <p className="text-red-400 text-xs mt-1">{errors.competitor_price}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Current Selling Price (₹) <span className="text-gray-500 font-normal ml-1">— Optional</span></label>
                    <input type="number" min="0" step="0.01" name="current_price" value={newData.current_price} onChange={handleNewChange} className={INPUT} placeholder="Leave empty for Cost × 1.20" />
                  </div>
                </div>
              </div>

              {/* Section: Market Conditions */}
              <div className="px-5 py-4">
                <p className={SECTION_TITLE}>Market Conditions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Demand</label>
                    <select name="demand_level" value={newData.demand_level} onChange={handleNewChange} className={INPUT}>
                      {DEMAND_OPTIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Inventory</label>
                    <input type="number" min="0" name="inventory_level" value={newData.inventory_level} onChange={handleNewChange} className={INPUT} placeholder="e.g. 150" />
                    {errors.inventory_level && <p className="text-red-400 text-xs mt-1">{errors.inventory_level}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Promotion</label>
                    <select name="promotion_type" value={newData.promotion_type} onChange={handleNewChange} className={INPUT}>
                      {PROMOTIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Season</label>
                    <select name="season" value={newData.season} onChange={handleNewChange} className={INPUT}>
                      {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Historical Sales <span className="text-gray-500 font-normal ml-1">— Optional</span></label>
                    <input type="number" min="0" name="historical_sales" value={newData.historical_sales} onChange={handleNewChange} className={INPUT} placeholder="Default: 0" />
                  </div>
                  <div>
                    <label className={LABEL}>Average Rating <span className="text-gray-500 font-normal ml-1">— Optional</span></label>
                    <input type="number" min="0" max="5" step="0.1" name="average_rating" value={newData.average_rating} onChange={handleNewChange} className={INPUT} placeholder="0-5. Default: 0" />
                    {errors.average_rating && <p className="text-red-400 text-xs mt-1">{errors.average_rating}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="px-5 py-4 bg-gray-900 border-t border-gray-800 flex gap-2 flex-shrink-0">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`flex-1 text-sm font-medium py-2.5 rounded transition-colors
              ${isSubmitDisabled
                ? 'bg-blue-900 text-blue-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isSubmitting ? 'Analyzing…' : 'Predict Optimal Price'}
          </button>
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-400 border border-gray-700 rounded hover:border-gray-500 hover:text-gray-200 transition-colors disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
