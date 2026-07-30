import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, CheckCircle, Search, User as UserIcon } from "lucide-react";
import api from "../services/api";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/");
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Could not load users. Make sure you have Admin privileges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role_name: newRole });
      // Update local state to reflect change instantly
      setUsers(users.map(u => u.id === userId ? { ...u, role_name: newRole } : u));
    } catch (err) {
      console.error("Failed to update role", err);
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto pb-16"
    >
      <div className="mb-8 glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -z-10"></div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
            <Shield className="text-brand-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">User Management</h1>
            <p className="text-white/60 font-medium mt-1">Manage platform access and assign corporate roles.</p>
          </div>
        </div>

        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="glass-card p-6 border border-red-500/20 bg-red-500/10 text-red-400 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-6 h-6" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-5 font-bold text-white/50 text-sm uppercase tracking-wider">User</th>
                  <th className="p-5 font-bold text-white/50 text-sm uppercase tracking-wider">Email</th>
                  <th className="p-5 font-bold text-white/50 text-sm uppercase tracking-wider">Current Role</th>
                  <th className="p-5 font-bold text-white/50 text-sm uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-white/70 font-medium">{user.email}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        user.role_name === 'Admin' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                        user.role_name === 'Viewer' ? 'bg-white/5 border-white/10 text-white/60' :
                        'bg-brand-500/10 border-brand-500/30 text-brand-400'
                      }`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="p-5">
                      <select
                        value={user.role_name}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.email === "mohammedsadiq4850@gmail.com"}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Pricing Manager">Pricing Manager</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-white/40 font-medium">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
