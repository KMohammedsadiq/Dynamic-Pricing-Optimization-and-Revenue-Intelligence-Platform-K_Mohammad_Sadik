import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, TrendingUp, BarChart3, LineChart, LogOut, UploadCloud, Hexagon, Users, Shield, Menu, X } from "lucide-react";
import { logout, getUser } from "../utils/auth";

export default function MainLayout() {
  const user = getUser();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#111827] flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Solid Enterprise Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-[#1F2937] border-r border-[#374151] flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 px-8 flex items-center justify-between border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <Hexagon className="text-blue-500" size={28} />
            <h1 className="text-xl font-bold text-white tracking-tight">
              PricePilot
            </h1>
          </div>
          {/* Close button for mobile */}
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Main Menu</p>
          
          {[
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all' },
            { path: '/products', label: 'Products', icon: Package, role: ['Admin', 'Pricing Manager'] },
            { path: '/predictions', label: 'Price Prediction', icon: TrendingUp, role: ['Admin', 'Pricing Manager'] },
            { path: '/forecasts', label: 'Demand Forecast', icon: LineChart, role: ['Admin', 'Business Analyst'] },
            { path: '/competitors', label: 'Competitor Analysis', icon: Users, role: 'Admin' },
            { path: '/revenue-optimization', label: 'Revenue Optimization', icon: TrendingUp, role: ['Admin', 'Pricing Manager'] },
            { path: '/analytics', label: 'Analytics', icon: BarChart3, role: ['Admin', 'Business Analyst'] },
            { path: '/upload', label: 'Upload Data', icon: UploadCloud, role: 'Admin' },
            { path: '/users', label: 'User Mgmt', icon: Shield, role: 'Admin' },
          ].map((item) => {
            const roles = Array.isArray(item.role) ? item.role : [item.role];
            if (item.role !== 'all' && (!user || !roles.includes(user.role_name))) return null;
            
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile when navigating
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                    : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-[#374151] bg-[#1F2937]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                {user ? user.full_name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user ? user.full_name : "Admin User"}</p>
                <p className="text-xs text-gray-400 truncate">{user ? user.role_name : "Administrator"}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-2 w-full text-gray-300 hover:text-white hover:bg-[#374151] rounded-md transition-colors border border-transparent"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#111827] w-full">
        {/* Top Header */}
        <header className="h-20 px-4 md:px-8 flex items-center border-b border-[#374151] bg-[#111827] flex-shrink-0 z-10 shadow-sm gap-4">
          <button 
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-md hover:bg-[#1F2937] transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex flex-col justify-center">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:block">Retail Pricing Management System</p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto custom-scrollbar relative w-full">
          <div className={location.pathname === '/predictions' ? "h-full" : "p-4 md:p-8 h-full"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
