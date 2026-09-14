import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Activity, Search, Utensils, ChefHat, LogOut
} from '../ui/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchAllBusinessesForSuperAdmin, SuperAdminBusinessRow } from '../../services/supabaseData';

const SuperAdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<SuperAdminBusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchAllBusinessesForSuperAdmin()
      .then(rows => {
        if (mounted) setBusinesses(rows);
      })
      .catch(err => addToast('error', err.message || 'Failed to load businesses'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [addToast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const filteredBusinesses = businesses.filter(
    b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = businesses.reduce((acc, curr) => acc + curr.itemCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="text-red-500" size={24} />
          <h1 className="text-xl font-bold">Super Admin</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 bg-red-900/20 text-red-100 border border-red-900/50">
            <Activity size={18} /> Platform Overview
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-700">
           <button
             onClick={handleLogout}
             className="w-full text-slate-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm"
           >
             <LogOut size={16} /> Sign Out
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

           <div>
             <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
             <p className="text-slate-500">Real-time view of registered restaurants across GourmetQR.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                   <Users size={24} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-500 font-medium">Total Restaurants</p>
                   <h3 className="text-2xl font-bold text-slate-800">{businesses.length}</h3>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                   <Utensils size={24} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-500 font-medium">Total Menu Items</p>
                   <h3 className="text-2xl font-bold text-slate-800">{totalItems}</h3>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                   <ChefHat size={24} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-500 font-medium">Avg Items / Restaurant</p>
                   <h3 className="text-2xl font-bold text-slate-800">
                     {businesses.length > 0 ? Math.round(totalItems / businesses.length) : 0}
                   </h3>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-lg text-slate-800">Registered Restaurants</h3>
                <div className="relative w-full sm:w-auto">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search restaurants..."
                     className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500"
                   />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-slate-500 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Restaurant Name</th>
                      <th className="px-6 py-4 font-semibold">Owner Email</th>
                      <th className="px-6 py-4 font-semibold text-center">Items</th>
                      <th className="px-6 py-4 font-semibold text-center">Categories</th>
                      <th className="px-6 py-4 font-semibold">Public URL</th>
                      <th className="px-6 py-4 font-semibold text-center">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td>
                      </tr>
                    ) : filteredBusinesses.length > 0 ? (
                      filteredBusinesses.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{b.name}</td>
                          <td className="px-6 py-4 text-slate-500">{b.ownerEmail}</td>
                          <td className="px-6 py-4 text-slate-500 text-center">
                            <span className="inline-block bg-slate-100 px-2 py-1 rounded-md min-w-[30px]">{b.itemCount}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-center">
                            <span className="inline-block bg-slate-100 px-2 py-1 rounded-md min-w-[30px]">{b.categoryCount}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">/m/{b.slug}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${b.isPublished ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                              {b.isPublished ? 'Live' : 'Hidden'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No businesses found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
