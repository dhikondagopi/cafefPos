import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChefHat, LogOut } from 'lucide-react';

const KitchenLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* KDS Dark Premium Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-md z-30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-950">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-white">CafeFlow KDS</h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Kitchen Display System</p>
          </div>
        </div>

        {/* Info & Logout */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-300">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">STATION: HEAD CHEF</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-red-950/70 border border-slate-700 hover:border-red-900 text-slate-300 hover:text-red-200 rounded-lg text-xs font-bold transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Ticket Dashboard Area */}
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
};

export default KitchenLayout;
