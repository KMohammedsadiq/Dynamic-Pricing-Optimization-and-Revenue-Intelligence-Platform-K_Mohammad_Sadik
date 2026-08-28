import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle, AlertTriangle, Info, TrendingUp, TrendingDown, ExternalLink,
  Activity, Target, BarChart2, Zap, ArrowUp, ArrowDown, Minus, ChevronRight,
  Download, FileText, Search,
} from 'lucide-react';

const inr = (v, decimals = 0) =>
  v != null ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: decimals })}` : '—';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-gray-100', icon: Icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-gray-200 uppercase tracking-widest">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-[10px] text-white font-medium">{sub}</span>}
    </div>
  );
}

function MovementBadge({ movement }) {
  if (!movement) {
    return <span className="text-xs text-gray-100 italic">No prior observation</span>;
  }
  const { direction, pct, prev_price, curr_price } = movement;
  const isUp = direction === 'INCREASED';
  const isDown = direction === 'DECREASED';
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
  const color = isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-gray-200';
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(pct).toFixed(2)}% from previous</span>
      <span className="text-gray-100 font-normal">({inr(prev_price)} → {inr(curr_price)})</span>
    </div>
  );
}

// Gap-derived position pill — ensures "+95% gap" correctly shows "Above Market"
function GapPositionPill({ gapPct }) {
  if (gapPct == null) return <span className="text-white text-xs">—</span>;
  const cls = gapPct < -3
    ? 'text-green-400 border-green-900'
    : gapPct > 3
    ? 'text-red-400 border-red-900'
    : 'text-yellow-400 border-yellow-900';
  const label = gapPct < -3 ? 'Below Market' : gapPct > 3 ? 'Above Market' : 'Near Market';
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-gray-800 ${cls}`}>
      {label}
    </span>
  );
}

