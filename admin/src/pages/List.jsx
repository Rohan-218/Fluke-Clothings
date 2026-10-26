import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { backendUrl, currency } from "../App";

const List = () => {

  const location = useLocation();
  const [list, setList] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product/list`
      );

      if (response.data.success === true) {
        setList(response.data.products);
      } else {
        toast.error(
          response.data.message || "Failed to fetch products"
        );
      }
    } catch (error) {
      console.error("Fetch products error:", error);

      if (error.response) {
        toast.error(
          error.response.data?.message ||
            "Failed to fetch products"
        );
      } else if (error.request) {
        toast.error("Unable to connect to the server.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    }
  };

  const removeProduct = async (productId) => {
    try {
      const response = await axios.delete(
        `${backendUrl}/api/product/${productId}`
      );

      if (response.data.success === true) {
        setList((prev) =>
          prev.filter((item) => item._id !== productId)
        );

        setSelectedProducts((prev) =>
          prev.filter((id) => id !== productId)
        );

        toast.success(
          response.data.message || "Product deleted successfully"
        );

        return true;
      }

      toast.error(
        response.data.message || "Failed to delete product"
      );

      return false;
    } catch (error) {
      console.error("Delete product error:", error);

      toast.error(
        error.response?.data?.message ||
          (error.request
            ? "Unable to connect to the server."
            : error.message || "Something went wrong")
      );

      return false;
    }
  };

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
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

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.length} selected product(s)?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      
      const results = await Promise.allSettled(
        selectedProducts.map(async (productId) => {
          const response = await axios.delete(
            `${backendUrl}/api/product/${productId}`
          );

          if (response.data.success === false) {
            throw new Error(
              response.data.message || "Failed to delete product"
            );
          }

          return productId;
        })
      );

      const deletedIds = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failedCount = results.length - deletedIds.length;

      setList((prev) =>
        prev.filter((item) => !deletedIds.includes(item._id))
      );

      setSelectedProducts((prev) =>
        prev.filter((id) => !deletedIds.includes(id))
      );

      if (deletedIds.length > 0) {
        toast.success(
          `${deletedIds.length} product(s) deleted successfully.`
        );
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} product(s) could not be deleted.`
        );
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Something went wrong while deleting products.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [location.pathname]);

  const allSelected =
    list.length > 0 &&
    selectedProducts.length === list.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">Product List</p>

        <button
          type="button"
          onClick={deleteSelectedProducts}
          disabled={selectedProducts.length === 0 || deleting}
          className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting
            ? "Deleting..."
            : `Delete Selected (${selectedProducts.length})`}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-[40px_0.5fr_2fr_1fr_1fr_0.5fr] items-center gap-3 border bg-gray-100 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            aria-label="Select all products"
            disabled={list.length === 0 || deleting}
            className="h-4 w-4 cursor-pointer accent-red-500"
          />
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>

        {list.map((item) => (
          <div
            key={item._id}
            className="grid grid-cols-[24px_56px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 py-3 text-sm sm:grid-cols-[28px_64px_minmax(0,2fr)_1fr_auto] sm:gap-3 sm:px-3 md:grid-cols-[40px_0.5fr_2fr_1fr_1fr_0.5fr]"
          >
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={selectedProducts.includes(item._id)}
              onChange={() => toggleProduct(item._id)}
              disabled={deleting}
              aria-label={`Select ${item.name}`}
              className="h-4 w-4 cursor-pointer accent-red-500"
            />

            {/* Product Image */}
            <img
              className="h-12 w-12 rounded object-cover sm:h-16 sm:w-16"
              src={item.image?.[0]}
              alt={item.name}
            />

            {/* Name and Mobile Details */}
            <div className="min-w-0">
              <p className="wrap-break-word font-medium text-gray-800">
                {item.name}
              </p>

              <p className="mt-1 text-xs text-gray-500 md:hidden">
                {item.category}
              </p>

              <p className="mt-1 text-xs text-gray-600 md:hidden">
                {currency}
                {item.price}
              </p>
            </div>

            {/* Category */}
            <p className="hidden truncate md:block">
              {item.category}
            </p>

            {/* Price */}
            <p className="hidden md:block">
              {currency}
              {item.price}
            </p>

            {/* Individual Delete */}
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete "${item.name}"?`
                  )
                ) {
                  removeProduct(item._id);
                }
              }}
              type="button"
              disabled={deleting}
              className="px-2 text-lg font-semibold text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${item.name}`}
            >
              X
            </button>
          </div>
        ))}

        {list.length === 0 && (
          <p className="py-8 text-center text-gray-500">
            No products found.
          </p>
        )}
      </div>
    </div>
  );
};

export default List;
