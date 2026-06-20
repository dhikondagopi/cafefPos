import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Trash2, X, AlertCircle, CalendarDays, Check, CheckCircle } from 'lucide-react';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tableId, setTableId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookRes, tableRes] = await Promise.all([
        API.get('/bookings'),
        API.get('/tables')
      ]);
      setBookings(bookRes.data.data);
      setTables(tableRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load bookings and tables.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setError('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setTableId(tables[0]?._id || '');
    setBookingDate('');
    setNumberOfGuests('2');
    setStatus('pending');
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !tableId || !bookingDate || !numberOfGuests) {
      return setError('Please fill in all required fields.');
    }

    const payload = {
      customerName,
      customerPhone,
      customerEmail,
      table: tableId,
      bookingDate: new Date(bookingDate).toISOString(),
      numberOfGuests: parseInt(numberOfGuests),
      status
    };

    try {
      const res = await API.post('/bookings', payload);
      if (res.data.success) {
        setBookings([...bookings, res.data.data]);
        handleCloseModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error scheduling reservation.');
    }
  };

  const handleConfirmStatus = async (booking) => {
    try {
      const res = await API.put(`/bookings/${booking._id}`, { status: 'confirmed' });
      if (res.data.success) {
        setBookings(bookings.map(b => b._id === booking._id ? res.data.data : b));
        alert('Booking confirmed. Table status updated to Reserved.');
      }
    } catch (err) {
      alert('Failed to update booking status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this reservation booking?')) return;

    try {
      const res = await API.delete(`/bookings/${id}`);
      if (res.data.success) {
        setBookings(bookings.filter(b => b._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete booking.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Table Reservations Book</h1>
          <p className="text-slate-500 text-sm">Schedule seating reservations for dining guests</p>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={tables.length === 0}
          className="flex items-center px-4 py-2 bg-odoo-primary hover:bg-odoo-accent disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Reservation
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-odoo-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No reservations scheduled</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Create table bookings for customers.</p>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-odoo-primary hover:bg-odoo-accent text-white font-bold text-sm rounded-xl transition-all shadow-sm"
          >
            Create Booking
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Date/Time</th>
                <th className="px-6 py-4">Guests Count</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{b.customerName}</td>
                  <td className="px-6 py-4 font-mono text-xs">{b.customerPhone}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {b.table?.name} <span className="text-[10px] text-slate-400 font-normal">({b.table?.floor?.name || '—'})</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {new Date(b.bookingDate).toLocaleDateString()} at {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">{b.numberOfGuests} guests</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                      b.status === 'confirmed' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : b.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmStatus(b)}
                        className="p-1 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 rounded text-slate-500 transition-all"
                        title="Confirm Booking"
                      >
                        <Check className="w-4.5 h-4.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 rounded text-slate-500 transition-all"
                      title="Cancel/Delete"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add Booking */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-6">
              <h3 className="font-bold text-slate-800 text-base">New Table Reservation</h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Guest Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none font-mono text-xs"
                    placeholder="e.g. 555-0133"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Guests Count</label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none"
                    placeholder="2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Table</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none bg-white text-slate-700"
                    required
                  >
                    {tables.map((tbl) => (
                      <option key={tbl._id} value={tbl._id}>
                        {tbl.name} (Cap: {tbl.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none bg-white text-slate-700"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="confirmed">Confirmed (Reserve Table)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none font-mono text-xs"
                  placeholder="name@example.com"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-odoo-primary hover:bg-odoo-accent text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  Schedule Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