// Backend position string pill (for Category table)
function PositionPill({ position }) {
  const map = {
    cheaper:   { label: 'Below Market', cls: 'text-green-400 border-green-900' },
    near:      { label: 'Near Market',  cls: 'text-yellow-400 border-yellow-900' },
    expensive: { label: 'Above Market', cls: 'text-red-400 border-red-900' },
  };
  const { label, cls } = map[position] || { label: position, cls: 'text-gray-200 border-gray-700' };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-gray-800 ${cls}`}>
      {label}
    </span>
  );
}

// Direction badge for Competitor Monitoring table
function DirectionBadge({ direction }) {
  const isUp = direction === 'INCREASED';
  const isDown = direction === 'DECREASED';
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
  const cls = isUp
    ? 'text-red-400 bg-red-950/30 border-red-900/40'
    : isDown
    ? 'text-green-400 bg-green-950/30 border-green-900/40'
    : 'text-gray-300 bg-gray-800/30 border-gray-700/40';
  const lbl = isUp ? 'Increased' : isDown ? 'Decreased' : 'Unchanged';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${cls}`}>
      <Icon className="w-2.5 h-2.5" />{lbl}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function CompetitorPricing() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [marketIntelligence, setMarketIntelligence] = useState(null);

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMI, setIsLoadingMI] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [syncResult, setSyncResult] = useState(null);
  const [latestPrices, setLatestPrices] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = React.useRef(null);

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Monitoring section filters
  const [monitorFilter, setMonitorFilter] = useState('All');
  const [monitorSearch, setMonitorSearch] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchMarketIntelligence();
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.get('/competitors/summary');
      setProducts(res.data.data || []);
    } catch (err) { console.error(err); } finally { setIsLoadingProducts(false); }
  };

  const fetchMarketIntelligence = async () => {
    setIsLoadingMI(true);
    try {
      const res = await api.get('/competitors/market-intelligence');
      setMarketIntelligence(res.data);
    } catch (err) { console.error(err); } finally { setIsLoadingMI(false); }
  };

  const handleSelectProduct = async (prod) => {
    setSelectedProduct(prod);
    setSearchQuery(`${prod.product_id} - ${prod.product_name}`);
    setShowDropdown(false);
    setSyncResult(null);
    setLatestPrices(null);
    setErrorMsg(null);
    fetchHistory(prod.product_id);
  };

  const fetchHistory = async (prodId) => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/competitors/history/${prodId}`);
      setHistoryData(res.data.history);
      if (res.data.latest_prices) setLatestPrices(res.data.latest_prices);
    } catch (err) { console.error(err); } finally { setIsLoadingHistory(false); }
  };

  const handleSync = async () => {
    if (!selectedProduct) return;
    setIsSyncing(true); setSyncResult(null); setErrorMsg(null);
    try {
      const res = await api.post(`/competitors/sync/${selectedProduct.product_id}`);
      setSyncResult(res.data.results);
      await fetchHistory(selectedProduct.product_id);
      await fetchMarketIntelligence();
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (err.response?.status === 429) setErrorMsg('A sync is already in progress. Please wait.');
      else setErrorMsg(detail || 'Failed to sync competitor prices.');
    } finally { setIsSyncing(false); }
  };

  // Derived values
  const displayResult = syncResult || latestPrices;
  const ourPrice = Number(selectedProduct?.base_price) || 0;
  const amzData  = displayResult?.Amazon;
  const fkpData  = displayResult?.Flipkart;
  const amzPrice = amzData?.price ? Number(amzData.price) : null;
  const fkpPrice = fkpData?.price ? Number(fkpData.price) : null;

  const validPrices = [amzPrice, fkpPrice].filter(p => p !== null);
  const hasCompetitorPrices = validPrices.length > 0;
  const lowest  = hasCompetitorPrices ? Math.min(...validPrices) : null;
  const highest = hasCompetitorPrices ? Math.max(...validPrices) : null;
  const avg     = hasCompetitorPrices ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : null;

  const getGapInfo = (compPrice) => {
    if (!compPrice) return null;
    const diff = ourPrice - compPrice;
    const pct  = (Math.abs(diff) / compPrice) * 100;
    if (diff > 0) return { text: `${inr(diff)} above (+${pct.toFixed(1)}%)`, Icon: TrendingUp };
    if (diff < 0) return { text: `${inr(Math.abs(diff))} below (-${pct.toFixed(1)}%)`, Icon: TrendingDown };
    return { text: 'Exact match', Icon: null };
  };
  const amzGap = getGapInfo(amzPrice);
  const fkpGap = getGapInfo(fkpPrice);

  let posTitle = 'Awaiting data', posDesc = 'Sync competitor prices to compute your position.', PosIcon = Info;
  if (hasCompetitorPrices) {
    const gapPct = avg ? ((ourPrice - avg) / avg) * 100 : 0;
    if (gapPct < -3) { 
      posTitle = 'Below Market';        
      posDesc = 'Your price is significantly cheaper than the market average.'; 
      PosIcon = CheckCircle; 
    }
    else if (gapPct > 3) { 
      posTitle = 'Above Market'; 
      posDesc = 'Your price is significantly more expensive than the market average.'; 
      PosIcon = AlertTriangle; 
    }
    else { 
      posTitle = 'Near Market';         
      posDesc = 'Your price is competitive and near the market average.';  
      PosIcon = CheckCircle; 
    }
  }

  // Chart data — group by minute to show intra-day sync updates
  let chartData = [];
  if (historyData) {
    const timeMap = {};
    const processData = (arr, key) => {
      arr.forEach(d => {
        const t = new Date(d.date);
        t.setSeconds(0, 0);
        const tStr = t.getTime();
        if (!timeMap[tStr]) timeMap[tStr] = { timestamp: tStr, OurPrice: ourPrice || 0 };
        timeMap[tStr][key] = d.price;
      });
    };
    processData(historyData.Amazon || [], 'Amazon');
    processData(historyData.Flipkart || [], 'Flipkart');

    chartData = Object.values(timeMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(d => {
        const dateObj = new Date(d.timestamp);
        const isMidnight = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;
        const formatted = isMidnight
          ? dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          : dateObj.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return { ...d, date: formatted };
      });
  }

  // Market intelligence aliases
  const mi     = marketIntelligence;
  const ov     = mi?.overview;
  const mp     = mi?.market_position;
  const ci     = mi?.category_intelligence || [];
  const topOps = mi?.top_opportunities || [];
  const productMovement  = mi?.product_movement || {};
  const selectedMovement = selectedProduct ? productMovement[selectedProduct.product_id] : null;
  const handleAnalyzeFromCatalog = (prod) => { handleSelectProduct(prod); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Monitoring data (from new backend field monitoring_records)
  const monitoringRecords = mi?.monitoring_records || [];
  const movementSummary   = mi?.movement_summary;
  const filteredMonitoring = useMemo(() => {
    return monitoringRecords.filter(r => {
      const matchFilter = monitorFilter === 'All' ? true
        : monitorFilter === 'Significant' ? Math.abs(r.pct) >= 5
        : r.direction === monitorFilter.toUpperCase();
      const q = monitorSearch.toLowerCase();
      const matchSearch = !q ||
        r.product_name.toLowerCase().includes(q) ||
        r.product_id.toLowerCase().includes(q) ||
        r.competitor.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [monitoringRecords, monitorFilter, monitorSearch]);

  // Market Insights (derived dynamically — no hardcoding)
  const marketInsights = useMemo(() => {
    if (!mi) return null;
    const insights = {};
    if (mp && mp.total > 0) {
      const belowPct = ((mp.cheaper / mp.total) * 100).toFixed(1);
      insights.position = `${belowPct}% of analyzed products are currently priced below the observed market average.`;
    }
    if (ci.length > 0) {
      const top = ci[0];
      if (top.avg_market != null && top.avg_our_price != null) {
        const diff = Math.abs(top.avg_gap_pct || 0).toFixed(1);
        const dir = (top.avg_gap_pct || 0) < 0 ? 'below' : 'above';
        insights.category = `${top.category} has an average market price of \u20b9${Number(top.avg_market).toLocaleString('en-IN')} compared with our average of \u20b9${Number(top.avg_our_price).toLocaleString('en-IN')} (${diff}% ${dir} market).`;
      }
    }
    if (mi.price_movement) {
      const amzTotal = mi.price_movement.Amazon
        ? mi.price_movement.Amazon.increased + mi.price_movement.Amazon.decreased + mi.price_movement.Amazon.unchanged : 0;
      const fkpTotal = mi.price_movement.Flipkart
        ? mi.price_movement.Flipkart.increased + mi.price_movement.Flipkart.decreased + mi.price_movement.Flipkart.unchanged : 0;
      if (amzTotal > 0 || fkpTotal > 0) {
        const leader = amzTotal >= fkpTotal ? 'Amazon' : 'Flipkart';
        insights.movement = `${leader} recorded more observed price movements (${Math.max(amzTotal, fkpTotal)} tracked products) in the available observations.`;
      }
    }
    if (topOps.length > 0) {
      const top = topOps[0];
      const dir = top.gap_pct < 0 ? 'below' : 'above';
      insights.opportunity = `${top.product_name} is priced ${Math.abs(top.gap_pct).toFixed(1)}% ${dir} its observed market average (\u20b9${Number(top.our_price).toLocaleString('en-IN')} vs \u20b9${Number(top.avg_market).toLocaleString('en-IN')}).`;
    }
    return insights;
  }, [mi, mp, ci, topOps]);

  // Product catalog filtering (reuses existing products state and catalog state)
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    return ['All Categories', ...cats];
  }, [products]);
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const q = catalogSearch.toLowerCase();
      const matchSearch = !q || `${p.product_id} ${p.product_name}`.toLowerCase().includes(q);
      const matchCat = catalogCategory === 'All Categories' || p.category === catalogCategory;
      return matchSearch && matchCat;
    });
  }, [products, catalogSearch, catalogCategory]);
  const totalPages  = Math.ceil(filteredCatalog.length / itemsPerPage);
  const catalogPage = filteredCatalog.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // CSV export for Pricing Comparison Report
  const exportReportCSV = () => {
    if (!selectedProduct) return;
    const gapVal = avg != null ? (ourPrice - avg) : null;
    const gapPct = avg != null ? (((ourPrice - avg) / avg) * 100) : null;
    const rows = [
      ['Field', 'Value'],
      ['Product Name', selectedProduct.product_name],
      ['Product ID', selectedProduct.product_id],
      ['Category', selectedProduct.category || ''],
      ['Report Date', new Date().toLocaleDateString('en-IN')],
      ['Our Price (INR)', ourPrice || 'N/A'],
      ['Amazon Price (INR)', amzPrice != null ? amzPrice : 'N/A'],
      ['Flipkart Price (INR)', fkpPrice != null ? fkpPrice : 'N/A'],
      ['Lowest Competitor (INR)', lowest != null ? lowest : 'N/A'],
      ['Highest Competitor (INR)', highest != null ? highest : 'N/A'],
      ['Market Average (INR)', avg != null ? avg.toFixed(2) : 'N/A'],
      ['Price Gap vs Market', gapVal != null ? `${Math.abs(gapVal).toFixed(2)} ${gapVal < 0 ? 'below' : gapVal > 0 ? 'above' : 'matching'}` : 'N/A'],
      ['Gap %', gapPct != null ? `${Math.abs(gapPct).toFixed(2)}% ${gapPct < 0 ? 'below' : gapPct > 0 ? 'above' : 'matching'}` : 'N/A'],
      ['Competitive Position', posTitle],
    ];
    if (selectedMovement?.Amazon) {
      const m = selectedMovement.Amazon;
      rows.push(['Amazon Movement', m.direction], ['Amazon Previous Recorded Price (INR)', m.prev_price],
                ['Amazon Current Movement Price (INR)', m.curr_price], ['Amazon Change %', m.pct.toFixed(2) + '%']);
    }
    if (selectedMovement?.Flipkart) {
      const m = selectedMovement.Flipkart;
      rows.push(['Flipkart Movement', m.direction], ['Flipkart Previous Recorded Price (INR)', m.prev_price],
                ['Flipkart Current Movement Price (INR)', m.curr_price], ['Flipkart Change %', m.pct.toFixed(2) + '%']);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProduct.product_id}_pricing_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Competitor card
  const renderCompetitorCard = (compName, compData, priceValue) => {
    if (!compData || (!priceValue && compData.status === 'no_data')) {
      return (
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[180px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-white mb-1">{compName}</span>
          <span className="text-gray-100 text-xs">No data — click Sync</span>
        </div>
      );
    }

    const isDemo   = compData.data_source === 'DEMO_SNAPSHOT';
    const isTest   = compData.data_source === 'TEST_HISTORICAL';
    const isLive   = compData.status === 'success' && !isDemo && !isTest;
    const isCached = (compData.status === 'cached' || compData.status === 'cooldown') && !isDemo && !isTest;
    const movement = selectedMovement?.[compName];

    const statusDot  = isLive ? 'bg-green-500' : isTest ? 'bg-green-500' : isCached ? 'bg-gray-500' : isDemo ? 'bg-purple-500' : 'bg-red-500';
    const statusText = isLive ? 'Live' : isTest ? 'Historical' : isCached ? 'Cached' : isDemo ? 'Snapshot' : 'Error';

    return (
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
          <span className="text-xs font-bold uppercase tracking-widest text-white">{compName}</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
            <span className="text-[10px] text-gray-200">{statusText}</span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Latest Price</div>
              {priceValue
                ? <div className="text-2xl font-bold text-gray-100">{inr(priceValue)}</div>
                : <div className="text-sm text-white">Not available</div>}
              <div className="mt-1.5">
                <MovementBadge movement={isDemo ? null : movement} />
              </div>
            </div>
            {compData.confidence && (
              <div className="text-right">
                <span className="text-[9px] text-white uppercase font-semibold block">Match</span>
                <span className="text-gray-100 font-semibold text-sm">{compData.confidence}%</span>
              </div>
            )}
          </div>
          <div className="mt-auto pt-3 border-t border-gray-800/60">
            {compData.title && (
              <p className="text-xs text-gray-200 line-clamp-1 mb-1.5" title={compData.title}>{compData.title}</p>
            )}
            <div className="flex justify-between items-center text-[10px] text-gray-100 font-mono">
              <span>{compData.asin ? `ASIN: ${compData.asin}` : compData.pid ? `PID: ${compData.pid}` : ''}</span>
              <span>
                {compData.scraped_at
                  ? new Date(compData.scraped_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
            </div>
          </div>
        </div>
        {compData.url && (
          <a href={compData.url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 text-[11px] font-medium text-center border-t border-gray-800 hover:bg-gray-800 transition-colors text-gray-200 flex items-center justify-center gap-1.5">
            View on {compName} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full font-sans text-gray-200">

      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Competitor Analysis</h1>
          <p className="text-xs text-gray-200 mt-0.5">Market intelligence and competitive pricing dashboard.</p>
        </div>
        <div className="w-full md:w-80" ref={searchRef}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search product to analyze…"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) { setSelectedProduct(null); setLatestPrices(null); setSyncResult(null); setHistoryData(null); }
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gray-600 placeholder-gray-700"
            />
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                {products
                  .filter(p => `${p.product_id} ${p.product_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 20)
                  .map(p => (
                    <button key={p.product_id} onClick={() => handleSelectProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800/50 last:border-0 transition-colors">
                      <span className="font-mono text-[10px] text-white w-16 shrink-0">{p.product_id}</span>
                      <span className="text-sm text-white truncate">{p.product_name}</span>
                    </button>
                  ))}
                {products.filter(p => `${p.product_id} ${p.product_name}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-xs text-white text-center">No matches found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product analysis section */}
      {!selectedProduct ? (
        <div className="flex flex-col items-center justify-center py-14 border border-dashed border-gray-800 rounded-lg text-gray-100 mb-8">
          <Info className="w-7 h-7 mb-2" />
          <p className="text-sm font-medium">Select a product to start analysis</p>
          <p className="text-xs mt-1">Search by name or ID above</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">

          {/* Product header + sync */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-3">
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold text-white uppercase tracking-widest mb-0.5">Analyzing</div>
                <h2 className="text-base font-bold text-gray-100 truncate">{selectedProduct.product_name}</h2>
                <div className="flex items-center gap-2 mt-1 font-mono text-[10px]">
                  <span className="text-white border border-gray-800 px-1.5 py-0.5 rounded">{selectedProduct.product_id}</span>
                  {selectedProduct.brand && <span className="text-gray-100">{selectedProduct.brand}</span>}
                </div>
              </div>
              <div className="shrink-0 md:border-l md:border-gray-800 md:pl-5">
                <div className="text-[9px] font-semibold text-white uppercase tracking-widest mb-0.5">Our Price</div>
                <div className="text-xl font-bold text-gray-200">{ourPrice > 0 ? inr(ourPrice) : 'N/A'}</div>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <button onClick={handleSync} disabled={isSyncing}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all h-full ${isSyncing ? 'bg-gray-800 text-white cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}>
                {isSyncing ? 'Syncing…' : 'Sync Live Prices'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950 border border-red-900 rounded-lg text-xs text-red-400">{errorMsg}</div>
          )}

          {/* Competitor price cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCompetitorCard('Amazon', amzData, amzPrice)}
            {renderCompetitorCard('Flipkart', fkpData, fkpPrice)}
          </div>

          {/* Price comparison + competitive position */}
          {hasCompetitorPrices && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-[10px] font-semibold text-white uppercase tracking-widest mb-3">Price Comparison</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Our Price',          value: inr(ourPrice) },
                    { label: 'Lowest Competitor',  value: inr(lowest) },
                    { label: 'Market Average',     value: inr(avg, 0) },
                    { label: 'Highest Competitor', value: inr(highest) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-950 border border-gray-800 rounded p-2.5">
                      <div className="text-[9px] text-white uppercase font-semibold mb-1">{label}</div>
                      <div className="text-sm font-bold text-gray-200">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-800 pt-3 space-y-1.5">
                  {amzGap && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white w-16 shrink-0">vs Amazon</span>
                      <span className="flex items-center gap-1 text-gray-100">
                        {amzGap.Icon && <amzGap.Icon className="w-3.5 h-3.5" />} {amzGap.text}
                      </span>
                    </div>
                  )}
                  {fkpGap && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white w-16 shrink-0">vs Flipkart</span>
                      <span className="flex items-center gap-1 text-gray-100">
                        {fkpGap.Icon && <fkpGap.Icon className="w-3.5 h-3.5" />} {fkpGap.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-center">
                <div className="text-[10px] font-semibold text-white uppercase tracking-widest mb-3">Competitive Position</div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 rounded bg-gray-800">
                    <PosIcon className="w-4 h-4 text-gray-200" />
                  </div>
                  <p className="text-sm font-bold text-gray-200">{posTitle}</p>
                </div>
                <p className="text-xs text-white">{posDesc}</p>
              </div>
            </div>
          )}

          {/* Price history chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-[10px] font-semibold text-white uppercase tracking-widest mb-4">Price History</div>
            {isLoadingHistory ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-100">Loading…</div>
            ) : chartData && chartData.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="date" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} tickMargin={8} axisLine={false} tickLine={false} />
                    <YAxis width={75} stroke="#374151" tick={{ fill: '#6b7280', fontSize: 10 }} tickMargin={8} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      domain={[dataMin => Math.max(0, Math.floor(dataMin * 0.95)), dataMax => Math.ceil(dataMax * 1.05)]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#e5e7eb', borderRadius: '0.375rem', fontSize: '12px' }}
                      formatter={(v, n) => [`₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, n]}
                      labelStyle={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                    <Line name="Amazon"    type="monotone" dataKey="Amazon"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    <Line name="Flipkart"  type="monotone" dataKey="Flipkart" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    <Line name="Our Price" type="stepAfter" dataKey="OurPrice" stroke="#4b5563" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-gray-100 border border-dashed border-gray-800 rounded-lg">
                <Info className="w-6 h-6 mb-2" />
                <p className="text-xs">No history yet — sync to start tracking.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Market Intelligence */}
      <div className="border-t border-gray-800 pt-6 space-y-6">

        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-white" />
          <h2 className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">Market Intelligence</h2>
        </div>

        {/* KPI cards */}
        {isLoadingMI ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-lg animate-pulse" />)}
          </div>
        ) : ov && (
          <div>
            <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest mb-3">Market Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Products Tracked" value={ov.total_products.toLocaleString('en-IN')} sub={`${ov.products_with_data} with price data`} icon={BarChart2} />
              <StatCard label="Amazon Coverage"   value={`${ov.amazon_coverage_pct}%`}   sub={`${ov.amazon_coverage} products with comparison data`}   icon={Activity} />
              <StatCard label="Flipkart Coverage" value={`${ov.flipkart_coverage_pct}%`} sub={`${ov.flipkart_coverage} products with comparison data`} icon={Activity} />
              <StatCard label="Avg Market Price"  value={inr(ov.avg_market_price)}        sub="Across all products"               icon={Target} />
            </div>
          </div>
        )}

        {/* Competitor Monitoring — summary cards + filterable table */}
        {mi && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-white" />
              <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest">Competitor Monitoring</h3>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {mi.price_movement?.Amazon && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="text-[10px] text-white uppercase font-bold mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"></span>Amazon
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-red-400"><ArrowUp className="w-3 h-3" />Increased</span><span className="font-bold text-gray-200">{mi.price_movement.Amazon.increased}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-green-400"><ArrowDown className="w-3 h-3" />Decreased</span><span className="font-bold text-gray-200">{mi.price_movement.Amazon.decreased}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-gray-300"><Minus className="w-3 h-3" />Unchanged</span><span className="font-bold text-gray-200">{mi.price_movement.Amazon.unchanged}</span></div>
                    <div className="flex justify-between items-center text-xs border-t border-gray-800 pt-2 mt-1"><span className="text-gray-400">Insufficient history</span><span className="font-bold text-gray-200">{mi.price_movement.Amazon.insufficient}</span></div>
                  </div>
                </div>
              )}
              {mi.price_movement?.Flipkart && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="text-[10px] text-white uppercase font-bold mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>Flipkart
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-red-400"><ArrowUp className="w-3 h-3" />Increased</span><span className="font-bold text-gray-200">{mi.price_movement.Flipkart.increased}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-green-400"><ArrowDown className="w-3 h-3" />Decreased</span><span className="font-bold text-gray-200">{mi.price_movement.Flipkart.decreased}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-1 text-gray-300"><Minus className="w-3 h-3" />Unchanged</span><span className="font-bold text-gray-200">{mi.price_movement.Flipkart.unchanged}</span></div>
                    <div className="flex justify-between items-center text-xs border-t border-gray-800 pt-2 mt-1"><span className="text-gray-400">Insufficient history</span><span className="font-bold text-gray-200">{mi.price_movement.Flipkart.insufficient}</span></div>
                  </div>
                </div>
              )}
              {movementSummary && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-4 justify-center">
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-semibold tracking-widest mb-1">Total Price Changes</div>
                    <div className="text-2xl font-bold text-gray-100">{movementSummary.total_changes}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">products with tracked movement</div>
                  </div>
                  <div className="border-t border-gray-800 pt-3">
                    <div className="text-[9px] text-gray-400 uppercase font-semibold tracking-widest mb-1">Significant Changes</div>
                    <div className="text-2xl font-bold text-red-400">{movementSummary.significant_changes}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">|&#916;| &ge; {movementSummary.significant_threshold_pct}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Monitoring table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Increased', 'Decreased', 'Unchanged', 'Significant'].map(f => (
                    <button key={f} onClick={() => setMonitorFilter(f)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase transition-colors ${
                        monitorFilter === f ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}>{f}</button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                  <input type="text" placeholder="Search product or competitor…" value={monitorSearch}
                    onChange={e => setMonitorSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 w-52" />
                </div>
              </div>
              {filteredMonitoring.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">
                  {monitoringRecords.length === 0
                    ? 'No genuine competitor price movements available yet. Sync a product multiple times to build movement history.'
                    : 'No records match the current filter or search.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-950 text-[10px] text-white uppercase font-semibold border-b border-gray-800">
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">Competitor</th>
                        <th className="px-4 py-2.5 text-right">Previous Recorded Price</th>
                        <th className="px-4 py-2.5 text-right">Current Movement Price</th>
                        <th className="px-4 py-2.5 text-right">Change</th>
                        <th className="px-4 py-2.5 text-right">Change %</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Observed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredMonitoring.map((r, idx) => {
                        const diffColor = r.diff > 0 ? 'text-red-400' : r.diff < 0 ? 'text-green-400' : 'text-gray-300';
                        const isTest = r.data_source === 'TEST_HISTORICAL';
                        return (
                          <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-[10px] text-gray-500 block">{r.product_id}</span>
                              <span className="text-white font-medium max-w-[160px] truncate block">{r.product_name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-bold ${ r.competitor === 'Amazon' ? 'text-yellow-400' : 'text-blue-400' }`}>{r.competitor}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-300">{inr(r.prev_price)}</td>
                            <td className="px-4 py-2.5 text-right text-white font-medium">{inr(r.curr_price)}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${diffColor}`}>{r.diff > 0 ? '+' : ''}{inr(r.diff)}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${diffColor}`}>{r.pct > 0 ? '+' : ''}{r.pct.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-center"><DirectionBadge direction={r.direction} /></td>
                            <td className="px-4 py-2.5 text-right text-gray-500 text-[10px]">
                              {r.curr_date ? new Date(r.curr_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '\u2014'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Position Distribution */}
        {mi && mp && (
          <div>
            <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest mb-3">Market Position Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'cheaper',   label: 'Below Market', icon: TrendingDown },
                { key: 'near',      label: 'Near Market',  icon: Minus },
                { key: 'expensive', label: 'Above Market', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => {
                const count = mp[key], total = mp.total;
                const pct = total ? ((count / total) * 100).toFixed(1) : 0;
                return (
                  <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-3">
                    <div className="p-2 rounded bg-gray-800 shrink-0"><Icon className="w-4 h-4 text-gray-200" /></div>
                    <div>
                      <p className="text-[9px] font-semibold text-white uppercase tracking-widest">{label}</p>
                      <p className="text-lg font-bold text-gray-200">{pct}%</p>
                      <p className="text-[10px] text-gray-100">{count.toLocaleString('en-IN')} products</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Market Insights */}
        {marketInsights && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-white" />
              <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest">Market Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'position',    title: 'Market Position',      borderCls: 'border-green-900/40' },
                { key: 'category',    title: 'Category Intelligence', borderCls: 'border-blue-900/40' },
                { key: 'movement',    title: 'Competitor Movement',   borderCls: 'border-yellow-900/40' },
                { key: 'opportunity', title: 'Top Opportunity',       borderCls: 'border-red-900/40' },
              ].map(({ key, title, borderCls }) => (
                <div key={key} className={`bg-gray-900 border ${borderCls} rounded-lg p-4`}>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{title}</div>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {marketInsights[key] || 'Insufficient data to generate this insight.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category intelligence table */}
        {ci.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest mb-3">Category Intelligence</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-950 text-[10px] text-white uppercase font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-center">Products</th>
                    <th className="px-4 py-2.5 text-right">Our Avg</th>
                    <th className="px-4 py-2.5 text-right">Amazon Avg</th>
                    <th className="px-4 py-2.5 text-right">Flipkart Avg</th>
                    <th className="px-4 py-2.5 text-right">Market Avg</th>
                    <th className="px-4 py-2.5 text-right">Gap</th>
                    <th className="px-4 py-2.5 text-center">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {ci.map(row => {
                    const gapColor = row.avg_gap_pct == null ? 'text-white'
                      : row.avg_gap_pct < -3 ? 'text-green-400'
                      : row.avg_gap_pct > 3  ? 'text-red-400'
                      : 'text-yellow-400';
                    return (
                      <tr key={row.category} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-white">{row.category}</td>
                        <td className="px-4 py-2.5 text-center text-gray-200">{row.products}</td>
                        <td className="px-4 py-2.5 text-right text-gray-100">{inr(row.avg_our_price)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-100">{inr(row.avg_amazon)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-100">{inr(row.avg_flipkart)}</td>
                        <td className="px-4 py-2.5 text-right text-white font-medium">{inr(row.avg_market)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${gapColor}`}>
                          {row.avg_gap_pct != null ? `${row.avg_gap_pct > 0 ? '+' : ''}${row.avg_gap_pct}%` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center"><PositionPill position={row.position} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top pricing opportunities */}
        {topOps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-white" />
              <h3 className="text-[10px] font-semibold text-white uppercase tracking-widest">Top Pricing Opportunities</h3>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-800">
                <p className="text-[10px] text-gray-100">
                  Products with the largest absolute gap from market average. Position is derived from gap percentage (±3% threshold).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-950 text-[10px] text-white uppercase font-semibold border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-right">Our Price</th>
                      <th className="px-4 py-2.5 text-right">Market Avg</th>
                      <th className="px-4 py-2.5 text-right">Gap</th>
                      <th className="px-4 py-2.5 text-center">Position</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {topOps.map(op => {
                      const gapColor = op.gap_pct < -3 ? 'text-green-400' : op.gap_pct > 3 ? 'text-red-400' : 'text-yellow-400';
                      return (
                        <tr key={op.product_id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-[10px] text-white block">{op.product_id}</span>
                            <span className="text-white font-medium max-w-[180px] truncate block">{op.product_name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-white">{op.category}</td>
                          <td className="px-4 py-2.5 text-right text-white font-medium">{inr(op.our_price)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-200">{inr(op.avg_market)}</td>
                          <td className={`px-4 py-2.5 text-right font-semibold ${gapColor}`}>
                            {op.gap_pct > 0 ? '+' : ''}{op.gap_pct}%
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {/* GapPositionPill is gap-derived, so +95% gap correctly shows "Above Market" */}
                            <GapPositionPill gapPct={op.gap_pct} />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => {
                                const prod = products.find(p => p.product_id === op.product_id);
                                if (prod) handleAnalyzeFromCatalog(prod);
                              }}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded text-[10px] font-semibold uppercase transition-colors flex items-center gap-1 ml-auto">
                              Analyze <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── PRODUCT COMPARISON CATALOG ──────────────────────────────────────── */}
      <div className="border-t border-gray-800 pt-6 mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-white" />
          <h2 className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">Product Comparison</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input type="text" placeholder="Search by name or ID…" value={catalogSearch}
              onChange={e => { setCatalogSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-900 border border-gray-800 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600" />
          </div>
          <select value={catalogCategory} onChange={e => { setCatalogCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:outline-none focus:border-gray-600 min-w-[160px]">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-950 text-[10px] text-white uppercase font-semibold border-b border-gray-800">
              <tr>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Our Price</th>
                <th className="px-4 py-2.5 text-right">Amazon</th>
                <th className="px-4 py-2.5 text-right">Flipkart</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoadingProducts ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading products…</td></tr>
              ) : catalogPage.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products match your search.</td></tr>
              ) : catalogPage.map(p => (
                <tr key={p.product_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[10px] text-gray-500 block">{p.product_id}</span>
                    <span className="text-white font-medium max-w-[200px] truncate block">{p.product_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">{p.category || '—'}</td>
                  <td className="px-4 py-2.5 text-right text-white font-medium">{inr(p.base_price)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {p.amazon_price != null ? <span className="text-yellow-400 font-medium">{inr(p.amazon_price)}</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.flipkart_price != null ? <span className="text-blue-400 font-medium">{inr(p.flipkart_price)}</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleAnalyzeFromCatalog(p)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded text-[10px] font-semibold uppercase transition-colors flex items-center gap-1 ml-auto">
                      Analyze <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCatalog.length)} of {filteredCatalog.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors">← Prev</button>
              <span className="px-2.5 py-1 text-gray-200">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── PRICING COMPARISON REPORT ──────────────────────────────────────── */}
      {selectedProduct && (
        <div className="border-t border-gray-800 pt-6 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-white" />
              <h2 className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">Pricing Comparison Report</h2>
            </div>
            <button onClick={exportReportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-[10px] font-semibold uppercase text-gray-200 transition-colors">
              <Download className="w-3 h-3" />Export CSV
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-5">

            {/* Report header */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-gray-800">
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">Product</div>
                <div className="text-base font-bold text-gray-100">{selectedProduct.product_name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">{selectedProduct.product_id}</span>
                  {selectedProduct.category && <span className="text-[10px] text-gray-400">{selectedProduct.category}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-gray-400 uppercase tracking-widest">Report Date</div>
                <div className="text-xs text-gray-200 font-medium mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Pricing summary */}
            <div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Pricing Summary</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Our Price',          val: inr(ourPrice) },
                  { label: 'Amazon',             val: inr(amzPrice) },
                  { label: 'Flipkart',           val: inr(fkpPrice) },
                  { label: 'Lowest Competitor',  val: inr(lowest) },
                  { label: 'Highest Competitor', val: inr(highest) },
                  { label: 'Market Average',     val: inr(avg, 0) },
                  { label: 'Price Gap',
                    val: avg != null ? `${inr(Math.abs(ourPrice - avg))} ${ourPrice < avg ? 'below' : ourPrice > avg ? 'above' : 'matching'} market` : '—' },
                  { label: 'Gap %',
                    val: avg != null ? `${Math.abs(((ourPrice - avg) / avg) * 100).toFixed(2)}% ${ourPrice < avg ? 'below' : ourPrice > avg ? 'above' : 'matching'} market` : '—' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-gray-950 border border-gray-800 rounded p-3">
                    <div className="text-[9px] text-gray-400 uppercase font-semibold mb-1">{label}</div>
                    <div className="text-sm font-bold text-gray-200">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Position + Market summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Competitive Position</div>
                <div className="bg-gray-950 border border-gray-800 rounded p-3 flex items-center gap-2.5">
                  <PosIcon className="w-4 h-4 text-gray-300 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-gray-100">{posTitle}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{posDesc}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Market Summary</div>
                <div className="bg-gray-950 border border-gray-800 rounded p-3">
                  {avg != null ? (
                    <p className="text-xs text-gray-200 leading-relaxed">
                      Our price is {Math.abs(((ourPrice - avg) / avg) * 100).toFixed(2)}%{' '}
                      {ourPrice < avg ? 'below' : ourPrice > avg ? 'above' : 'at'} the observed competitor market average ({inr(avg, 0)}).{' '}
                      Lowest observed: {inr(lowest)}. Highest observed: {inr(highest)}.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Sync competitor prices to generate the market summary.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Competitor movement */}
            <div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Competitor Movement</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Amazon', 'Flipkart'].map(comp => {
                  const mv = selectedMovement?.[comp];
                  return (
                    <div key={comp} className="bg-gray-950 border border-gray-800 rounded p-3">
                      <div className="text-[10px] font-bold text-white mb-2">{comp}</div>
                      {mv ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs"><span className="text-gray-400">Previous Recorded Price</span><span className="text-gray-300">{inr(mv.prev_price)}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-400">Current Movement Price</span><span className="text-white font-medium">{inr(mv.curr_price)}</span></div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Change</span>
                            <span className={`font-semibold ${mv.pct > 0 ? 'text-red-400' : mv.pct < 0 ? 'text-green-400' : 'text-gray-300'}`}>
                              {mv.pct > 0 ? '+' : ''}{mv.pct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="pt-1 border-t border-gray-800 mt-1">
                            <DirectionBadge direction={mv.direction} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">Price movement unavailable — insufficient historical observations.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CompetitorPricing;

