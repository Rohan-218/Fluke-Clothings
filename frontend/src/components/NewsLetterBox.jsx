import React, { useState } from 'react';
import axios from "axios";
import { toast } from "react-toastify";

const NewsLetterBox = () => {

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const subscribeNewsletter = async (event) => {
    event.preventDefault();

    if (newsletterLoading) return;

    setNewsletterLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/newsletter/subscribe`,
        { email: newsletterEmail.trim() }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setNewsletterEmail("");
      } else {
        toast.error(response.data.message || "Subscription failed.");
      }
    } catch (error) {
      console.error(
        "Newsletter subscription error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to subscribe. Please try again."
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800">Subscribe now & get 20% off</p>
      <p className="text-gray-400 mt-3">
        Get fresh arrivals, stylish deals, and exclusive offers delivered to your inbox every week.
      </p>
      <form onSubmit={subscribeNewsletter} className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3">
          <input
            type="email"
            value={newsletterEmail}
            onChange={(event) => setNewsletterEmail(event.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
            disabled={newsletterLoading}
            className="w-full sm:flex-1 outline-none"
          />
        <button type="submit" disabled={newsletterLoading} className="bg-black text-white text-xs px-10 py-4">
          {newsletterLoading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
};

export default NewsLetterBox;
