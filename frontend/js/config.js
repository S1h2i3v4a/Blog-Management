// API Base URL Configuration
// Jab Render pe backend deploy ho jaye, tab yaha apna Render URL daal dena:
// Example: const API_BASE_URL = "https://your-backend.onrender.com";

const DEFAULT_RENDER_URL = "https://blog-management-backend.onrender.com";

const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : (localStorage.getItem("API_BASE_URL") || DEFAULT_RENDER_URL);
