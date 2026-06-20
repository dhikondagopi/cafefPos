import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { Printer, Send, ArrowLeft, CheckCircle, Coffee, User, CreditCard, Table2 } from 'lucide-react';

const CURRENCY = '₹';

const Receipt = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const changeDueParam = searchParams.get('changeDue');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderReceipt();
  }, [orderId]);

  const fetchOrderReceipt = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      const foundOrder = res.data.data.find(o => o._id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        if (foundOrder.customer?.email) setEmail(foundOrder.customer.email);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  const handleEmailReceipt = (e) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    setTimeout(() => { setEmailLoading(false); setEmailSent(true); }, 1200);
  };

  const renderBarcode = (code) => {
    const bars = [];
    const widths = [1,2,1,3,1,2,4,1,2,1,3,1,2,1,4,2,1,3,1,2,1,3,2,1,4,1,2,1];
    let x = 4;
    for (let i = 0; i < widths.length; i++) {
      bars.push(<rect key={i} x={x} width={widths[i]} height="20" fill={i % 2 === 0 ? "black" : "transparent"} />);
      x += widths[i] + 1.5;
    }
    return (
      <svg className="w-full h-10" viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <rect width="120" height="20" fill="white" />
        {bars}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#08090f] flex flex-col items-center justify-center text-slate-400 p-6">
        <p className="font-bold mb-4">Receipt not found.</p>
        <Link to="/pos" className="btn-primary text-xs px-5 py-2.5">← Back to POS</Link>
      </div>
    );
  }

  const changeDue = parseFloat(changeDueParam) || 0;

  return (
    <div className="min-h-screen bg-[#08090f] flex flex-col items-center justify-center py-6 px-4 print:bg-white print:p-0" style={{ fontFamily: 'Inter,sans-serif' }}>
      
      {/* Action Bar (hidden on print) */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/pos')} className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to POS</span>
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrint} className="flex items-center space-x-1.5 px-3 py-2 bg-[#0d1120] border border-white/8 hover:border-white/15 text-slate-300 font-bold text-xs rounded-xl transition-all">
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Change Due Banner */}
      {changeDue > 0 && (
        <div className="w-full max-w-md mb-4 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center space-x-3 print:hidden animate-fade-up">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-sm font-black">Payment Successful!</p>
            <p className="text-emerald-600 text-xs">Change Due: <span className="text-emerald-400 font-mono font-bold">{CURRENCY}{changeDue.toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {/* Receipt Card */}
      <div className="w-full max-w-md card-dark overflow-hidden print:border-none print:shadow-none print:bg-white animate-fade-up">
        
        {/* Receipt Header */}
        <div className="p-4 bg-gradient-to-r from-[#FF5722]/10 to-transparent border-b border-white/5 print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-white">Transaction Receipt</span>
          </div>
        </div>

        {/* Thermal Receipt Content */}
        <div className="p-5 bg-[#08090f] print:p-0 print:bg-white">
          <div className="bg-white text-slate-900 p-6 rounded-xl shadow-inner print:rounded-none print:shadow-none" style={{ fontFamily: 'monospace' }}>
            
            {/* Shop Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Coffee className="w-5 h-5 text-[#FF5722]" />
                <h2 className="text-xl font-black text-slate-900">CafeFlow POS</h2>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Premium Cafe & Restaurant</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tel: +91 9876543210</p>
              <p className="text-[10px] text-slate-400">GST: 29ABCDE1234F1Z5</p>
            </div>

            {/* Order Meta */}
            <div className="space-y-1.5 border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              {[
                { label: 'Order #', value: order.orderNumber, bold: true },
                { label: 'Date', value: new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { label: 'Time', value: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Table', value: order.table?.name || 'Takeaway' },
                { label: 'Customer', value: order.customer?.name || 'Walk-in Guest' },
                { label: 'Payment', value: order.paymentMethod?.name || 'Cash', bold: true },
                { label: 'Status', value: 'PAID ✓', color: 'text-emerald-600', bold: true },
              ].map(({ label, value, bold, color }) => (
                <div key={label} className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{label}:</span>
                  <span className={`${bold ? 'font-black' : 'font-semibold'} text-slate-900 ${color || ''}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Line Items */}
            <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                <span>Item</span>
                <div className="flex space-x-6">
                  <span>Qty</span>
                  <span>Amt</span>
                </div>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="mb-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-slate-900 max-w-[55%] truncate">{item.name}</span>
                    <div className="flex space-x-4">
                      <span className="font-mono text-slate-600">×{item.quantity}</span>
                      <span className="font-mono font-bold text-slate-900">{CURRENCY}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  {item.notes && <p className="text-[9px] text-slate-400 italic ml-2">"{item.notes}"</p>}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{CURRENCY}{(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>GST (5%)</span>
                <span className="font-mono">{CURRENCY}{(order.tax || 0).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600">
                  <span>Discount</span>
                  <span className="font-mono font-bold">-{CURRENCY}{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TOTAL</span>
                <span className="font-mono">{CURRENCY}{order.total.toFixed(2)}</span>
              </div>
              {changeDue > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Change Due</span>
                  <span className="font-mono">{CURRENCY}{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode */}
            <div className="mb-4">
              {renderBarcode(order.orderNumber)}
              <p className="text-center text-[8px] font-mono font-bold text-slate-400 tracking-widest mt-1 uppercase">
                {order.orderNumber}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center space-y-0.5 pt-2 border-t border-slate-200">
              <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Thank You!</p>
              <p className="text-[9px] text-slate-400">Please visit again • Feedback: www.cafeflow.in</p>
              <p className="text-[8px] text-slate-300 mt-1">Software by CafeFlow Enterprise POS v2.0</p>
            </div>
          </div>
        </div>

        {/* Email Receipt */}
        <div className="p-4 border-t border-white/5 print:hidden">
          {emailSent ? (
            <div className="flex items-center space-x-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Receipt sent to <strong>{email}</strong></span>
            </div>
          ) : (
            <form onSubmit={handleEmailReceipt} className="flex space-x-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Customer email address..."
                className="flex-1 input-dark text-xs py-2"
              />
              <button type="submit" disabled={emailLoading}
                className="px-4 py-2 bg-gradient-to-r from-[#FF5722] to-[#f97316] hover:from-[#f97316] hover:to-[#FF5722] text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-[#FF5722]/20 disabled:opacity-60">
                {emailLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{emailLoading ? '...' : 'Send'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* New Order Button */}
      <div className="mt-4 print:hidden">
        <button onClick={() => navigate('/pos')}
          className="btn-primary px-8 py-3 text-sm">
          Start New Order →
        </button>
      </div>
    </div>
  );
};

export default Receipt;
