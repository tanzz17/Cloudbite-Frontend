/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

// 🔹 Create context
export const AuthContext = createContext(null);

// 🔹 Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// 🔹 Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ======================================================
  // ✅ RESTORE SESSION (IMPROVED)
  // ======================================================
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const isPublicPage = [
          "/",
          "/login",
          "/register",
          "/send-otp",
          "/verify-otp",
          "/forgot-password",
        ].includes(location.pathname);

        if (isPublicPage) {
          redirectByRole(parsedUser.role);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        localStorage.clear();
      }
    }

    setLoading(false);
  }, [location.pathname]);

  // ======================================================
  // 🔁 ROLE BASED REDIRECT (REUSABLE)
  // ======================================================
  const redirectByRole = (role) => {
    switch (role) {
      case "ROLE_ADMIN":
        navigate("/admin/dashboard", { replace: true });
        break;
      case "ROLE_KITCHEN_OWNER":
        navigate("/kitchen/dashboard", { replace: true });
        break;
      case "ROLE_DELIVERY_PARTNER":
        navigate("/delivery/dashboard", { replace: true });
        break;
      case "ROLE_CUSTOMER":
          navigate("/", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  };

  // ======================================================
  // ✅ LOGIN
  // ======================================================
  const login = (authData) => {
    try {
      const { jwtToken, user } = authData;

      if (!jwtToken || !user?.role) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("jwt", jwtToken);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success("Login successful");
      redirectByRole(user.role);
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    }
  };

  // ======================================================
  // ✅ LOGOUT
  // ======================================================
  const logout = () => {
    localStorage.clear();
    setUser(null);
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  // ======================================================
  // ⏳ LOADING SCREEN
  // ======================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <h2 className="text-lg font-semibold animate-pulse">Loading...</h2>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
