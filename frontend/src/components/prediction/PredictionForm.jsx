import React, { useState } from 'react';

const PredictionForm = ({ onSubmit, onReset, isSubmitting }) => {
  const initialState = {
    category: "Electronics",
    brand: "",
    region: "US",
    season: "Winter",
    channel: "web",
    promotion_type: "No Promotion",
    base_price: "",
    inventory_level: "",
    stockout_flag: 1, // Defaulting to 1 to match backend schema constraints for now
    demand_index: ""
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) newErrors.base_price = "Valid price required";
    if (!formData.inventory_level || parseInt(formData.inventory_level) < 0) newErrors.inventory_level = "Valid inventory required";
    if (!formData.demand_index || parseFloat(formData.demand_index) < 0) newErrors.demand_index = "Valid demand required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Convert numeric fields from strings before sending
      onSubmit({
        ...formData,
        base_price: parseFloat(formData.base_price),
        inventory_level: parseInt(formData.inventory_level),
        demand_index: parseFloat(formData.demand_index),
        stockout_flag: parseInt(formData.inventory_level) > 0 ? 0 : 1
      });
    }
  };

  const handleReset = () => {
    setFormData(initialState);
    setErrors({});
    onReset();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-4">Product Parameters</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50">
              <option>Electronics</option>
              <option>Apparel</option>
              <option>Shoes</option>
              <option>Home & Garden</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Nike" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50" />
            {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select name="region" value={formData.region} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50">
              <option>US</option>
              <option>EU</option>
              <option>APAC</option>
              <option>AU</option>
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select name="season" value={formData.season} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50">
              <option>Winter</option>
              <option>Spring</option>
              <option>Summer</option>
              <option>Fall</option>
            </select>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Channel</label>
            <select name="channel" value={formData.channel} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50">
              <option>web</option>
              <option>retail</option>
              <option>mobile</option>
            </select>
          </div>

          {/* Promotion Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
            <select name="promotion_type" value={formData.promotion_type} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50">
              <option>None</option>
              <option>No Promotion</option>
              <option>Buy One Get One</option>
              <option>Holiday Sale</option>
              <option>Clearance</option>
              <option>Member Discount</option>
            </select>
          </div>
          
          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (USD)</label>
            <input type="number" step="any" name="base_price" value={formData.base_price} onChange={handleChange} placeholder="e.g., 250" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50" />
            {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>}
          </div>

          {/* Inventory Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Level</label>
            <input type="number" name="inventory_level" value={formData.inventory_level} onChange={handleChange} placeholder="e.g., 100" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50" />
            {errors.inventory_level && <p className="text-red-500 text-xs mt-1">{errors.inventory_level}</p>}
          </div>

          {/* Demand Index */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Demand Index</label>
            <input type="number" step="any" name="demand_index" value={formData.demand_index} onChange={handleChange} placeholder="e.g., 120" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50" />
            {errors.demand_index && <p className="text-red-500 text-xs mt-1">{errors.demand_index}</p>}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t mt-6">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex-1 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Analyzing...' : 'Predict Optimal Price'}
          </button>
          <button 
            type="button" 
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
