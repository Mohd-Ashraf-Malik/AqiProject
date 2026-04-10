// api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;

    // prevent infinite loop
    if (error.response?.status === 401 && error.response?.data?.message === "Unauthorized request" && !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        await api.post("/api/user/refresh-token");
        return api(originalRequest);

      } catch (refreshError) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
export default api;