import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, X, Layers, AlertCircle, CheckCircle } from 'lucide-react';

const Floors = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchFloors(); }, []);

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/floors');
      setFloors(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (floor = null) => {
    setFormError('');
    if (floor) { setEditId(floor._id); setName(floor.name); setColor(floor.color || '#6366f1'); setIsActive(floor.isActive); }
    else { setEditId(null); setName(''); setColor('#6366f1'); setIsActive(true); }
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditId(null); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return setFormError('Floor name is required.');
    setFormLoading(true); setFormError('');
    try {
      if (editId) {
        const res = await API.put(`/floors/${editId}`, { name, color, isActive });
        if (res.data.success) setFloors(floors.map(f => f._id === editId ? res.data.data : f));
      } else {
        const res = await API.post('/floors', { name, color, isActive });
        if (res.data.success) setFloors([...floors, res.data.data]);
      }
      closeModal();
    } catch (err) { setFormError(err.response?.data?.message || 'Error saving floor.'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this floor? All tables on this floor must be deleted first.')) return;
    try {
      const res = await API.delete(`/floors/${id}`);
      if (res.data.success) setFloors(floors.filter(f => f._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const presetColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#FF5722', '#06b6d4', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <Layers className="w-5 h-5 mr-2 text-[#FF5722]" />
            Floors & Layout Zones
          </h1>
          <p className="text-slate-500 text-xs mt-1">Define dining spaces like Ground Floor, Terrace, Bar Area</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>Add Floor</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : floors.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No floors configured</h3>
          <p className="text-slate-500 text-sm mb-4">Add your first floor to start setting up tables.</p>
          <button onClick={() => openModal()} className="btn-primary px-5 py-2.5 text-xs">Create First Floor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {floors.map((floor, i) => (
            <div key={floor._id} className="card-dark p-5 flex flex-col group hover:border-white/15 transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${floor.color || '#6366f1'}20`, border: `1px solid ${floor.color || '#6366f1'}40` }}>
                  <Layers className="w-5 h-5" style={{ color: floor.color || '#6366f1' }} />
                </div>
                <span className={`status-badge ${floor.isActive ? 'status-available' : 'status-cancelled'}`}>
                  {floor.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <h3 className="font-black text-white text-base mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>{floor.name}</h3>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-4">
                <div className="w-3 h-3 rounded-full border border-white/15" style={{ background: floor.color || '#6366f1' }} />
                <span className="font-mono">{floor.color || '#6366f1'}</span>
              </div>
              <div className="flex gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(floor)} className="flex-1 py-1.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1">
                  <Edit2 className="w-3 h-3" /><span>Edit</span>
                </button>
                <button onClick={() => handleDelete(floor._id)} className="flex-1 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1">
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
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>{editId ? 'Edit Floor' : 'New Floor'}</h3>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floor Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-dark" placeholder="e.g. Ground Floor, Terrace" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color Theme</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all border-2 ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ background: c }} />
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer overflow-hidden bg-transparent" />
                  <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                    className="flex-1 input-dark font-mono text-xs" placeholder="#6366f1" />
                </div>
              </div>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <div onClick={() => setIsActive(!isActive)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isActive ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-slate-300">Floor is active in POS</span>
              </label>
              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 btn-ghost py-2.5 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `${editId ? 'Update' : 'Create'} Floor`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Floors;
