import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Eye, X, Trash2, ArrowLeft, RefreshCw, Layers } from 'lucide-react';

const CURRENCY = '₹';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrdersHistory();
  }, []);

  const fetchOrdersHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const res = await API.delete(`/orders/${id}`);
      if (res.data.success) {
        setSelectedOrder(null);
        fetchOrdersHistory();
        alert('Order successfully deleted.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order.');
    }
  };

  const handleEditOrder = (ord) => {
    setSelectedOrder(null);
    navigate(`/pos/order/${ord.table?._id || ord.table}?orderId=${ord._id}`);
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const orderNum = o.orderNumber.toLowerCase();
    const custName = o.customer?.name?.toLowerCase() || 'walk-in guest';
    const dateStr = new Date(o.createdAt).toLocaleDateString().toLowerCase();
    return orderNum.includes(term) || custName.includes(term) || dateStr.includes(term);
  });

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] text-slate-200 overflow-hidden font-sans relative w-full">
      {/* Main Container */}
      <div className="flex-1 p-6 flex flex-col min-h-0 bg-[#0d0d0d]">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0 mb-4">
            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Order History
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">View and manage history of POS orders and checkout logs.</p>
          </div>
          <button 
            onClick={fetchOrdersHistory}
            className="flex items-center px-4 py-2 bg-[#121212] border border-[#262626] hover:bg-[#1a1a1a] text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </button>
        </div>


        {/* Search filter panel matching Image 3 design */}
        <div className="flex items-center bg-[#121212] border border-[#262626] rounded-xl px-3 py-2.5 max-w-md mb-6 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Search by customer name, order number, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        {/* Table layout container */}
        <div className="flex-1 bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-24 space-y-2">
              <Layers className="w-12 h-12 text-slate-700" />
              <h4 className="font-bold text-white text-sm">No transaction orders found</h4>
              <p className="text-xs text-slate-500">Go to table map and add products to checkout transactions.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#161616] border-b border-[#262626] text-slate-400 uppercase text-[9px] font-extrabold tracking-wider sticky top-0 z-10">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020] text-slate-300">
                  {filteredOrders.map((o) => (
                    <tr 
                      key={o._id} 
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-[#1a1a1a]/40 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white uppercase text-[10px]">
                        {o.orderNumber}
                      </td>
                      <td className="px-6 py-4">{o.customer?.name || 'Walk-in Guest'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-[#FF5722] text-sm">
                        {CURRENCY}{o.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                          o.status === 'draft'
                            ? 'bg-[#2b2b2b] text-slate-400 border border-slate-800'
                            : 'bg-[#4a2a2a] text-[#f97316] border border-[#5e2b2b]'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                          className="p-1 hover:bg-[#202020] hover:text-[#3b82f6] rounded border border-transparent transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ================= ORDER DETAILS OVERLAY MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header matching Image 4 popup */}
            <div className="h-14 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-6">
              <span className="text-white font-extrabold text-sm tracking-tight">
                Order #{selectedOrder.orderNumber}
              </span>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 hover:bg-[#1c1c1c] text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-5 bg-[#0d0d0d]">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Date</p>
                  <p className="text-white mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Customer</p>
                  <p className="text-white mt-0.5">{selectedOrder.customer?.name || 'Walk-in Guest'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Amount</p>
                  <p className="text-[#FF5722] font-extrabold mt-0.5">{CURRENCY}{selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Status</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    selectedOrder.status === 'paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-3 border-t border-[#262626]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Products</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-[#1c1c1c] text-slate-300">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono">{CURRENCY}{(it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Visible only if Draft Order */}
              <div className="pt-6 border-t border-[#262626] flex gap-3 flex-shrink-0">
                {selectedOrder.status === 'draft' ? (
                  <>
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="flex-1 py-3 bg-[#4a2424] hover:bg-[#5e2b2b] text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleEditOrder(selectedOrder)}
                      className="flex-1 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black rounded-xl text-xs font-black transition-all shadow"
                    >
                      Edit Order
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-[10px] text-slate-500 py-3 bg-[#121212] rounded-xl border border-[#202020]">
                    Closed Transactions Cannot Be Edited
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
