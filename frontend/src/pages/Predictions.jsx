import React, { useState } from "react";
import { Cpu, Search, Package } from "lucide-react";

export default function Predictions() {
  const [selectedProduct, setSelectedProduct] = useState("");

  return (
    <div className="w-full max-w-[1000px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Price Prediction</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Select a product to generate an optimal price prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Selection and Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Product Selection */}
          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              1. Select Product
            </p>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or Name..."
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="ent-input w-full pl-9"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="ent-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              2. Product Information
            </p>
            {selectedProduct ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between border-b border-[#374151] pb-2">
                  <span className="text-gray-400">Current Price</span>
                  <span className="font-semibold text-gray-100">--</span>
                </div>
                <div className="flex justify-between border-b border-[#374151] pb-2">
                  <span className="text-gray-400">Base Cost</span>
                  <span className="font-semibold text-gray-100">--</span>
                </div>
                <div className="flex justify-between border-b border-[#374151] pb-2">
                  <span className="text-gray-400">Category</span>
                  <span className="font-semibold text-gray-100">--</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-400">Inventory</span>
                  <span className="font-semibold text-gray-100">--</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">Search and select a product above to view details.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prediction Results Placeholder */}
        <div className="lg:col-span-2">
          <div className="ent-panel p-8 h-full flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-50 mb-1">
                Prediction Module Not Connected
              </p>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed mx-auto">
                The UI structure is ready. Once the ML backend is deployed in Milestone 2, this section will display the predicted optimal price, confidence score, and demand curve for the selected product.
              </p>
            </div>
            
            <button disabled className="mt-4 px-6 py-2.5 bg-[#374151] text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
              Run Price Prediction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
