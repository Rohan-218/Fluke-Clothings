import React from "react";
import { Link, useSearchParams } from "react-router-dom";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">

      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">

        {/* Brand */}
        <Link to="/" className="mb-10 inline-block text-3xl font-semibold tracking-[0.25em] text-gray-900">
          FLUKE
        </Link>

        {/* Icon */}
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <svg
            className="h-10 w-10 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Payment Process Completed
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-gray-500">
          Thank you for shopping with Fluke. Your payment status is being
          confirmed by our server.
        </p>

        {/* Order Details */}
        {orderId && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Order ID
            </p>

            <p className="mt-2 break-all text-sm font-semibold text-gray-800">
              {orderId}
            </p>
          </div>
        )}

        {/* Information */}
        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-left">
          <div className="flex gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.5m0 3h.01M10.3 3.9L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
              />
            </svg>

            <p className="text-sm leading-6 text-yellow-800">
              Please return to the device where you placed your order to
              check the latest payment status. Avoid making another payment
              while your current payment is being verified.
            </p>
          </div>
        </div>

        {/* Action */}
        <Link
          to="/"
          className="mt-8 flex w-full items-center justify-center rounded-lg bg-black px-6 py-3.5 text-sm font-medium text-white transition duration-200 hover:bg-gray-800"
        >
          Continue Shopping
        </Link>

        <p className="mt-6 text-xs text-gray-400">
          Thank you for choosing Fluke.
        </p>

      </div>
    </div>
  );
};

export default PaymentReturn;