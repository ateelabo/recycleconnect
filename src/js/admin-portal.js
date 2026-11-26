(() => {
  const api = window.RecycleConnectAPI;
  const page = location.pathname.split("/").pop();
  const $ = (id) => document.getElementById(id);
  const show = (node, message, error = false) => {
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("text-red-700", error);
  };
  const requireAdmin = () => {
    const current = api.session();
    if (!current.authenticated || current.role !== "ADMIN") {
      location.replace("../admin/");
      return false;
    }
    return true;
  };
  const signOut = () => {
    api.signOut();
    location.replace("../admin/");
  };
  const safeImageUrl = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    return /^data:image\//i.test(trimmed) || /^https?:\/\//i.test(trimmed) ? trimmed : "";
  };
  const addImagePanel = (parent, title, value) => {
    const section = document.createElement("section");
    section.className = "rounded-xl border border-slate-200 bg-slate-50 p-3";
    const heading = document.createElement("h4");
    heading.className = "text-sm font-semibold text-slate-800";
    heading.textContent = title;
    section.appendChild(heading);
    const url = safeImageUrl(value);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "mt-2 block overflow-hidden rounded-lg bg-slate-200";
      const image = document.createElement("img");
      image.src = url;
      image.alt = title;
      image.loading = "lazy";
      image.className = "h-56 w-full object-contain";
      link.appendChild(image);
      section.appendChild(link);
    } else {
      const note = document.createElement("p");
      note.className = "mt-2 flex h-56 items-center justify-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500";
      note.textContent = "No image was included in this submission.";
      section.appendChild(note);
    }
    parent.appendChild(section);
  };

  if (page === "admin-collectors.html") {
    if (!requireAdmin()) return;
    $("admin-logout")?.addEventListener("click", signOut);
    const notice = $("collectors-notice");
    const list = $("pending-collectors");
    const loadCollectors = async () => {
      show(notice, "Loading pending collectors…");
      try {
        const result = await api.admin.pendingCollectors();
        list.replaceChildren();
        for (const collector of result.pending_collectors || []) {
          const card = document.createElement("article");
          card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
          const head = document.createElement("div");
          head.className = "flex flex-wrap items-start justify-between gap-3";
          const identity = document.createElement("div");
          const name = document.createElement("h2");
          name.className = "text-lg font-bold text-slate-900";
          name.textContent = collector.full_name || "Collector";
          const contact = document.createElement("p");
          contact.className = "mt-1 text-sm text-slate-600";
          contact.textContent = [collector.email, collector.phone, collector.address].filter(Boolean).join(" · ");
          const idType = document.createElement("p");
          idType.className = "mt-2 text-sm font-medium text-slate-700";
          idType.textContent = `${collector.id_doc_type || "Identity document"} · NIN ${collector.nin_number || "not supplied"}`;
          identity.append(name, contact, idType);
          const status = document.createElement("span");
          status.className = "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800";
          status.textContent = "Pending review";
          head.append(identity, status);
          const comparison = document.createElement("div");
          comparison.className = "mt-4 grid gap-3 sm:grid-cols-2";
          addImagePanel(comparison, "Submitted ID document", collector.id_doc_url);
          addImagePanel(comparison, "Live selfie", collector.live_selfie_url);
          const guarantor = document.createElement("p");
          guarantor.className = "mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600";
          guarantor.textContent = `Guarantor: ${collector.guarantor_name || "—"} · ${collector.guarantor_relationship || "relationship not supplied"} · ${collector.guarantor_phone || "phone not supplied"}`;
          const actions = document.createElement("div");
          actions.className = "mt-4 flex flex-wrap gap-2";
          for (const action of ["APPROVE", "REJECT"]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = action === "APPROVE"
              ? "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              : "rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50";
            button.textContent = action === "APPROVE" ? "Approve collector" : "Reject application";
            button.addEventListener("click", async () => {
              const prompt = action === "APPROVE"
                ? `Approve ${collector.full_name || "this collector"}?`
                : `Reject the application from ${collector.full_name || "this collector"}?`;
              if (!window.confirm(prompt)) return;
              button.disabled = true;
              try {
                const response = await api.admin.verifyCollector(collector.id, action);
                show(notice, action === "APPROVE"
                  ? `Collector approved${response.badge_id ? ` · badge ${response.badge_id}` : ""}.` 
                  : "Collector application rejected.");
                await loadCollectors();
              } catch (error) {
                show(notice, error.message || "Could not update collector verification.", true);
                button.disabled = false;
              }
            });
            actions.appendChild(button);
          }
          card.append(head, comparison, guarantor, actions);
          list.appendChild(card);
        }
        if (!result.pending_collectors?.length) show(notice, "No collectors are waiting for review.");
        else show(notice, `${result.pending_collectors.length} collector application${result.pending_collectors.length === 1 ? "" : "s"} awaiting review.`);
      } catch (error) {
        list.replaceChildren();
        show(notice, error.message || "Could not load pending collectors.", true);
      }
    };
    $("collectors-refresh")?.addEventListener("click", loadCollectors);
    loadCollectors();
  }

  if (page === "admin-dispute.html") {
    if (!requireAdmin()) return;
    $("admin-logout")?.addEventListener("click", signOut);
    const notice = $("disputes-notice");
    const list = $("admin-disputes");
    const loadDisputes = async () => {
      show(notice, "Loading disputes…");
      try {
        const result = await api.admin.disputes();
        list.replaceChildren();
        for (const dispute of result.disputes || []) {
          const card = document.createElement("article");
          card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
          const heading = document.createElement("div");
          heading.className = "flex flex-wrap items-start justify-between gap-3";
          const title = document.createElement("div");
          const name = document.createElement("h2");
          name.className = "text-lg font-bold text-slate-900";
          name.textContent = `Dispute · ${String(dispute.id || "").slice(0, 8) || "Pending"}`;
          const reason = document.createElement("p");
          reason.className = "mt-1 text-sm text-slate-600";
          reason.textContent = dispute.reason || "No dispute reason was supplied.";
          title.append(name, reason);
          const status = document.createElement("span");
          const pending = dispute.admin_resolution === "PENDING";
          status.className = pending
            ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
            : "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800";
          status.textContent = dispute.admin_resolution || "PENDING";
          heading.append(title, status);
          const details = document.createElement("div");
          details.className = "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4";
          const weights = typeof dispute.weights_json === "string"
            ? (() => { try { return JSON.parse(dispute.weights_json); } catch { return {}; } })()
            : (dispute.weights_json || {});
          const weightSummary = Object.entries(weights).map(([material, kg]) => `${material}: ${kg} kg`).join(" · ") || "Weight details unavailable";
          for (const [label, value] of [
            ["Total weight", dispute.total_kg == null ? "—" : `${dispute.total_kg} kg`],
            ["Payout", dispute.total_payout == null ? "—" : `₦${Number(dispute.total_payout).toLocaleString("en-NG")}`],
            ["Materials", weightSummary],
            ["Collector ID", dispute.collector_id || "—"]
          ]) {
            const item = document.createElement("div");
            item.className = "rounded-xl bg-slate-50 p-3";
            const caption = document.createElement("p"); caption.className = "text-xs text-slate-500"; caption.textContent = label;
            const data = document.createElement("p"); data.className = "mt-1 break-words text-sm font-semibold text-slate-800"; data.textContent = value;
            item.append(caption, data); details.appendChild(item);
          }
          const evidenceUrl = safeImageUrl(dispute.scale_photo_url);
          const evidence = document.createElement("div");
          evidence.className = "mt-4";
          if (evidenceUrl) {
            const image = document.createElement("img");
            image.src = evidenceUrl; image.alt = "Scale evidence for this dispute"; image.loading = "lazy";
            image.className = "max-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain";
            evidence.appendChild(image);
          } else {
            const note = document.createElement("p"); note.className = "rounded-xl bg-slate-50 p-3 text-sm text-slate-500"; note.textContent = "No scale photo was attached to this dispute."; evidence.appendChild(note);
          }
          const actions = document.createElement("div"); actions.className = "mt-4 flex flex-wrap items-center gap-2";
          const select = document.createElement("select"); select.className = "rounded-lg border border-slate-300 bg-white p-2 text-sm";
          [["APPROVE", "Uphold logged payout"], ["ADJUST", "Adjust payout"], ["SUSPEND", "Suspend collector"]].forEach(([value, label]) => select.add(new Option(label, value)));
          const amount = document.createElement("input"); amount.type = "number"; amount.min = "0"; amount.step = "1"; amount.placeholder = "Adjusted payout (₦)"; amount.className = "hidden w-48 rounded-lg border border-slate-300 p-2 text-sm";
          select.addEventListener("change", () => amount.classList.toggle("hidden", select.value !== "ADJUST"));
          const resolve = document.createElement("button"); resolve.type = "button"; resolve.className = "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"; resolve.textContent = "Resolve dispute"; resolve.disabled = !pending;
          if (!pending) resolve.classList.add("cursor-not-allowed", "opacity-50");
          resolve.addEventListener("click", async () => {
            if (select.value === "ADJUST" && (!amount.value || !Number.isInteger(Number(amount.value)) || Number(amount.value) < 0)) {
              show(notice, "Enter a whole-number payout of zero or more.", true); return;
            }
            if (!window.confirm("Save this dispute resolution?")) return;
            resolve.disabled = true;
            try {
              await api.admin.resolveDispute(dispute.id, select.value, select.value === "ADJUST" ? Number(amount.value) : undefined);
              show(notice, "Dispute resolved."); await loadDisputes();
            } catch (error) {
              show(notice, error.message || "Could not resolve this dispute.", true);
              resolve.disabled = false;
            }
          });
          if (pending) actions.append(select, amount, resolve);
          card.append(heading, details, evidence, actions);
          list.appendChild(card);
        }
        if (!result.disputes?.length) show(notice, "No disputes have been recorded.");
        else show(notice, `${result.disputes.length} dispute${result.disputes.length === 1 ? "" : "s"} loaded.`);
      } catch (error) {
        list.replaceChildren();
        show(notice, error.message || "Could not load disputes.", true);
      }
    };
    $("disputes-refresh")?.addEventListener("click", loadDisputes);
    loadDisputes();
  }
})();
