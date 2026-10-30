import React, { useState } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Add = () => {
  const [uploadMode, setUploadMode] = useState("single");

  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setImage1(false);
    setImage2(false);
    setImage3(false);
    setImage4(false);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Men");
    setSubCategory("Topwear");
    setBestseller(false);
    setSizes([]);
  };

  // Register product
  const registerProduct = async (product, imageFiles) => {
    const formData = new FormData();

    imageFiles.forEach((file, index) => {
      if (file) {
        formData.append(`image${index + 1}`, file);
      }
    });

    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory,
      sizes: JSON.stringify(product.sizes || []),
      bestseller: String(Boolean(product.bestseller)),
    };

    Object.entries(productData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await axios.post(
      `${backendUrl}/api/product/register`,
      formData
    );

    if (response.data.success === false) {
      throw new Error(
        response.data.message || "Product registration failed"
      );
    }

    return response.data;
  };

  // Single product submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      await registerProduct(
        {
          name,
          description,
          price,
          category,
          subCategory,
          sizes,
          bestseller,
        },
        [image1, image2, image3, image4]
      );

      toast.success("Product added successfully");
      resetForm();
    } catch (error) {
      console.error("Add product error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Select folder
  const onBulkFolderChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setBulkProgress("");

    const jsonFile = selectedFiles.find(
      (file) =>
        file.webkitRelativePath
          .split("/")
          .pop()
          .toLowerCase() === "products.json"
    );

    if (!jsonFile) {
      toast.error("The selected folder must contain products.json");
      setBulkFiles([]);
      e.target.value = "";
      return;
    }

    setBulkFiles(selectedFiles);
    toast.success(`Folder selected: ${selectedFiles.length} files found`);
  };

  // Find product image
  const findProductImage = (imagePath) => {
    const normalizedPath = String(imagePath)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return bulkFiles.find((file) => {
      const relativePath = file.webkitRelativePath.replace(/\\/g, "/");

      return (
        relativePath === normalizedPath ||
        relativePath.endsWith("/" + normalizedPath)
      );
    });
  };

  // Bulk registration
  const onBulkUploadHandler = async () => {
    if (bulkLoading) return;

    if (!bulkFiles.length) {
      toast.error("Please select your product folder first");
      return;
    }

    setBulkLoading(true);

    let succeeded = 0;
    const failed = [];

    try {
      const jsonFile = bulkFiles.find(
        (file) =>
          file.webkitRelativePath
            .split("/")
            .pop()
            .toLowerCase() === "products.json"
      );

      if (!jsonFile) {
        throw new Error("products.json was not found");
      }

      setBulkProgress("Reading products.json...");

      const parsedData = JSON.parse(await jsonFile.text());

      if (
        !parsedData ||
        !Array.isArray(parsedData.products) ||
        parsedData.products.length === 0
      ) {
        throw new Error(
          'products.json must contain a non-empty "products" array'
        );
      }

      const products = parsedData.products;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        setBulkProgress(
          `Uploading product ${i + 1} of ${products.length}: ${
            product.name || "Unnamed product"
          }`
        );

        try {
          if (
            !product.name ||
            !product.description ||
            product.price == null ||
            !product.category ||
            !product.subCategory ||
            !Array.isArray(product.sizes)
          ) {
            throw new Error("Missing or invalid product details");
          }

          if (
            !Array.isArray(product.image) ||
            product.image.length === 0
          ) {
            throw new Error("No product images specified");
          }

          if (product.image.length > 4) {
            throw new Error(
              "This endpoint supports a maximum of 4 images per product"
            );
          }

          const imageFiles = product.image.map((imagePath) => {
            const file = findProductImage(imagePath);

            if (!file) {
              throw new Error(`Image not found: ${imagePath}`);
            }

            return file;
          });

          while (imageFiles.length < 4) {
            imageFiles.push(null);
          }

          await registerProduct(product, imageFiles);
          succeeded++;
        } catch (error) {
          console.error(`Failed to register ${product.name}:`, error);

          failed.push({
            name: product.name || `Product ${i + 1}`,
            reason:
              error.response?.data?.message ||
              error.message ||
              "Registration failed",
          });
        }
      }

      setBulkProgress(
        `Finished: ${succeeded} of ${products.length} products registered.`
      );

      if (failed.length === 0) {
        toast.success(
          `Successfully registered all ${succeeded} products`
        );
      } else {
        toast.warning(
          `${succeeded} succeeded, ${failed.length} failed. Check console for details.`
        );

        console.table(failed);
      }
    } catch (error) {
      console.error("Bulk upload error:", error);

      toast.error(
        error.message || "Failed to process the product folder"
      );

      setBulkProgress("");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSize = (size) => {
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((item) => item !== size)
        : [...prev, size]
    );
  };

  const inputClass =
    "w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-200";

  const labelClass =
    "mb-1.5 block text-xs font-semibold text-gray-600";

  const imageStates = [
    image1,
    image2,
    image3,
    image4,
  ];

  const imageSetters = [
    setImage1,
    setImage2,
    setImage3,
    setImage4,
  ];

  return (
    <div className="w-full min-h-screen bg-[#f7f7f7] px-3 py-4 sm:px-5 lg:px-7">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Inventory Management
              </p>
            </div>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
              Add Product
            </h1>
          </div>

          {/* Upload Mode */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setUploadMode("single")}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                uploadMode === "single"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <span className="mr-1.5">＋</span>
              Single Product
            </button>

            <button
              type="button"
              onClick={() => setUploadMode("bulk")}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                uploadMode === "bulk"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <span className="mr-1.5">▤</span>
              Bulk Upload
            </button>
          </div>
        </div>

        {/* SINGLE PRODUCT */}
        {uploadMode === "single" && (
          <form
            onSubmit={onSubmitHandler}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >

            {/* Main Form Layout */}
            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-[250px_1fr]">

              {/* Images */}
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Product Images
                  </h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Upload up to 4 images
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {imageStates.map((image, index) => (
                    <label
                      key={index}
                      htmlFor={`image${index + 1}`}
                      className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-500 hover:bg-gray-100"
                    >
                      <img
                        className={`h-full w-full ${
                          image
                            ? "object-contain p-1"
                            : "object-contain p-5 opacity-50 group-hover:opacity-80"
                        }`}
                        src={
                          image
                            ? URL.createObjectURL(image)
                            : assets.upload_area
                        }
                        alt={`Product image ${index + 1}`}
                      />

                      {!image && (
                        <span className="absolute bottom-1.5 text-[9px] font-medium text-gray-500">
                          Image {index + 1}
                        </span>
                      )}

                      {image && (
                        <span className="absolute right-1 bottom-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-white">
                          Uploaded
                        </span>
                      )}

                      <input
                        type="file"
                        id={`image${index + 1}`}
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0] || false;
                          imageSetters[index](file);
                        }}
                      />
                    </label>
                  ))}
                </div>

                <p className="mt-2 text-[10px] leading-4 text-gray-400">
                  The first image will be used as the primary product image.
                </p>
              </div>

              {/* Product Details */}
              <div className="min-w-0">

                {/* Basic Information */}
                <div className="mb-4">
                  <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">
                    Basic Information
                  </h2>

                  <div className="space-y-3">

                    <div>
                      <label className={labelClass}>
                        Product Name
                      </label>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter product name"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Description
                      </label>

                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your product, features and details..."
                        rows={2}
                        className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Classification */}
                <div className="mb-4">
                  <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">
                    Product Classification
                  </h2>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <div>
                      <label className={labelClass}>
                        Category
                      </label>

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Subcategory
                      </label>

                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="Topwear">Topwear</option>
                        <option value="Bottomwear">Bottomwear</option>
                        <option value="Winterwear">Winterwear</option>
                        <option value="Formal">Formal</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Price (₹)
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="499"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-gray-900">
                    Available Sizes
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        aria-pressed={sizes.includes(size)}
                        className={`flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-xs font-semibold transition ${
                          sizes.includes(size)
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-500"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

              <label
                htmlFor="bestseller"
                className="flex cursor-pointer items-center gap-2.5"
              >
                <input
                  type="checkbox"
                  id="bestseller"
                  checked={bestseller}
                  onChange={(e) => setBestseller(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-black"
                />

                <span className="text-xs font-medium text-gray-700">
                  Mark as Bestseller
                </span>

                <span className="text-[10px] text-gray-400">
                  (Optional)
                </span>
              </label>

              <div className="flex items-center gap-3">

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-black px-7 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? "Adding Product..." : "Add Product →"}
                </button>
              </div>
            </div>

          </form>
        )}

        {/* BULK UPLOAD */}
        {uploadMode === "bulk" && (
          <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Bulk Product Upload
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Import multiple products using a folder.
                </p>
              </div>

              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                JSON + Images
              </span>
            </div>

            {/* Folder Upload */}
            <label
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-5 text-center transition ${
                bulkFiles.length > 0
                  ? "border-green-400 bg-green-50/40"
                  : "border-gray-300 bg-gray-50 hover:border-gray-500 hover:bg-gray-100"
              }`}
            >
              <input
                type="file"
                multiple
                webkitdirectory=""
                onChange={onBulkFolderChange}
                disabled={bulkLoading}
                className="hidden"
              />

              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
                📁
              </div>

              <p className="text-sm font-semibold text-gray-800">
                {bulkFiles.length > 0
                  ? "Folder selected successfully"
                  : "Choose your product folder"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {bulkFiles.length > 0
                  ? `${bulkFiles.length} files ready for upload`
                  : "Select a folder containing products.json and images."}
              </p>

              <span className="mt-3 rounded-md bg-black px-4 py-2 text-[10px] font-semibold text-white">
                {bulkFiles.length > 0 ? "Change Folder" : "Browse Folder"}
              </span>
            </label>

            {/* Folder Information */}
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                Required folder structure
              </p>

              <div className="space-y-1 font-mono text-xs text-gray-500">
                <p>📁 products/</p>
                <p className="pl-5">📄 products.json</p>
                <p className="pl-5">📁 images/</p>
                <p className="pl-10">🖼 product-1.jpg</p>
                <p className="pl-10">🖼 product-2.jpg</p>
              </div>
            </div>

            {/* Progress */}
            {bulkProgress && (
              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">ℹ️</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-900">
                      Upload Status
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">
                      {bulkProgress}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  if (!bulkLoading) {
                    setBulkFiles([]);
                    setBulkProgress("");
                  }
                }}
                disabled={bulkLoading || bulkFiles.length === 0}
                className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear Selection
              </button>

              <button
                type="button"
                onClick={onBulkUploadHandler}
                disabled={bulkLoading || bulkFiles.length === 0}
                className="rounded-md bg-black px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkLoading
                  ? "Uploading Products..."
                  : "Upload All Products →"}
              </button>

            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Add;