/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { CheckCircle2, Receipt, ArrowRight, Home, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../../context/ThemeContext";

const API_BASE_URL = "http://localhost:8080/api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [latestOrder, setLatestOrder] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders/user/${user.id}`);
        // Get the last order from the list
        if (res.data && res.data.length > 0) {
          setLatestOrder(res.data[res.data.length - 1]);
        }
      } catch (error) {
        console.error("Receipt sync failed");
      }
    };
    fetchLatestOrder();

    // Optional: Keep your auto-redirect but extend it to 10s so they can read the invoice
    const timer = setTimeout(() => {
      // navigate("/customer/orders");
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate, user.id]);

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-10 transition-colors duration-500 ${isDarkMode ? "bg-[#0b0f1a]" : "bg-gray-50"}`}>
      
      {/* Success Animation Header */}
      <div className="mb-8 text-center">
        <div className="relative inline-block">
            <CheckCircle2 size={80} className="text-orange-500 animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-orange-500/20 rounded-full -z-10"></div>
        </div>
        <h1 className={`text-4xl font-black italic tracking-tighter uppercase mt-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Order Signal Confirmed
        </h1>
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-2">Transaction Finalized</p>
      </div>

      {/* Digital Receipt Card */}
      {latestOrder && (
        <div className={`w-full max-w-md rounded-[2.5rem] p-8 border mb-8 ${isDarkMode ? "bg-[#161b29] border-white/5 shadow-2xl" : "bg-white border-gray-100 shadow-xl"}`}>
          <div className="flex justify-between items-center mb-6 border-b border-dashed border-gray-500/20 pb-4">
            <div className="flex items-center gap-2">
                <Receipt size={16} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Digital Invoice</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">#{latestOrder.id}</span>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {latestOrder.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-sm font-bold opacity-80">{item.quantity}x {item.foodName}</span>
                <span className="text-sm font-black italic">{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Fee Breakdown (The part we fixed!) */}
          <div className={`space-y-2 pt-4 border-t ${isDarkMode ? "border-white/5" : "border-gray-50"}`}>
            <div className="flex justify-between text-[10px] font-black uppercase opacity-50">
              <span>Delivery Fee</span>
              <span>{formatPrice(latestOrder.deliveryFee || 30)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase opacity-50">
              <span>Platform Fee</span>
              <span>{formatPrice(latestOrder.platformFee || 5)}</span>
            </div>
            <div className="flex justify-between text-xl font-black italic tracking-tighter mt-4 text-orange-500">
              <span className="uppercase">Grand Total</span>
              <span>{formatPrice(latestOrder.totalPrice)}</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-center">
             <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Method: Cash on Delivery</p>
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => navigate("/customer/orders")}
          className="flex-1 bg-orange-500 text-black font-black py-4 rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
        >
          Track My Order <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate("/")}
          className={`flex-1 font-black py-4 rounded-2xl transition-all border flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-900"}`}
        >
          <Home size={14} /> Back to Hub
        </button>
      </div>

      <p className="text-[8px] font-bold text-gray-500 mt-8 uppercase tracking-[0.3em]">
        Redirecting to dashboard in 10 seconds...
      </p>
    </div>
  );
}