import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SEASONS    = ['Spring', 'Winter', 'Summer', 'Autumn'];
const PROMOTIONS = ['No Promotion', 'Festival Offer', 'Flash Sale', 'Clearance', 'Member Offer'];

const DEMAND_OPTIONS = [
  { label: 'Low', value: 60 },
  { label: 'Medium', value: 90 },
  { label: 'High', value: 120 },
  { label: 'Very High', value: 150 },
];

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const PredictionForm = ({ onSubmit, onReset, isSubmitting }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const initialState = {
    season: 'Winter',
    promotion_type: 'No Promotion',
    inventory_level: '',
    demand_level: 'High'
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products?limit=1000');
        setProducts(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch products for prediction form", err);
      }
    };
    fetchProducts();
  }, []);

  const handleProductSelect = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    const prod = products.find(p => p.product_name === val);
    if (prod) {
      setSelectedProduct(prod);
      setFormData(prev => ({
        ...prev,
        inventory_level: prod.initial_inventory || 120
      }));
      setErrors({});
    } else {
      setSelectedProduct(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!selectedProduct) e.product_id = 'Please select a valid product';
    if (formData.inventory_level === '' || parseInt(formData.inventory_level) < 0) e.inventory_level = 'Invalid inventory';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const qty = parseInt(formData.inventory_level);
    const demandObj = DEMAND_OPTIONS.find(d => d.label === formData.demand_level) || DEMAND_OPTIONS[1];
    
    // We still pass all required fields to the backend for the ML model, 
    // even though the UI is simplified for the mentor demo.
    onSubmit({
      product_name: selectedProduct.product_name,
      brand: selectedProduct.brand || 'Unknown',
      category: selectedProduct.category || 'Unknown',
      base_price: parseFloat(selectedProduct.base_price || 0),
      cost_price: parseFloat(selectedProduct.cost_price || selectedProduct.base_price * 0.8),
      competitor_price: parseFloat(selectedProduct.competitor_price || selectedProduct.base_price * 0.95), // Default
      demand_index: demandObj.value,
      inventory_level: qty,
      promotion_type: formData.promotion_type,
      season: formData.season,
      historical_sales: parseInt(selectedProduct.historical_sales || 100),
      average_rating: parseFloat(selectedProduct.average_rating || 4.5),
      product_lifecycle: selectedProduct.product_lifecycle || 'Maturity',
    });
  };

  const handleReset = () => { 
    setFormData(initialState); 
    setSearchQuery('');
    setSelectedProduct(null);
    setErrors({}); 
    onReset(); 
  };

  const fieldBase = `w-full rounded-lg border border-gray-300 bg-white text-gray-900 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-150`;
  const labelBase = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
          
          {/* SECTION: Select Product */}
          <div>
            <label className={labelBase}>Select Product</label>
            <input 
              list="product-list" 
              value={searchQuery}
              onChange={handleProductSelect} 
              placeholder="Search Product... (e.g. Nike Air Max 270)"
              className={fieldBase}
            />
            <datalist id="product-list">
              {products.map(p => <option key={p.id} value={p.product_name} />)}
            </datalist>
            {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 1: Product Information */}
          <div>
            <label className={labelBase}>Product Information</label>
            {selectedProduct ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="flex flex-col"><span className="text-gray-500 text-xs">Brand</span><span className="font-semibold text-gray-900">{selectedProduct.brand || '—'}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 text-xs">Category</span><span className="font-semibold text-gray-900">{selectedProduct.category || '—'}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 text-xs">Base Price</span><span className="font-semibold text-gray-900">{formatINR(selectedProduct.base_price)}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 text-xs">Current Price</span><span className="font-semibold text-gray-900">{formatINR(selectedProduct.cost_price || selectedProduct.base_price * 0.95)}</span></div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-400 italic">
                Select a product to view details
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 2: Today's Market */}
          <div className={`${!selectedProduct ? 'opacity-40 pointer-events-none' : ''} transition-opacity`}>
            <label className={labelBase}>Today's Market</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white p-1">
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Demand</label>
                <select name="demand_level" value={formData.demand_level} onChange={handleChange} className={fieldBase}>
                  {DEMAND_OPTIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Inventory</label>
                <input type="number" min="0" name="inventory_level"
                  value={formData.inventory_level} onChange={handleChange}
                  placeholder="e.g., 120" className={fieldBase} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Promotion</label>
                <select name="promotion_type" value={formData.promotion_type} onChange={handleChange} className={fieldBase}>
                  {PROMOTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Season</label>
                <select name="season" value={formData.season} onChange={handleChange} className={fieldBase}>
                  {SEASONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button type="submit" disabled={isSubmitting || !selectedProduct}
            className={`flex-1 font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200
              ${(isSubmitting || !selectedProduct)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-lg shadow-black/20'}`}>
            {isSubmitting ? 'Analyzing…' : 'Predict Optimal Price'}
          </button>
          <button type="button" onClick={handleReset} disabled={isSubmitting}
            className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm
              hover:border-black hover:text-black transition-all duration-200 disabled:opacity-40 bg-white">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
