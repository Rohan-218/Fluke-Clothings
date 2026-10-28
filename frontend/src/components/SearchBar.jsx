import React, { useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { useLocation, useNavigate } from "react-router-dom";

const SearchBar = () => {
  const {
    products,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    currency
  } = useContext(ShopContext);

  const location = useLocation();
  const navigate = useNavigate();

  const isCollectionPage = location.pathname === "/collection";

  useEffect(() => {
    setShowSearch(false);
  }, [location.pathname, setShowSearch]);

  // Search results
  const searchResults = search
    ? products
        .filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 6)
    : [];

  // Search
  const handleSearch = () => {
    if (!search.trim()) return;
    navigate("/collection");
  };

  // Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Product click
  const handleProductClick = (id) => {
    setShowSearch(false);
    navigate(`/product/${id}`);
  };

  return showSearch ? (
    <div className="relative w-full bg-white border-b z-50">

      {/* Search */}
      <div className="flex justify-center px-4 pt-6 pb-2">
        <div className="relative w-full max-w-220">

          <div className="flex items-center w-full h-11.5 border border-gray-700 rounded-[5px] px-3 bg-white">
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 h-full outline-none bg-transparent text-sm" type="text" placeholder="Search products" />
            {search && <span onClick={() => setSearch("")} className="text-gray-500 cursor-pointer mr-4 text-lg">×</span>}
            <img onClick={handleSearch} src={assets.search_icon} alt="search" className="w-5 h-5 cursor-pointer" />
          </div>

          {/* Product suggestions */}
          {!isCollectionPage && search && searchResults.length > 0 && (
            <div className="absolute top-11.5 left-0 w-full bg-white border border-gray-200 shadow-lg max-h-150 overflow-y-auto">
              <div className="px-7 py-5">
                <p className="text-base font-semibold mb-4">Products</p>

                <div className="flex flex-col">
                  {searchResults.map((item) => (
                    <div key={item._id} onClick={() => handleProductClick(item._id)} className="flex items-center gap-4 py-3 cursor-pointer hover:bg-gray-50">
                      <div className="w-17 h-20 shrink-0 overflow-hidden">
                        <img src={item.image[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-700">{item.name}</p>
                        <p className="text-sm text-red-500">{currency}{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {!isCollectionPage && search && searchResults.length === 0 && (
            <div className="absolute top-11.5 left-0 w-full bg-white border border-gray-200 shadow-lg">
              <p className="px-7 py-6 text-sm text-gray-500">No products found</p>
            </div>
          )}

        </div>
      </div>

      {/* Popular searches */}
      {(!search || isCollectionPage) && (
        <div className="flex justify-center items-center gap-5 pb-5 pt-3 text-sm">
          <span className="text-gray-500">Popular Searches:</span>
          <span onClick={() => setSearch("Oversized T-Shirt")} className="underline cursor-pointer">Oversized T-Shirt</span>
          <span onClick={() => setSearch("Joggers")} className="underline cursor-pointer">Joggers</span>
        </div>
      )}

    </div>
  ) : null;
};

export default SearchBar;