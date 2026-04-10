import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const aqiApi = {
  verifyGoogleAuth: (payload) => api.post("/auth/google/verify", payload),
  fetchComplaintMeta: () => api.get("/complaints/meta"),
  fetchComplaintStats: (params) => api.get("/complaints/stats", { params }),
  fetchNearbyStation: (params) => api.get("/stations/nearby", { params }),
  fetchHeatmapStations: (params) => api.get("/stations/heatmap", { params }),
  fetchCityComparison: (params) => api.get("/cities/compare", { params }),
  submitComplaint: (formData, token) =>
    api.post("/complaints", formData, authHeaders(token)),
};

export default api;
