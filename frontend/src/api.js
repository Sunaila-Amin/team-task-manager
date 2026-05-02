import axios from "axios";

function resolveApiBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  // Use PROD (set by vite build), not DEV — misconfigured builders / env can leave
  // DEV truthy or bake VITE_API_URL=localhost, causing ERR_CONNECTION_REFUSED in prod.
  if (import.meta.env.PROD) {
    if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
      return envUrl.replace(/\/$/, "");
    }
    return "/api";
  }
  return envUrl || "http://localhost:5000/api";
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
