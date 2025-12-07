import React from "react";
import { Routes } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/globals.css";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ErrorBoundary>
  );
};


