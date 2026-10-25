import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const { products, productsLoading } = useContext(ShopContext);

  // Get the first 5 bestseller products
  const bestSellers = products
    .filter((item) => item.bestseller)
    .slice(0, 5);

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1="BEST" text2="SELLERS" />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover our most popular products that customers love!
        </p>
      </div>

      {productsLoading ? (
        <p className="py-10 text-center">Loading products...</p>
      ) : bestSellers.length === 0 ? (
        <p className="py-10 text-center">
          No bestseller products available.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {bestSellers.map((item) => (
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

export default BestSeller;
