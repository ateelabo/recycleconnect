(() => {
  function nextPage(session, isNewUser) {
    const role = session.role;
    if (role === "COLLECTOR") return { href: "./collector-dashboard.html" };
    if (role === "ADMIN") return { href: "./admin-dashboard.html" };
    if (isNewUser) {
      return { href: "./household-onboarding.html?role=" + role.toLowerCase() };
    }
    return { href: "./household-dashboard.html" };
  }

  window.startRecycleConnectGoogleSignIn = (messageElement, selectedRole) => {
    const api = window.RecycleConnectAPI;
    if (!api?.googleClientId) {
      messageElement.textContent = "Google sign-in is not configured. Add the OAuth client ID in src/js/config/config.js.";
      messageElement.classList.add("text-red-600");
      return;
    }
    const initialize = () => window.google.accounts.id.initialize({
      client_id: api.googleClientId,
      callback: async (credentialResponse) => {
        try {
          messageElement.textContent = "Signing in…";
          const result = await api.signInWithGoogle(credentialResponse.credential, selectedRole);
          const destination = nextPage(result.session, result.is_new_user);
          if (destination.message) {
            messageElement.textContent = destination.message;
            return;
          }
          window.location.href = destination.href;
        } catch (error) {
          messageElement.textContent = error.message;
          messageElement.classList.add("text-red-600");
        }
      }
    });
    const showPrompt = () => {
      initialize();
      window.google.accounts.id.prompt();
    };
    if (window.google?.accounts?.id) {
      showPrompt();
    } else {
      let script = document.querySelector('script[data-google-identity]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", showPrompt, { once: true });
      script.addEventListener("error", () => {
        messageElement.textContent = "Google sign-in could not load. Check your connection and try again.";
        messageElement.classList.add("text-red-600");
      }, { once: true });
    }
  };
})();
