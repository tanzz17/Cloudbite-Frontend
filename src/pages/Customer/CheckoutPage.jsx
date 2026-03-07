/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  CreditCard,
  Zap,
  ShieldCheck,
  Phone
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";

const API_BASE_URL = "http://localhost:8080/api";

const DELIVERY_FEE = 30.0;
const PLATFORM_FEE = 5.0;

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);

export default function CheckoutPage() {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);

  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ LOAD RAZORPAY
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ✅ FETCH CART
  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customers/cart/user/${user.id}`);
      setCart(res.data);
    } catch {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH ADDRESS
  const fetchSavedAddress = async () => {
    try {
      const { email, id: userId } = user;
      const res = await axios.get(`${API_BASE_URL}/customers/profile`, {
        params: { email, userId },
      });
      setSavedAddress(res.data);
    } catch {
      toast.error("Profile sync failed.");
    }
  };

  useEffect(() => {
    if (!user?.id) {
      toast.error("Login required");
      navigate("/login");
      return;
    }
    fetchCart();
    fetchSavedAddress();
  }, [user?.id]);

  const calculateSubtotal = () =>
    cart?.items?.reduce(
      (sum, item) =>
        sum +
        (item.totalPrice ??
          (item.priceAtAddition || 0) * (item.quantity || 1)),
      0
    ) || 0;

  const openRazorpay = async (orderId, amount) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) return toast.error("Razorpay failed to load");

    try {
      const { data } = await axios.post(`${API_BASE_URL}/payment/create-order`, {
        orderId,
        amount,
      });

      const razorpayOrder = JSON.parse(data);

      const options = {
        key: "rzp_test_SOFuNApP2JzrmE", // 🔥 replace
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "CloudBite",
        description: "Food Payment",
        order_id: razorpayOrder.id,

        handler: async function (response) {
          try {
            await axios.post(`${API_BASE_URL}/payment/verify`, response);
            toast.success("Payment Successful 🎉");
            navigate("/order-success");
          } catch {
            toast.error("Payment verification failed");
          }
        },

        theme: { color: "#f97316" },
      };

      new window.Razorpay(options).open();
    } catch {
      toast.error("Payment init failed");
    }
  };

  // ✅ PLACE ORDER + PAY
  const handlePlaceOrder = async () => {
    let deliveryAddress = "";
    let phone = "";
    let place = "";
    let postalCode = "";

    if (useSavedAddress && savedAddress) {
      deliveryAddress = savedAddress.address;
      phone = savedAddress.phone;
      place = savedAddress.place;
      postalCode = savedAddress.postalCode;
    } else {
      const { street, city, state, zipCode, phone: newPhone } = newAddress;
      if (!street || !city || !state || !zipCode || !newPhone)
        return toast.error("Fill all address fields");

      deliveryAddress = `${street}, ${city}, ${state}`;
      phone = newPhone;
      place = city;
      postalCode = zipCode;
    }

    try {
      setPlacingOrder(true);

      const res = await axios.post(
        `${API_BASE_URL}/orders/place/${user.id}`,
        {},
        { params: { deliveryAddress, phone, place, postalCode } }
      );

      const order = res.data;

      await openRazorpay(order.orderId, order.totalPrice);

    } catch {
      toast.error("Order failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + DELIVERY_FEE + PLATFORM_FEE;

  return (
    <div className="max-w-5xl mx-auto mt-20 px-6">
      <h1 className="text-3xl font-bold mb-10">Checkout</h1>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between mb-4">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between mb-4">
          <span>Delivery Fee</span>
          <span>{formatPrice(DELIVERY_FEE)}</span>
        </div>

        <div className="flex justify-between mb-4">
          <span>Platform Fee</span>
          <span>{formatPrice(PLATFORM_FEE)}</span>
        </div>

        <hr />

        <div className="flex justify-between font-bold mt-4 text-lg">
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="mt-6 w-full bg-orange-500 text-white py-3 rounded-lg font-bold"
        >
          {placingOrder ? "Processing..." : "PAY NOW"}
        </button>
      </div>
    </div>
  );
}