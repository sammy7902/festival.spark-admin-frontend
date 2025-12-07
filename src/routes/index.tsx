import React from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Earnings } from "../pages/Earnings";
import { GenerateBill } from "../pages/GenerateBill";
import { Categories } from "../pages/Categories";
import { Subcategories } from "../pages/Subcategories";
import { Items } from "../pages/Items";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { AppLayout } from "../components/layout/AppLayout";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthGuard();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="generate-bill" element={<GenerateBill />} />
        <Route path="categories" element={<Categories />} />
        <Route path="subcategories" element={<Subcategories />} />
        <Route path="items" element={<Items />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </RouterRoutes>
  );
};


