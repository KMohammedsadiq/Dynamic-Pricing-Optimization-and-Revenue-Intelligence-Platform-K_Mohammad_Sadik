import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Upload = lazy(() => import("./pages/Upload"));
const Products = lazy(() => import("./pages/Products"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Landing = lazy(() => import("./pages/Landing"));
const Users = lazy(() => import("./pages/Users"));
const Analytics = lazy(() => import("./pages/Analytics"));
const PricePrediction = lazy(() => import("./pages/PricePrediction"));
const AmazonApiTest = lazy(() => import("./pages/AmazonApiTest"));
const FlipkartApiTest = lazy(() => import("./pages/FlipkartApiTest"));
const Forecasts = lazy(() => import("./pages/Forecasts"));
const Competitors = lazy(() => import("./pages/Competitors"));
const RevenueOptimization = lazy(() => import("./pages/RevenueOptimization"));
const ExecutiveBi = lazy(() => import("./pages/ExecutiveBi"));
const SmartPriceAdvisor = lazy(() => import("./pages/SmartPriceAdvisor"));

// Fallback loader
const Fallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#111827]">
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#374151] border-t-purple-500"></div>
      <p className="mt-4 text-sm font-medium text-gray-400 tracking-wide">Loading PricePilot AI...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
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
              <Route path="amazon-test" element={<AmazonApiTest />} />
              <Route path="flipkart-test" element={<FlipkartApiTest />} />
            </Route>

            {/* Pricing Manager and Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Pricing Manager"]} />}>
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="predictions" element={<PricePrediction />} />
              <Route path="revenue-optimization" element={<RevenueOptimization />} />
              <Route path="smart-price" element={<SmartPriceAdvisor />} />
            </Route>

            {/* Business Analyst and Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Business Analyst"]} />}>
              <Route path="forecasts" element={<Forecasts />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="executive-bi" element={<ExecutiveBi />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
