(() => {
  const api = window.RecycleConnectAPI;
  const page = location.pathname.split("/").pop();
  const $ = (id) => document.getElementById(id);
  const session = () => api.session();
  const show = (element, message, error = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("text-red-600", error);
  };
  const photoToDataUrl = async (file) => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.72, 0.58, 0.44, 0.32]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;
      if (blob.size > 70 * 1024) continue;
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read the compressed image."));
        reader.readAsDataURL(blob);
      });
    }
    throw new Error("This photo is too large to send to the backend. Choose a smaller image.");
  };
  const redirectAfterGoogle = async (message, role) => {
    const selectedRole = role || localStorage.getItem("recycleconnect_role") || "";
    if (!selectedRole) {
      location.href = "./role-selection.html";
      return;
    }
    window.startRecycleConnectGoogleSignIn(message, selectedRole);
  };

  if (page === "role-selection.html") {
    document.querySelectorAll("[data-role]").forEach((button) => {
      if (button.dataset.role.toLowerCase() === "admin") {
        button.dataset.role = "Estate";
        button.textContent = "Estate Manager";
      }
    });
  }

  if (page === "auth-choice.html") {
    const role = new URLSearchParams(location.search).get("role") || "";
    const message = $("selected-role");
    document.querySelectorAll('a[href="./login.html"], a[href="./signup.html"]').forEach((link) => {
      if (role) link.href += "?role=" + encodeURIComponent(role);
    });
    const button = $("google-signin");
    button?.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      redirectAfterGoogle(message, role);
    }, true);
  }

  if (page === "login.html") {
    const role = new URLSearchParams(location.search).get("role") || "";
    const form = $("login-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const message = $("login-message");
      try {
        show(message, "Signing in…");
        const result = await api.auth.login($("identity").value.trim(), $("password").value);
        if (result.session.role === "COLLECTOR") {
          location.href = "./collector-dashboard.html";
          return;
        }
        if (result.session.role === "ADMIN") {
          location.href = "./admin-dashboard.html";
          return;
        }
        if (!["HOUSEHOLD", "ESTATE"].includes(result.session.role)) throw new Error("This account role is not supported by the frontend.");
        if (!result.session.user?.address) {
          location.href = "./household-onboarding.html?role=" + result.session.role.toLowerCase();
          return;
        }
        location.href = "./household-dashboard.html";
      } catch (error) { show(message, error.message, true); }
    }, true);
    $("google-button")?.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      redirectAfterGoogle($("login-message"), role);
    }, true);
  }

  if (page === "signup.html") {
    const params = new URLSearchParams(location.search);
    const role = params.get("role") || "";
    if (!role) {
      location.replace("./role-selection.html");
      return;
    }
    if ($("role-label")) $("role-label").textContent = "Account type: " + role;
    const loginLink = $("login-link");
    if (loginLink) loginLink.href = "./login.html?role=" + encodeURIComponent(role);
    const form = $("signup-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const message = $("signup-message");
      const password = $("password").value;
      if (password !== $("confirm-password").value) {
        show(message, "The passwords do not match.", true);
        return;
      }
      if (password.length < 8) {
        show(message, "Use a password with at least 8 characters.", true);
        return;
      }
      try {
        show(message, "Creating your account…");
        const result = await api.auth.signup({
          full_name: $("fullname").value.trim(),
          email: $("email").value.trim(),
          phone: $("phone").value.trim(),
          password,
          role: role.toUpperCase()
        });
        if (result.session.role === "COLLECTOR") {
          location.href = "./collector-dashboard.html";
          return;
        }
        location.href = "./household-onboarding.html?role=" + result.session.role.toLowerCase();
      } catch (error) { show(message, error.message, true); }
    }, true);
    $("google-signup")?.addEventListener("click", () => redirectAfterGoogle($("signup-message"), role));
  }

  if (page === "household-onboarding.html") {
    const params = new URLSearchParams(location.search);
    const role = (params.get("role") || localStorage.getItem("recycleconnect_role") || "household").toLowerCase();
    const form = $("onboarding-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const message = $("form-message");
      if (!session().authenticated) { show(message, "Sign in before saving your pickup address.", true); return; }
      const interval = document.querySelector('input[name="interval"]:checked');
      if (!interval) { show(message, "Please choose a collection interval.", true); return; }
      const street = $("street").value.trim();
      const city = $("city").value.trim();
      const landmark = $("landmark").value.trim();
      const position = JSON.parse(localStorage.getItem("recycleconnect_coordinates") || "null");
      const address = [street, city, landmark].filter(Boolean).join(", ");
      const profile = {
        fullName: session().name || "", email: session().email || "", role,
        street, city, landmark, postalCode: $("postal-code").value.trim(),
        interval: interval.value, address
      };
      try {
        show(message, "Saving your address…");
        await api.users.onboarding({
          full_name: profile.fullName, address, phone: session().user?.phone || null,
          pickup_interval: role === "estate" || interval.value === "weekly" ? "WEEKLY" : "BIWEEKLY",
          usual_materials: ["PET", "CANS", "CARTONS", "GLASS"],
          lat: position?.lat ?? null, lng: position?.lng ?? null
        });
        localStorage.setItem("recycleconnect_profile", JSON.stringify(profile));
        show(message, "Address and pickup schedule saved.");
        location.href = "./household-dashboard.html";
      } catch (error) { show(message, error.message, true); }
    }, true);
    $("location-button")?.addEventListener("click", (event) => {
      event.stopImmediatePropagation();
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        localStorage.setItem("recycleconnect_coordinates", JSON.stringify({
          lat: pos.coords.latitude, lng: pos.coords.longitude
        }));
      });
    }, true);
  }

  if (page === "household-dashboard.html") {
    if ($("wallet-balance")) $("wallet-balance").textContent = "Loading…";
    if ($("wallet-points")) $("wallet-points").textContent = "Loading account…";
    if ($("history-list")) $("history-list").textContent = "Loading pickup activity…";
    const initialRatesTitle = Array.from(document.querySelectorAll("h2")).find((h) => h.textContent.trim() === "Material Rate Card");
    const initialRates = initialRatesTitle?.closest("section")?.querySelector(".mt-5.grid");
    if (initialRates) initialRates.replaceChildren();
    const initialRateBadge = initialRatesTitle?.parentElement?.querySelector("span");
    if (initialRateBadge) initialRateBadge.textContent = "LOADING";
    const earliestPickup = new Date();
    earliestPickup.setDate(earliestPickup.getDate() + 1);
    const earliestLocal = new Date(earliestPickup.getTime() - earliestPickup.getTimezoneOffset() * 60000);
    if ($("oneoff-date")) $("oneoff-date").min = earliestLocal.toISOString().slice(0, 10);
    const statusText = (status) => ({
      SCHEDULED: "Scheduled", EN_ROUTE: "Collector en route", ARRIVED: "Collector arrived",
      COMPLETED: "Completed", DISPUTED: "Disputed", SKIPPED: "Skipped"
    }[status] || status || "No pickup scheduled");
    let dashboard = null;
    const renderDashboard = async () => {
      if (!session().authenticated) { location.replace("./login.html"); return; }
      try {
        dashboard = await api.pickups.dashboard();
        const user = session().user || {};
        const profile = JSON.parse(localStorage.getItem("recycleconnect_profile") || "{}");
        const name = session().name || user.full_name || "Member";
        if ($("greeting-name")) $("greeting-name").textContent = name.split(" ")[0];
        if ($("header-name")) $("header-name").textContent = name;
        if ($("header-role")) $("header-role").textContent = user.role === "ESTATE" ? "Estate Account" : "Household Account";
        if ($("avatar")) $("avatar").textContent = name.charAt(0).toUpperCase();
        if ($("pickup-address")) $("pickup-address").textContent = user.address || profile.address || "Add your pickup address.";
        if ($("wallet-balance")) $("wallet-balance").textContent = dashboard.wallet_balance_formatted || "₦" + Number(dashboard.wallet_balance || 0).toLocaleString("en-NG");
        if ($("wallet-points")) $("wallet-points").textContent = "Wallet credited after completed pickups";
        if ($("pickup-status")) $("pickup-status").textContent = statusText(dashboard.next_pickup?.status);
        if (dashboard.next_pickup) {
          const date = new Date(dashboard.next_pickup.scheduled_date);
          if ($("pickup-time")) $("pickup-time").textContent = date.toLocaleString("en-NG", { weekday: "long", hour: "numeric", minute: "2-digit" });
          const skip = $("cancel-pickup");
          if (skip) {
            skip.textContent = "Skip This Pickup";
            skip.disabled = dashboard.next_pickup.status !== "SCHEDULED";
          }
        }
        const ratesTitle = Array.from(document.querySelectorAll("h2")).find((h) => h.textContent.trim() === "Material Rate Card");
        const rateGrid = ratesTitle?.closest("section")?.querySelector(".mt-5.grid");
        if (rateGrid) {
          rateGrid.replaceChildren();
          const icons = { PET: "🧴", CANS: "🥫", CARTONS: "📦", GLASS: "🍾" };
          (dashboard.rates || []).forEach((rate) => {
            const card = document.createElement("div");
            card.className = "rounded-xl bg-green-50 p-4";
            const icon = document.createElement("span"); icon.className = "text-3xl"; icon.textContent = icons[rate.material] || "♻️";
            const label = document.createElement("p"); label.className = "mt-3 text-sm font-semibold"; label.textContent = rate.material;
            const amount = document.createElement("p"); amount.className = "mt-2 text-lg font-bold text-green-700";
            amount.textContent = "₦" + Number(rate.rate_per_kg).toLocaleString("en-NG") + "/kg";
            card.append(icon, label, amount); rateGrid.appendChild(card);
          });
          const rateBadge = ratesTitle.parentElement.querySelector("span");
          if (rateBadge) rateBadge.textContent = "LIVE RATES";
        }
        const history = $("history-list");
        if (history) {
          history.replaceChildren();
          (dashboard.history || []).forEach((item) => {
            const row = document.createElement("div"); row.className = "flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4";
            const title = document.createElement("span"); title.textContent = (item.pickup_type === "ONE_OFF" ? "One-off" : "Recurring") + " · " + new Date(item.scheduled_date).toLocaleDateString("en-NG");
            const state = document.createElement("span"); state.className = "text-xs font-semibold text-green-700";
            state.textContent = statusText(item.status) + (item.total_payout ? " · ₦" + Number(item.total_payout).toLocaleString("en-NG") : "");
            row.append(title, state); history.appendChild(row);
          });
          if (!dashboard.history?.length) history.textContent = "No pickup activity yet.";
        }
        const pause = $("pause-toggle");
        if (pause) {
          pause.dataset.paused = String(dashboard.is_paused);
          pause.textContent = dashboard.is_paused ? "Resume Pickups" : "Pause Pickups";
          if ($("pause-description")) $("pause-description").textContent = dashboard.is_paused ? "Recurring pickups are paused." : "Your regular pickup schedule is active.";
        }
        const awaiting = (dashboard.history || []).find((item) => item.confirmation_status === "PENDING");
        if ($("pickup-confirmation")) $("pickup-confirmation").classList.toggle("hidden", !awaiting);
        if (awaiting) {
          $("pickup-approve").onclick = async () => {
            try { await api.pickups.confirm(awaiting.id, "THUMBS_UP"); location.reload(); }
            catch (error) { alert(error.message); }
          };
          $("pickup-dispute").onclick = () => {
            $("pickup-feedback").classList.remove("hidden");
            $("submit-pickup-feedback").classList.remove("hidden");
          };
          $("submit-pickup-feedback").onclick = async () => {
            const reason = $("pickup-feedback").value.trim();
            if (!reason) { alert("Please describe the issue."); return; }
            try { await api.pickups.confirm(awaiting.id, "THUMBS_DOWN", reason); location.reload(); }
            catch (error) { alert(error.message); }
          };
        }
      } catch (error) {
        show($("pickup-notice"), error.message, true);
        if ($("wallet-balance")) $("wallet-balance").textContent = "Unavailable";
        if ($("history-list")) $("history-list").textContent = error.message;
      }
    };
    renderDashboard();
    $("pause-toggle")?.addEventListener("click", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const button = $("pause-toggle");
      try {
        const result = await api.users.pause(button.dataset.paused !== "true");
        button.dataset.paused = String(result.is_paused);
        button.textContent = result.is_paused ? "Resume Pickups" : "Pause Pickups";
        if ($("pause-description")) $("pause-description").textContent = result.is_paused ? "Recurring pickups are paused." : "Your regular pickup schedule is active.";
      } catch (error) { alert(error.message); }
    }, true);
    $("cancel-pickup")?.addEventListener("click", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!dashboard?.next_pickup || !confirm("Skip this scheduled pickup?")) return;
      try { await api.pickups.skip(dashboard.next_pickup.id); location.reload(); }
      catch (error) { alert(error.message); }
    }, true);
    $("oneoff-form")?.addEventListener("submit", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const file = $("oneoff-photo").files[0];
      const message = $("oneoff-message");
      if (!file) { show(message, "Choose a load photo first.", true); return; }
      const chosen = $("oneoff-material").value.toUpperCase();
      const materials = chosen === "MIXED" ? ["PET", "CANS", "CARTONS", "GLASS"] : [chosen];
      try {
        show(message, "Submitting pickup request…");
        const photo = await photoToDataUrl(file);
        await api.pickups.oneOff(materials, $("oneoff-date").value, photo);
        show(message, "Pickup request submitted.");
        setTimeout(() => location.reload(), 500);
      } catch (error) { show(message, error.message, true); }
    }, true);
  }

  if (page === "profile-settings.html") {
    if ($("edit-email")) {
      $("edit-email").readOnly = true;
      $("edit-email").title = "Email changes are not supported by the account API.";
    }
    $("profile-form")?.addEventListener("submit", async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const profile = JSON.parse(localStorage.getItem("recycleconnect_profile") || "{}");
      const fullName = $("edit-fullname").value.trim();
      const street = $("edit-street").value.trim();
      const city = $("edit-city").value.trim();
      const state = $("edit-state").value.trim();
      const address = [street, city, state].filter(Boolean).join(", ");
      try {
        const response = await api.users.profile({
          full_name: fullName, address, phone: $("edit-phone").value.trim() || null
        });
        const updated = { ...profile, fullName, street, city, state, address, phone: $("edit-phone").value.trim() };
        localStorage.setItem("recycleconnect_profile", JSON.stringify(updated));
        const current = session();
        current.name = fullName;
        current.user = response.user;
        localStorage.setItem("recycleconnect_session", JSON.stringify(current));
        localStorage.setItem("recycleconnect_user", JSON.stringify({
          id: response.user.id, name: fullName, email: response.user.email, role: response.user.role
        }));
        if ($("profile-name")) $("profile-name").textContent = fullName;
        if ($("profile-email")) $("profile-email").textContent = response.user.email || current.email || "";
        alert("Profile saved to your account.");
        $("edit-profile-form").classList.add("hidden");
      } catch (error) { alert(error.message); }
    }, true);
    $("logout-button")?.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (confirm("Are you sure you want to log out?")) { api.signOut(); location.href = "./auth-choice.html"; }
    }, true);
  }

  if (page === "balance-history.html" || page === "rewards.html") {
    if ($("history-naira")) $("history-naira").textContent = "Loading…";
    if ($("history-list")) $("history-list").textContent = "Loading pickup activity…";
    if ($("rewards-naira")) $("rewards-naira").textContent = "Loading…";
    if ($("rewards-history")) $("rewards-history").textContent = "Loading pickup activity…";
    const redeemButton = page === "balance-history.html" ? $("redeem-button") : $("open-redeem");
    if (redeemButton) redeemButton.disabled = true;
    api.pickups.dashboard().then((data) => {
      if (page === "balance-history.html") {
        if ($("history-points")) $("history-points").textContent = "Wallet";
        if ($("history-naira")) $("history-naira").textContent = data.wallet_balance_formatted || "₦" + Number(data.wallet_balance || 0).toLocaleString("en-NG");
      const button = $("redeem-button"); if (button) { button.disabled = true; button.title = "Redemption is not supported by the backend API"; }
        const list = $("history-list");
        if (list) {
          list.replaceChildren();
          (data.history || []).forEach((item) => {
            const row = document.createElement("article"); row.className = "rounded-xl border border-slate-200 bg-white p-4";
            row.textContent = item.status + " pickup · " + new Date(item.scheduled_date).toLocaleDateString("en-NG") + (item.total_payout ? " · ₦" + Number(item.total_payout).toLocaleString("en-NG") : "");
            list.appendChild(row);
          });
          if (!data.history?.length) list.textContent = "No pickup activity yet.";
        }
      } else {
        if ($("rewards-points")) $("rewards-points").textContent = "Points are not provided by this backend";
        if ($("rewards-naira")) $("rewards-naira").textContent = data.wallet_balance_formatted || "₦" + Number(data.wallet_balance || 0).toLocaleString("en-NG");
        const button = $("open-redeem"); if (button) { button.disabled = true; button.title = "Redemption is not supported by the backend API"; }
        const list = $("rewards-history");
        if (list) list.textContent = (data.history || []).map((item) => item.status + " pickup · " + (item.total_kg || 0) + " kg · ₦" + Number(item.total_payout || 0).toLocaleString("en-NG")).join("\n") || "No pickup activity yet.";
      }
    }).catch((error) => {
      const target = $("history-list") || $("rewards-history");
      show(target, error.message, true);
      if ($("history-naira")) $("history-naira").textContent = "Unavailable";
      if ($("rewards-naira")) $("rewards-naira").textContent = "Unavailable";
    });
  }

  if (page === "collector-dashboard.html") {
    const current = session();
    if (!current.authenticated || current.role !== "COLLECTOR") { location.replace("./login.html"); return; }
    if ($("collector-name")) $("collector-name").textContent = current.name || "Collector";
    if ($("collector-phone")) $("collector-phone").value = current.user?.phone || "";
    const notice = $("collector-notice");
    const pinList = $("collector-pins");
    const weightPanel = $("weigh-panel");
    let activePickupId = null;

    const loadPins = async () => {
      if (pinList) pinList.textContent = "Loading pickup requests…";
      try {
        const result = await api.collectors.mapPins($("pin-date")?.value || "");
        if (!pinList) return;
        pinList.replaceChildren();
        (result.pins || []).forEach((pin) => {
          const card = document.createElement("article");
          card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
          const title = document.createElement("h3"); title.className = "font-semibold";
          title.textContent = `${pin.status} · ${new Date(pin.scheduled_date).toLocaleString("en-NG")}`;
          const address = document.createElement("p"); address.className = "mt-2 text-sm text-slate-600"; address.textContent = pin.address || "No address";
          const materials = document.createElement("p"); materials.className = "mt-1 text-sm text-slate-600";
          materials.textContent = `Materials: ${(pin.materials || []).join(", ") || "Not specified"}`;
          const actions = document.createElement("div"); actions.className = "mt-4 flex flex-wrap gap-2";
          const addAction = (label, handler) => {
            const button = document.createElement("button"); button.type = "button";
            button.className = "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800";
            button.textContent = label; button.addEventListener("click", handler); actions.appendChild(button);
          };
          if (pin.status === "SCHEDULED") addAction("Start route", async () => {
            try { await api.collectors.updatePickupStatus(pin.pickup_id, "EN_ROUTE"); await loadPins(); }
            catch (error) { show(notice, error.message, true); }
          });
          if (pin.status === "EN_ROUTE") addAction("Mark arrived", async () => {
            try { await api.collectors.updatePickupStatus(pin.pickup_id, "ARRIVED"); await loadPins(); }
            catch (error) { show(notice, error.message, true); }
          });
          if (pin.status === "ARRIVED") addAction("Record weights", () => {
            activePickupId = pin.pickup_id;
            if (weightPanel) { weightPanel.classList.remove("hidden"); weightPanel.scrollIntoView({ behavior: "smooth", block: "center" }); }
          });
          card.append(title, address, materials, actions); pinList.appendChild(card);
        });
        if (!result.pins?.length) pinList.textContent = "No pickup requests are available for this date.";
        show(notice, "Pickup list updated.");
      } catch (error) {
        if (pinList) pinList.textContent = error.message;
        show(notice, error.message, true);
      }
    };

    $("collector-otp-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api.auth.verifyOtp($("collector-phone").value.trim(), $("collector-otp").value.trim());
        if (current.user) current.user.phone = $("collector-phone").value.trim();
        localStorage.setItem("recycleconnect_session", JSON.stringify(current));
        show(notice, "Phone verified. You can now submit your KYC details.");
      } catch (error) { show(notice, error.message, true); }
    });

    $("collector-kyc-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fields = ["nin-number", "id-doc-type", "id-doc-url", "live-selfie-url", "guarantor-name", "guarantor-phone", "guarantor-relationship"];
      const values = fields.map((id) => $(id)?.value.trim() || "");
      try {
        show(notice, "Submitting verification details…");
        await api.collectors.submitKyc({
          nin_number: values[0], id_doc_type: values[1], id_doc_url: values[2], live_selfie_url: values[3],
          guarantor_name: values[4], guarantor_phone: values[5], guarantor_relationship: values[6]
        });
        show(notice, "KYC submitted. An administrator must approve it before pickup actions are available.");
      } catch (error) { show(notice, error.message, true); }
    });

    $("refresh-pins")?.addEventListener("click", loadPins);
    $("pin-date")?.addEventListener("change", loadPins);
    $("collector-logout")?.addEventListener("click", () => { api.signOut(); location.href = "./auth-choice.html"; });
    $("weigh-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!activePickupId) { show(notice, "Choose an arrived pickup first.", true); return; }
      const weights = {};
      ["PET", "CANS", "CARTONS", "GLASS"].forEach((material) => {
        const value = Number($("weight-" + material)?.value || 0);
        if (value > 0) weights[material] = value;
      });
      try {
        await api.collectors.weighPickup(activePickupId, {
          householder_present: $("householder-present").checked,
          scale_photo_url: $("scale-photo-url").value.trim() || undefined,
          weights
        });
        show(notice, "Weights saved and the household wallet was credited.");
        if (weightPanel) weightPanel.classList.add("hidden");
        event.target.reset(); activePickupId = null; await loadPins();
      } catch (error) { show(notice, error.message, true); }
    });
    loadPins();
  }

  if (page === "admin-dashboard.html") {
    const current = session();
    if (!current.authenticated || current.role !== "ADMIN") { location.replace("./login.html"); return; }
    if ($("admin-name")) $("admin-name").textContent = current.name || "Administrator";
    const notice = $("admin-notice");
    const loadAdmin = async () => {
      try {
        const [overview, rates, pending, disputes] = await Promise.all([
          api.admin.overview(), api.rates.list(), api.admin.pendingCollectors(), api.admin.disputes()
        ]);
        if ($("today-pickups")) $("today-pickups").textContent = overview.today_pickups ?? "0";
        if ($("today-kg")) $("today-kg").textContent = `${Number(overview.today_kg || 0).toLocaleString("en-NG")} kg`;
        if ($("today-payouts")) $("today-payouts").textContent = overview.today_payouts_formatted || "₦0";
        (rates.rates || []).forEach((rate) => { const input = $("rate-" + rate.material); if (input) input.value = rate.rate_per_kg; });
        const collectorList = $("pending-collectors");
        if (collectorList) {
          collectorList.replaceChildren();
          (pending.pending_collectors || []).forEach((collector) => {
            const card = document.createElement("article"); card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
            const title = document.createElement("h3"); title.className = "font-semibold"; title.textContent = collector.full_name || "Collector";
            const details = document.createElement("p"); details.className = "mt-2 text-sm text-slate-600";
            details.textContent = `${collector.email || ""} · ${collector.phone || ""} · ID: ${collector.id_doc_type || ""}`;
            const actions = document.createElement("div"); actions.className = "mt-3 flex gap-2";
            ["APPROVE", "REJECT"].forEach((action) => {
              const button = document.createElement("button"); button.type = "button";
              button.className = action === "APPROVE" ? "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white" : "rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700";
              button.textContent = action === "APPROVE" ? "Approve" : "Reject";
              button.addEventListener("click", async () => {
                try { await api.admin.verifyCollector(collector.id, action); await loadAdmin(); }
                catch (error) { show(notice, error.message, true); }
              });
              actions.appendChild(button);
            });
            card.append(title, details, actions); collectorList.appendChild(card);
          });
          if (!pending.pending_collectors?.length) collectorList.textContent = "No collectors are waiting for review.";
        }
        const disputeList = $("admin-disputes");
        if (disputeList) {
          disputeList.replaceChildren();
          (disputes.disputes || []).forEach((dispute) => {
            const card = document.createElement("article"); card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
            const title = document.createElement("h3"); title.className = "font-semibold"; title.textContent = `Dispute · ${dispute.admin_resolution || "PENDING"}`;
            const summary = document.createElement("p"); summary.className = "mt-2 text-sm text-slate-600";
            summary.textContent = `${dispute.reason || "No reason provided"} · Current payout ₦${Number(dispute.total_payout || 0).toLocaleString("en-NG")}`;
            const action = document.createElement("select"); action.className = "rounded-lg border border-slate-300 p-2 text-sm";
            [["APPROVE", "Approve"], ["ADJUST", "Adjust payout"], ["SUSPEND", "Suspend collector"]].forEach(([value, label]) => action.add(new Option(label, value)));
            const amount = document.createElement("input"); amount.type = "number"; amount.min = "0"; amount.step = "1"; amount.placeholder = "Adjusted payout";
            amount.className = "w-36 rounded-lg border border-slate-300 p-2 text-sm";
            amount.classList.add("hidden"); action.addEventListener("change", () => amount.classList.toggle("hidden", action.value !== "ADJUST"));
            const button = document.createElement("button"); button.type = "button"; button.className = "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"; button.textContent = "Resolve";
            button.disabled = dispute.admin_resolution !== "PENDING";
            button.addEventListener("click", async () => {
              try {
                if (action.value === "ADJUST" && (!amount.value || !Number.isInteger(Number(amount.value)) || Number(amount.value) < 0)) {
                  show(notice, "Enter a whole-number payout of zero or more.", true);
                  return;
                }
                const adjusted = action.value === "ADJUST" ? Number(amount.value) : undefined;
                await api.admin.resolveDispute(dispute.id, action.value, adjusted);
                show(notice, "Dispute resolved."); await loadAdmin();
              } catch (error) { show(notice, error.message, true); }
            });
            card.append(title, summary, action, amount, button); disputeList.appendChild(card);
          });
          if (!disputes.disputes?.length) disputeList.textContent = "No disputes have been recorded.";
        }
        show(notice, "Admin data refreshed.");
      } catch (error) { show(notice, error.message, true); }
    };
    $("rates-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const rates = ["PET", "CANS", "CARTONS", "GLASS"].map((material) => ({
        material, rate_per_kg: Number($("rate-" + material)?.value)
      }));
      try { await api.admin.updateRates(rates); show(notice, "Rates saved."); await loadAdmin(); }
      catch (error) { show(notice, error.message, true); }
    });
    $("admin-refresh")?.addEventListener("click", loadAdmin);
    $("admin-logout")?.addEventListener("click", () => { api.signOut(); location.href = "./auth-choice.html"; });
    loadAdmin();
  }
})();
