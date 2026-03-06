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

// Constants to match Backend logic in OrderServiceImpl
const DELIVERY_FEE = 30.0;
const PLATFORM_FEE = 5.0;

const getImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/300x300?text=No+Image";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
};

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

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customers/cart/user/${user.id}`);
      setCart(res.data);
    } catch (error) {
      toast.error("Failed to load terminal cart!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAddress = async () => {
    try {
      const { email, id: userId } = user;
      const res = await axios.get(`${API_BASE_URL}/customers/profile`, {
        params: { email, userId },
      });
      const data = res.data;
      setSavedAddress({
        fullName: data.fullName,
        address: data.address,
        place: data.place,
        postalCode: data.postalCode,
        phone: data.phone,
      });
    } catch (err) {
      toast.error("Profile sync failed.");
    }
  };

  useEffect(() => {
    if (!user?.id) {
      toast.error("Access Denied. Please login.");
      navigate("/login");
      return;
    }
    fetchCart();
    fetchSavedAddress();
  }, [user?.id]);

  const calculateSubtotal = () => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce(
      (sum, item) => sum + (item.totalPrice ?? (item.priceAtAddition || 0) * (item.quantity || 1)),
      0
    );
  };

  const handlePlaceOrder = async () => {
    let deliveryAddress = "";
    let phone = "";
    let place = "";
    let postalCode = "";

    if (useSavedAddress) {
      if (!savedAddress) {
        toast.error("No saved address found.");
        return;
      }
      deliveryAddress = savedAddress.address || "";
      phone = savedAddress.phone || "";
      place = savedAddress.place || "";
      postalCode = savedAddress.postalCode || "";
    } else {
      const { street, city, state, zipCode, phone: newPhone } = newAddress;
      if (!street || !city || !state || !zipCode || !newPhone) {
        toast.error("Incomplete address fields!");
        return;
      }
      deliveryAddress = `${street}, ${city}, ${state}`;
      phone = newPhone;
      place = city;
      postalCode = zipCode;
    }

    try {
      setPlacingOrder(true);
      
      // We pass an empty body {} because the Backend now handles all fee 
      // calculations and total price logic internally to ensure DB integrity.
      const res = await axios.post(
        `${API_BASE_URL}/orders/place/${user.id}`,
        {}, 
        { 
          params: { 
            deliveryAddress, 
            phone, 
            place, 
            postalCode 
          } 
        }
      );

      if (res.status === 200) {
        toast.success("Order Signal Received! 🎉");
        navigate("/order-success");
      }
    } catch (error) {
      toast.error("Terminal Error: Order failed.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col justify-center items-center ${isDarkMode ? "bg-[#0b0f1a]" : "bg-white"}`}>
      <Loader2 className="animate-spin w-12 h-12 text-orange-500 mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-orange-500">Initializing Checkout...</span>
    </div>
  );

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + DELIVERY_FEE + PLATFORM_FEE;

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${isDarkMode ? "bg-[#0b0f1a] text-white" : "bg-gray-50 text-gray-900"}`}>
      
      {/* --- Header --- */}
      <div className={`sticky top-0 z-30 py-6 border-b backdrop-blur-md ${isDarkMode ? "bg-[#0b0f1a]/80 border-white/5" : "bg-white/80 border-gray-200"}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between mt-18">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100">
            <ArrowLeft size={16} /> Edit Cart
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Finalize Order</h1>
            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.3em]">Encrypted Session</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
            <ShieldCheck size={14} /> Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-gray-500">Order Verification</h2>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className={`flex items-center p-4 rounded-[2rem] border transition-all ${isDarkMode ? "bg-[#161b29] border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
                  <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden mr-4 bg-gray-100 flex-shrink-0">
                    <img src={getImageUrl(item.foodImage)} alt={item.foodName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-black italic tracking-tighter leading-none">{item.foodName}</h3>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-2">{item.quantity} Unit(s)</p>
                  </div>
                  <div className="text-right font-black italic tracking-tighter text-lg">
                    {formatPrice(item.totalPrice ?? (item.priceAtAddition || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? "bg-[#161b29] border-white/5 shadow-2xl" : "bg-white border-gray-100 shadow-xl shadow-gray-200/40"}`}>
            <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 mb-6 uppercase">
              <MapPin size={22} className="text-orange-500" /> Delivery Target
            </h2>
            <div className="flex gap-4 mb-8">
              <button onClick={() => setUseSavedAddress(true)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${useSavedAddress ? "bg-orange-500 border-orange-500 text-white" : "border-white/10 opacity-50"}`}>
                Saved Profile
              </button>
              <button onClick={() => setUseSavedAddress(false)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${!useSavedAddress ? "bg-orange-500 border-orange-500 text-white" : "border-white/10 opacity-50"}`}>
                Manual Entry
              </button>
            </div>

            {useSavedAddress && savedAddress ? (
              <div className={`p-6 rounded-[1.5rem] border-2 border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-orange-50 border-orange-200"}`}>
                <div className="flex justify-between items-start mb-4">
                    <p className="text-lg font-black italic tracking-tighter leading-none uppercase">{savedAddress.fullName}</p>
                    <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase">Default</span>
                </div>
                <p className="text-xs font-medium opacity-70 leading-relaxed mb-4">{savedAddress.address}, {savedAddress.place} - {savedAddress.postalCode}</p>
                <p className="text-xs font-black flex items-center gap-2 tracking-widest"><Phone size={12} className="text-orange-500" /> {savedAddress.phone}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["street", "city", "state", "zipCode", "phone"].map((key) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={key.toUpperCase()}
                    value={newAddress[key]}
                    onChange={(e) => setNewAddress({ ...newAddress, [key]: e.target.value })}
                    className={`p-4 rounded-xl text-xs font-bold tracking-widest outline-none border transition-all ${isDarkMode ? "bg-[#0b0f1a] border-white/10 focus:border-orange-500" : "bg-gray-50 border-gray-200 focus:border-orange-500"} ${key === "phone" ? "md:col-span-2" : ""}`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5">
            <div className={`p-10 rounded-[3rem] sticky top-32 border ${isDarkMode ? "bg-[#1c2231] border-white/5 shadow-2xl" : "bg-white border-gray-100 shadow-2xl shadow-gray-200/50"}`}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-gray-500 text-center">Checkout Terminal</h2>
                
                <div className="space-y-5 mb-8">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60">
                        <span>Items Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60">
                        <span>Delivery Network</span>
                        <span className="text-orange-500">{formatPrice(DELIVERY_FEE)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60">
                        <span>Platform Surcharge</span>
                        <span>{formatPrice(PLATFORM_FEE)}</span>
                    </div>
                </div>

                <div className="border-t border-b border-dashed border-white/10 py-6 mb-8 flex justify-between items-center">
                    <span className="text-lg font-black italic tracking-tighter uppercase">Total Payable</span>
                    <span className="text-4xl font-black italic tracking-tighter text-orange-500">{formatPrice(grandTotal)}</span>
                </div>

                <div className={`p-4 rounded-2xl border mb-10 flex items-center justify-between ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Payment Method</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">COD ONLY</span>
                </div>

                <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-orange-500/30 active:scale-95 disabled:opacity-50"
                >
                    {placingOrder ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <><Zap size={20} className="fill-white" /> PLACE SIGNAL ORDER</>
                    )}
                </button>
                
                <p className="text-[8px] font-bold text-center mt-6 opacity-40 uppercase tracking-[0.2em] leading-relaxed">
                    By placing this order, you agree to our <br/> Startup Terms & Cloud Delivery Policy.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}