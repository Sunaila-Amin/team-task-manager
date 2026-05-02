import axios from "axios";

function resolveApiBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) {
    return envUrl || "http://localhost:5000/api";
  }
  // Production: derive API URL from the page origin so we never call baked-in
  // localhost, wrong host, or http:// on an https:// page (mixed content → Network Error).
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  const safeEnv =
    envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl) ? envUrl : null;
  return safeEnv || "/api";
}

const baseURL = resolveApiBaseURL();

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
