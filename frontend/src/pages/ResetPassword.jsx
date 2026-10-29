import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/reset-password/${encodeURIComponent(token)}`,
        { password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Password reset successfully. Please log in.");
        navigate("/login", { replace: true });
      } else {
        toast.error(response.data.message || "Password reset failed.");
      }
    } catch (error) {
      console.error(
        "Reset password error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "The reset link may be invalid or expired."
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
          Reset Password
        </p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      <p className="text-sm text-center">
        Enter your new password below.
      </p>

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="New password"
        autoComplete="new-password"
        minLength={6}
        required
        disabled={loading}
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Confirm new password"
        autoComplete="new-password"
        minLength={6}
        required
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white font-light px-8 py-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Please wait..." : "Reset Password"}
      </button>

      <Link to="/login" className="text-sm hover:underline">
        Back to Login
      </Link>
    </form>
  );
};

export default ResetPassword;