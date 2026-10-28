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

  // Register one product through the existing backend endpoint
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
    }
  };

  // Select folder containing products.json and images/
  const onBulkFolderChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setBulkFiles(selectedFiles);
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
      return;
    }

    toast.success(`Folder selected: ${selectedFiles.length} files found`);
  };

  // Find image by the path specified in products.json
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
        toast.success(`Successfully registered all ${succeeded} products`);
      } else {
        toast.warning(
          `${succeeded} succeeded, ${failed.length} failed. Check the console for details.`
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

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Upload mode selector */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setUploadMode("single")}
          className={`px-4 py-2 border cursor-pointer ${
            uploadMode === "single"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-gray-300"
          }`}
        >
          Single Product Upload
        </button>

        <button
          type="button"
          onClick={() => setUploadMode("bulk")}
          className={`px-4 py-2 border cursor-pointer ${
            uploadMode === "bulk"
              ? "bg-black text-white border-black"
              : "bg-white text-black border-gray-300"
          }`}
        >
          Bulk Upload Products
        </button>
      </div>

      {/* Bulk upload: hidden until selected */}
      {uploadMode === "bulk" && (
        <section className="w-full border border-gray-300 p-5 rounded">
          <h2 className="text-lg font-semibold mb-2">
            Bulk Upload Products
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Select the folder containing products.json and the images
            folder.
          </p>

          <input
            type="file"
            multiple
            webkitdirectory=""
            onChange={onBulkFolderChange}
            disabled={bulkLoading}
            className="block w-full text-sm mb-4"
          />

          {bulkFiles.length > 0 && (
            <p className="text-sm mb-3">
              {bulkFiles.length} files selected
            </p>
          )}

          <button
            type="button"
            onClick={onBulkUploadHandler}
            disabled={bulkLoading || bulkFiles.length === 0}
            className="px-5 py-3 bg-blue-600 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {bulkLoading ? "Uploading..." : "UPLOAD ALL PRODUCTS"}
          </button>

          {bulkProgress && (
            <p className="mt-3 text-sm text-gray-700">
              {bulkProgress}
            </p>
          )}
        </section>
      )}

      {/* Single product form: hidden in bulk mode */}
      {uploadMode === "single" && (
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col w-full items-start gap-3"
        >
          <div>
            <p className="mb-2">Upload Image</p>

            <div className="flex gap-2">
              {[image1, image2, image3, image4].map((image, index) => (
                <label key={index} htmlFor={`image${index + 1}`}>
                  <img
                    className="w-20"
                    src={
                      !image
                        ? assets.upload_area
                        : URL.createObjectURL(image)
                    }
                    alt="upload-area"
                  />

                  <input
                    onChange={(e) => {
                      const file = e.target.files?.[0] || false;

                      [
                        setImage1,
                        setImage2,
                        setImage3,
                        setImage4,
                      ][index](file);
                    }}
                    type="file"
                    id={`image${index + 1}`}
                    accept="image/*"
                    hidden
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="w-full">
            <p className="mb-2">Product name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="w-full max-w-125 px-3 py-2"
              type="text"
              placeholder="Type here"
              required
            />
          </div>

          <div className="w-full">
            <p className="mb-2">Product description</p>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className="w-full max-w-125 px-3 py-2"
              placeholder="Write content here"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
            <div>
              <p className="mb-2">Product category</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
              </select>
            </div>

            <div>
              <p className="mb-2">Sub category</p>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2"
              >
                <option value="Topwear">Topwear</option>
                <option value="Bottomwear">Bottomwear</option>
                <option value="Winterwear">Winterwear</option>
                <option value="Formal">Formal</option>
              </select>
            </div>

            <div>
              <p className="mb-2">Product Price</p>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className="w-full px-3 py-2 sm:w-30"
                type="number"
                placeholder="499"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <p className="mb-2">Product sizes</p>

            <div className="flex gap-3">
              {["S", "M", "L", "XL", "XXL"].map((size) => (
                <div
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`${
                    sizes.includes(size)
                      ? "bg-blue-100"
                      : "bg-slate-200"
                  } px-3 py-1 cursor-pointer`}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <input
              onChange={(e) => setBestseller(e.target.checked)}
              checked={bestseller}
              type="checkbox"
              id="bestseller"
            />

            <label className="cursor-pointer" htmlFor="bestseller">
              Add to bestseller
            </label>
          </div>

          <button
            className="w-28 py-3 mt-4 bg-black text-white cursor-pointer"
            type="submit"
          >
            ADD
          </button>
        </form>
      )}
    </div>
  );
};

export default Add;