import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, TrendingUp, BarChart3, LineChart, LogOut, UploadCloud, Hexagon, Users, Shield } from "lucide-react";
import { logout, getUser } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function MainLayout() {
  const user = getUser();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-transparent flex overflow-hidden relative">
      <div className="cyber-grid-bg"></div>
      {/* Floating Glass Sidebar */}
      <aside className="w-64 glass-panel m-4 rounded-3xl flex flex-col relative z-20">
        <div className="p-8 flex items-center gap-3">
          <Hexagon className="text-brand-400" size={28} />
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 tracking-tight">
            PricePilot
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 relative">
          <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Main Menu</p>
          
          {[
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all', color: 'text-brand-400' },
            { path: '/users', label: 'User Mgmt', icon: Shield, role: 'Admin', color: 'text-brand-400' },
            { path: '/upload', label: 'Upload Data', icon: UploadCloud, role: 'Admin', color: 'text-accent-400' },
            { path: '/competitors', label: 'Competitors', icon: Users, role: 'Admin', color: 'text-pink-400' },
            { path: '/products', label: 'Products', icon: Package, role: ['Admin', 'Pricing Manager'], color: 'text-brand-400' },
            { path: '/predictions', label: 'Predictions', icon: TrendingUp, role: ['Admin', 'Pricing Manager'], color: 'text-brand-400' },
            { path: '/forecasts', label: 'Forecasts', icon: LineChart, role: ['Admin', 'Business Analyst'], color: 'text-brand-400' },
            { path: '/analytics', label: 'Analytics', icon: BarChart3, role: ['Admin', 'Business Analyst'], color: 'text-brand-400' },
          ].map((item) => {
            // Check roles
            const roles = Array.isArray(item.role) ? item.role : [item.role];
            if (item.role !== 'all' && (!user || !roles.includes(user.role_name))) return null;
            
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 overflow-hidden group ${isActive ? 'text-white font-bold' : 'text-white/60 hover:text-white'}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active" 
                    className="absolute inset-0 bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_20px_rgba(56,189,248,0.15)] z-0" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {/* Hover Indicator Background (when not active) */}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 z-0"></div>
                )}
                <div className="z-10 flex items-center gap-4 relative">
                  <Icon size={20} className={`${isActive ? item.color : 'opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform'} drop-shadow-md`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-6 mt-auto">
          <div className="glass-card p-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center font-bold text-white shadow-lg">
                {user ? user.full_name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user ? user.full_name : "Admin User"}</p>
                <p className="text-xs text-white/50 truncate">{user ? user.role_name : "Administrator"}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen">
        {/* Top Header */}
        <header className="h-20 px-10 flex items-center justify-between bg-transparent">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white tracking-tight capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
            <p className="text-sm text-white/50 font-medium">Enterprise Analytics Overview</p>
          </div>
          

        </header>

        {/* Page Content with Framer Motion AnimatePresence */}
        <main className="flex-1 overflow-auto px-10 pb-10 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
