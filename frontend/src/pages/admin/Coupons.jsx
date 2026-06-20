import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, X, Tag, AlertCircle } from 'lucide-react';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await API.get('/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      console.error(err);
      setFormError('Failed to fetch coupons.');
    } finally { setLoading(false); }
  };

  const openModal = (coupon = null) => {
    setFormError('');
    if (coupon) {
      setEditId(coupon._id);
      setCode(coupon.code);
      setDiscount(coupon.discount);
      setIsActive(coupon.isActive);
    } else {
      setEditId(null);
      setCode('');
      setDiscount('');
      setIsActive(true);
    }
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditId(null); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discount) return setFormError('Code and discount are required.');
    const payload = { code, discount, isActive };
    try {
      if (editId) {
        const res = await API.put(`/coupons/${editId}`, payload);
        if (res.data.success) setCoupons(coupons.map(c => c._id === editId ? res.data.data : c));
      } else {
        const res = await API.post('/coupons', payload);
        if (res.data.success) setCoupons([...coupons, res.data.data]);
      }
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving coupon.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const res = await API.delete(`/coupons/${id}`);
      if (res.data.success) setCoupons(coupons.filter(c => c._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <Tag className="w-5 h-5 mr-2 text-[#FF5722]" />
            Coupons & Promotions
          </h1>
          <p className="text-slate-500 text-xs mt-1">Create promo codes for discounts</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>Add Coupon</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No coupons yet</h3>
          <p className="text-slate-500 text-sm mb-4">Add a coupon to boost sales.</p>
          <button onClick={() => openModal()} className="btn-primary px-5 py-2.5 text-xs">Create Coupon</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c, i) => (
            <div key={c._id} className="card-dark p-5 flex flex-col group hover:border-white/15 transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-slate-800/30 rounded-xl">
                  <Tag className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Outfit,sans-serif' }}>{c.code}</h3>
                  <span className="text-slate-400 text-xs">{c.discount}% off</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {c.isActive ? 'Active' : 'Disabled'}
              </span>
              <div className="flex gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(c)} className="flex-1 py-1.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1">
                  <Edit2 className="w-3 h-3" /><span>Edit</span>
                </button>
                <button onClick={() => handleDelete(c._id)} className="flex-1 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1">
                  <Trash2 className="w-3 h-3" /><span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>{editId ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coupon Code</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)}
                  className="input-dark" placeholder="e.g. SAVE20" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount (%)</label>
                <input type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)}
                  className="input-dark" placeholder="e.g. 20" required />
              </div>
              <label className="flex items-center space-x-2.5 cursor-pointer mt-2">
                <div onClick={() => setIsActive(!isActive)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isActive ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-slate-300">Enable Coupon</span>
              </label>
              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 btn-ghost py-2.5 text-xs font-bold">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center">
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
