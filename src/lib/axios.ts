import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getAuthToken, clearAuth } from "../store/auth";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!apiBaseUrl) {
  console.warn("⚠️ VITE_API_BASE_URL is not set. API calls will fail until configured.");
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl || "http://localhost:5004/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor - Log requests and add auth token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getAuthToken();

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`📤 [${new Date().toISOString()}] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        hasAuth: !!token,
      });
    }

    if (token && config.headers) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Log responses and handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ [${new Date().toISOString()}] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Log error responses
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      
      if (import.meta.env.DEV) {
        console.error(`❌ [${new Date().toISOString()}] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${status}`, {
          status,
          message,
          data: error.response.data,
        });
      }

      // Handle 401 - Unauthorized
      if (status === 401) {
        clearAuth();
        // Only redirect if not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("❌ Network error - No response received:", error.request);
    } else {
      // Something else happened
      console.error("❌ Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Export as 'api' for convenience
export const api = apiClient;


