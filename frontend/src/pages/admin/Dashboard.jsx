import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { 
  Coffee, FolderKanban, Compass, Users, Ticket, CalendarDays,
  TrendingUp, Layers, ArrowUpRight, ShoppingBag, DollarSign,
  Clock, Activity, BarChart2
} from 'lucide-react';

const CURRENCY = '₹';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, categories: 0, floors: 0, tables: 0, users: 0, coupons: 0, bookings: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenue, setRevenue] = useState({ today: 0, total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prod, cat, flr, tbl, usr, cpn, bkg, orders] = await Promise.all([
          API.get('/products'), API.get('/categories'), API.get('/floors'),
          API.get('/tables'), API.get('/auth/users'), API.get('/coupons'),
          API.get('/bookings'), API.get('/orders')
        ]);
        setStats({
          products: prod.data.data.length, categories: cat.data.data.length,
          floors: flr.data.data.length, tables: tbl.data.data.length,
          users: usr.data.data.length, coupons: cpn.data.data.length,
          bookings: bkg.data.data.length
        });
        const allOrders = orders.data.data;
        const today = new Date().toDateString();
        const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today && o.status === 'paid');
        const totalRevenue = allOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0);
        const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
        const pendingCount = allOrders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
        setRevenue({ today: todayRevenue, total: totalRevenue, pending: pendingCount });
        setRecentOrders(allOrders.slice(0, 6));
      } catch (error) {
        console.error('Dashboard fetch error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const metricCards = [
    { name: 'Products', count: stats.products, link: '/admin/products', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Coffee },
    { name: 'Categories', count: stats.categories, link: '/admin/categories', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: FolderKanban },
    { name: 'Floors', count: stats.floors, link: '/admin/floors', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Layers },
    { name: 'Tables', count: stats.tables, link: '/admin/tables', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: Compass },
    { name: 'Employees', count: stats.users, link: '/admin/users', color: '#FF5722', bg: 'rgba(255,87,34,0.1)', icon: Users },
    { name: 'Coupons', count: stats.coupons, link: '/admin/coupons', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Ticket },
    { name: 'Reservations', count: stats.bookings, link: '/admin/bookings', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', icon: CalendarDays },
  ];

  const statusConfig = {
    draft: { label: 'Draft', className: 'status-draft' },
    sent_to_kitchen: { label: 'In Kitchen', className: 'status-sent' },
    paid: { label: 'Paid', className: 'status-paid' },
    cancelled: { label: 'Cancelled', className: 'status-cancelled' },
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 skeleton w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit,sans-serif' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening with your cafe today.</p>
        </div>
        <Link
          to="/admin/reports"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#f97316] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FF5722]/25 hover:shadow-[#FF5722]/40 transition-all"
        >
          <BarChart2 className="w-4 h-4" />
          <span>View Reports</span>
        </Link>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Revenue", value: `${CURRENCY}${revenue.today.toFixed(2)}`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', sub: 'Cash receipts today' },
          { label: 'Total Revenue', value: `${CURRENCY}${revenue.total.toFixed(2)}`, icon: TrendingUp, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', sub: 'All-time earnings' },
          { label: 'Pending Orders', value: revenue.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', sub: 'Awaiting completion' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card-dark p-5 flex items-center space-x-4 animate-fade-up" style={{ animationDelay: `${i*60}ms` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">{kpi.label}</p>
                <h3 className="text-xl font-black text-white mt-0.5" style={{ fontFamily: 'JetBrains Mono,monospace' }}>{kpi.value}</h3>
                <p className="text-slate-600 text-[10px] mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Overview Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-[#FF5722]" />
          System Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {metricCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.name}
                to={card.link}
                className="card-dark p-4 hover:border-white/15 transition-all group animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <h4 className="text-xl font-black text-white" style={{ fontFamily: 'JetBrains Mono,monospace' }}>{card.count}</h4>
                <p className="text-slate-500 text-[10px] font-semibold mt-0.5">{card.name}</p>
                <ArrowUpRight className="w-3 h-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: card.color }} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders + Quick Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 card-dark overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-[#FF5722]" />
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>Recent Orders</h3>
            </div>
            <Link to="/pos" className="text-[10px] text-[#FF5722] font-bold hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No orders yet. Start your first POS session.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Table</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {recentOrders.map((order) => {
                    const sc = statusConfig[order.status] || { label: order.status, className: 'status-draft' };
                    return (
                      <tr key={order._id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-300">{order.orderNumber?.slice(-6)}</td>
                        <td className="px-5 py-3 text-slate-300">{order.customer?.name || 'Walk-in'}</td>
                        <td className="px-5 py-3 text-slate-400">{order.table?.name || '—'}</td>
                        <td className="px-5 py-3 font-mono font-bold text-[#FF5722]">{CURRENCY}{order.total?.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className={`status-badge ${sc.className}`}>{sc.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Setup Guide */}
        <div className="card-dark p-5">
          <h3 className="font-black text-sm text-white mb-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Quick Setup Guide</h3>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Create Floors', desc: 'Define dining zones like Ground Floor, Patio', link: '/admin/floors', done: stats.floors > 0 },
              { step: '02', title: 'Add Tables', desc: 'Assign tables to each floor with capacity', link: '/admin/tables', done: stats.tables > 0 },
              { step: '03', title: 'Setup Categories', desc: 'Organize menu (Coffee, Food, Drinks)', link: '/admin/categories', done: stats.categories > 0 },
              { step: '04', title: 'Add Products', desc: 'Create menu items with prices', link: '/admin/products', done: stats.products > 0 },
              { step: '05', title: 'Configure Payments', desc: 'Setup Cash, UPI, Card methods', link: '/admin/payment-methods', done: true },
            ].map((item, i) => (
              <Link key={i} to={item.link} className="flex items-start space-x-3 group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5 transition-all ${
                  item.done ? 'bg-emerald-500 text-white' : 'bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/25 group-hover:bg-[#FF5722]/25'
                }`}>
                  {item.done ? '✓' : item.step}
                </div>
                <div>
                  <p className={`text-xs font-bold ${item.done ? 'text-emerald-400 line-through opacity-60' : 'text-slate-200 group-hover:text-white'}`}>{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/pos" className="mt-5 flex items-center justify-center py-2.5 btn-primary text-xs w-full">
            → Launch POS Terminal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
