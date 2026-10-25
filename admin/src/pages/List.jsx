import React, { useState, useEffect } from 'react';
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";

const List = () => {

  const [list, setList] = useState([]);

  const fetchList = async () => {

    try {
    const response = await axios.get(`${backendUrl}/api/product/list`);
    
      if (response.data.status === "success") {
        setList(response.data.products);
      } else {
        toast.error(response.data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch products error:", error);

      if (error.response) {
        toast.error(
          error.response.data?.message || "Failed to fetch products"
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

      if (response.data.status === "success") {
        toast.success(response.data.message || "Product deleted successfully");

        setList((prev) => prev.filter((item) => item._id !== productId));
      } else {
        toast.error(response.data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete product error:", error);

      if (error.response) {
        toast.error(
          error.response.data?.message || "Failed to delete product"
        );
      } else if (error.request) {
        toast.error("Unable to connect to the server.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    }
  };

  useEffect(() => {
    fetchList();
  },[]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-semibold">Product List</p>

      <div className="flex flex-col gap-2">

        {/* List Table Title */}
        <div className="hidden md:grid grid-cols-[0.5fr_2fr_1fr_1fr_0.5fr] items-center py-3 px-3 border bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>

        {/* Product List */}
        {list.map((item) => (
          <div
            key={item._id}
            className="grid grid-cols-[64px_minmax(0,1fr)_auto] sm:grid-cols-[80px_minmax(0,2fr)_1fr_auto] md:grid-cols-[0.5fr_2fr_1fr_1fr_0.5fr] items-center gap-3 sm:gap-4 py-3 px-2 sm:px-3 border rounded-md text-sm"
          >
            {/* Image */}
            <img
              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded"
              src={item.image?.[0]}
              alt={item.name}
            />

            {/* Name and mobile details */}
            <div className="min-w-0">
              <p className="font-medium text-gray-800 wrap-break-word">{item.name}</p>

              <p className="text-xs text-gray-500 mt-1 md:hidden">{item.category}</p>

              <p className="text-xs text-gray-600 mt-1 md:hidden">{currency}{item.price}</p>
            </div>

            {/* Category: tablet and desktop */}
            <p className="hidden md:block truncate">{item.category}</p>

            {/* Price: desktop */}
            <p className="hidden md:block">{currency}{item.price}</p>

            <button
              onClick={() => removeProduct(item._id)}
              type="button"
              className="text-red-500 hover:text-red-700 font-semibold text-lg px-2 cursor-pointer"
              aria-label={`Delete ${item.name}`}
            >
              X
            </button>
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No products found.
          </p>
        )}
      </div>
    </div>
  );
};

export default List;
