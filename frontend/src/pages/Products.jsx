import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

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
  const [categories, setCategories] = useState(["Accessories", "Apparel", "Beauty", "Electronics", "Groceries", "Home", "Shoes", "Sports"]);
  
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);

  // Success message from upload
  const [uploadSuccess, setUploadSuccess] = useState(location.state?.uploadSuccess || null);

  const limit = 20;

  useEffect(() => {
    fetchProducts();
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [page, search, category, sortBy, sortDesc]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = new URLSearchParams({ skip, limit });
      if (search) params.append("search", search);
      if (category) params.append("category", category);
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
    } finally {
      setLoading(false);
    }
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

  const handleRowClick = (id) => {
    navigate(`/products/${id}`);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 inline ml-1 text-white/30" />;
    return <ArrowUpDown className={`w-4 h-4 inline ml-1 ${sortDesc ? "text-accent-400" : "text-brand-400"}`} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full pb-10"
    >
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
            className="mb-6 p-4 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20 shadow-xl backdrop-blur-md font-medium"
          >
            Successfully imported {uploadSuccess.rows_imported} products from {uploadSuccess.file_name}!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Product Management</h1>
        <div className="text-sm text-white/50 font-medium px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-inner">
          Total Products: <span className="text-brand-400 font-bold">{totalCount.toLocaleString()}</span>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl overflow-hidden border border-white/10"
      >
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between bg-black/20">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Product ID or Category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 text-white placeholder-white/30 outline-none transition-all"
            />
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="text-white/50 w-5 h-5" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-brand-500/50 outline-none bg-[#0a0a0a] text-white/80 cursor-pointer transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/50 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-white/10">Product ID</th>
                <th className="p-4 border-b border-white/10">Category</th>
                <th className="p-4 border-b border-white/10">Brand</th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("base_price")}>
                  Base Price <SortIcon column="base_price" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("current_price")}>
                  Current Price <SortIcon column="current_price" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("units_sold")}>
                  Units Sold <SortIcon column="units_sold" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("revenue")}>
                  Revenue <SortIcon column="revenue" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("inventory_level")}>
                  Inventory <SortIcon column="inventory_level" />
                </th>
                <th className="p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("demand_index")}>
                  Demand Index <SortIcon column="demand_index" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-white/50 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-brand-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-white/50">No products found.</td>
                </tr>
              ) : (
                products.map((product, index) => {
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={product.id} 
                      onClick={() => handleRowClick(product.id)}
                      className="hover:bg-brand-500/10 cursor-pointer transition-colors group"
                    >
                      <td className="p-4 text-sm font-mono font-black text-white group-hover:text-brand-300 truncate max-w-[120px]" title={product.product_id}>{product.product_id}</td>
                      <td className="p-4 text-sm text-white/80 capitalize">{product.category?.replace("_", " ")}</td>
                      <td className="p-4 text-sm text-white/90 font-bold">{product.brand}</td>
                      <td className="p-4 text-sm font-bold text-white/50"><span className="opacity-70 line-through mr-1 text-xs"></span>${parseFloat(product.base_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm font-black price-inline">${parseFloat(product.current_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm text-white/80">{product.units_sold}</td>
                      <td className="p-4 text-sm font-black price-inline">${parseFloat(product.revenue || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm text-white/80">{product.inventory_level}</td>
                      <td className="p-4 text-sm text-white/80">{parseFloat(product.demand_index || 0).toFixed(2)}</td>
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
