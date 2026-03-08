import api from "./api";

// Profile
export const getMyDeliveryProfile = () =>
  api.get("/delivery/me");

// Online / Offline
export const goOnline = () =>
  api.put("/delivery/online");

export const goOffline = () =>
  api.put("/delivery/offline");

// Orders
export const getActiveOrders = () =>
  api.get("/delivery/orders/active");

export const updateDeliveryStatus = (orderId, status) =>
  api.put(`/delivery/orders/${orderId}/status?status=${status}`);

export const getDeliveryHistory = () =>
  api.get("/delivery/orders/history");

// ✅ FIXED: Matches your @PostMapping("/orders/{orderId}/accept")
export const acceptOrder = (orderId) =>
  api.post(`/delivery/orders/${orderId}/accept`); 

