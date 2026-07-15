import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config.ts";

const isLovablePreviewHost = (hostname: string) =>
  hostname === "lovableproject.com" ||
  hostname.endsWith(".lovableproject.com") ||
  hostname === "lovableproject-dev.com" ||
  hostname.endsWith(".lovableproject-dev.com") ||
  hostname === "lovable.app" ||
  hostname.endsWith(".lovable.app") ||
  hostname.startsWith("id-preview--") ||
  hostname.startsWith("preview--");

const shouldUseAppServiceWorker =
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  window.self === window.top &&
  !isLovablePreviewHost(window.location.hostname) &&
  !new URLSearchParams(window.location.search).has("sw");

const cleanupAppServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => registration.active?.scriptURL.endsWith("/sw.js"))
      .map((registration) => registration.unregister())
  );

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.allSettled(
      cacheNames
        .filter((name) => name.startsWith("calmora-") || name.includes("workbox"))
        .map((name) => caches.delete(name))
    );
  }
};

// Ensure React is properly available
if (!React) {
  throw new Error("React is not available");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the app service worker only on real production domains.
// In dev/Lovable previews it can cache Vite dependency chunks and create duplicate React bundles.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (shouldUseAppServiceWorker) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed silently
      });
    } else {
      cleanupAppServiceWorker().catch(() => {
        // Cleanup failed silently
      });
    }
  });
}