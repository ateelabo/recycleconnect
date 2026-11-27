(() => {
  const config = window.RECYCLECONNECT_CONFIG || {};
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const localApiUrl = isLocalDevelopment
    ? localStorage.getItem("recycleconnect_api_url")
    : "";
  const API_BASE = (config.apiBaseUrl || window.RECYCLECONNECT_API_URL ||
    localApiUrl || "https://recycleconnect-api-2gmy.onrender.com").replace(/\/$/, "");
  const GOOGLE_CLIENT_ID = config.googleClientId || window.RECYCLECONNECT_GOOGLE_CLIENT_ID || "";

  async function request(path, options = {}) {
    const token = localStorage.getItem("recycleconnect_token");
    const response = await fetch(API_BASE + "/v1" + path, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(options.headers || {})
      }
    });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Request failed (" + response.status + ")");
    return data;
  }

  function saveSession(data) {
    const user = data.user || {};
    const role = user.role || "";
    const session = {
      authenticated: true, token: data.token, userId: user.id, role,
      name: user.full_name || "", email: user.email || "", user
    };
    localStorage.setItem("recycleconnect_token", data.token);
    localStorage.setItem("recycleconnect_session", JSON.stringify(session));
    localStorage.setItem("recycleconnect_user", JSON.stringify({
      id: user.id, name: user.full_name || "", email: user.email || "", role
    }));
    localStorage.setItem("recycleconnect_profile", JSON.stringify({
      fullName: user.full_name || "", email: user.email || "", phone: user.phone || "",
      street: user.address || "", address: user.address || "", interval: user.pickup_interval || "WEEKLY",
      materials: user.usual_materials || []
    }));
    localStorage.setItem("recycleconnect_role", role.toLowerCase());
    return session;
  }

  function roleCode(value) {
    const normalized = String(value || "").toUpperCase();
    return ["HOUSEHOLD", "ESTATE", "COLLECTOR"].includes(normalized) ? normalized : "";
  }

  const api = {
    baseUrl: API_BASE,
    googleClientId: GOOGLE_CLIENT_ID,
    health: async () => {
      const response = await fetch(API_BASE + "/health");
      if (!response.ok) throw new Error("Backend health check failed (" + response.status + ")");
      return response.json();
    },
    request,
    session: () => JSON.parse(localStorage.getItem("recycleconnect_session") || "{}"),
    signOut() {
      ["recycleconnect_token", "recycleconnect_session", "recycleconnect_user", "recycleconnect_role"]
        .forEach((key) => localStorage.removeItem(key));
    },
    async signInWithGoogle(idToken, role) {
      const selectedRole = roleCode(role);
      const data = await request("/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: idToken, ...(selectedRole ? { role: selectedRole } : {}) })
      });
      return { ...data, session: saveSession(data) };
    },
    auth: {
      async signup(details) {
        const data = await request("/auth/signup", {
          method: "POST", body: JSON.stringify(details)
        });
        return { ...data, session: saveSession(data) };
      },
      async login(identity, password) {
        const data = await request("/auth/login", {
          method: "POST", body: JSON.stringify({ identity, password })
        });
        return { ...data, session: saveSession(data) };
      },
      verifyOtp: (phone, otp) => request("/auth/otp/verify", {
        method: "POST", body: JSON.stringify({ phone, otp })
      })
    },
    users: {
      getProfile: () => request("/users/profile"),
      profile: (profile) => request("/users/profile", {
        method: "PATCH", body: JSON.stringify(profile)
      }),
      uploadProfileImage: (file) => request("/users/profile/avatar", {
        method: "PUT", body: file,
        headers: { "Content-Type": file.type }
      }),
      onboarding: (profile) => request("/users/onboarding", {
        method: "PATCH", body: JSON.stringify(profile)
      }),
      pause: (isPaused) => request("/users/pause-toggle", {
        method: "PATCH", body: JSON.stringify({ is_paused: isPaused })
      })
    },
    rates: { list: () => request("/rates") },
    pickups: {
      dashboard: () => request("/pickups/dashboard"),
      oneOff: (materials, scheduledDate, photoUrl) => request("/pickups/one-off", {
        method: "POST",
        body: JSON.stringify({ materials, scheduled_date: scheduledDate, load_photo_url: photoUrl })
      }),
      skip: (id) => request("/pickups/" + encodeURIComponent(id) + "/skip", { method: "PATCH" }),
      confirm: (id, action, reason) => request("/pickups/" + encodeURIComponent(id) + "/confirm", {
        method: "POST", body: JSON.stringify({ action, ...(reason ? { reason } : {}) })
      })
    },
    collectors: {
      submitKyc: (details) => request("/collectors/kyc", {
        method: "POST", body: JSON.stringify(details)
      }),
      mapPins: (date) => request("/collector/map-pins" + (date ? "?date=" + encodeURIComponent(date) : "")),
      updatePickupStatus: (id, status) => request("/collector/pickups/" + encodeURIComponent(id) + "/status", {
        method: "PATCH", body: JSON.stringify({ status })
      }),
      weighPickup: (id, payload) => request("/collector/pickups/" + encodeURIComponent(id) + "/weigh", {
        method: "POST", body: JSON.stringify(payload)
      })
    },
    admin: {
      updateRates: (rates) => request("/admin/rates", {
        method: "PATCH", body: JSON.stringify({ rates })
      }),
      pendingCollectors: () => request("/admin/collectors/pending"),
      verifyCollector: (id, action) => request("/admin/collectors/" + encodeURIComponent(id) + "/verify", {
        method: "PATCH", body: JSON.stringify({ action })
      }),
      overview: () => request("/admin/overview"),
      disputes: () => request("/admin/disputes"),
      resolveDispute: (id, action, adjustedPayout) => request("/admin/disputes/" + encodeURIComponent(id) + "/resolve", {
        method: "PATCH",
        body: JSON.stringify({ action, ...(adjustedPayout === undefined ? {} : { adjusted_payout: adjustedPayout }) })
      })
    }
  };
  window.RecycleConnectAPI = api;
})();
