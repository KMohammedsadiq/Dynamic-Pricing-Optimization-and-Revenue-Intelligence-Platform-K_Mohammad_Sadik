import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, BarChart2, Calendar, TrendingUp } from "lucide-react";
import api from "../services/api";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError("Product not found or an error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto py-8 text-center text-gray-500">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/products")} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md font-medium transition-colors">
            Return to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <button 
        onClick={() => navigate("/products")}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Products
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                {(product.category || "").replace("_", " ")}
              </span>
              <span className="flex items-center gap-1 text-yellow-600 text-sm font-bold bg-yellow-50 px-2 py-1 rounded">
                Demand: {product.demand_index}
              </span>
              {product.brand && (
                <span className="flex items-center gap-1 text-gray-600 text-sm font-bold bg-gray-200 px-2 py-1 rounded">
                  {product.brand}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-mono font-bold text-slate-800">{product.product_id}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Current Price</p>
            <p className="text-4xl font-bold text-green-600">
              ${parseFloat(product.current_price || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Sales & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 border-b pb-2">
              <Package className="w-5 h-5 text-blue-500" />
              Sales & Inventory
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Units Sold</span>
                <span className="font-medium text-gray-900">{product.units_sold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-medium text-gray-900">${parseFloat(product.revenue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inventory Level</span>
                <span className="font-medium text-gray-900">{product.inventory_level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Stockout Flag</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${product.stockout_flag ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {product.stockout_flag ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Promotions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 border-b pb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Pricing & Promotions
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Price</span>
                <span className="font-medium text-gray-900">${parseFloat(product.base_price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount %</span>
                <span className="font-medium text-gray-900">{product.discount_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Promotion Type</span>
                <span className="font-medium text-gray-900">{product.promotion_type || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price Change %</span>
                <span className="font-medium text-gray-900">{product.price_change_pct}%</span>
              </div>
            </div>
          </div>

          {/* Market Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 border-b pb-2">
              <BarChart2 className="w-5 h-5 text-purple-500" />
              Market Context
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Region</span>
                <span className="font-medium text-gray-900">{product.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Channel</span>
                <span className="font-medium text-gray-900">{product.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Season</span>
                <span className="font-medium text-gray-900 capitalize">{product.season}</span>
              </div>
              {product.date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date Recorded</span>
                  <span className="font-medium text-gray-900">{new Date(product.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
