import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/forgot-password`,
        { email: email.trim() },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        toast.success("If your account exists, a reset link will be sent.");
      } else {
        toast.error(response.data.message || "Request failed.");
      }
    } catch (error) {
      console.error(
        "Forgot password error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">
          Forgot Password
        </p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {submitted ? (
        <div className="w-full text-center text-sm">
          <p>
            If an account exists with that email, you will
            receive a password reset link.
          </p>
          <p className="mt-3">
            Check your inbox and spam folder.
          </p>

          <Link
            to="/login"
            className="inline-block mt-5 underline"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-center">
            Enter the email address associated with your account.
            We will send you a link to reset your password.
          </p>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Email"
            autoComplete="email"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white font-light px-8 py-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : "Send Reset Link"}
          </button>

          <Link to="/login" className="text-sm hover:underline">
            Back to Login
          </Link>
        </>
      )}
    </form>
  );
};

export default ForgotPassword;