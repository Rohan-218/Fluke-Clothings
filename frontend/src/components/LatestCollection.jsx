import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products, productsLoading } = useContext(ShopContext);

  // Display the first 10 products
  const latestProducts = products.slice(0, 10);

  return (
    <div className="my-10">
      <div className="text-center py-8 text-[1.7rem] sm:text-3xl">
        <Title text1="LATEST" text2="COLLECTIONS" />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover our newest arrivals and exclusive collections
        </p>
      </div>

      {productsLoading ? (
        <p className="py-10 text-center">Loading products...</p>
      ) : latestProducts.length === 0 ? (
        <p className="py-10 text-center">No products available.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {latestProducts.map((item) => (
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
  );
};

export default LatestCollection;
