// The public API URL is safe to expose in browser code. Override it for local development
// with window.RECYCLECONNECT_API_URL. Local storage overrides are honored only on localhost.
const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const localApiUrl = isLocalDevelopment
  ? localStorage.getItem("recycleconnect_api_url")
  : "";

window.RECYCLECONNECT_CONFIG = {
  apiBaseUrl: window.RECYCLECONNECT_API_URL ||
    localApiUrl || "https://recycleconnect-api-2gmy.onrender.com",
  googleClientId: "312905596463-gg830gbh7ao5h2lv49ntr4hlodpr2d9h.apps.googleusercontent.com"
};
