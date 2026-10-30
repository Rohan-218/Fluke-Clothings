import axios from "axios";
import React, { useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Login = ({ setIsAuthenticated }) => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {

      const response = await axios.post(
        `${backendUrl}/api/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      if (response.data.success === true) {
        setIsAuthenticated(true);
        toast.success(response.data.message || "Login successful");
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        toast.error(
          error.response.data?.message || "Login failed"
        );
      } else if (error.request) {
        toast.error("Unable to connect to the server.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    }
  };

  const useDemoCredentials = () => {
    setEmail("system@gmail.com");
    setPassword("System@test");
    setShowDemoCredentials(false);
    toast.success("Demo credentials filled!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

        <form onSubmit={onSubmitHandler}>
          <div className="mb-3 min-w-72">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-3 min-w-72">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Password
            </p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="mt-2 w-full py-2 px-4 rounded-md text-white bg-black disabled:opacity-50" type="submit">
            Login
          </button>
        </form>

        <button type="button" onClick={() => setShowDemoCredentials(true)} className="mt-4 text-sm font-medium text-blue-600 hover:underline">
          View Demo Credentials
        </button>

      </div>

      {showDemoCredentials && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowDemoCredentials(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Demo Admin Credentials
              </h2>

              <button
                type="button"
                onClick={() => setShowDemoCredentials(false)}
                className="text-xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 rounded-lg bg-gray-50 p-4 text-sm">

              <div>
                <p className="mb-2 font-medium text-gray-700">Email</p>
                <p className="break-all text-gray-600">
                  system@gmail.com
                </p>
              </div>

              <div>
                <p className="mb-2 font-medium text-gray-700">Password</p>
                <p className="break-all text-gray-600">
                  System@test
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={useDemoCredentials}
              className="mt-3 w-full rounded-md bg-black py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Use Demo Credentials
            </button>

            <button
              type="button"
              onClick={() => setShowDemoCredentials(false)}
              className="mt-3 w-full rounded-md py-2 text-sm text-gray-500 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;