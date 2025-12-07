import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * ViewBill Component
 * 
 * Public route to view bills via token.
 * Redirects to backend public route to serve the PDF.
 */
export const ViewBill: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid bill link");
      setLoading(false);
      return;
    }

    // Get backend URL from environment or construct from API base URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5004/api";
    // Remove /api suffix to get base backend URL
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    
    // Construct the backend public bill URL
    const backendBillUrl = `${backendBaseUrl}/public/bill/${token}`;

    // Redirect to backend URL to serve the PDF
    // The backend will handle serving the PDF or redirecting to S3
    window.location.href = backendBillUrl;
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bill...</p>
      </div>
    </div>
  );
};

