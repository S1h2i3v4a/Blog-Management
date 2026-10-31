// API Base URL Configuration
// Linked to Render Backend
const DEFAULT_RENDER_URL = "https://blog-management-3oyx.onrender.com";

const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : (localStorage.getItem("API_BASE_URL") || DEFAULT_RENDER_URL);
