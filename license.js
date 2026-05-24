// License validation module for Aviator Strategy Bot
// Handles: fingerprint generation, server validation, token caching, feature gating

window.AviatorLicense = (function () {
  const API_BASE = "https://aviator-bot-api.YOUR_WORKER.workers.dev"; // Replace after deploy
  const TOKEN_KEY = "ab_license_token";
  const KEY_KEY = "ab_license_key";
  const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 48h offline grace
  const REVALIDATE_MS = 24 * 60 * 60 * 1000; // 24h token TTL

  let cachedTier = "free";
  let cachedFeatures = [];
  let cachedToken = null;
  let lastValidation = 0;

  // --- Device Fingerprint ---
  async function generateFingerprint() {
    const components = [];

    // Screen
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(screen.pixelDepth);

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Language
    components.push(navigator.language);

    // Platform
    components.push(navigator.platform);

    // Hardware concurrency
    components.push(navigator.hardwareConcurrency || 0);

    // Canvas fingerprint
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(100, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("AviatorBot:fp", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("AviatorBot:fp", 4, 17);
      components.push(canvas.toDataURL());
    } catch (e) {
      components.push("no-canvas");
    }

    // WebGL renderer
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        }
      }
    } catch (e) {
      components.push("no-webgl");
    }

    const raw = components.join("|");
    const hash = await sha256(raw);
    return hash;
  }

  async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // --- Storage helpers ---
  function getStored(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (data) => resolve(data[key] || null));
    });
  }

  function setStored(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  // --- API Calls ---
  async function validateWithServer(licenseKey) {
    const fingerprint = await generateFingerprint();
    const label = `Chrome on ${navigator.platform}`;

    try {
      const response = await fetch(`${API_BASE}/api/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: licenseKey, fingerprint, label }),
      });

      const data = await response.json();

      if (data.valid) {
        cachedTier = data.tier || "free";
        cachedFeatures = data.features || [];
        cachedToken = data.token;
        lastValidation = Date.now();

        await setStored(TOKEN_KEY, {
          token: data.token,
          tier: data.tier,
          features: data.features,
          validatedAt: Date.now(),
          expiresIn: data.expires_in * 1000,
        });

        return { valid: true, tier: data.tier, features: data.features };
      } else {
        return { valid: false, error: data.error };
      }
    } catch (err) {
      // Network error — check if we have a cached token within grace period
      const cached = await getStored(TOKEN_KEY);
      if (cached && Date.now() - cached.validatedAt < GRACE_PERIOD_MS) {
        cachedTier = cached.tier;
        cachedFeatures = cached.features;
        cachedToken = cached.token;
        lastValidation = cached.validatedAt;
        return { valid: true, tier: cached.tier, features: cached.features, offline: true };
      }
      return { valid: false, error: "Network error and no cached token" };
    }
  }

  // --- Public API ---

  async function initialize() {
    const storedKey = await getStored(KEY_KEY);
    if (!storedKey) {
      cachedTier = "free";
      cachedFeatures = ["simulation", "flat-conservative", "flat-balanced", "basic-stats"];
      return { valid: false, needsKey: true };
    }

    // Check cached token first
    const cached = await getStored(TOKEN_KEY);
    if (cached && Date.now() - cached.validatedAt < REVALIDATE_MS) {
      cachedTier = cached.tier;
      cachedFeatures = cached.features;
      cachedToken = cached.token;
      lastValidation = cached.validatedAt;
      return { valid: true, tier: cached.tier, features: cached.features, fromCache: true };
    }

    // Token expired or missing — revalidate
    return await validateWithServer(storedKey);
  }

  async function activate(licenseKey) {
    const result = await validateWithServer(licenseKey);
    if (result.valid) {
      await setStored(KEY_KEY, licenseKey);
    }
    return result;
  }

  async function deactivate() {
    const storedKey = await getStored(KEY_KEY);
    if (storedKey) {
      const fingerprint = await generateFingerprint();
      try {
        await fetch(`${API_BASE}/api/auth/deactivate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: storedKey, fingerprint }),
        });
      } catch (e) { /* best effort */ }
    }
    await setStored(KEY_KEY, null);
    await setStored(TOKEN_KEY, null);
    cachedTier = "free";
    cachedFeatures = [];
    cachedToken = null;
  }

  function getTier() {
    return cachedTier;
  }

  function getFeatures() {
    return cachedFeatures;
  }

  function isFeatureAllowed(feature) {
    if (cachedTier === "pro") return true;
    return cachedFeatures.includes(feature);
  }

  function isStrategyAllowed(strategyId) {
    const FREE_STRATEGIES = ["flat-conservative", "flat-balanced"];
    const PRO_ONLY = ["sniper"];

    if (cachedTier === "pro") return true;
    if (cachedTier === "basic") return !PRO_ONLY.includes(strategyId);
    return FREE_STRATEGIES.includes(strategyId);
  }

  function isRealBettingAllowed() {
    return cachedTier === "basic" || cachedTier === "pro";
  }

  function isAutopilotAllowed() {
    return cachedTier === "pro";
  }

  function getMaxRounds() {
    if (cachedTier === "pro") return Infinity;
    if (cachedTier === "basic") return 200;
    return 50;
  }

  function needsRevalidation() {
    return Date.now() - lastValidation > REVALIDATE_MS;
  }

  return {
    initialize,
    activate,
    deactivate,
    getTier,
    getFeatures,
    isFeatureAllowed,
    isStrategyAllowed,
    isRealBettingAllowed,
    isAutopilotAllowed,
    getMaxRounds,
    needsRevalidation,
    generateFingerprint,
  };
})();
