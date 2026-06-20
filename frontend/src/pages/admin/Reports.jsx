import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { BarChart3, TrendingUp, ShoppingBag, Clock, RefreshCw, DollarSign, ArrowUp, ArrowDown, Calendar, Package } from 'lucide-react';

const CURRENCY = '₹';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    setLoading(true); setError('');
    try {
      const res = await API.get('/reports/summary');
      if (res.data.success) setReportData(res.data.data);
      else setError('Failed to aggregate report data.');
    } catch (err) {
      console.error(err); setError('Failed to fetch financial reports.');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 skeleton w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="card-dark p-8 text-center">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-white font-bold mb-1">Report Error</p>
        <p className="text-slate-400 text-sm mb-4">{error || 'Failed to load report data'}</p>
        <button onClick={fetchReport} className="btn-primary px-5 py-2 text-xs">Retry</button>
      </div>
    );
  }

  const { revenue, orderCount, averageOrderValue, activeOrdersCount, salesByCategory, salesByTable, salesTrend } = reportData;

  const maxTrendRevenue = salesTrend.length > 0 ? Math.max(...salesTrend.map(t => t.revenue)) : 0;
  const maxCategoryRevenue = salesByCategory.length > 0 ? Math.max(...salesByCategory.map(c => c.revenue)) : 0;
  const maxTableRevenue = salesByTable.length > 0 ? Math.max(...salesByTable.map(t => t.revenue)) : 0;

  const kpis = [
    { label: 'Gross Revenue', value: `${CURRENCY}${revenue.toFixed(2)}`, sub: 'Total earnings', icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Orders Completed', value: `${orderCount}`, sub: 'Paid transactions', icon: ShoppingBag, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
    { label: 'Avg Order Value', value: `${CURRENCY}${averageOrderValue.toFixed(2)}`, sub: 'Per ticket', icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Active Orders', value: `${activeOrdersCount}`, sub: 'In queue', icon: Clock, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  ];

  const categoryColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <BarChart3 className="w-6 h-6 mr-2 text-[#FF5722]" />
            Financial Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Revenue insights from completed transactions</p>
        </div>
        <button onClick={fetchReport}
          className="inline-flex items-center space-x-2 px-4 py-2 btn-ghost text-xs font-bold">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card-dark p-5 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'JetBrains Mono,monospace' }}>{kpi.value}</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">{kpi.label}</p>
              <p className="text-slate-600 text-[10px] mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Trend Bar Chart */}
        <div className="lg:col-span-8 card-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-base text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>
                Daily Sales Trend
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Revenue over the past 7 days</p>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-bold">7 Days</span>
            </div>
          </div>

          {salesTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-white/8 rounded-xl text-slate-500 text-sm">
              No sales data yet
            </div>
          ) : (
            <div className="h-52 flex items-end justify-around gap-3 pb-6 border-b border-white/5 relative">
              {/* Y-axis guidelines */}
              {[25, 50, 75, 100].map(pct => (
                <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-white/4" style={{ bottom: `${pct}%` }}>
                  <span className="absolute -left-1 -top-2.5 text-[8px] text-slate-600 font-mono">
                    {CURRENCY}{((maxTrendRevenue * pct) / 100).toFixed(0)}
                  </span>
                </div>
              ))}
              
              {salesTrend.map((day, i) => {
                const heightPct = maxTrendRevenue > 0 ? Math.max(4, (day.revenue / maxTrendRevenue) * 100) : 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer" style={{ zIndex: 10 }}>
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full mb-2 bg-[#0d1120] border border-white/10 rounded-xl px-3 py-2 text-center pointer-events-none shadow-xl z-20">
                      <p className="text-white font-black text-xs font-mono">{CURRENCY}{day.revenue.toFixed(2)}</p>
                      <p className="text-slate-400 text-[9px]">{day.count} orders</p>
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-90"
                      style={{
                        height: `${heightPct}%`,
                        background: `linear-gradient(to top, #FF5722, #f97316)`,
                        boxShadow: '0 -4px 12px rgba(255, 87, 34, 0.25)'
                      }}
                    />
                    {/* Label */}
                    <span className="text-[9px] text-slate-500 font-mono mt-2 group-hover:text-slate-300 transition-colors">
                      {day._id?.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="lg:col-span-4 card-dark p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-base text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>By Category</h3>
              <p className="text-slate-500 text-xs mt-0.5">Revenue breakdown</p>
            </div>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          
          {salesByCategory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No sales data</div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-none">
              {salesByCategory.map((cat, i) => {
                const pct = maxCategoryRevenue > 0 ? (cat.revenue / maxCategoryRevenue) * 100 : 0;
                const color = categoryColors[i % categoryColors.length];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{cat.categoryName}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{CURRENCY}{cat.revenue.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="text-[9px] text-slate-600 mt-0.5">{cat.quantitySold} units sold</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Revenue by Table */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-base text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>Revenue by Table</h3>
            <p className="text-slate-500 text-xs mt-0.5">Total earnings per dining table</p>
          </div>
        </div>
        
        {salesByTable.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No table revenue data.</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-none pr-1">
            {salesByTable.map((tbl, i) => {
              const pct = maxTableRevenue > 0 ? (tbl.revenue / maxTableRevenue) * 100 : 0;
              return (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-[#FF5722]/15 border border-[#FF5722]/25 rounded-lg flex items-center justify-center text-[9px] font-black text-[#FF5722] flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="w-24 text-xs font-bold text-slate-300 truncate">{tbl.tableName}</span>
                  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#FF5722] to-[#f97316] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right text-xs font-mono font-bold text-white">{CURRENCY}{tbl.revenue.toFixed(2)}</span>
                  <span className="w-16 text-right text-[9px] text-slate-500 font-mono">{tbl.visitCount} visits</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
