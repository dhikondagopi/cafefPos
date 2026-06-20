import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Edit2, Trash2, X, Users as UsersIcon, AlertCircle, ShieldCheck, Utensils, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (usr) => {
    setFormError('');
    setSelectedUser(usr); setName(usr.name); setEmail(usr.email);
    setRole(usr.role); setIsActive(usr.isActive); setPassword('');
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setSelectedUser(null); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return setFormError('Name and email are required.');
    setFormLoading(true); setFormError('');
    try {
      const payload = { name, email, role, isActive };
      if (password) payload.password = password;
      const res = await API.put(`/auth/users/${selectedUser._id}`, payload);
      if (res.data.success) {
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, ...res.data.data } : u));
        closeModal();
      }
    } catch (err) { setFormError(err.response?.data?.message || 'Error updating user.'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (id === currentUser._id) return alert('You cannot delete your own account.');
    if (!window.confirm('Permanently delete this employee account?')) return;
    try {
      const res = await API.delete(`/auth/users/${id}`);
      if (res.data.success) setUsers(users.filter(u => u._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const roleConfig = {
    admin: { label: 'Admin', icon: ShieldCheck, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
    employee: { label: 'Cashier', icon: UserCheck, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    kitchen: { label: 'Kitchen', icon: Utensils, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center" style={{ fontFamily: 'Outfit,sans-serif' }}>
            <UsersIcon className="w-5 h-5 mr-2 text-[#FF5722]" />
            Staff & Employee Management
          </h1>
          <p className="text-slate-500 text-xs mt-1">Manage employee roles and access permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 px-2 py-1 bg-white/4 border border-white/8 rounded-lg font-bold">{users.length} total users</span>
          <span className="text-[10px] text-emerald-400 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-bold">{users.filter(u => u.isActive).length} active</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card-dark overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {users.map((usr) => {
                const rc = roleConfig[usr.role] || roleConfig.employee;
                const RoleIcon = rc.icon;
                return (
                  <tr key={usr._id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0 border border-white/10"
                          style={{ background: rc.bg }}>
                          {usr.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white text-xs">{usr.name}</span>
                            {usr._id === currentUser?._id && (
                              <span className="px-1.5 py-0.5 bg-[#FF5722]/15 border border-[#FF5722]/25 text-[#FF5722] text-[8px] font-black rounded uppercase">You</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">{usr.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg w-fit" style={{ background: rc.bg, border: `1px solid ${rc.border}` }}>
                        <RoleIcon className="w-3 h-3" style={{ color: rc.color }} />
                        <span className="text-[10px] font-bold" style={{ color: rc.color }}>{rc.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`status-badge ${usr.isActive ? 'status-available' : 'status-cancelled'}`}>
                        {usr.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[10px] font-mono">
                      {new Date(usr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(usr)} className="p-1.5 bg-white/5 hover:bg-indigo-500/15 border border-white/8 hover:border-indigo-500/25 text-slate-400 hover:text-indigo-400 rounded-lg transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(usr._id)} disabled={usr._id === currentUser?._id}
                          className="p-1.5 bg-white/5 hover:bg-red-500/15 border border-white/8 hover:border-red-500/25 text-slate-400 hover:text-red-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <h3 className="font-black text-sm text-white" style={{ fontFamily: 'Outfit,sans-serif' }}>Edit Employee</h3>
              <button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {[
                { label: 'Full Name', value: name, onChange: setName, placeholder: 'John Smith', type: 'text', required: true },
                { label: 'Email', value: email, onChange: setEmail, placeholder: 'john@example.com', type: 'email', required: true, mono: true },
                { label: 'New Password (optional)', value: password, onChange: setPassword, placeholder: 'Leave blank to keep current', type: 'password', mono: true },
              ].map(f => (
                <div key={f.label} className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                  <input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)}
                    className={`input-dark ${f.mono ? 'font-mono text-[11px]' : ''}`} placeholder={f.placeholder} required={f.required} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} disabled={selectedUser?._id === currentUser?._id}
                    className="input-dark" style={{ background: 'rgba(10,14,25,0.8)' }}>
                    <option value="employee">Cashier</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')}
                    disabled={selectedUser?._id === currentUser?._id} className="input-dark" style={{ background: 'rgba(10,14,25,0.8)' }}>
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 btn-ghost py-2.5 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
