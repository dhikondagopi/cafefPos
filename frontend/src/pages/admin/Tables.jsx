import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  AlertCircle,
  CheckCircle,
  Circle,
  Edit2,
  Grid3X3,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  Users,
  X,
} from "lucide-react";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getId = (item) => item?._id || item?.id || "";

const getFloorName = (floor) =>
  floor?.name || floor?.floorName || floor?.title || "Unnamed Floor";

const getTableName = (table) =>
  table?.name || table?.tableName || table?.tableNumber || "Table";

const getTableFloorId = (table) => {
  if (!table?.floor) return "";
  return table.floor?._id || table.floor?.id || table.floor;
};

const isSuspiciousFloor = (floor) => {
  const name = getFloorName(floor).trim().toLowerCase();

  return (
    name.startsWith("table ") ||
    floor?.tableName !== undefined ||
    floor?.tableNumber !== undefined ||
    floor?.capacity !== undefined ||
    floor?.seats !== undefined ||
    floor?.posX !== undefined ||
    floor?.posY !== undefined ||
    floor?.shape !== undefined
  );
};

const statusStyle = {
  available: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  occupied: "bg-red-500/15 border-red-500/30 text-red-300",
  payment_pending: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  reserved: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  inactive: "bg-slate-500/15 border-slate-500/30 text-slate-300",
};

