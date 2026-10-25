import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Collection = () => {
  const { products, productsLoading, search } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");

  // Get unique categories from fetched products
  const categories = useMemo(
    () => [...new Set(products.map((item) => item.category).filter(Boolean))].sort(),
    [products]
  );

  // Get unique subcategories from fetched products
  const subCategories = useMemo(
    () =>
      [
        ...new Set(
          products.map((item) => item.subCategory).filter(Boolean)
        ),
      ].sort(),
    [products]
  );

  const toggleCategory = (e) => {
    const value = e.target.value;

    setCategory((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const toggleSubCategory = (e) => {
    const value = e.target.value;

    setSubCategory((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const filterProducts = useMemo(() => {
    let productsCopy = [...products];

    if (search?.trim()) {
      productsCopy = productsCopy.filter((item) =>
        item.name?.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.category)
      );
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes(item.subCategory)
      );
    }

    if (sortType === "low-high") {
      productsCopy.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortType === "high-low") {
      productsCopy.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return productsCopy;
  }, [products, search, category, subCategory, sortType]);

  useEffect(() => {
    setCategory((previous) =>
      previous.filter((value) => categories.includes(value))
    );

    setSubCategory((previous) =>
      previous.filter((value) => subCategories.includes(value))
    );
  }, [categories, subCategories]);

  return (
    <div className="flex flex-col gap-1 pt-10 border-t sm:flex-row sm:gap-10">
      {/* Filters */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <span className="text-sm sm:hidden">
            {showFilter ? "▲" : "▼"}
          </span>
        </p>

        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>

          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {categories.map((item) => (
              <label key={item} className="flex gap-2">
                <input
                  type="checkbox"
                  value={item}
                  checked={category.includes(item)}
                  onChange={toggleCategory}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">SUBCATEGORIES</p>

          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {subCategories.map((item) => (
              <label key={item} className="flex gap-2">
                <input
                  type="checkbox"
                  value={item}
                  checked={subCategory.includes(item)}
                  onChange={toggleSubCategory}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4 text-base sm:text-2xl">
          <Title text1="ALL" text2="COLLECTIONS" />

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2 py-2"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {productsLoading ? (
          <p className="py-10 text-center">Loading products...</p>
        ) : filterProducts.length === 0 ? (
          <p className="py-10 text-center">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {filterProducts.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                image={item.image}
                name={item.name}
                price={item.price}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
