import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { Search, Plus, X, ArrowLeft, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form modal toggles
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Field values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomersRegistry();
  }, []);

  const fetchCustomersRegistry = async () => {
    setLoading(true);
    try {
      const res = await API.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers registry', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCustomer(c);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone);
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!name || !phone) return alert('Name and Phone number are required.');

    try {
      if (selectedCustomer) {
        // Update customer
        const res = await API.put(`/customers/${selectedCustomer._id}`, { name, email, phone });
        if (res.data.success) {
          alert('Customer details successfully saved!');
        }
      } else {
        // Create new customer
        const res = await API.post('/customers', { name, email, phone });
        if (res.data.success) {
          alert('New customer profile successfully registered!');
        }
      }
      setIsFormOpen(false);
      fetchCustomersRegistry();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer details.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer?')) return;
    try {
      const res = await API.delete(`/customers/${id}`);
      if (res.data.success) {
        setIsFormOpen(false);
        fetchCustomersRegistry();
        alert('Customer profile deleted.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] text-slate-200 overflow-hidden font-sans relative w-full">
      {/* Main workspace */}
      <div className="flex-1 p-6 flex flex-col min-h-0 bg-[#0d0d0d]">
        
        {/* Title area */}
        <div className="flex-shrink-0 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Customer Registry
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Manage details of registered cafe members and customer profiles.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchCustomersRegistry}
              className="flex items-center px-4 py-2 bg-[#121212] border border-[#262626] hover:bg-[#1a1a1a] text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Refresh
            </button>
            <button 
              onClick={handleOpenAdd}
              className="flex items-center px-4 py-2 bg-[#FF5722] hover:bg-[#f97316] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#FF5722]/20"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Customer
            </button>
          </div>
        </div>

        {/* Search input bar */}
        <div className="flex items-center bg-[#121212] border border-[#262626] rounded-xl px-3 py-2.5 max-w-md mb-6 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Search customers registry by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        {/* Table list */}
        <div className="flex-1 bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-24">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h4 className="font-bold text-white text-sm">No customers registered</h4>
              <p className="text-xs text-slate-500">Register new customers to log their loyalty points during transactions.</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto divide-y divide-[#202020] p-4 scrollbar-thin">
              {filteredCustomers.map((c) => (
                <div key={c._id} className="py-3.5 flex justify-between items-center hover:bg-[#1a1a1a]/30 px-3 rounded-xl transition-all">
                  <div>
                    <h4 className="font-extrabold text-white text-sm">{c.name}</h4>
                    <p className="text-slate-500 font-mono text-xs mt-0.5">{c.email || 'no email added'} • {c.phone}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="Edit Customer Profile"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ==================== FORM OVERLAY MODAL (Image 5 Edit style) ==================== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="h-12 bg-[#161616] border-b border-[#262626] flex items-center justify-between px-4">
              <span className="text-white font-bold text-xs">
                {selectedCustomer ? 'Edit' : 'Add'} Customer Profile
              </span>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1 hover:bg-[#1c1c1c] text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 bg-[#0d0d0d]">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-xs text-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g. Eric Smith"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-xs text-white focus:outline-none focus:border-slate-500 font-mono"
                  placeholder="eric@odoo.com"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-xs text-white focus:outline-none focus:border-slate-500 font-mono"
                  placeholder="+91 9898989898"
                  required
                />
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2 border border-[#262626] hover:bg-[#1c1c1c] text-slate-400 text-xs font-bold rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Save
                </button>
              </div>

              {/* Delete button if selected customer */}
              {selectedCustomer && (
                <div className="pt-2 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(selectedCustomer._id)}
                    className="w-full py-2 bg-[#4a2424] hover:bg-[#5c2a2a] text-rose-300 font-extrabold text-xs rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
