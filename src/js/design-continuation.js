document.querySelectorAll("[data-notice]").forEach((button) => {
  button.addEventListener("click", () => {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = button.dataset.notice;
    toast.hidden = false;
    window.clearTimeout(window.recycleConnectToastTimer);
    window.recycleConnectToastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  });
});

document.querySelectorAll("[data-current-time]").forEach((node) => {
  node.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
});
