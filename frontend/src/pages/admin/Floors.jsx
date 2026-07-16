import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  AlertCircle,
  CheckCircle,
  Edit2,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const presetColors = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#FF5722",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
];

const getId = (item) => item?._id || item?.id || "";

const getFloorName = (floor) =>
  floor?.name || floor?.floorName || floor?.title || "Unnamed Floor";

const getFloorColor = (floor) => floor?.color || "#6366f1";

const getFloorActive = (floor) => {
  if (typeof floor?.isActive === "boolean") return floor.isActive;
  if (typeof floor?.active === "boolean") return floor.active;
  return true;
};

const extractList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.floors)) return data.floors;
  if (Array.isArray(data?.data)) return data.data;

  return [];
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

const Floors = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [showSuspicious, setShowSuspicious] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFloors = async () => {
    setLoading(true);

    try {
      const res = await API.get("/floors?includeInactive=true");
      const list = extractList(res).filter((floor) => getId(floor));

      setFloors(list);
    } catch (err) {
      console.error("Fetch floors error:", err);
      showToast(
        "error",
        err.response?.data?.message || "Failed to load floors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  const validFloors = useMemo(
    () => floors.filter((floor) => !isSuspiciousFloor(floor)),
    [floors]
  );

  const suspiciousFloors = useMemo(
    () => floors.filter((floor) => isSuspiciousFloor(floor)),
    [floors]
  );

  const displayedFloors = showSuspicious ? suspiciousFloors : validFloors;

  const stats = useMemo(() => {
    return {
      total: floors.length,
      valid: validFloors.length,
      active: validFloors.filter((floor) => getFloorActive(floor)).length,
      disabled: validFloors.filter((floor) => !getFloorActive(floor)).length,
      suspicious: suspiciousFloors.length,
    };
  }, [floors, validFloors, suspiciousFloors]);

  const openModal = (floor = null) => {
    setFormError("");

    if (floor) {
      setEditId(getId(floor));
      setName(getFloorName(floor));
      setColor(getFloorColor(floor));
      setIsActive(getFloorActive(floor));
    } else {
      setEditId(null);
      setName("");
      setColor("#6366f1");
      setIsActive(true);
    }

    setIsOpen(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setIsOpen(false);
    setEditId(null);
    setName("");
    setColor("#6366f1");
    setIsActive(true);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setFormError("Floor name is required.");
      return;
    }

    const duplicateFloor = floors.find((floor) => {
      const sameName =
        getFloorName(floor).trim().toLowerCase() === cleanName.toLowerCase();
      const differentId = getId(floor) !== editId;

      return sameName && differentId;
    });

    if (duplicateFloor) {
      setFormError("Floor name already exists.");
      return;
    }

    const payload = {
      name: cleanName,
      color: color || "#6366f1",
      isActive: Boolean(isActive),
    };

    setFormLoading(true);
    setFormError("");

    try {
      if (editId) {
        const res = await API.put(`/floors/${editId}`, payload);

        if (res.data.success) {
          showToast("success", "Floor updated successfully.");
        }
      } else {
        const res = await API.post("/floors", payload);

        if (res.data.success) {
          showToast("success", "Floor created successfully.");
        }
      }

      closeModal();
      await fetchFloors();
    } catch (err) {
      console.error("Save floor error:", err);
      setFormError(err.response?.data?.message || "Error saving floor.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (floor) => {
    const floorId = getId(floor);
    const floorName = getFloorName(floor);

    if (!window.confirm(`Delete "${floorName}"? Tables on this floor must be deleted first.`)) {
      return;
    }

    try {
      const res = await API.delete(`/floors/${floorId}`);

      if (res.data.success) {
        setFloors((prev) => prev.filter((item) => getId(item) !== floorId));
        showToast("success", "Floor deleted successfully.");
      }
    } catch (err) {
      console.error("Delete floor error:", err);
      showToast("error", err.response?.data?.message || "Delete failed.");
    }
  };

  const renderFloorCard = (floor, index) => {
    const floorName = getFloorName(floor);
    const floorColor = getFloorColor(floor);
    const active = getFloorActive(floor);
    const suspicious = isSuspiciousFloor(floor);

    return (
      <div
        key={getId(floor)}
        className="card-dark p-5 flex flex-col group hover:border-white/15 transition-all animate-fade-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${floorColor}20`,
              border: `1px solid ${floorColor}40`,
            }}
          >
            <Layers className="w-5 h-5" style={{ color: floorColor }} />
          </div>

          <div className="flex flex-col items-end gap-2">
            {suspicious && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wide">
                Suspicious
              </span>
            )}

            <span
              className={`status-badge ${
                active ? "status-available" : "status-cancelled"
              }`}
            >
              {active ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        <h3
          className="font-black text-white text-base mb-1"
          style={{ fontFamily: "Outfit,sans-serif" }}
        >
          {floorName}
        </h3>

        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-4">
          <div
            className="w-3 h-3 rounded-full border border-white/15"
            style={{ background: floorColor }}
          />
          <span className="font-mono">{floorColor}</span>
        </div>

        {suspicious && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] leading-5 text-amber-200">
            This record looks like table data saved inside floors. Delete it
            after confirming it is not a real floor.
          </div>
        )}

        <div className="flex gap-2 mt-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => openModal(floor)}
            className="flex-1 py-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => handleDelete(floor)}
            className="flex-1 py-2 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-[80] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur ${
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
            <Layers className="w-5 h-5 mr-2 text-[#FF5722]" />
            Floors & Layout Zones
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Define real dining spaces like Ground Floor, First Floor, Terrace, or Bar Area.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchFloors}
            className="btn-ghost flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          {suspiciousFloors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuspicious((prev) => !prev)}
              className="btn-ghost flex items-center space-x-2 px-4 py-2.5 text-xs border-amber-500/25 text-amber-300"
            >
              {showSuspicious ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>
                {showSuspicious ? "Show Valid Floors" : "Review Suspicious"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Floor</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
            Total Records
          </p>
          <h2 className="text-2xl font-black text-white mt-2">{stats.total}</h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-black">
            Valid Floors
          </p>
          <h2 className="text-2xl font-black text-white mt-2">{stats.valid}</h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">
            Active
          </p>
          <h2 className="text-2xl font-black text-white mt-2">{stats.active}</h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-red-300 font-black">
            Disabled
          </p>
          <h2 className="text-2xl font-black text-white mt-2">{stats.disabled}</h2>
        </div>

        <div className="card-dark p-4 border-amber-500/20">
          <p className="text-[10px] uppercase tracking-widest text-amber-300 font-black">
            Suspicious
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.suspicious}
          </h2>
        </div>
      </div>

      {suspiciousFloors.length > 0 && !showSuspicious && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-300 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-amber-200">
                Suspicious floor records detected
              </h3>
              <p className="text-xs text-amber-100/80 mt-1 leading-5">
                Some records look like tables saved inside floors collection.
                Review and delete them before creating clean floor/table layout.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSuspicious(true)}
            className="btn-ghost text-xs border-amber-500/25 text-amber-300 px-4 py-2.5"
          >
            Review Now
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-white font-black text-sm">
          {showSuspicious ? "Suspicious Floor Records" : "Valid Floor Zones"}
        </h2>
        <span className="text-xs text-slate-500 font-semibold">
          {displayedFloors.length} item{displayedFloors.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : displayedFloors.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">
            {showSuspicious ? "No suspicious records" : "No valid floors configured"}
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            {showSuspicious
              ? "Your floors collection looks clean."
              : "Add your first real floor to start setting up tables."}
          </p>

          {!showSuspicious && (
            <button
              type="button"
              onClick={() => openModal()}
              className="btn-primary px-5 py-2.5 text-xs"
            >
              Create First Floor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedFloors.map((floor, i) => renderFloorCard(floor, i))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <h3
                className="font-black text-sm text-white"
                style={{ fontFamily: "Outfit,sans-serif" }}
              >
                {editId ? "Edit Floor" : "New Floor"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Floor Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  placeholder="e.g. Ground Floor, Terrace"
                  required
                />
              </div>

              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick names
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Ground Floor",
                    "First Floor",
                    "Second Floor",
                    "Terrace",
                    "Outdoor Area",
                    "Family Hall",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setName(item)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[10px] font-bold text-slate-300 hover:text-white hover:border-orange-500/30"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Color Theme
                </label>

                <div className="flex flex-wrap gap-2">
                  {presetColors.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`w-8 h-8 rounded-xl transition-all border-2 ${
                        color === presetColor
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ background: presetColor }}
                    />
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer overflow-hidden bg-transparent"
                  />

                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 input-dark font-mono text-xs"
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <div
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`w-10 h-5 rounded-full transition-all relative ${
                    isActive ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                      isActive ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </div>

                <span className="text-xs font-semibold text-slate-300">
                  Floor is active in POS
                </span>
              </label>

              <div className="flex space-x-2.5 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-ghost py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${editId ? "Update" : "Create"} Floor`
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

export default Floors;