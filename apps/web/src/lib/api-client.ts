import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3001/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Har request se pehle token attach karo
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Tenant ID bhi attach karo agar available ho
  const tenantId = localStorage.getItem("currentTenantId");
  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
  }
  return config;
});

// 401 aaye toh logout karo
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
