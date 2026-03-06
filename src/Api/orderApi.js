// 📁 src/Api/orderApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/orders";

// ✅ Attach JWT token if available
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ✅ Place new order
export const placeOrder = (userId, orderData) =>
  axios.post(`${API_BASE_URL}/place/${userId}`, orderData, {
    headers: getAuthHeaders(),
  });

// ✅ Get orders for a specific customer
export const getOrdersByCustomer = (customerId) =>
  axios.get(`${API_BASE_URL}/customer/${customerId}`, {
    headers: getAuthHeaders(),
  });
