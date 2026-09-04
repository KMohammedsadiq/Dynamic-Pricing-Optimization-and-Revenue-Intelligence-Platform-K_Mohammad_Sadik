import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Edit2, Trash2, Package } from "lucide-react";
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

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
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 inline ml-1 text-gray-500" />;
    return <ArrowUpDown className={`w-4 h-4 inline ml-1 ${sortDesc ? "text-blue-500" : "text-blue-400"}`} />;
  };

  return (
    <div className="w-full pb-10 relative">
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
        {toastMessage && (
          <div 
            className={`p-4 rounded-lg shadow-lg font-bold text-center border ${
              toastType === 'success' 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {toastMessage}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-50 tracking-tight flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-500" />
          Product Catalog
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400 font-medium px-4 py-2 bg-[#1F2937] rounded-md border border-[#374151] shadow-sm">
            Total Products: <span className="text-blue-500 font-bold">{totalCount.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleAddClick}
            className="ent-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="ent-panel overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-[#374151] flex flex-col md:flex-row gap-4 items-center bg-[#1F2937]">
          <div className="relative w-full md:w-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Name or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="ent-input w-full pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Filter className="text-gray-500 w-4 h-4 hidden md:block" />
            
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="ent-input"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setPage(1); }}
              className="ent-input"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="ent-input"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="ent-table-header">
              <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("product_name")}>
                  Product Name <SortIcon column="product_name" />
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("brand")}>
                  Brand <SortIcon column="brand" />
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("category")}>
                  Category <SortIcon column="category" />
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("base_price")}>
                  Current Price <SortIcon column="base_price" />
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("initial_inventory")}>
                  Inventory <SortIcon column="initial_inventory" />
                </th>
                <th className="p-4 cursor-pointer hover:text-gray-200 transition-colors" onClick={() => handleSort("status")}>
                  Status <SortIcon column="status" />
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading catalog...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="w-12 h-12 text-gray-700" />
                      <p>No products found in the catalog.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  return (
                    <tr 
                      key={product.id} 
                      onClick={(e) => handleRowClick(product.id, e)}
                      className="ent-table-row cursor-pointer group hover:bg-[#374151]/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-50 group-hover:text-blue-400 transition-colors whitespace-nowrap">
                          {product.product_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300 font-medium uppercase tracking-wide">
                          {product.brand || "—"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300 capitalize">
                          {product.category?.replace("_", " ") || "—"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-gray-100">
                          {!product.base_price || product.base_price <= 0 ? (
                            <span className="text-gray-500 font-normal">Not available</span>
                          ) : (
                            `₹${parseFloat(product.base_price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-gray-300">
                          {product.initial_inventory != null ? product.initial_inventory : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${product.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[#111827] text-gray-500 border-[#374151]'}`}>
                          {product.status || "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleEditClick(product, e)}
                            className="p-1.5 rounded bg-[#374151] hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(product, e)}
                            className="p-1.5 rounded bg-[#374151] hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
                            title="Archive Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#374151] bg-[#1F2937] flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing Page <span className="font-bold text-gray-100">{page}</span> of <span className="font-bold text-gray-100">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading || totalPages === 0}
              className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
