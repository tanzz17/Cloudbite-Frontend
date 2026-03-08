// src/Api/api.js
import axios from "axios";

// Base URL of your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT (skip for OTP endpoints)
api.interceptors.request.use(
  (config) => {
    if (
      !config.url.includes("/auth/forgot-password") &&
      !config.url.includes("/auth/reset-password")
    ) {
      const token = localStorage.getItem("jwt");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------- CUSTOMER SIGNUP (NEW) ---------------- //
export const registerCustomer = async (customerData) => {
  const response = await api.post("/auth/signup/customer", customerData);

  // ✅ Auto-login after signup
  const data = response.data;
  if (data.jwtToken) {
    localStorage.setItem("jwt", data.jwtToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

// ---------------- NORMAL USER LOGIN/SIGNUP ---------------- //
export const registerUser = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  localStorage.setItem("jwt", response.data.jwtToken);
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data;
};

export const loginUser = async (loginData) => {
  const response = await api.post("/auth/signin", loginData);
  localStorage.setItem("jwt", response.data.jwtToken);
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data;
};

// ---------------- USER PROFILE ---------------- //
export const getUserProfile = async () => {
  const userData = localStorage.getItem("user");
  if (userData) return JSON.parse(userData);
  return null;
};

export const updateUserProfile = async (updatedUser) => {
  const userId = updatedUser.id;
  const response = await api.put(`/user/update/${userId}`, updatedUser);
  return response.data;
};

// ---------------- PASSWORD RESET ---------------- //
export const sendForgotPasswordOtp = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const response = await api.post("/auth/reset-password", {
    email,
    otp,
    newPassword,
  });
  return response.data;
};

// ---------------- LOGOUT ---------------- //
export const logoutUser = () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("user");
};

export default api;
