import api from "./api";

// Profile
export const getMyDeliveryProfile = () =>
  api.get("/api/delivery/me");

// Online / Offline
export const goOnline = () =>
  api.put("/api/delivery/online");

export const goOffline = () =>
  api.put("/api/delivery/offline");

// Orders
export const getActiveOrders = () =>
  api.get("/api/delivery/orders/active");

export const updateDeliveryStatus = (orderId, status) =>
  api.put(`/api/delivery/orders/${orderId}/status?status=${status}`);

export const getDeliveryHistory = () =>
  api.get("/api/delivery/orders/history");

// ✅ FIXED: Matches your @PostMapping("/orders/{orderId}/accept")
export const acceptOrder = (orderId) =>
  api.post(`/api/delivery/orders/${orderId}/accept`); 