const tableVisualStyle = {
  available: "bg-emerald-500/20 border-emerald-400/50 text-emerald-100",
  occupied: "bg-red-500/20 border-red-400/50 text-red-100",
  payment_pending: "bg-amber-500/20 border-amber-400/50 text-amber-100",
  reserved: "bg-blue-500/20 border-blue-400/50 text-blue-100",
  inactive: "bg-slate-500/20 border-slate-400/30 text-slate-200",
};

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloorTab, setSelectedFloorTab] = useState("");

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [floor, setFloor] = useState("");
  const [posX, setPosX] = useState(30);
  const [posY, setPosY] = useState(30);
  const [width, setWidth] = useState(90);
  const [height, setHeight] = useState(90);
  const [shape, setShape] = useState("square");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [tableRes, floorRes] = await Promise.all([
        API.get("/tables"),
        API.get("/floors?includeInactive=true"),
      ]);

      const tableList = extractList(tableRes, "tables").filter((item) =>
        getId(item)
      );

      const floorList = extractList(floorRes, "floors")
        .filter((item) => getId(item))
        .filter((item) => !isSuspiciousFloor(item));

      setTables(tableList);
      setFloors(floorList);

      if (floorList.length > 0) {
        setSelectedFloorTab((prev) => {
          const stillExists = floorList.some((flr) => getId(flr) === prev);
          return stillExists ? prev : getId(floorList[0]);
        });
      } else {
        setSelectedFloorTab("");
      }
    } catch (err) {
      console.error("Fetch tables/floors error:", err);
      setPageError(
        err.response?.data?.message ||
          "Failed to load tables and floor configurations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeFloor = useMemo(
    () => floors.find((flr) => getId(flr) === selectedFloorTab),
    [floors, selectedFloorTab]
  );

  const activeTables = useMemo(
    () => tables.filter((tbl) => getTableFloorId(tbl) === selectedFloorTab),
    [tables, selectedFloorTab]
  );

  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((table) => table.status === "available").length,
      occupied: tables.filter((table) => table.status === "occupied").length,
      paymentPending: tables.filter(
        (table) => table.status === "payment_pending"
      ).length,
    };
  }, [tables]);

  const handleOpenModal = (table = null) => {
    setFormError("");

    if (table) {
      setEditId(getId(table));
      setName(getTableName(table));
      setCapacity(String(table.capacity || table.seats || 4));
      setFloor(getTableFloorId(table) || selectedFloorTab || getId(floors[0]));
      setPosX(Number(table.posX ?? 30));
      setPosY(Number(table.posY ?? 30));
      setWidth(Number(table.width ?? 90));
      setHeight(Number(table.height ?? 90));
      setShape(table.shape || "square");
    } else {
      setEditId(null);
      setName("");
      setCapacity("4");
      setFloor(selectedFloorTab || getId(floors[0]));
      setPosX(30);
      setPosY(30);
      setWidth(90);
      setHeight(90);
      setShape("square");
    }

    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (formLoading) return;

    setIsOpen(false);
    setEditId(null);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanCapacity = Number(capacity);

    if (!cleanName) {
      setFormError("Table name is required.");
      return;
    }

    if (!cleanCapacity || cleanCapacity < 1) {
      setFormError("Valid seating capacity is required.");
      return;
    }

    if (!floor) {
      setFormError("Floor zone is required.");
      return;
    }

    const duplicateTable = tables.find((table) => {
      const sameFloor = getTableFloorId(table) === floor;
      const sameName =
        getTableName(table).trim().toLowerCase() === cleanName.toLowerCase();
      const differentId = getId(table) !== editId;

      return sameFloor && sameName && differentId;
    });

    if (duplicateTable) {
      setFormError("This table already exists on the selected floor.");
      return;
    }

    const payload = {
      name: cleanName,
      capacity: cleanCapacity,
      floor,
      posX: Number(posX),
      posY: Number(posY),
      width: Number(width),
      height: Number(height),
      shape,
    };

    setFormLoading(true);
    setFormError("");

    try {
      if (editId) {
        await API.put(`/tables/${editId}`, payload);
        showToast("success", "Table updated successfully.");
      } else {
        await API.post("/tables", payload);
        showToast("success", "Table created successfully.");
      }

      handleCloseModal();
      await fetchData();
    } catch (err) {
      console.error("Save table error:", err);
      setFormError(
        err.response?.data?.message || "Error saving table configuration."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (table) => {
    const tableId = getId(table);
    const tableName = getTableName(table);

    if (!window.confirm(`Delete "${tableName}"?`)) return;

    try {
      const res = await API.delete(`/tables/${tableId}`);

      if (res.data.success) {
        setTables((prev) => prev.filter((item) => getId(item) !== tableId));
        showToast("success", "Table deleted successfully.");
      }
    } catch (err) {
      console.error("Delete table error:", err);
      showToast("error", err.response?.data?.message || "Failed to delete table.");
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-[90] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-red-500/30 bg-red-500/15 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-black text-white tracking-tight flex items-center"
            style={{ fontFamily: "Outfit,sans-serif" }}
          >
            <Grid3X3 className="w-5 h-5 mr-2 text-[#FF5722]" />
            Tables Plan
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure table placement, seating capacity, shape, and floor layout.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="btn-ghost flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            disabled={floors.length === 0}
            className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
            Total Tables
          </p>
          <h2 className="text-2xl font-black text-white mt-2">{stats.total}</h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">
            Available
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.available}
          </h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-red-300 font-black">
            Occupied
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.occupied}
          </h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-300 font-black">
            Payment Pending
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.paymentPending}
          </h2>
        </div>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
          <p className="text-sm text-red-200 font-semibold">{pageError}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-[430px] skeleton rounded-2xl" />
          <div className="lg:col-span-4 h-[430px] skeleton rounded-2xl" />
        </div>
      ) : floors.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-black mb-2">Setup floors first</h3>
          <p className="text-slate-500 text-sm">
            Create at least one real floor before configuring table placements.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card-dark p-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {floors.map((flr) => {
                const floorId = getId(flr);
                const active = selectedFloorTab === floorId;
                const floorTableCount = tables.filter(
                  (tbl) => getTableFloorId(tbl) === floorId
                ).length;

                return (
                  <button
                    key={floorId}
                    type="button"
                    onClick={() => setSelectedFloorTab(floorId)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${
                      active
                        ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                        : "bg-white/[0.03] border-white/8 text-slate-400 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{getFloorName(flr)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px]">
                      {floorTableCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 card-dark p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-white text-sm">
                    Layout Map Preview
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {getFloorName(activeFloor)} • {activeTables.length} table
                    {activeTables.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-[10px] font-black text-slate-300 uppercase tracking-wide">
                  Live POS Layout
                </span>
              </div>

              <div
                className="relative w-full h-[430px] rounded-2xl border border-white/8 overflow-hidden shadow-inner"
                style={{
                  background: `radial-gradient(circle at top left, ${
                    activeFloor?.color || "#6366f1"
                  }24, transparent 34%), #080b12`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                {activeTables.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <Grid3X3 className="w-12 h-12 text-slate-700 mb-3" />
                    <h3 className="text-white font-black mb-1">
                      No tables placed here
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                      Add your first table on {getFloorName(activeFloor)}.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenModal()}
                      className="btn-primary px-5 py-2.5 text-xs"
                    >
                      Add Table
                    </button>
                  </div>
                ) : (
                  activeTables.map((tbl) => {
                    const status = tbl.status || "available";

                    return (
                      <div
                        key={getId(tbl)}
                        className={`absolute flex flex-col items-center justify-center border shadow-xl select-none ${
                          tbl.shape === "round" ? "rounded-full" : "rounded-2xl"
                        } ${
                          tableVisualStyle[status] || tableVisualStyle.available
                        }`}
                        style={{
                          left: `${Number(tbl.posX ?? 30)}%`,
                          top: `${Number(tbl.posY ?? 30)}%`,
                          width: `${Number(tbl.width ?? 90)}px`,
                          height: `${Number(tbl.height ?? 90)}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <span className="text-xs font-black">
                          {getTableName(tbl)}
                        </span>
                        <span className="text-[10px] opacity-80 font-mono mt-0.5">
                          {tbl.capacity || tbl.seats || 0} seats
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-4 card-dark p-5 flex flex-col min-h-[430px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-white text-sm">
                    Placement List
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage current floor tables
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[430px]">
                {activeTables.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center">
                    <p className="text-slate-500 text-sm">
                      No table configuration.
                    </p>
                  </div>
                ) : (
                  activeTables.map((tbl) => {
                    const status = tbl.status || "available";

                    return (
                      <div
                        key={getId(tbl)}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black text-white text-sm">
                              {getTableName(tbl)}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{tbl.capacity || tbl.seats || 0} seats</span>
                              <span>•</span>
                              <span>{tbl.shape || "square"}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${
                              statusStyle[status] || statusStyle.available
                            }`}
                          >
                            {status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-3 text-[10px] font-mono text-slate-500">
                          X:{tbl.posX ?? 30}% Y:{tbl.posY ?? 30}% • W:
                          {tbl.width ?? 90}px H:{tbl.height ?? 90}px
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(tbl)}
                            className="flex-1 py-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(tbl)}
                            className="flex-1 py-2 bg-red-500/15 border border-red-500/25 text-red-300 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-14 bg-[#0b0d16] border-b border-white/8 flex items-center justify-between px-6">
              <div>
                <h3
                  className="font-black text-sm text-white"
                  style={{ fontFamily: "Outfit,sans-serif" }}
                >
                  {editId ? "Edit Table Placement" : "New Table Placement"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure table name, capacity, floor zone, and map position.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[78vh] overflow-y-auto"
            >
              {formError && (
                <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark"
                    placeholder="e.g. Table 8"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="input-dark"
                    placeholder="4"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Floor Zone
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="input-dark appearance-none cursor-pointer"
                    required
                  >
                    {floors.map((flr) => (
                      <option
                        key={getId(flr)}
                        value={getId(flr)}
                        className="bg-[#0d1120] text-white"
                      >
                        {getFloorName(flr)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Table Shape
                  </label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="input-dark appearance-none cursor-pointer"
                  >
                    <option value="square" className="bg-[#0d1120] text-white">
                      Square / Rectangle
                    </option>
                    <option value="round" className="bg-[#0d1120] text-white">
                      Round / Circle
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Map Coordinates & Size
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Relative floor map units
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Horizontal Position</span>
                    <span className="font-mono text-orange-300">{posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={posX}
                    onChange={(e) => setPosX(e.target.value)}
                    className="w-full accent-[#FF5722]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Vertical Position</span>
                    <span className="font-mono text-orange-300">{posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={posY}
                    onChange={(e) => setPosY(e.target.value)}
                    className="w-full accent-[#FF5722]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Width PX
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="220"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="input-dark"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Height PX
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="220"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="input-dark"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-ghost px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center min-w-[130px]"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Table"
                  )}
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