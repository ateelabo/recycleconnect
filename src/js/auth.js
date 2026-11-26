(() => {
  let initialized = false;
  let promptActive = false;
  let activeMessage = null;
  let activeRole = "";

  function nextPage(session, isNewUser) {
    const role = session.role;
    if (role === "COLLECTOR") return { href: "./collector-dashboard.html" };
    if (role === "ADMIN") return { href: "./admin-dashboard.html" };
    if (isNewUser) {
      return { href: "./household-onboarding.html?role=" + role.toLowerCase() };
    }
    return { href: "./household-dashboard.html" };
  }

  function showError(message) {
    if (!activeMessage) return;
    activeMessage.textContent = message;
    activeMessage.classList.add("text-red-600");
  }

  function initializeGoogle() {
    if (initialized) return;
    const api = window.RecycleConnectAPI;
    window.google.accounts.id.initialize({
      client_id: api.googleClientId,
      callback: async (credentialResponse) => {
        promptActive = false;
        const messageElement = activeMessage;
        try {
          if (!credentialResponse?.credential) throw new Error("Google did not return a sign-in credential. Please try again.");
          messageElement.textContent = "Signing in…";
          const result = await api.signInWithGoogle(credentialResponse.credential, activeRole);
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
    initialized = true;
  }

  function showPrompt() {
    if (!window.google?.accounts?.id) {
      promptActive = false;
      showError("Google sign-in could not load. Check your connection and try again.");
      return;
    }
    initializeGoogle();
    if (promptActive) return;
    promptActive = true;
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          promptActive = false;
        }
      });
    } catch (error) {
      promptActive = false;
      showError(error.message || "Google sign-in could not start. Please try again.");
    }
  }

  window.startRecycleConnectGoogleSignIn = (messageElement, selectedRole) => {
    activeMessage = messageElement;
    activeRole = selectedRole;
    const api = window.RecycleConnectAPI;
    if (!api?.googleClientId) {
      showError("Google sign-in is not configured. Add the OAuth client ID in src/js/config/config.js.");
      return;
    }
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
        promptActive = false;
        showError("Google sign-in could not load. Check your connection and try again.");
      }, { once: true });
    }
  };
})();
