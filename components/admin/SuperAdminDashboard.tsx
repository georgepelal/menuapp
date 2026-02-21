import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Database, LogOut, 
  Trash2, Search, Utensils, ChefHat 
} from '../ui/Icons';
import { User } from '../../types';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

interface UserStat {
  email: string;
  name: string;
  itemCount: number;
  categoryCount: number;
  languages: string[];
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all data from localStorage
  const loadData = () => {
    try {
      const usersStr = localStorage.getItem('gourmet_qr_users');
      const usersObj = usersStr ? JSON.parse(usersStr) : {};
      
      const stats: UserStat[] = Object.entries(usersObj).map(([email, user]: [string, any]) => {
        // Skip listing the admin if they are saved in users (though we handle admin login separately)
        if (email === 'admin@gourmetqr.com') return null;

        const dataStr = localStorage.getItem(`gourmet_qr_data_${email}`);
        const data = dataStr ? JSON.parse(dataStr) : null;
        
        return {
          email,
          name: user.name,
          itemCount: data?.items?.length || 0,
          categoryCount: data?.categories?.length || 0,
          languages: data?.profile?.languages?.map((l: any) => l.code) || ['en']
        };
      }).filter(Boolean) as UserStat[];

      setUsers(stats);
    } catch (e) {
      console.error("Error loading super admin data", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = (email: string) => {
    if (confirm(`Are you sure you want to permanently delete ${email} and all their data?`)) {
      // 1. Remove from users list
      const usersStr = localStorage.getItem('gourmet_qr_users');
      if (usersStr) {
        const usersObj = JSON.parse(usersStr);
        delete usersObj[email];
        localStorage.setItem('gourmet_qr_users', JSON.stringify(usersObj));
      }

      // 2. Remove their data
      localStorage.removeItem(`gourmet_qr_data_${email}`);
      
      // 3. Remove session if they are logged in on this browser (optional cleanup)
      const session = localStorage.getItem('gourmet_qr_session');
      if (session) {
        const currentUser = JSON.parse(session);
        if (currentUser.email === email) {
           localStorage.removeItem('gourmet_qr_session');
        }
      }

      // Refresh list
      loadData();
    }
  };

  const handleResetSystem = () => {
    if (confirm("WARNING: This will wipe ALL registered users and menu data from this browser. This cannot be undone. Are you sure?")) {
      localStorage.clear();
      setUsers([]);
      alert("System reset complete.");
      onLogout(); // Log admin out as well since session is gone
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = users.reduce((acc, curr) => acc + curr.itemCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
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
             onClick={onLogout}
             className="w-full text-slate-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm"
           >
             <LogOut size={16} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
           
           {/* Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
               <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
               <p className="text-slate-500">Manage registered restaurants and monitor system usage.</p>
             </div>
             <button 
               onClick={handleResetSystem}
               className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
             >
               <Database size={16} /> Wipe All Data
             </button>
           </div>

           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                   <Users size={24} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-500 font-medium">Total Restaurants</p>
                   <h3 className="text-2xl font-bold text-slate-800">{users.length}</h3>
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
                     {users.length > 0 ? Math.round(totalItems / users.length) : 0}
                   </h3>
                 </div>
              </div>
           </div>

           {/* Users Table */}
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
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold text-center">Items</th>
                      <th className="px-6 py-4 font-semibold text-center">Categories</th>
                      <th className="px-6 py-4 font-semibold">Languages</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                          <td className="px-6 py-4 text-slate-500">{user.email}</td>
                          <td className="px-6 py-4 text-slate-500 text-center">
                            <span className="inline-block bg-slate-100 px-2 py-1 rounded-md min-w-[30px]">{user.itemCount}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-center">
                            <span className="inline-block bg-slate-100 px-2 py-1 rounded-md min-w-[30px]">{user.categoryCount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {user.languages.map(l => (
                                <span key={l} className="text-xs border border-gray-200 px-1.5 py-0.5 rounded uppercase text-slate-500">{l}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleDeleteUser(user.email)}
                               className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                               title="Delete User"
                             >
                               <Trash2 size={18} />
                             </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No users found matching your search.
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