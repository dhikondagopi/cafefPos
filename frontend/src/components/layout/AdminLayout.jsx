import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Tag,
  Coffee, 
  Layers, 
  Grid3X3,
  Users, 
  Ticket, 
  CreditCard, 
  CalendarDays, 
  BarChart3, 
  LogOut,
  ChefHat,
  MonitorPlay,
  Menu,
  X,
  Bell,
  Settings,
  Search
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { group: 'Overview', items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    ]},
    { group: 'Product Setup', items: [
      { name: 'Categories', path: '/admin/categories', icon: Tag },
      { name: 'Products', path: '/admin/products', icon: Coffee },
    ]},
    { group: 'Floor Management', items: [
      { name: 'Floors', path: '/admin/floors', icon: Layers },
      { name: 'Tables Plan', path: '/admin/tables', icon: Grid3X3 },
    ]},
    { group: 'Operations', items: [
      { name: 'Employees', path: '/admin/users', icon: Users },
      { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
      { name: 'Payment Config', path: '/admin/payment-methods', icon: CreditCard },
      { name: 'Reservations', path: '/admin/bookings', icon: CalendarDays },
    ]},
    { group: 'Insights', items: [
      { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    ]},
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPageName = (() => {
    for (const group of menuItems) {
      for (const item of group.items) {
        const matched = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
        if (matched) return item.name;
      }
    }
    return 'Admin Portal';
  })();

  const SidebarContent = () => (
    <>
      {/* Branding */}
      <div className={`px-5 py-5 border-b border-white/5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-[#FF5722] to-[#f97316] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5722]/25 flex-shrink-0">
          <ChefHat className="w-4.5 h-4.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="font-black text-sm text-white tracking-tight truncate" style={{ fontFamily: 'Outfit,sans-serif' }}>CafeFlow POS</h1>
            <p className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">{todayStr}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow overflow-y-auto py-4 scrollbar-none">
        {menuItems.map((group) => (
          <div key={group.group} className="mb-2">
            {!sidebarCollapsed && (
              <p className="px-5 mb-1 text-[9px] font-black text-slate-600 uppercase tracking-[0.12em]">{group.group}</p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`relative flex items-center mx-3 mb-0.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    active
                      ? 'bg-gradient-to-r from-[#FF5722]/15 to-[#f97316]/5 text-[#FF5722] border border-[#FF5722]/20'
                      : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  {active && <span className="nav-active-indicator" />}
                  <Icon className={`flex-shrink-0 transition-colors ${sidebarCollapsed ? 'w-4.5 h-4.5' : 'w-4 h-4 mr-3'} ${active ? 'text-[#FF5722]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  {active && !sidebarCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* POS Access Button */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-3">
          <Link
            to="/pos"
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-gradient-to-r from-[#FF5722]/20 to-[#f97316]/10 hover:from-[#FF5722]/30 hover:to-[#f97316]/20 border border-[#FF5722]/25 text-[#FF5722] font-bold text-xs rounded-xl transition-all"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Access POS Terminal</span>
          </Link>
        </div>
      )}

      {/* User card */}
      <div className={`border-t border-white/5 p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0 border border-white/10">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        {!sidebarCollapsed && (
          <>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="text-[9px] text-slate-500 uppercase font-medium truncate">{user?.role} access</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-950/25 hover:text-red-400 rounded-lg text-slate-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#08090f] text-slate-100 overflow-hidden" style={{ fontFamily: 'Inter,sans-serif' }}>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className={`hidden lg:flex flex-col bg-[#0b0d16] border-r border-white/5 transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-[68px]' : 'w-[230px]'}`}>
        <SidebarContent />
      </div>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b0d16] border-r border-white/5 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors lg:flex hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight" style={{ fontFamily: 'Outfit,sans-serif' }}>{currentPageName}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:flex items-center px-2.5 py-1 bg-[#FF5722]/10 border border-[#FF5722]/20 text-[#FF5722] text-[9px] font-black rounded-full uppercase tracking-wider">
              {user?.role}
            </span>
            <Link
              to="/kitchen"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-[10px] rounded-xl transition-all"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen KDS</span>
            </Link>
            <div className="flex items-center space-x-2 pl-2 border-l border-white/5">
              <div className="w-7 h-7 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-white font-black text-[10px] border border-white/10">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-grow overflow-y-auto bg-[#08090f] p-5 scrollbar-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
