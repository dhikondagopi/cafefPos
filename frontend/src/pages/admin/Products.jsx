import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, Coffee, PackageCheck, PackageX } from 'lucide-react';

const CURRENCY = '₹';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [photo, setPhoto] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [stock, setStock] = useState('50');
  const [isAvailable, setIsAvailable] = useState(true);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([API.get('/products'), API.get('/categories')]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditId(product._id); setName(product.name); setDescription(product.description || '');
      setPrice(product.price); setCategory(product.category?._id || product.category || '');
      setImage(product.image || '');
      setImageUrl(product.imageUrl || '');
      setPhoto(product.photo || '');
      setThumbnail(product.thumbnail || '');
      setStock(product.stock || 0); setIsAvailable(product.isAvailable);
    } else {
      setEditId(null); setName(''); setDescription(''); setPrice('');
      setCategory(categories[0]?._id || '');
      setImage(''); setImageUrl(''); setPhoto(''); setThumbnail('');
      setStock('50'); setIsAvailable(true);
    }
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditId(null); setFormError(''); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImage(base64);
      setImageUrl(base64);
      setPhoto(base64);
      setThumbnail(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !category) return setFormError('Name, price, and category are required.');
    setFormLoading(true); setFormError('');
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        category,
        image,
        imageUrl,
        photo,
        thumbnail,
        stock: parseInt(stock) || 0,
        isAvailable
      };
      if (editId) {
        const res = await API.put(`/products/${editId}`, payload);
        if (res.data.success) setProducts(products.map(p => p._id === editId ? res.data.data : p));
      } else {
        const res = await API.post('/products', payload);
        if (res.data.success) setProducts([...products, res.data.data]);
      }
      closeModal();
    } catch (err) { setFormError(err.response?.data?.message || 'Error saving product.'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await API.delete(`/products/${id}`);
      if (res.data.success) setProducts(products.filter(p => p._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'all' || (p.category?._id || p.category) === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <Coffee className="w-5 h-5 mr-2 text-[#FF5722]" />
            Products & Menu Items
          </h1>
          <p className="text-slate-500 text-xs mt-1">Manage pricing, images, and stock of all menu items</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex items-center bg-[#0d1120] border border-white/8 rounded-xl px-3 py-2 flex-1 max-w-sm focus-within:border-[#FF5722]/40 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${filterCat === 'all' ? 'bg-[#FF5722]/20 border-[#FF5722]/30 text-[#FF5722]' : 'bg-white/3 border-white/8 text-slate-400 hover:text-white'}`}>
            All ({products.length})
          </button>
          {categories.map(cat => (
            <button key={cat._id} onClick={() => setFilterCat(cat._id)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${filterCat === cat._id ? 'bg-[#FF5722]/20 border-[#FF5722]/30 text-[#FF5722]' : 'bg-white/3 border-white/8 text-slate-400 hover:text-white'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Coffee className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No products found</h3>
          <p className="text-slate-500 text-sm">Add your first menu item or clear search filters.</p>
        </div>
      ) : (
        <div className="card-dark overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                <th className="px-5 py-3.5">Image</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-5 py-3">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=80&q=80'}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover bg-[#0d1120] border border-white/8"
                      onError={(e) => { e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230d1120"/><text y="55" x="50" text-anchor="middle" font-size="40">☕</text></svg>`; }}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-white text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-500 max-w-[180px] truncate">{p.description || '—'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded-lg uppercase">
                      {p.category?.name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-[#FF5722] text-xs">{CURRENCY}{p.price.toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{p.stock} units</td>
                  <td className="px-5 py-3">
                    <span className={`status-badge ${p.isAvailable ? 'status-available' : 'status-cancelled'}`}>
                      {p.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(p)} className="p-1.5 bg-white/5 hover:bg-indigo-500/15 border border-white/8 hover:border-indigo-500/25 text-slate-400 hover:text-indigo-400 rounded-lg transition-all" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 bg-white/5 hover:bg-red-500/15 border border-white/8 hover:border-red-500/25 text-slate-400 hover:text-red-400 rounded-lg transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">{filtered.length} of {products.length} products</p>
            <p className="text-[10px] text-slate-600">{products.filter(p => p.isAvailable).length} available • {products.filter(p => !p.isAvailable).length} unavailable</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>{editId ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-none">
              {formError && (
                <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-dark" placeholder="e.g. Cafe Latte" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Local Image</label>
                <input type="file" accept="image/*" onChange={handleFileUpload}
                  className="input-dark text-xs py-1" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image / URL (Fallback)</label>
                <input type="text" value={imageUrl} onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImage(e.target.value);
                  setPhoto(e.target.value);
                  setThumbnail(e.target.value);
                }}
                  className="input-dark font-mono text-[11px]" placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="input-dark resize-none" placeholder="Ingredients, preparation details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="input-dark" placeholder="0.00" required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</label>
                  <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                    className="input-dark" placeholder="100" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="input-dark" style={{ background: 'rgba(10,14,25,0.8)' }} required>
                  <option value="" disabled>Select category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <div onClick={() => setIsAvailable(!isAvailable)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isAvailable ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${isAvailable ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-slate-300">Available for sale</span>
              </label>
              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 btn-ghost py-2.5 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `${editId ? 'Update' : 'Create'} Product`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
