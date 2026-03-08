// 📁 src/api/cartApi.js
import axios from "axios";

const API_BASE_URL = "cloudbite-backend-production.up.railway.app";

// ✅ Get full cart by userId
export const getCart = (userId) => axios.get(`${API_BASE_URL}/user/${userId}`);

// ✅ Add food to cart
export const addToCart = (userId, foodId, quantity = 1) =>
  axios.post(`${API_BASE_URL}/add/${userId}/${foodId}?quantity=${quantity}`);

// ✅ Remove specific item from cart
export const removeFromCart = (userId, cartItemId) =>
  axios.delete(`${API_BASE_URL}/remove/${userId}/${cartItemId}`);

// ✅ Clear all items from cart
export const clearCart = (userId) =>
  axios.delete(`${API_BASE_URL}/clear/${userId}`);

// ✅ Update quantity of a food in cart
export const updateCartItemQuantity = (userId, foodId, quantity) =>
  axios.put(`${API_BASE_URL}/update/${userId}/${foodId}?quantity=${quantity}`);
