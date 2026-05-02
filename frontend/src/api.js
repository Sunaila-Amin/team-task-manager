import axios from "axios";

function resolveApiBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) {
    return envUrl || "http://localhost:5000/api";
  }
  // Production bundle: never use localhost — Railway often sets VITE_API_URL from
  // .env.example at build time, which breaks login/signup in the user's browser.
  if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }
  return "/api";
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
