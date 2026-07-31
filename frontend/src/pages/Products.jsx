import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Edit2, Trash2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

import ProductFormModal from "../components/products/ProductFormModal";
import DeleteConfirmationModal from "../components/products/DeleteConfirmationModal";

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Toast / Messages
  const [toastMessage, setToastMessage] = useState(location.state?.uploadSuccess ? `Successfully imported ${location.state.uploadSuccess.rows_imported} products!` : null);
  const [toastType, setToastType] = useState('success');

  const limit = 20;

  const categories = ["Accessories", "Apparel", "Beauty", "Electronics", "Groceries", "Home", "Shoes", "Sports"];
  const brands = ["Adidas", "Apple", "Asics", "Bose", "Coach", "Decathlon", "Dove", "Fitbit", "H&M", "Nike", "Puma", "Samsung", "Sony", "Target", "Under Armour"];

  useEffect(() => {
    fetchProducts();
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [page, search, category, brand, status, sortBy, sortDesc, toastMessage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = new URLSearchParams({ skip, limit });
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (brand) params.append("brand", brand);
      if (status) params.append("status", status);
      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_desc", sortDesc);
      }
      
      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error("Failed to fetch products", error);
      showToast("Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(false);
    }
    setPage(1);
  };

  const handleRowClick = (id, e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('button')) return;
    navigate(`/products/${id}`);
  };

  // --- CRUD ACTIONS ---
  
  const handleAddClick = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    setModalLoading(true);
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, formData);
        showToast("Product updated successfully!");
      } else {
        await api.post("/products", formData);
        showToast("Product created successfully!");
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.detail || "An error occurred while saving the product.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async (id) => {
    setModalLoading(true);
    try {
      await api.delete(`/products/${id}`);
      showToast("Product archived successfully.");
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast("Failed to archive product.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 inline ml-1 text-white/30" />;
    return <ArrowUpDown className={`w-4 h-4 inline ml-1 ${sortDesc ? "text-accent-400" : "text-brand-400"}`} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full pb-10 relative"
    >
      <ProductFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveProduct} 
        product={selectedProduct} 
        isLoading={modalLoading} 
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        product={selectedProduct}
        isLoading={modalLoading}
      />

      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-center border ${
                toastType === 'success' 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Package className="w-8 h-8 text-brand-400" />
          Product Catalog
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-white/50 font-medium px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-inner">
            Total Products: <span className="text-brand-400 font-bold">{totalCount.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl overflow-hidden border border-white/10"
      >
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center bg-black/20">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Name or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 text-white placeholder-white/30 outline-none transition-all"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Filter className="text-white/50 w-5 h-5 hidden md:block" />
            
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-brand-500/50 outline-none bg-[#0a0a0a] text-white/80 cursor-pointer transition-all appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setPage(1); }}
              className="border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-brand-500/50 outline-none bg-[#0a0a0a] text-white/80 cursor-pointer transition-all appearance-none"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-brand-500/50 outline-none bg-[#0a0a0a] text-white/80 cursor-pointer transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/50 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-white/10 w-64">Product Info</th>
                <th className="p-4 border-b border-white/10">Category & Brand</th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("base_price")}>
                  Pricing <SortIcon column="base_price" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("initial_inventory")}>
                  Stock <SortIcon column="initial_inventory" />
                </th>
                <th className="p-4 border-b border-white/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-white/50 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-brand-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading catalog...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-white/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="w-12 h-12 text-white/20" />
                      <p>No products found in the catalog.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={product.id} 
                      onClick={(e) => handleRowClick(product.id, e)}
                      className="hover:bg-brand-500/10 cursor-pointer transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-brand-300 transition-colors">
                          {product.product_name || product.product_id}
                        </div>
                        {product.product_name && (
                          <div className="text-xs text-white/40 font-mono mt-1">
                            {product.product_id}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-white/80 capitalize">
                          {product.category?.replace("_", " ") || "—"}
                        </div>
                        <div className="text-xs text-brand-300/70 font-bold mt-1 uppercase">
                          {product.brand || "—"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-white/90">
                          ${parseFloat(product.base_price || 0).toFixed(2)}
                        </div>
                        {product.cost_price !== null && product.cost_price !== undefined && (
                          <div className="text-xs text-white/40 font-bold mt-1">
                            Cost: ${parseFloat(product.cost_price).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${product.initial_inventory > 50 ? 'bg-green-400' : product.initial_inventory > 10 ? 'bg-yellow-400' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}></div>
                          <span className="text-sm font-bold text-white/80">{product.initial_inventory || 0}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${product.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                          {product.status || "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleEditClick(product, e)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 text-white/50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(product, e)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                            title="Archive Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <p className="text-sm text-white/50">
            Showing Page <span className="font-bold text-white/90">{page}</span> of <span className="font-bold text-white/90">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading || totalPages === 0}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
      </motion.div>
    </motion.div>
  );
}
