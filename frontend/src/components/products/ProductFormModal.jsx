import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, DollarSign, Tag, Info, AlertCircle } from 'lucide-react';

export default function ProductFormModal({ isOpen, onClose, onSave, product = null, isLoading = false }) {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    brand: '',
    base_price: '',
    cost_price: '',
    initial_inventory: '',
    description: '',
    product_id: '', // SKU
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        category: product.category || '',
        brand: product.brand || '',
        base_price: product.base_price || '',
        cost_price: product.cost_price || '',
        initial_inventory: product.initial_inventory || 0,
        description: product.description || '',
        product_id: product.product_id || '',
        status: product.status || 'Active'
      });
    } else {
      setFormData({
        product_name: '',
        category: '',
        brand: '',
        base_price: '',
        cost_price: '',
        initial_inventory: '0',
        description: '',
        product_id: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product_name) newErrors.product_name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }
    if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = 'Cost price cannot be negative';
    }
    if (formData.initial_inventory && parseInt(formData.initial_inventory, 10) < 0) {
      newErrors.initial_inventory = 'Inventory cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border border-white/10 rounded-[2rem] shadow-2xl bg-[#0f172a]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Package className="w-6 h-6 text-brand-400" />
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Core Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Core Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Product Name *</label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    placeholder="E.g. Wireless Noise-Cancelling Headphones"
                    className={`w-full bg-black/40 border ${errors.product_name ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors`}
                  />
                  {errors.product_name && <p className="text-red-400 text-xs mt-1">{errors.product_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    disabled={isEditing}
                    placeholder={isEditing ? formData.product_id : "Auto-generated if blank"}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="E.g. Electronics"
                    className={`w-full bg-black/40 border ${errors.category ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors`}
                  />
                  {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="E.g. Sony"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full my-4"></div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Pricing & Inventory
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Base Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full bg-black/40 border ${errors.base_price ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors`}
                    />
                  </div>
                  {errors.base_price && <p className="text-red-400 text-xs mt-1">{errors.base_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full bg-black/40 border ${errors.cost_price ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors`}
                    />
                  </div>
                  {errors.cost_price && <p className="text-red-400 text-xs mt-1">{errors.cost_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Initial Inventory</label>
                  <input
                    type="number"
                    name="initial_inventory"
                    value={formData.initial_inventory}
                    onChange={handleChange}
                    placeholder="0"
                    className={`w-full bg-black/40 border ${errors.initial_inventory ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors`}
                  />
                  {errors.initial_inventory && <p className="text-red-400 text-xs mt-1">{errors.initial_inventory}</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full my-4"></div>

            {/* Status & Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Status & Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-white/70 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  placeholder="Enter product description..."
                ></textarea>
              </div>
            </div>

            {/* Notice about AI fields */}
            <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-200/80">
                <strong>Note:</strong> Advanced metrics (Revenue, Units Sold, Demand Index, etc.) are generated automatically by historical imports and the AI analytics engine. They cannot be manually edited here.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl text-white/70 hover:bg-white/10 font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isEditing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
