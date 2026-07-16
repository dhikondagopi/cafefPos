import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  AlertCircle,
  CheckCircle,
  Edit2,
  FolderKanban,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const presetColors = [
  "#FF5722",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#a78b8b",
  "#6b4f3f",
  "#06b6d4",
];

const getId = (item) => item?._id || item?.id || "";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#FF5722");

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await API.get("/categories");
      const list = extractList(res, "categories").filter((item) => getId(item));
      setCategories(list);
    } catch (err) {
      console.error("Fetch categories error:", err);
      setPageError(
        err.response?.data?.message || "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const catName = cat.name || "";
      const catDescription = cat.description || "";

      return (
        catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [categories, searchTerm]);

  const openModal = (category = null) => {
    setFormError("");

    if (category) {
      setEditId(getId(category));
      setName(category.name || "");
      setDescription(category.description || "");
      setColor(category.color || "#FF5722");
    } else {
      setEditId(null);
      setName("");
      setDescription("");
      setColor("#FF5722");
    }

    setIsOpen(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setIsOpen(false);
    setEditId(null);
    setName("");
    setDescription("");
    setColor("#FF5722");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setFormError("Category name is required.");
      return;
    }

    const duplicateCategory = categories.find((cat) => {
      const sameName = String(cat.name || "").trim().toLowerCase() === cleanName.toLowerCase();
      const differentId = getId(cat) !== editId;

      return sameName && differentId;
    });

    if (duplicateCategory) {
      setFormError("Category name already exists.");
      return;
    }

    const payload = {
      name: cleanName,
      description: description.trim(),
      color: color || "#FF5722",
    };

    setFormLoading(true);
    setFormError("");

    try {
      if (editId) {
        await API.put(`/categories/${editId}`, payload);
        showToast("success", "Category updated successfully.");
      } else {
        await API.post("/categories", payload);
        showToast("success", "Category created successfully.");
      }

      closeModal();
      await fetchCategories();
    } catch (err) {
      console.error("Save category error:", err);
      setFormError(err.response?.data?.message || "Error saving category.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (category) => {
    const categoryId = getId(category);
    const categoryName = category.name || "this category";

    if (!window.confirm(`Delete "${categoryName}"? Products using this category may be affected.`)) {
      return;
    }

    try {
      const res = await API.delete(`/categories/${categoryId}`);

      if (res.data.success) {
        setCategories((prev) => prev.filter((cat) => getId(cat) !== categoryId));
        showToast("success", "Category deleted successfully.");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      showToast("error", err.response?.data?.message || "Delete failed.");
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
            <FolderKanban className="w-5 h-5 mr-2 text-[#FF5722]" />
            Product Categories
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Organize menu items into groups like Beverages, Food, Desserts, and Snacks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="btn-ghost flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
            Total Categories
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {categories.length}
          </h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-orange-300 font-black">
            Visible Groups
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {filteredCategories.length}
          </h2>
        </div>

        <div className="card-dark p-4 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-black">
            Menu Setup
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {categories.length > 0 ? "Ready" : "Pending"}
          </h2>
        </div>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
          <p className="text-sm text-red-200 font-semibold">{pageError}</p>
        </div>
      )}

      <div className="relative flex items-center bg-[#0d1120] border border-white/8 rounded-xl px-3 py-2 max-w-md focus-within:border-[#FF5722]/40 transition-colors">
        <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No categories found</h3>
          <p className="text-slate-500 text-sm mb-4">
            Create your first product category to start adding menu items.
          </p>
          <button
            type="button"
            onClick={() => openModal()}
            className="btn-primary px-5 py-2.5 text-xs"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat, index) => {
            const catColor = cat.color || "#FF5722";

            return (
              <div
                key={getId(cat)}
                className="card-dark p-5 flex flex-col group hover:border-white/15 transition-all animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${catColor}20`,
                      border: `1px solid ${catColor}40`,
                    }}
                  >
                    <Tag className="w-5 h-5" style={{ color: catColor }} />
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/8 text-slate-400 text-[10px] font-black uppercase">
                    Category
                  </span>
                </div>

                <h3
                  className="font-black text-white text-base mb-1"
                  style={{ fontFamily: "Outfit,sans-serif" }}
                >
                  {cat.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[36px]">
                  {cat.description || "No description added."}
                </p>

                <div className="flex items-center space-x-2 text-[10px] text-slate-500 my-4">
                  <div
                    className="w-3 h-3 rounded-full border border-white/15"
                    style={{ background: catColor }}
                  />
                  <span className="font-mono">{catColor}</span>
                </div>

                <div className="flex gap-2 mt-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openModal(cat)}
                    className="flex-1 py-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="flex-1 py-2 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1"
                  >
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center px-4 py-8">
            <div className="bg-[#0d1120] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in">
              <div className="h-14 bg-[#0b0d16] border-b border-white/8 flex items-center justify-between px-6">
                <div>
                  <h3
                    className="font-black text-sm text-white"
                    style={{ fontFamily: "Outfit,sans-serif" }}
                  >
                    {editId ? "Edit Category" : "New Category"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Create a clean group for menu products.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-slate-500 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark"
                    placeholder="e.g. Beverages"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Description Optional
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="input-dark resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Category Color
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-11 h-11 rounded-xl border border-white/10 cursor-pointer overflow-hidden bg-transparent"
                    />

                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 input-dark font-mono text-xs"
                      placeholder="#FF5722"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
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
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    <Tag className="w-5 h-5" style={{ color }} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      {name || "Category Preview"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {description || "This is how the category card will look."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-ghost px-5 py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center min-w-[150px]"
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `${editId ? "Update" : "Create"} Category`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;