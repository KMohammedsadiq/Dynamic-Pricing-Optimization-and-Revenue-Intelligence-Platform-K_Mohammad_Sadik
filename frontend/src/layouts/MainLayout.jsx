import { Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Package, TrendingUp, BarChart3, LineChart, LogOut } from "lucide-react";
import { logout, getUser } from "../utils/auth";

export default function MainLayout() {
  const user = getUser();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400">PricePilot AI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {/* Everyone sees the Dashboard */}
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* Pricing Managers and Admins see Products and Predictions */}
          {(user?.role_name === "Admin" || user?.role_name === "Pricing Manager") && (
            <>
              <Link to="/products" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
                <Package size={20} />
                <span>Products</span>
              </Link>
              <Link to="/predictions" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
                <TrendingUp size={20} />
                <span>Predictions</span>
              </Link>
            </>
          )}

          {/* Business Analysts and Admins see Forecasts and Analytics */}
          {(user?.role_name === "Admin" || user?.role_name === "Business Analyst") && (
            <>
              <Link to="/forecasts" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
                <LineChart size={20} />
                <span>Forecasts</span>
              </Link>
              <Link to="/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
            </>
          )}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-700">Enterprise Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">{user ? user.full_name : "Admin User"}</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold">
              {user ? user.full_name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
