(() => {
  const api = window.RecycleConnectAPI;
  const page = location.pathname.split("/").pop();
  const $ = (id) => document.getElementById(id);
  const session = api.session();
  const statusLabel = (status) => ({
    SCHEDULED: "Scheduled", EN_ROUTE: "Collector en route", ARRIVED: "Collector arrived",
    COMPLETED: "Completed", DISPUTED: "Disputed", SKIPPED: "Skipped"
  }[status] || status || "Status unavailable");
  const money = (value) => "₦" + Number(value || 0).toLocaleString("en-NG");
  const dateText = (value) => value ? new Date(value).toLocaleString("en-NG", {
    weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
  }) : "Not scheduled";
  const notice = (id, message, error = false) => {
    const node = $(id);
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("text-red-700", error);
    node.classList.toggle("text-red-600", error);
  };
  const requireRole = (...roles) => {
    if (!session.authenticated || !roles.includes(session.role)) {
      location.replace("./login.html?role=" + encodeURIComponent(roles[0] === "COLLECTOR" ? "Collector" : "Household"));
      return false;
    }
    return true;
  };
  const infoRow = (label, value) => {
    const row = document.createElement("div"); row.className = "rc-info-row";
    const caption = document.createElement("span"); caption.textContent = label;
    const data = document.createElement("strong"); data.textContent = value;
    row.append(caption, data); return row;
  };
  const noticeBox = (message) => {
    const box = document.createElement("p"); box.className = "rc-small-note"; box.textContent = message; return box;
  };

  if (page === "collector-home-dashboard.html") {
    if (!requireRole("COLLECTOR")) return;
    const pinsNode = $("collector-pickups");
    const ratesNode = $("collector-rates");
    const metricsNode = $("collector-metrics");
    const greeting = $("collector-greeting");
    if (greeting) greeting.textContent = `Hi, ${(session.name || "Collector").split(" ")[0]} · Your live pickup queue`;
    const load = async () => {
      if (pinsNode) pinsNode.textContent = "Loading pickup queue…";
      try {
        const [result, rateResult] = await Promise.all([api.collectors.mapPins(""), api.rates.list()]);
        const pins = result.pins || [];
        if (metricsNode) {
          metricsNode.replaceChildren();
          [[pins.length, "Open pickups"], [pins.filter((p) => p.status === "EN_ROUTE").length, "En route"],
            [pins.filter((p) => p.status === "ARRIVED").length, "On site"]].forEach(([value, label]) => {
            const card = document.createElement("div"); card.className = "rc-metric";
            const count = document.createElement("strong"); count.textContent = value;
            const text = document.createElement("span"); text.textContent = label;
            card.append(count, text); metricsNode.appendChild(card);
          });
        }
        if (pinsNode) {
          pinsNode.replaceChildren();
          pins.forEach((pin) => {
            const card = document.createElement("article"); card.className = "rc-card rc-soft-card";
            const title = document.createElement("h2"); title.textContent = statusLabel(pin.status);
            card.append(title, infoRow("Pickup time", dateText(pin.scheduled_date)), infoRow("Address", pin.address || "Address unavailable"),
              infoRow("Materials", (pin.materials || []).join(" · ") || "Not listed"));
            if (Number.isFinite(Number(pin.lat)) && Number.isFinite(Number(pin.lng))) {
              const map = document.createElement("a"); map.className = "rc-button secondary block small";
              map.href = `https://www.google.com/maps?q=${encodeURIComponent(`${pin.lat},${pin.lng}`)}`;
              map.target = "_blank"; map.rel = "noopener noreferrer"; map.textContent = "Open pickup location"; card.appendChild(map);
            }
            const action = document.createElement("button"); action.type = "button"; action.className = "rc-button block";
            if (pin.status === "SCHEDULED") action.textContent = "Start route";
            else if (pin.status === "EN_ROUTE") action.textContent = "Mark arrived";
            else { action.textContent = "Record weights"; action.addEventListener("click", () => { location.href = "./collector-collection-confirm.html"; }); card.appendChild(action); pinsNode.appendChild(card); return; }
            action.addEventListener("click", async () => {
              action.disabled = true;
              try {
                await api.collectors.updatePickupStatus(pin.pickup_id, pin.status === "SCHEDULED" ? "EN_ROUTE" : "ARRIVED");
                await load();
              } catch (error) { notice("collector-notice", error.message, true); action.disabled = false; }
            });
            card.appendChild(action); pinsNode.appendChild(card);
          });
          if (!pins.length) pinsNode.appendChild(noticeBox("No pickup requests are available from the backend."));
        }
        if (ratesNode) {
          ratesNode.replaceChildren();
          (rateResult.rates || []).forEach((rate) => ratesNode.appendChild(infoRow(rate.material, `${money(rate.rate_per_kg)}/kg`)));
          if (!rateResult.rates?.length) ratesNode.appendChild(noticeBox("No material rates are currently available."));
        }
        notice("collector-notice", "Pickup queue and material rates are up to date.");
      } catch (error) {
        if (pinsNode) pinsNode.textContent = error.message;
        if (ratesNode) ratesNode.textContent = "Rates unavailable.";
        notice("collector-notice", error.message || "Could not load collector data.", true);
      }
    };
    $("collector-refresh")?.addEventListener("click", load);
    load();
  }

  if (page === "collector-notification.html" || page === "collector-onsite-notification.html") {
    if (!requireRole("HOUSEHOLD", "ESTATE")) return;
    const isOnsite = page === "collector-onsite-notification.html";
    const dashboard = $("dispatch-details");
    api.pickups.dashboard().then((data) => {
      const pickup = data.next_pickup;
      const history = data.history || [];
      const pending = history.find((item) => item.confirmation_status === "PENDING");
      const latestNote = data.notifications?.[0];
      if (!pickup && !pending) {
        dashboard.replaceChildren(noticeBox("There is no active pickup or dispatch in your account."));
        notice("dispatch-notice", "No live pickup data is available."); return;
      }
      dashboard.replaceChildren();
      const current = pickup || pending;
      dashboard.append(infoRow("Pickup status", statusLabel(current.status)),
        infoRow("Scheduled", dateText(current.scheduled_date)));
      if (pickup) {
        dashboard.append(infoRow("Collector", pickup.collector_name || "Not assigned yet"),
          infoRow("Collector badge", pickup.collector_badge_id || "Not assigned yet"),
          infoRow("Pickup address", session.user?.address || "Address unavailable"));
      }
      if (pending) dashboard.append(infoRow("Collected weight", `${Number(pending.total_kg || 0).toLocaleString("en-NG")} kg`),
        infoRow("Wallet credit", money(pending.total_payout)));
      if (latestNote?.message) dashboard.append(noticeBox(`Latest update: ${latestNote.message}`));
      notice("dispatch-notice", isOnsite ? "Showing the latest pickup and weighing status from your account." : "Showing the latest dispatch data from your account.");
    }).catch((error) => {
      dashboard.replaceChildren(noticeBox(error.message || "Could not load pickup data."));
      notice("dispatch-notice", error.message || "Could not load pickup data.", true);
    });
  }

  if (page === "collection-confirm.html") {
    if (!requireRole("HOUSEHOLD", "ESTATE")) return;
    const content = $("confirmation-details");
    api.pickups.dashboard().then((data) => {
      const pickup = (data.history || []).find((item) => item.confirmation_status === "PENDING");
      if (!pickup) { content.replaceChildren(noticeBox("There is no pickup waiting for confirmation.")); $("confirmation-actions").hidden = true; return; }
      content.replaceChildren(infoRow("Pickup date", dateText(pickup.scheduled_date)),
        infoRow("Total weight", `${Number(pickup.total_kg || 0).toLocaleString("en-NG")} kg`),
        infoRow("Reward credited", money(pickup.total_payout)),
        noticeBox("Per-material weights and collector details are not included in the current dashboard API response."));
      $("confirm-pickup").addEventListener("click", async () => {
        const button = $("confirm-pickup"); button.disabled = true;
        try { await api.pickups.confirm(pickup.id, "THUMBS_UP"); location.href = "./collection-success.html"; }
        catch (error) { notice("confirmation-notice", error.message, true); button.disabled = false; }
      });
      $("dispute-pickup").addEventListener("click", () => {
        $("dispute-form").hidden = false;
      });
      $("submit-dispute").addEventListener("click", async () => {
        const reason = $("dispute-reason").value.trim();
        if (!reason) { notice("confirmation-notice", "Add a short reason before submitting the dispute.", true); return; }
        try { await api.pickups.confirm(pickup.id, "THUMBS_DOWN", reason); notice("confirmation-notice", "Dispute sent for admin review."); $("confirmation-actions").hidden = true; }
        catch (error) { notice("confirmation-notice", error.message, true); }
      });
      notice("confirmation-notice", "Pickup details loaded from your account.");
    }).catch((error) => notice("confirmation-notice", error.message || "Could not load pickup confirmation.", true));
  }

  if (page === "collection-success.html") {
    if (!requireRole("HOUSEHOLD", "ESTATE")) return;
    api.pickups.dashboard().then((data) => {
      const pickup = (data.history || []).find((item) => item.confirmation_status === "THUMBS_UP");
      const content = $("success-details"); content.replaceChildren();
      if (!pickup) {
        content.appendChild(noticeBox("No confirmed pickup was found in your account yet."));
        notice("success-notice", "No confirmed pickup was returned by the backend.");
        return;
      }
      content.append(infoRow("Pickup date", dateText(pickup.scheduled_date)),
        infoRow("Total weight", `${Number(pickup.total_kg || 0).toLocaleString("en-NG")} kg`),
        infoRow("Reward credited", money(pickup.total_payout)),
        infoRow("Wallet balance", data.wallet_balance_formatted || money(data.wallet_balance)));
      notice("success-notice", "Showing the confirmed pickup recorded in your account.");
    }).catch((error) => notice("success-notice", error.message || "Could not load the confirmed pickup.", true));
  }

  if (page === "collector-collection-confirm.html") {
    if (!requireRole("COLLECTOR")) return;
    const picker = $("arrived-pickup");
    const materials = $("weight-fields");
    const form = $("weigh-confirm-form");
    let rates = [];
    Promise.all([api.collectors.mapPins(""), api.rates.list()]).then(([pinData, rateData]) => {
      const arrived = (pinData.pins || []).filter((pin) => pin.status === "ARRIVED");
      rates = rateData.rates || [];
      picker.replaceChildren(new Option("Choose an arrived pickup", ""));
      arrived.forEach((pin) => picker.add(new Option(`${pin.address || "Pickup"} · ${dateText(pin.scheduled_date)}`, pin.pickup_id)));
      materials.replaceChildren();
      rates.forEach((rate) => {
        const label = document.createElement("label"); label.className = "rc-form-label";
        label.textContent = `${rate.material} · ${money(rate.rate_per_kg)}/kg`;
        const input = document.createElement("input"); input.className = "rc-weight-input"; input.type = "number";
        input.min = "0"; input.step = "0.01"; input.value = "0"; input.dataset.material = rate.material;
        label.appendChild(input); materials.appendChild(label);
      });
      if (!arrived.length) notice("weigh-notice", "No arrived pickup is ready for weighing.");
      else notice("weigh-notice", `${arrived.length} arrived pickup${arrived.length === 1 ? "" : "s"} loaded.`);
    }).catch((error) => notice("weigh-notice", error.message || "Could not load arrived pickups and rates.", true));
    $("householder-present").addEventListener("change", (event) => { $("scale-photo-field").hidden = event.target.checked; });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const weights = {};
      materials.querySelectorAll("input[data-material]").forEach((input) => {
        const value = Number(input.value);
        if (value > 0) weights[input.dataset.material] = value;
      });
      if (!picker.value) { notice("weigh-notice", "Choose an arrived pickup first.", true); return; }
      if (!Object.keys(weights).length) { notice("weigh-notice", "Enter a weight for at least one material.", true); return; }
      if (!$("householder-present").checked && !$("scale-photo-url").value.trim()) {
        notice("weigh-notice", "A scale photo URL is required when the householder is absent.", true); return;
      }
      const submit = form.querySelector("button[type=submit]"); submit.disabled = true;
      try {
        const result = await api.collectors.weighPickup(picker.value, {
          householder_present: $("householder-present").checked,
          scale_photo_url: $("scale-photo-url").value.trim() || undefined,
          weights
        });
        notice("weigh-notice", `Saved to the database · ${Number(result.total_kg).toLocaleString("en-NG")} kg · ${result.total_payout_formatted || money(result.total_payout)} credited. The household can now confirm the pickup.`);
        form.hidden = true;
      } catch (error) { notice("weigh-notice", error.message || "Could not save weights.", true); submit.disabled = false; }
    });
  }
})();
