import React, { useState } from 'react';
import api from '../services/api';

const FlipkartApiTest = () => {
  const [endpoint, setEndpoint] = useState('category-products-list');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const handleTest = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      endpoint_type: endpoint,
      query_params: endpoint === 'category-products-list' 
        ? { categoryID: query, page: '1' }
        : endpoint === 'product-details'
        ? { fsn: query } // Assuming fsn or productId is used for details
        : {}
    };

    try {
      const response = await api.post('/flipkart/test', payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <h1 className="text-base font-semibold text-white tracking-tight">Flipkart API Playground</h1>
        <p className="text-xs text-gray-400 mt-0.5">Test real-time Flipkart data scraping endpoints</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">API Endpoint</label>
              <select 
                value={endpoint} 
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full border border-gray-700 bg-gray-800 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="category-products-list">Category Products List</option>
                <option value="product-details">Product Details</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                {endpoint === 'category-products-list' ? 'Category ID (e.g. axc)' : 'Product ID (e.g. fsn)'}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={endpoint === 'category-products-list' ? "Enter category ID..." : "Enter product ID..."}
                  className="flex-1 border border-gray-700 bg-gray-800 text-gray-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-600"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTest(); }}
                />
                <button 
                  onClick={handleTest}
                  disabled={loading || !query}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  {loading ? 'Fetching...' : 'Test Endpoint'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded p-4 mb-6">
            <p className="text-sm text-red-400 font-medium">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  Table View
                </button>
                <button 
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  Raw JSON
                </button>
              </div>
              <span className="text-xs font-mono text-green-400">200 OK</span>
            </div>
            
            {viewMode === 'json' ? (
              <pre className="p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed custom-scrollbar max-h-[600px] overflow-y-auto bg-[#0d1117]">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                {(() => {
                  const products = Array.isArray(result) 
                    ? result 
                    : Array.isArray(result?.products) 
                      ? result.products 
                      : Array.isArray(result?.data) 
                        ? result.data 
                        : null;

                  if (products && products.length > 0) {
                    return (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-950 sticky top-0 z-10 border-b border-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-400">Product</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-400">Price</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-400">Rating</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-400">Reviews</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {products.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {(p.image || p.thumbnail) && <img src={p.image || p.thumbnail} alt="Product" className="w-10 h-10 object-contain bg-white rounded p-1" />}
                                  <div>
                                    <p className="text-sm font-medium text-gray-200 line-clamp-2 max-w-sm" title={p.title || p.name}>{p.title || p.name}</p>
                                    {(p.url || p.link) && <a href={p.url || p.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">View on Flipkart</a>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-green-400">{p.price || p.current_price || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-yellow-400 font-medium">⭐ {p.rating || p.stars || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-300">{p.reviews || p.ratings_count || '0'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  }
                  return (
                    <div className="p-8 text-center text-gray-500">
                      No products found or unrecognized data format. Try viewing Raw JSON.
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
        
        {!result && !loading && !error && (
          <div className="flex items-center justify-center h-48 border border-dashed border-gray-800 rounded-lg">
            <p className="text-sm text-gray-500">Run a test to see the JSON structure here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlipkartApiTest;
