// Set these values for your environment. The API defaults to localhost for local development.
window.RECYCLECONNECT_CONFIG = {
  apiBaseUrl: window.RECYCLECONNECT_API_URL ||
    localStorage.getItem("recycleconnect_api_url") || "http://localhost:3000",
  googleClientId: "312905596463-gg830gbh7ao5h2lv49ntr4hlodpr2d9h.apps.googleusercontent.com"
};