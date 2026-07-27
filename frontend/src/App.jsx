import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Placeholder Page Components
const Login = () => <div className="p-10 text-center"><h1 className="text-3xl font-bold">Login Page</h1><p className="mt-4 text-gray-600">Authentication comes later.</p></div>;
const Register = () => <div className="p-10 text-center"><h1 className="text-3xl font-bold">Register Page</h1><p className="mt-4 text-gray-600">Registration logic comes later.</p></div>;
const Dashboard = () => <div><h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1><div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">KPI Widgets Placeholder</div></div>;
const Products = () => <div><h1 className="text-2xl font-bold mb-4">Product Management</h1><div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">Data Table Placeholder</div></div>;
const Predictions = () => <div><h1 className="text-2xl font-bold mb-4">Price Predictions</h1><div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">AI Results Placeholder</div></div>;
const Forecasts = () => <div><h1 className="text-2xl font-bold mb-4">Demand Forecasts</h1><div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">Time Series Chart Placeholder</div></div>;
const Analytics = () => <div><h1 className="text-2xl font-bold mb-4">Analytics & Revenue</h1><div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">BI Reports Placeholder</div></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes inside MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="forecasts" element={<Forecasts />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
