import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  // ⏳ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Logged in but not allowed for this route
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authorized access
  return children;
}
