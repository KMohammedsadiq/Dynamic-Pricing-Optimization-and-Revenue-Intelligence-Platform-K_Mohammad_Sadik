import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard";
import ProductDetails from "./pages/ProductDetails";
import Landing from "./pages/Landing";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";

import ProtectedRoute from "./components/ProtectedRoute";

// Placeholder Page Components
const Predictions = () => <div><h1 className="text-2xl font-bold mb-4">Price Predictions</h1><div className="h-64 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white/50">AI Results Placeholder</div></div>;
const Forecasts = () => <div><h1 className="text-2xl font-bold mb-4">Demand Forecasts</h1><div className="h-64 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white/50">Time Series Chart Placeholder</div></div>;
const Competitors = () => <div><h1 className="text-2xl font-bold mb-4">Competitor Analysis</h1><div className="h-64 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white/50">Competitor Monitoring Placeholder</div></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          {/* Layout Wrapper */}
          <Route element={<MainLayout />}>
            {/* Dashboard is accessible to all logged-in users */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="upload" element={<Upload />} />
              <Route path="competitors" element={<Competitors />} />
              <Route path="users" element={<Users />} />
            </Route>
            
            {/* Pricing Manager and Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Pricing Manager"]} />}>
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="predictions" element={<Predictions />} />
            </Route>
            
            {/* Business Analyst and Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Business Analyst"]} />}>
              <Route path="forecasts" element={<Forecasts />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
