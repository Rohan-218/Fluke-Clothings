import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const Login = () => {
  const [currentState, setCurrentState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { checkAuth } = useContext(ShopContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const isLogin = currentState === "Login";

      const endpoint = isLogin
        ? "/api/auth/login"
        : "/api/auth/register";

      const payload = isLogin
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const response = await axios.post(
        `${backendUrl}${endpoint}`,
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success !== true) {
        toast.error(
          response.data.message || "Authentication failed."
        );
        return;
      }

      // Verify the HTTP-only authentication cookie.
      const authenticated = await checkAuth();

      if (!authenticated) {
        console.error(
          "Login/register succeeded, but session verification failed."
        );

        toast.error(
          "Authentication could not be verified. Check your connection and try again."
        );
        return;
      }

      toast.success(
        response.data.message ||
          (isLogin ? "Login successful!" : "Registration successful!")
      );

      navigate("/");
    } catch (error) {
      console.error(
        "Login/register error:",
        error.response?.status,
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const switchState = (state) => {
    if (loading) return;

    setCurrentState(state);
    setPassword("");
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState !== "Login" && (
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Name"
          autoComplete="name"
          required
          disabled={loading}
        />
      )}

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

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        autoComplete={
          currentState === "Login"
            ? "current-password"
            : "new-password"
        }
        minLength={6}
        required
        disabled={loading}
      />

      <div className="w-full flex justify-between text-sm -mt-2">
        {currentState === "Login" && (
          <Link
            to="/forgot-password"
            className="cursor-pointer hover:underline"
          >
            Forgot your password?
          </Link>
        )}

        {currentState === "Login" ? (
          <p
            onClick={() => switchState("Sign Up")}
            className="cursor-pointer"
          >
            Create account
          </p>
        ) : (
          <p
            onClick={() => switchState("Login")}
            className="cursor-pointer"
          >
            Login Here
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white font-light px-8 py-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? "Please wait..."
          : currentState === "Login"
            ? "Sign In"
            : "Sign Up"}
      </button>
    </form>
  );
};

export default Login;