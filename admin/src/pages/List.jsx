import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { backendUrl, currency } from "../App";
import { assets } from "../assets/assets";

const List = () => {
  const location = useLocation();

  const [list, setList] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    sizes: "",
    bestseller: false
  });

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/product/list`);

      if (response.data.success === true) {
        setList(response.data.products || []);
        setSelectedProducts([]);
      } else {
        toast.error(response.data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      toast.error(error.response?.data?.message || (error.request ? "Unable to connect to the server." : error.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (productId) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/product/${productId}`, { withCredentials: true });

      if (response.data.success === true) {
        setList((prev) => prev.filter((item) => item._id !== productId));
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
        setSelectedProduct((prev) => prev?._id === productId ? null : prev);
        toast.success(response.data.message || "Product deleted successfully");
        return true;
      }

      toast.error(response.data.message || "Failed to delete product");
      return false;
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error(error.response?.data?.message || (error.request ? "Unable to connect to the server." : error.message || "Something went wrong"));
      return false;
    }
  };

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === list.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(list.map((item) => item._id));
    }
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.info("Please select at least one product.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected product(s)?`)) return;

    setDeleting(true);

    try {
      const results = await Promise.allSettled(
        selectedProducts.map(async (productId) => {
          const response = await axios.delete(`${backendUrl}/api/product/${productId}`, { withCredentials: true });
          if (response.data.success !== true) {
            throw new Error(response.data.message || "Failed to delete product");
          }
          return productId;
        })
      );

      const deletedIds = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      const failedCount = results.length - deletedIds.length;

      setList((prev) => prev.filter((item) => !deletedIds.includes(item._id)));
      setSelectedProducts((prev) => prev.filter((id) => !deletedIds.includes(id)));
      setSelectedProduct((prev) => prev && deletedIds.includes(prev._id) ? null : prev);

      if (deletedIds.length > 0) toast.success(`${deletedIds.length} product(s) deleted successfully.`);
      if (failedCount > 0) toast.error(`${failedCount} product(s) could not be deleted.`);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Something went wrong while deleting products.");
    } finally {
      setDeleting(false);
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setActiveImage(0);
    setEditing(false);
    setEditForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
      bestseller: Boolean(product.bestseller)
    });
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setActiveImage(0);
    setEditing(false);
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const saveProductChanges = async (event) => {
    event.preventDefault();

    if (!selectedProduct) return;

    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.category.trim() || !editForm.subCategory.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (editForm.price === "" || !Number.isFinite(Number(editForm.price)) || Number(editForm.price) < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const sizes = editForm.sizes.split(",").map((size) => size.trim()).filter(Boolean);

    if (sizes.length === 0) {
      toast.error("Please enter at least one size.");
      return;
    }

    const updatedData = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      price: Number(editForm.price),
      category: editForm.category.trim(),
      subCategory: editForm.subCategory.trim(),
      sizes,
      bestseller: editForm.bestseller
    };

    try {
      setSaving(true);

      const response = await axios.put(
        `${backendUrl}/api/product/${selectedProduct._id}`,
        updatedData,
        { withCredentials: true }
      );

      if (response.data.success === true) {
        const updatedProduct = response.data.product;

        setList((prev) => prev.map((item) => item._id === updatedProduct._id ? { ...item, ...updatedProduct } : item));
        setSelectedProduct((prev) => prev ? { ...prev, ...updatedProduct } : prev);
        setEditForm({
          name: updatedProduct.name || "",
          description: updatedProduct.description || "",
          price: updatedProduct.price ?? "",
          category: updatedProduct.category || "",
          subCategory: updatedProduct.subCategory || "",
          sizes: Array.isArray(updatedProduct.sizes) ? updatedProduct.sizes.join(", ") : "",
          bestseller: Boolean(updatedProduct.bestseller)
        });
        setEditing(false);

        toast.success(response.data.message || "Product updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Update product error:", error);
      toast.error(error.response?.data?.message || (error.request ? "Unable to connect to the server." : error.message || "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  const toggleBestseller = async (productId, event) => {
    event?.stopPropagation();

    const product = list.find((item) => item._id === productId) || selectedProduct;

    if (!product) return;

    const updatedBestseller = !product.bestseller;

    try {
      const response = await axios.put(
        `${backendUrl}/api/product/${productId}`,
        { bestseller: updatedBestseller },
        { withCredentials: true }
      );

      if (response.data.success === true) {
        setList((prev) => prev.map((item) => item._id === productId ? { ...item, bestseller: updatedBestseller } : item));
        setSelectedProduct((prev) => prev?._id === productId ? { ...prev, bestseller: updatedBestseller } : prev);
        setEditForm((prev) => selectedProduct?._id === productId ? { ...prev, bestseller: updatedBestseller } : prev);
        toast.success(updatedBestseller ? "Product marked as bestseller" : "Bestseller status removed");
      } else {
        toast.error(response.data.message || "Failed to update bestseller status");
      }
    } catch (error) {
      console.error("Update bestseller error:", error);
      toast.error(error.response?.data?.message || "Failed to update bestseller status");
    }
  };

  useEffect(() => {
    fetchList();
  }, [location.pathname]);

  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeProductDetails();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  const allSelected = list.length > 0 && selectedProducts.length === list.length;

  const getProductImages = (product) => {
    if (!product) return [];
    if (Array.isArray(product.image)) return product.image.filter(Boolean);
    return product.image ? [product.image] : [];
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100";
  const labelClass = "text-xs font-semibold text-gray-600";

  return (
    <div className="min-h-screen space-y-5 rounded-2xl bg-[#f7f8fa] p-3 pb-8 sm:p-4 lg:p-5">
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <img src={assets.grid_view_icon} alt="Product grid" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">FLUKE / INVENTORY</p>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Product List</h1>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">Manage products, pricing and inventory.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={fetchList} disabled={deleting || loading} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <img src={assets.refresh_icon} alt="Refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button type="button" onClick={deleteSelectedProducts} disabled={selectedProducts.length === 0 || deleting} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">
              {deleting ? "Deleting..." : `Delete Selected (${selectedProducts.length})`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-gray-100 bg-gray-50/70 sm:grid-cols-3">
          <div className="border-r border-gray-100 px-4 py-3 sm:px-5">
            <p className="text-xs font-medium text-gray-500">Total products</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{list.length.toString().padStart(2, "0")}</p>
          </div>
          <div className="px-4 py-3 sm:border-r sm:border-gray-100 sm:px-5">
            <p className="text-xs font-medium text-gray-500">Selected products</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{selectedProducts.length.toString().padStart(2, "0")}</p>
          </div>
          <div className="hidden px-5 py-3 sm:block">
            <p className="text-xs font-medium text-gray-500">Inventory status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700">{loading ? "Updating inventory" : "Inventory overview"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">All Products</h2>
            <p className="mt-1 text-sm text-gray-500">Select a product card to view its full details.</p>
          </div>

          {list.length > 0 && (
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={deleting || loading} aria-label="Select all products" className="h-4 w-4 cursor-pointer accent-red-500 disabled:cursor-not-allowed" />
              Select all
            </label>
          )}
        </div>

        {loading && list.length === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2.5">
                <div className="aspect-square animate-pulse rounded-lg bg-gray-100" />
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-8 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {list.map((item) => {
              const isSelected = selectedProducts.includes(item._id);

              return (
                <article key={item._id} onClick={() => openProductDetails(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProductDetails(item); } }} role="button" tabIndex={0} aria-label={`View details for ${item.name}`} className={`group relative min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${isSelected ? "border-red-300 ring-2 ring-red-100" : "border-gray-200/80 shadow-sm hover:border-gray-300"}`}>
                  <div className="relative m-2 mb-0 overflow-hidden rounded-lg bg-[#f5f5f5]">
                    <div className="aspect-square overflow-hidden">
                      {item.image?.[0] ? (
                        <img src={item.image[0]} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <img src={assets.image_placeholder} alt="No product image" className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    <label onClick={(event) => event.stopPropagation()} className={`absolute left-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border shadow-sm ${isSelected ? "border-red-500 bg-red-500 text-white" : "border-white/80 bg-white/90 text-gray-600"}`} title={isSelected ? "Deselect product" : "Select product"}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(item._id)} disabled={deleting || loading} aria-label={`Select ${item.name}`} className="sr-only" />
                      {isSelected ? (
                        <img src={assets.check_icon} alt="Selected" className="h-4 w-4" />
                      ) : <span className="h-4 w-4 rounded border border-gray-300 bg-white" />}
                    </label>

                    <span className="absolute right-2 top-2 max-w-[65%] truncate rounded-md border border-white/70 bg-white/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-700 shadow-sm">{item.category || "Uncategorized"}</span>
                  </div>

                  <div className="p-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold leading-5 text-gray-900" title={item.name}>{item.name}</h3>
                      <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-wider text-gray-400">{item.subCategory || "General"}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                      <p className="truncate text-base font-semibold text-gray-900">{currency}{Number(item.price || 0).toLocaleString("en-IN")}</p>
                      <span className="shrink-0 text-[10px] text-gray-400">View details ↗</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-gray-600">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.bestseller ? "bg-amber-500" : "bg-gray-300"}`} />
                        <span className="truncate">Bestseller</span>
                      </span>
                      <button type="button" role="switch" aria-checked={Boolean(item.bestseller)} aria-label={`Toggle bestseller for ${item.name}`} onClick={(event) => toggleBestseller(item._id, event)} className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition ${item.bestseller ? "bg-amber-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${item.bestseller ? "left-4" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`truncate text-[10px] font-medium ${isSelected ? "text-red-600" : "text-gray-400"}`}>{isSelected ? "Selected" : `${Array.isArray(item.sizes) ? item.sizes.length : 0} sizes`}</span>
                      <button type="button" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) removeProduct(item._id); }} disabled={deleting || loading} aria-label={`Delete ${item.name}`} title="Delete product" className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                        <img src={assets.delete_icon} alt="Delete" className="h-3.25 w-3.25" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              <img src={assets.empty_products_icon} alt="No products found" className="h-7.5 w-7.5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No products found</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">Your product collection is empty. Add your first product to start building your store inventory.</p>
            <button type="button" onClick={fetchList} disabled={loading} className="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Refresh products</button>
          </div>
        )}
      </div>

      {list.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Showing <span className="font-semibold text-gray-900">{list.length}</span> {list.length === 1 ? "product" : "products"} in your inventory</p>
          <div className="flex flex-wrap items-center gap-3">
            {selectedProducts.length > 0 && (
              <>
                <span className="text-xs font-medium text-gray-500">{selectedProducts.length} selected</span>
                <button type="button" onClick={() => setSelectedProducts([])} disabled={deleting} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50">Clear selection</button>
              </>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Inventory loaded</span>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5" onClick={closeProductDetails}>
          <section role="dialog" aria-modal="true" aria-labelledby="product-details-title" onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">FLUKE / PRODUCT DETAILS</p>
                <h2 id="product-details-title" className="mt-1 truncate text-lg font-semibold text-gray-900 sm:text-xl">{selectedProduct.name}</h2>
              </div>
              <button type="button" onClick={closeProductDetails} aria-label="Close product details" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-xl text-gray-500 transition hover:bg-gray-100">×</button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-2">
              <div className="min-w-0">
                {(() => {
                  const images = getProductImages(selectedProduct);
                  return (
                    <>
                      <div className="overflow-hidden rounded-xl bg-[#f5f5f5]">
                        <div className="aspect-square">
                          {images.length > 0 ? <img src={images[activeImage] || images[0]} alt={`${selectedProduct.name} ${activeImage + 1}`} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-gray-400">No product images available</div>}
                        </div>
                      </div>
                      {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">{images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`View product image ${index + 1}`} className={`aspect-square overflow-hidden rounded-lg border-2 bg-[#f5f5f5] ${activeImage === index ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}><img src={image} alt={`${selectedProduct.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
                      <p className="mt-2 text-xs text-gray-400">{images.length} product image{images.length !== 1 ? "s" : ""}</p>
                    </>
                  );
                })()}
              </div>

              <div className="min-w-0">
                {editing ? (
                  <form onSubmit={saveProductChanges} className="space-y-4">
                    <div>
                      <label className={labelClass} htmlFor="edit-name">Product name</label>
                      <input id="edit-name" name="name" type="text" value={editForm.name} onChange={handleEditChange} required className={inputClass} />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="edit-description">Description</label>
                      <textarea id="edit-description" name="description" value={editForm.description} onChange={handleEditChange} required rows={4} className={`${inputClass} resize-y`} />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="edit-price">Price ({currency})</label>
                      <input id="edit-price" name="price" type="number" min="0" step="0.01" value={editForm.price} onChange={handleEditChange} required className={inputClass} />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="edit-category">Category</label>
                        <input id="edit-category" name="category" type="text" value={editForm.category} onChange={handleEditChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="edit-subCategory">Subcategory</label>
                        <input id="edit-subCategory" name="subCategory" type="text" value={editForm.subCategory} onChange={handleEditChange} required className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="edit-sizes">Available sizes</label>
                      <input id="edit-sizes" name="sizes" type="text" value={editForm.sizes} onChange={handleEditChange} placeholder="S, M, L, XL" required className={inputClass} />
                      <p className="mt-1.5 text-xs text-gray-400">Separate each size with a comma.</p>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Bestseller</p>
                        <p className="mt-1 text-xs text-gray-500">Show this product as a bestseller.</p>
                      </div>
                      <input type="checkbox" name="bestseller" checked={editForm.bestseller} onChange={handleEditChange} className="h-5 w-5 cursor-pointer accent-amber-500" />
                    </label>

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                      <button type="button" onClick={() => { setEditing(false); openProductDetails(selectedProduct); }} disabled={saving} className="min-h-10 flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                      <button type="submit" disabled={saving} className="min-h-10 flex-1 cursor-pointer rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Product price</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{currency}{Number(selectedProduct.price || 0).toLocaleString("en-IN")}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Category</p><p className="mt-1 wrap-break-word text-sm font-medium text-gray-800">{selectedProduct.category || "Uncategorized"}</p></div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Subcategory</p><p className="mt-1 wrap-break-word text-sm font-medium text-gray-800">{selectedProduct.subCategory || "General"}</p></div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Description</p>
                      <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-600">{selectedProduct.description || "No description provided."}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Available sizes</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 ? selectedProduct.sizes.map((size) => <span key={size} className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs font-medium text-gray-700">{size}</span>) : <span className="text-sm text-gray-400">No sizes listed</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Bestseller</p>
                        <p className="mt-1 text-xs text-gray-500">{selectedProduct.bestseller ? "Currently marked as a bestseller" : "Not currently a bestseller"}</p>
                      </div>
                      <button type="button" role="switch" aria-checked={Boolean(selectedProduct.bestseller)} onClick={(event) => toggleBestseller(selectedProduct._id, event)} className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${selectedProduct.bestseller ? "bg-amber-500" : "bg-gray-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${selectedProduct.bestseller ? "left-5" : "left-1"}`} /></button>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                      <button type="button" onClick={() => setEditing(true)} className="min-h-10 flex-1 cursor-pointer rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700">Edit product</button>
                      <button type="button" onClick={closeProductDetails} className="min-h-10 flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Close details</button>
                      <button type="button" disabled={deleting} onClick={() => { if (window.confirm(`Are you sure you want to delete "${selectedProduct.name}"?`)) removeProduct(selectedProduct._id); }} className="min-h-10 flex-1 cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">Delete product</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default List;