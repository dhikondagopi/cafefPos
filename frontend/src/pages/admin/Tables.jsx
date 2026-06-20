import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, X, AlertCircle, Compass } from 'lucide-react';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFloorTab, setSelectedFloorTab] = useState('');

  // Form Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [floor, setFloor] = useState('');
  const [posX, setPosX] = useState(20);
  const [posY, setPosY] = useState(20);
  const [width, setWidth] = useState(90);
  const [height, setHeight] = useState(90);
  const [shape, setShape] = useState('square');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tableRes, floorRes] = await Promise.all([
        API.get('/tables'),
        API.get('/floors')
      ]);
      setTables(tableRes.data.data);
      setFloors(floorRes.data.data);
      
      if (floorRes.data.data.length > 0) {
        setSelectedFloorTab(floorRes.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load tables and floors configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table = null) => {
    setError('');
    if (table) {
      setEditId(table._id);
      setName(table.name);
      setCapacity(table.capacity);
      setFloor(table.floor?._id || table.floor || '');
      setPosX(table.posX || 20);
      setPosY(table.posY || 20);
      setWidth(table.width || 90);
      setHeight(table.height || 90);
      setShape(table.shape || 'square');
    } else {
      setEditId(null);
      setName('');
      setCapacity('4');
      setFloor(selectedFloorTab || floors[0]?._id || '');
      setPosX(30);
      setPosY(30);
      setWidth(90);
      setHeight(90);
      setShape('square');
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !capacity || !floor) {
      return setError('Name, seating capacity, and floor location are required.');
    }

    const payload = {
      name,
      capacity: parseInt(capacity),
      floor,
      posX: parseInt(posX),
      posY: parseInt(posY),
      width: parseInt(width),
      height: parseInt(height),
      shape
    };

    try {
      if (editId) {
        const res = await API.put(`/tables/${editId}`, payload);
        if (res.data.success) {
          setTables(tables.map(t => t._id === editId ? res.data.data : t));
        }
      } else {
        const res = await API.post('/tables', payload);
        if (res.data.success) {
          setTables([...tables, res.data.data]);
        }
      }
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving table parameters.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    try {
      const res = await API.delete(`/tables/${id}`);
      if (res.data.success) {
        setTables(tables.filter(t => t._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table.');
    }
  };

  const activeFloor = floors.find(f => f._id === selectedFloorTab);
  const activeTables = tables.filter(t => (t.floor?._id || t.floor) === selectedFloorTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tables layout designer</h1>
          <p className="text-slate-500 text-sm">Configure tables on maps, dimensions, and seat capacities</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={floors.length === 0}
          className="flex items-center justify-center px-4 py-2 bg-odoo-primary hover:bg-odoo-accent disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </button>
      </div>

      {floors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Setup Floors First</h3>
          <p className="text-slate-500 text-sm mt-1">You must create at least one floor before configuring tables.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Floor tabs */}
          <div className="flex border-b border-slate-200 space-x-2">
            {floors.map((flr) => (
              <button
                key={flr._id}
                onClick={() => setSelectedFloorTab(flr._id)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                  selectedFloorTab === flr._id
                    ? 'border-odoo-primary text-odoo-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {flr.name}
              </button>
            ))}
          </div>

          {/* Visual Floor Layout Preview and table grid side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Map Layout */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-700 text-sm mb-3">Layout Map Preview ({activeFloor?.name})</h3>
              
              <div
                className="w-full relative rounded-xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center transition-colors"
                style={{
                  height: '400px',
                  backgroundColor: activeFloor?.color || '#f3f4f6'
                }}
              >
                {activeTables.length === 0 ? (
                  <p className="text-slate-400 text-sm font-medium">No tables placed on this floor zone.</p>
                ) : (
                  activeTables.map((tbl) => (
                    <div
                      key={tbl._id}
                      className={`absolute flex flex-col items-center justify-center text-slate-700 border transition-all cursor-default select-none shadow-md ${
                        tbl.shape === 'round' ? 'rounded-full' : 'rounded-xl'
                      } ${
                        tbl.status === 'occupied' 
                          ? 'bg-red-100 border-red-300 text-red-800' 
                          : tbl.status === 'reserved'
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-slate-300 hover:border-odoo-primary'
                      }`}
                      style={{
                        left: `${tbl.posX}%`,
                        top: `${tbl.posY}%`,
                        width: `${tbl.width}px`,
                        height: `${tbl.height}px`,
                        transform: 'translate(-50%, -50%)' // Center tables around coordinates
                      }}
                    >
                      <span className="text-xs font-black">{tbl.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">Cap: {tbl.capacity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Config list */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden flex flex-col">
              <h3 className="font-bold text-slate-700 text-sm mb-3">Placements Table</h3>
              
              <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100">
                {activeTables.length === 0 ? (
                  <p className="text-slate-400 text-sm p-4 text-center">No tables configuration.</p>
                ) : (
                  activeTables.map((tbl) => (
                    <div key={tbl._id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-bold text-slate-800">{tbl.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          X:{tbl.posX}% Y:{tbl.posY}% | Shape: {tbl.shape}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleOpenModal(tbl)}
                          className="p-1 hover:bg-teal-50 hover:text-odoo-primary rounded text-slate-500 border border-transparent"
                          title="Edit Layout"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tbl._id)}
                          className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-500 border border-transparent"
                          title="Delete Table"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-6">
              <h3 className="font-bold text-slate-800 text-base">{editId ? 'Edit Table Configurations' : 'New Table Placement'}</h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Table Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-odoo-primary"
                    placeholder="e.g. Table 8"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-odoo-primary"
                    placeholder="4"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Floor Zone</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-odoo-primary"
                    required
                  >
                    {floors.map((flr) => (
                      <option key={flr._id} value={flr._id}>{flr.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Table Shape</label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-odoo-primary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-odoo-primary"
                  >
                    <option value="square">Square/Rectangle</option>
                    <option value="round">Round/Circle</option>
                  </select>
                </div>
              </div>

              {/* Geometry coordinates inputs (X, Y percentage positioning on floor map) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Map Coordinates & Size (Relative Units)</h4>
                
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Horizontal Position (posX): {posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={posX}
                    onChange={(e) => setPosX(e.target.value)}
                    className="w-full accent-odoo-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Vertical Position (posY): {posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={posY}
                    onChange={(e) => setPosY(e.target.value)}
                    className="w-full accent-odoo-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="200"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Height (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="200"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
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
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
