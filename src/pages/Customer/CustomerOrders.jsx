import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Package, Calendar, ChevronRight } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { connectOrderSocket, disconnectSocket } from "../../socket";

const API_BASE = "http://localhost:8080/api/orders";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);

const getStatusClasses = (status) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
    case "CONFIRMED": return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "READY_FOR_PICKUP": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    case "ON_THE_WAY": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    case "DELIVERED": return "bg-green-500/10 text-green-500 border border-green-500/20";
    case "CANCELLED": return "bg-red-500/10 text-red-500 border border-red-500/20";
    default: return "bg-gray-500/10 text-gray-400";
  }
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      const res = await axios.get(`${API_BASE}/user/${user.id}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    orders.forEach((order) => {
      connectOrderSocket(order.orderId, (event) => {
        setOrders((prev) =>
          prev.map((o) => o.orderId === event.orderId ? { ...o, orderStatus: event.status } : o)
        );
        toast.success(`Order #${event.orderId} status: ${event.status.replaceAll("_", " ")}`);
      });
    });
    return () => disconnectSocket();
  }, [orders]);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="animate-spin mb-4 text-orange-500" size={32} />
        <p className="text-xs font-black uppercase tracking-widest opacity-50">Syncing with Kitchen...</p>
      </div>
    );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 opacity-80">Track Progress</h2>
          <h1 className={`text-4xl font-black tracking-tighter mt-1 italic ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            MY <span className="text-orange-500">ORDERS.</span>
          </h1>
        </div>
        <div className={`text-xs font-bold uppercase tracking-widest opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          {orders.length} orders found
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto text-orange-500 opacity-10 mb-4" />
            <p className="font-black uppercase tracking-widest text-sm opacity-40">No history found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className={`group relative overflow-hidden p-6 md:p-8 rounded-[2.5rem] transition-all duration-500 hover:translate-x-2 ${isDarkMode ? "bg-[#1c2231] hover:bg-[#252b3d] border border-white/5" : "bg-white hover:shadow-2xl border border-gray-100"}`}>
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>{order.kitchenName}</h3>
                  <div className="flex items-center gap-4 mt-2">
                     <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                       <Calendar size={12} className="mr-1 text-orange-500" />
                       {new Date(order.orderDate).toLocaleDateString()}
                     </span>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">#{order.orderId}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusClasses(order.orderStatus)}`}>{order.orderStatus.replaceAll("_", " ")}</span>
                   <span className="mt-2 text-xl font-black text-orange-500 italic">{formatPrice(order.totalPrice)}</span>
                   {/* MODIFIED: Label for transparency */}
                   <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-1">Total Paid (Incl. Fees)</span>
                </div>
              </div>

              <div className={`space-y-3 pt-4 border-t ${isDarkMode ? "border-white/5" : "border-gray-50"}`}>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                       <span className={`text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{item.foodName}</span>
                    </div>
                    <span className={`text-xs font-black tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{item.quantity} × {formatPrice(item.unitPrice)}</span>
                  </div>
                ))}
                
                {/* MODIFIED: Visual fee breakdown for customer */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-500/20 opacity-60">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Delivery & Service Charges</span>
                    <span className="text-[10px] font-black">{formatPrice(35)}</span>
                </div>
              </div>

              <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-orange-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}