import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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
  const [searchInput, setSearchInput] = useState(""); // For debouncing or explicit search
  
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState(["Accessories", "Apparel", "Beauty", "Electronics", "Groceries", "Home", "Shoes", "Sports"]);
  
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);

  // Success message from upload
  const [uploadSuccess, setUploadSuccess] = useState(location.state?.uploadSuccess || null);

  const limit = 20;

  useEffect(() => {
    fetchProducts();
    // Clear upload success message after 5 seconds
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
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 inline ml-1 text-gray-400" />;
    return <ArrowUpDown className={`w-4 h-4 inline ml-1 ${sortDesc ? "text-red-500" : "text-green-500"}`} />;
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 shadow-sm">
          Successfully imported {uploadSuccess.rows_imported} products from {uploadSuccess.file_name}!
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Product Management</h1>
        <div className="text-sm text-gray-500 font-medium">Total Products: {totalCount.toLocaleString()}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between bg-gray-50">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Product ID or Category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
              <tr className="bg-gray-100 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Product ID</th>
                <th className="p-4 border-b">Category</th>
                <th className="p-4 border-b">Brand</th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("base_price")}>
                  Base Price <SortIcon column="base_price" />
                </th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("current_price")}>
                  Current Price <SortIcon column="current_price" />
                </th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("units_sold")}>
                  Units Sold <SortIcon column="units_sold" />
                </th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("revenue")}>
                  Revenue <SortIcon column="revenue" />
                </th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("inventory_level")}>
                  Inventory <SortIcon column="inventory_level" />
                </th>
                <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort("demand_index")}>
                  Demand Index <SortIcon column="demand_index" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                products.map((product) => {
                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => handleRowClick(product.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-sm font-mono text-gray-700 truncate max-w-[120px]" title={product.product_id}>{product.product_id}</td>
                      <td className="p-4 text-sm text-gray-700 capitalize">{product.category?.replace("_", " ")}</td>
                      <td className="p-4 text-sm text-gray-700 font-medium">{product.brand}</td>
                      <td className="p-4 text-sm text-gray-500">${parseFloat(product.base_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">${parseFloat(product.current_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm text-gray-700">{product.units_sold}</td>
                      <td className="p-4 text-sm text-gray-900 font-medium">${parseFloat(product.revenue || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm text-gray-700">{product.inventory_level}</td>
                      <td className="p-4 text-sm text-gray-700">{parseFloat(product.demand_index || 0).toFixed(2)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading || totalPages === 0}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
