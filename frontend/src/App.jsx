import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import PricePrediction from "./pages/PricePrediction";
import AmazonApiTest from "./pages/AmazonApiTest";
import FlipkartApiTest from "./pages/FlipkartApiTest";
import Forecasts from "./pages/Forecasts";
import Competitors from "./pages/Competitors";
import RevenueOptimization from "./pages/RevenueOptimization";
import ExecutiveBi from "./pages/ExecutiveBi";

import ProtectedRoute from "./components/ProtectedRoute";

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
              <Route path="amazon-test" element={<AmazonApiTest />} />
              <Route path="flipkart-test" element={<FlipkartApiTest />} />
            </Route>

            {/* Pricing Manager and Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Pricing Manager"]} />}>
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetails />} />
              <Route path="predictions" element={<PricePrediction />} />
              <Route path="revenue-optimization" element={<RevenueOptimization />} />
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
    </BrowserRouter>
  );
}
