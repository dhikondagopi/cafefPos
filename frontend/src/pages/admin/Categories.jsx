import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, X, FolderKanban, AlertCircle } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FF5722');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/categories');
      setCategories(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (category = null) => {
    setFormError('');
    if (category) {
      setEditId(category._id);
      setName(category.name);
      setDescription(category.description || '');
      setColor(category.color || '#FF5722');
    } else {
      setEditId(null);
      setName('');
      setDescription('');
      setColor('#FF5722');
    }
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditId(null); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return setFormError('Category name is required.');
    setFormLoading(true); setFormError('');
    try {
      const payload = { name, description, color };
      if (editId) {
        const res = await API.put(`/categories/${editId}`, payload);
        if (res.data.success) setCategories(categories.map(c => c._id === editId ? res.data.data : c));
      } else {
        const res = await API.post('/categories', payload);
        if (res.data.success) setCategories([...categories, res.data.data]);
      }
      closeModal();
    } catch (err) { setFormError(err.response?.data?.message || 'Error saving category.'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await API.delete(`/categories/${id}`);
      if (res.data.success) setCategories(categories.filter(c => c._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const presetColors = [
    '#FF5722', // Odoo Orange
    '#E0B034', // Gold Amber
    '#10B981', // Jade Green
    '#3B82F6', // Ocean Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple/Violet
    '#EC4899', // Ruby Pink
    '#8D6E63', // Coffee Milk Brown
    '#4E342E', // Deep Coffee Espresso
    '#06B6D4', // Cyan
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <FolderKanban className="w-5 h-5 mr-2 text-[#FF5722]" />
            Product Categories
          </h1>
          <p className="text-slate-500 text-xs mt-1">Organize menu into groups like Beverages, Food, Desserts</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No categories yet</h3>
          <p className="text-slate-500 text-sm mb-4">Start by creating your first menu category.</p>
          <button onClick={() => openModal()} className="btn-primary px-5 py-2.5 text-xs">Create Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const catColor = cat.color || '#FF5722';
            return (
              <div key={cat._id} className="card-dark p-5 group relative hover:border-white/15 transition-all animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 flex-shrink-0" style={{ background: `${catColor}15`, border: `1px solid ${catColor}35` }}>
                  <span className="text-lg font-black" style={{ color: catColor }}>{cat.name.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="font-black text-white text-sm flex items-center justify-between">
                  <span>{cat.name}</span>
                  <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: catColor }} title={catColor} />
                </h3>
                <p className="text-slate-500 text-[10px] mt-1 truncate">{cat.description || 'No description'}</p>
                <div className="flex items-center space-x-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="flex-1 py-1.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1">
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(cat._id)} className="flex-1 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1">
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>{editId ? 'Edit Category' : 'New Category'}</h3>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-dark" placeholder="e.g. Beverages" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} className="input-dark resize-none" placeholder="Brief description..." />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Color</label>
                <div className="flex items-center space-x-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 bg-transparent border border-white/10 rounded-xl cursor-pointer p-0.5" />
                  <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                    className="input-dark text-xs flex-1 font-mono uppercase" placeholder="#FF5722" />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        color.toLowerCase() === c.toLowerCase()
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-white/10 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 btn-ghost py-2.5 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `${editId ? 'Update' : 'Create'} Category`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
