import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";

const Cart = () => {
  const {
    products,
    cartItems,
    updateQuantity,
    currency,
    navigate,
  } = useContext(ShopContext);

  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const initialQuantities = {};

    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        initialQuantities[`${itemId}-${size}`] =
          cartItems[itemId][size];
      }
    }

    setQuantities(initialQuantities);
  }, [cartItems]);

  const handleQuantityChange = (itemId, size, value) => {
    const key = `${itemId}-${size}`;

    setQuantities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleQuantityBlur = (itemId, size) => {
    const key = `${itemId}-${size}`;
    const value = quantities[key];

    if (value === "" || Number(value) < 1 || !Number.isFinite(Number(value))) {
      setQuantities((prev) => ({
        ...prev,
        [key]: cartItems[itemId][size],
      }));
      return;
    }

    const quantity = Math.floor(Number(value));

    updateQuantity(itemId, size, quantity);

    setQuantities((prev) => ({
      ...prev,
      [key]: quantity,
    }));
  };

  return (
    <div className="border-t pt-14">
      <div className="mb-3 text-2xl">
        <Title text1="YOUR" text2="CART" />
      </div>

      <div>
        {Object.keys(cartItems).length === 0 ||
        !Object.values(cartItems).some((sizes) =>
          Object.values(sizes).some((quantity) => Number(quantity) > 0)
        ) ? (
          <p className="py-10 text-gray-500">Your cart is empty.</p>
        ) : (
          Object.keys(cartItems).map((itemId) => {
            const product = products.find(
              (item) => String(item._id) === String(itemId)
            );

            if (!product) return null;

            return Object.keys(cartItems[itemId]).map((size) => {
              const quantity = cartItems[itemId][size];

              if (Number(quantity) <= 0) return null;

              const key = `${itemId}-${size}`;
              const productImage = Array.isArray(product.image)
                ? product.image[0]
                : product.image;

              return (
                <div
                  key={key}
                  className="grid grid-cols-[4fr_0.5fr_0.5fr] items-center gap-4 border-b py-4 text-gray-700 sm:grid-cols-[4fr_1fr_0.5fr]"
                >
                  <div className="flex items-start gap-6">
                    <img
                      className="w-16 sm:w-20"
                      src={productImage}
                      alt={product.name}
                    />

                    <div>
                      <p className="text-xs font-medium sm:text-lg">
                        {product.name}
                      </p>

                      <p className="mt-2">
                        {currency}
                        {Number(product.price).toFixed(2)}
                      </p>

                      <p className="mt-2 text-sm">Size: {size}</p>
                    </div>
                  </div>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantities[key] ?? quantity}
                    onChange={(e) =>
                      handleQuantityChange(itemId, size, e.target.value)
                    }
                    onBlur={() => handleQuantityBlur(itemId, size)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-16 border px-2 py-1 sm:w-20"
                  />

                  <img
                    onClick={() => updateQuantity(itemId, size, 0)}
                    className="w-4 cursor-pointer sm:w-5"
                    src={assets.bin_icon}
                    alt="Remove item"
                  />
                </div>
              );
            });
          })
        )}
      </div>

      <div className="mt-20 flex justify-end">
        <div className="w-full sm:w-112.5">
          <CartTotal />
          <div className="mt-6 text-end">
            <button
              onClick={() => navigate("/place-order")}
              className="bg-black px-8 py-3 text-sm text-white active:bg-gray-700"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
