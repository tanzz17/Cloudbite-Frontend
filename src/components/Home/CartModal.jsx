/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/api";

// ✅ Get stored userId
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.id;
};

// ✅ Format price in INR
const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);

// ✅ Get Cart
const getCartApi = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/customers/cart/user/${userId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    throw error;
  }
};

// ✅ Update Cart Quantity
const updateQuantityApi = async (userId, foodId, quantity) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/customers/cart/update/${userId}/${foodId}?quantity=${quantity}`
    );
    return res.data;
  } catch (error) {
    console.error("❌ Error updating quantity:", error);
    throw error;
  }
};

// ✅ Remove Item
const removeItemApi = async (userId, foodId) => {
  try {
    const res = await axios.delete(
      `${API_BASE_URL}/customers/cart/remove/${userId}/${foodId}`
    );
    return res.data;
  } catch (error) {
    console.error("❌ Error removing item:", error);
    throw error;
  }
};

// ✅ Clear Cart (if needed)
const clearCartApi = async (userId) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/customers/cart/clear/${userId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    throw error;
  }
};

// ✅ Image Helper
const getImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/300x300?text=No+Image";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
};

export default function CartPage() {
  const userId = getUserId();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Cart on mount
  useEffect(() => {
    if (!userId) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }
    fetchCart();
  }, [userId]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await getCartApi(userId);

      // 🧠 Restriction: if cart contains items from multiple kitchens (edge case)
      const uniqueKitchens = new Set(
        data.items?.map((item) => item.food?.kitchen?.id)
      );
      if (uniqueKitchens.size > 1) {
        toast.error(
          "Your cart contains items from multiple kitchens. Please clear your cart before adding from another kitchen."
        );
      }

      setCart(data);
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Increase or decrease quantity
  const handleQuantityChange = async (foodId, newQuantity) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(foodId);
      return;
    }
    try {
      await updateQuantityApi(userId, foodId, newQuantity);
      fetchCart();
    } catch (error) {
      toast.error("Failed to update quantity!");
    }
  };

  // ✅ Remove Item from Cart
  const handleRemoveItem = async (foodId) => {
    try {
      await removeItemApi(userId, foodId);
      toast.success("Item removed!");
      fetchCart();
    } catch (error) {
      toast.error("Failed to remove item!");
    }
  };

  // ✅ Proceed to Checkout
  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    // Restriction double-check: ensure all items are from one kitchen
    const uniqueKitchens = new Set(
      cart.items?.map((item) => item.food?.kitchen?.id)
    );
    if (uniqueKitchens.size > 1) {
      toast.error(
        "You can checkout items from only one kitchen at a time. Please clear other items first."
      );
      return;
    }

    navigate("/customer/checkout");
  };

  // 🌀 Loading State
  if (loading)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10 text-orange-500 mb-3" />
        <p>Loading your cart...</p>
      </div>
    );

  if (!cart || cart.items.length === 0)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-gray-600">
        <ShoppingBag size={48} className="mb-3 text-gray-400" />
        <p className="text-lg font-medium mb-3">Your cart is empty.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Explore Kitchens
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      {/* Header */}
      <div className="bg-white shadow-md py-4 mb-6 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-green-600 transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.food.id}
            className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            {/* Food Image */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 mr-4">
              <img
                src={getImageUrl(item.food?.images?.[0])}
                alt={item.food?.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Food Info */}
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-900">
                {item.food?.name}
              </h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                {item.food?.description || "Tasty and freshly prepared"}
              </p>
              <p className="font-semibold text-gray-800 mt-1">
                {formatPrice(item.food?.price)}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center mt-2">
                <button
                  onClick={() =>
                    handleQuantityChange(item.food.id, item.quantity - 1)
                  }
                  className="px-2 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-3 border-t border-b border-gray-300 text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleQuantityChange(item.food.id, item.quantity + 1)
                  }
                  className="px-2 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100"
                >
                  +
                </button>

                <button
                  onClick={() => handleRemoveItem(item.food.id)}
                  className="ml-4 text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl py-4 z-30">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">
              Total ({cart.items.length} items)
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(cart.total || 0)}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            href="/checkout"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
