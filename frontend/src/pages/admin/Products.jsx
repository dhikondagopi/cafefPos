import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Coffee,
  Edit2,
  ImagePlus,
  Loader2,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

const CURRENCY = "₹";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getId = (item) => item?._id || item?.id || "";

const getImageSrc = (product) =>
  product?.image ||
  product?.imageUrl ||
  product?.photo ||
  product?.thumbnail ||
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=120&q=80";

const fallbackSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230d1120"/><text y="58" x="50" text-anchor="middle" font-size="40">☕</text></svg>`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [photo, setPhoto] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [stock, setStock] = useState("50");
  const [isAvailable, setIsAvailable] = useState(true);

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/products"),
        API.get("/categories"),
      ]);

      setProducts(extractList(prodRes, "products"));
      setCategories(extractList(catRes, "categories"));
    } catch (err) {
      console.error("Fetch products error:", err);
      setPageError(
        err.response?.data?.message ||
          "Failed to load products and categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory(categories[0]?._id || "");
    setImage("");
    setImageUrl("");
    setPhoto("");
    setThumbnail("");
    setStock("50");
    setIsAvailable(true);
    setFormError("");
    setCategoryOpen(false);
  };

  const openModal = (product = null) => {
    setFormError("");
    setCategoryOpen(false);

    if (product) {
      const productImage = getImageSrc(product);

      setEditId(getId(product));
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price ?? "");
      setCategory(product.category?._id || product.category || "");
      setImage(product.image || productImage || "");
      setImageUrl(product.imageUrl || productImage || "");
      setPhoto(product.photo || productImage || "");
      setThumbnail(product.thumbnail || productImage || "");
      setStock(String(product.stock ?? 0));
      setIsAvailable(product.isAvailable !== false);
    } else {
      resetForm();
    }

    setIsOpen(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setIsOpen(false);
    setEditId(null);
    setFormError("");
    setCategoryOpen(false);
  };

  const handleImageValueChange = (value) => {
    setImageUrl(value);
    setImage(value);
    setPhoto(value);
    setThumbnail(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Image size should be below 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result;

      setImage(base64);
      setImageUrl(base64);
      setPhoto(base64);
      setThumbnail(base64);
      setFormError("");
    };

    reader.readAsDataURL(file);
  };

  const selectedCategoryName =
    categories.find((cat) => getId(cat) === category)?.name || "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPrice = Number(price);
    const cleanStock = Number(stock || 0);

    if (!cleanName) {
      setFormError("Product name is required.");
      return;
    }

    if (!cleanPrice || cleanPrice < 0) {
      setFormError("Valid price is required.");
      return;
    }

    if (!category) {
      setFormError("Category is required.");
      return;
    }

    const payload = {
      name: cleanName,
      description: description.trim(),
      price: cleanPrice,
      category,
      image,
      imageUrl,
      photo,
      thumbnail,
      stock: cleanStock,
      isAvailable,
    };

    setFormLoading(true);
    setFormError("");

    try {
      if (editId) {
        await API.put(`/products/${editId}`, payload);
        showToast("success", "Product updated successfully.");
      } else {
        await API.post("/products", payload);
        showToast("success", "Product created successfully.");
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Save product error:", err);
      setFormError(err.response?.data?.message || "Error saving product.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product) => {
    const productId = getId(product);

    if (!window.confirm(`Delete "${product.name}"?`)) return;

    try {
      const res = await API.delete(`/products/${productId}`);

      if (res.data.success) {
        setProducts((prev) => prev.filter((item) => getId(item) !== productId));
        showToast("success", "Product deleted successfully.");
      }
    } catch (err) {
      console.error("Delete product error:", err);
      showToast("error", err.response?.data?.message || "Delete failed.");
    }
  };

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const productName = product.name || "";
      const categoryName = product.category?.name || "";

      const matchSearch =
        productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat =
        filterCat === "all" ||
        (product.category?._id || product.category) === filterCat;

      return matchSearch && matchCat;
    });
  }, [products, searchTerm, filterCat]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      available: products.filter((product) => product.isAvailable !== false)
        .length,
      unavailable: products.filter((product) => product.isAvailable === false)
        .length,
      lowStock: products.filter((product) => Number(product.stock || 0) <= 5)
        .length,
    };
  }, [products]);

  const previewImage = image || imageUrl || photo || thumbnail || "";

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
            <Coffee className="w-5 h-5 mr-2 text-[#FF5722]" />
            Products & Menu Items
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage pricing, images, stock, and menu availability.
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
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2 px-4 py-2.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
            Total Products
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
            Unavailable
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.unavailable}
          </h2>
        </div>

        <div className="card-dark p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-300 font-black">
            Low Stock
          </p>
          <h2 className="text-2xl font-black text-white mt-2">
            {stats.lowStock}
          </h2>
        </div>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
          <p className="text-sm text-red-200 font-semibold">{pageError}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex items-center bg-[#0d1120] border border-white/8 rounded-xl px-3 py-2 flex-1 max-w-md focus-within:border-[#FF5722]/40 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Search products or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCat("all")}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
              filterCat === "all"
                ? "bg-[#FF5722]/20 border-[#FF5722]/30 text-[#FF5722]"
                : "bg-white/[0.03] border-white/8 text-slate-400 hover:text-white"
            }`}
          >
            All ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={getId(cat)}
              type="button"
              onClick={() => setFilterCat(getId(cat))}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                filterCat === getId(cat)
                  ? "bg-[#FF5722]/20 border-[#FF5722]/30 text-[#FF5722]"
                  : "bg-white/[0.03] border-white/8 text-slate-400 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <Coffee className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">No products found</h3>
          <p className="text-slate-500 text-sm">
            Add your first menu item or clear search filters.
          </p>
        </div>
      ) : (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
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

              <tbody className="divide-y divide-white/5">
                {filtered.map((product) => {
                  const available = product.isAvailable !== false;
                  const productPrice = Number(product.price || 0);

                  return (
                    <tr
                      key={getId(product)}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <img
                          src={getImageSrc(product)}
                          alt={product.name}
                          className="w-11 h-11 rounded-xl object-cover bg-[#0d1120] border border-white/8"
                          onError={(e) => {
                            e.currentTarget.src = fallbackSvg;
                          }}
                        />
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-bold text-white text-xs">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-[240px] truncate">
                          {product.description || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded-lg uppercase">
                          {product.category?.name || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3 font-mono font-bold text-[#FF5722] text-xs">
                        {CURRENCY}
                        {productPrice.toFixed(2)}
                      </td>

                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                        {product.stock ?? 0} units
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`status-badge ${
                            available ? "status-available" : "status-cancelled"
                          }`}
                        >
                          {available ? "Available" : "Out of Stock"}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openModal(product)}
                            className="p-1.5 bg-white/5 hover:bg-indigo-500/15 border border-white/8 hover:border-indigo-500/25 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/15 border border-white/8 hover:border-red-500/25 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                            title="Delete"
                          >
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

          <div className="px-5 py-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] text-slate-500">
              {filtered.length} of {products.length} products
            </p>
            <p className="text-[10px] text-slate-600">
              {stats.available} available • {stats.unavailable} unavailable
            </p>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center px-4 py-8">
            <div className="bg-[#0d1120] border border-white/10 rounded-2xl w-full max-w-4xl overflow-visible shadow-2xl animate-scale-in">
              <div className="sticky top-0 z-10 h-14 bg-[#0b0d16] border-b border-white/8 flex items-center justify-between px-6 rounded-t-2xl">
                <div>
                  <h3
                    className="font-black text-sm text-white"
                    style={{ fontFamily: "Outfit,sans-serif" }}
                  >
                    {editId ? "Edit Product" : "New Product"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Add menu details, image, price, stock, and category.
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

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-5">
                  {formError && (
                    <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-4 space-y-4">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Product Image
                        </p>

                        <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#080b12] flex items-center justify-center">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = fallbackSvg;
                              }}
                            />
                          ) : (
                            <div className="text-center p-6">
                              <ImagePlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                              <p className="text-xs text-slate-500">
                                Upload image or paste URL
                              </p>
                            </div>
                          )}
                        </div>

                        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-xs font-black text-orange-300 hover:bg-orange-500/15 transition">
                          <ImagePlus className="w-4 h-4" />
                          Upload Local Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>

                        <p className="text-[10px] text-slate-600 mt-2 text-center">
                          JPG, PNG, WEBP • Max 2 MB
                        </p>
                      </div>

                      <label className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          {isAvailable ? (
                            <PackageCheck className="w-5 h-5 text-emerald-300" />
                          ) : (
                            <PackageX className="w-5 h-5 text-red-300" />
                          )}
                          <div>
                            <p className="text-xs font-black text-white">
                              Available for sale
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Show this product inside POS
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setIsAvailable((prev) => !prev)}
                          className={`w-11 h-6 rounded-full transition-all relative ${
                            isAvailable ? "bg-emerald-500" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                              isAvailable ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-dark"
                            placeholder="e.g. Cafe Latte"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Price ({CURRENCY})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="input-dark"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="input-dark"
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Category
                        </label>

                        <button
                          type="button"
                          onClick={() => setCategoryOpen((prev) => !prev)}
                          className={`input-dark w-full flex items-center justify-between text-left ${
                            category ? "text-white" : "text-slate-500"
                          }`}
                        >
                          <span>
                            {category
                              ? selectedCategoryName || "Select category"
                              : "Select category"}
                          </span>

                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform ${
                              categoryOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {categoryOpen && (
                          <div className="absolute left-0 right-0 top-[68px] z-[120] rounded-xl border border-white/10 bg-[#0b0f1a] shadow-2xl overflow-hidden">
                            {categories.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-red-300 bg-red-500/10">
                                No categories found. Create a category first.
                              </div>
                            ) : (
                              categories.map((cat) => (
                                <button
                                  key={getId(cat)}
                                  type="button"
                                  onClick={() => {
                                    setCategory(getId(cat));
                                    setCategoryOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-xs font-bold transition ${
                                    category === getId(cat)
                                      ? "bg-orange-500/15 text-orange-300"
                                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Image URL / Fallback
                        </label>
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) =>
                            handleImageValueChange(e.target.value)
                          }
                          className="input-dark font-mono text-[11px]"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                          className="input-dark resize-none"
                          placeholder="Ingredients, preparation details..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-[#0b0d16] border-t border-white/8 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
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
                      `${editId ? "Update" : "Create"} Product`
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

export default Products;