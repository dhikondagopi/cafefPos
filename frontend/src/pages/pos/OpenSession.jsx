import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Landmark, ArrowRight, LogOut, Coffee, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const OpenSession = () => {
  const [openingBalance, setOpeningBalance] = useState('1000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, startSession, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate('/pos');
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) return setError('Please enter a valid opening cash balance.');
    setLoading(true);
    const res = await startSession(balance);
    setLoading(false);
    if (res.success) navigate('/pos');
    else setError(res.error || 'Failed to open POS session. Please try again.');
  };

  const quickAmounts = ['500', '1000', '2000', '5000'];

  return (
    <div className="min-h-screen bg-[#08090f] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'Inter,sans-serif' }}>
      {/* BG Decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#FF5722]/5 blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div className="card-dark overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-900/30">
              <Coffee className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit,sans-serif' }}>Open POS Session</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Initialize your cashier drawer to start processing orders for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-950/25 border border-red-900/40 rounded-xl flex items-start space-x-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Balance Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Cash Balance (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-lg">₹</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full pl-8 pr-4 py-4 bg-[#0d1120] border border-white/8 focus:border-amber-500/50 rounded-xl text-2xl text-white text-center font-black focus:outline-none transition-colors"
                    style={{ fontFamily: 'JetBrains Mono,monospace' }}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setOpeningBalance(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      openingBalance === amt 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                        : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'
                    }`}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Info box */}
              <div className="p-3 bg-white/3 border border-white/6 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Cashier</span>
                  <span className="text-white font-bold">{user?.name}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Role</span>
                  <span className="text-white font-bold capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Opening Balance</span>
                  <span className="text-amber-400 font-bold font-mono">₹{parseFloat(openingBalance || 0).toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center space-x-2 disabled:opacity-60">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Open Drawer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom */}
            <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-slate-500">System Online</span>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }}
                className="text-slate-500 hover:text-red-400 font-bold flex items-center space-x-1 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenSession;
