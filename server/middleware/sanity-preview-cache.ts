import { parseCookies, setResponseHeader } from "h3";

/**
 * Server middleware that disables caching for Sanity preview sessions.
 *
 * @remarks
 * Runs on every request before route handlers.
 *
 * Behaviour:
 * - Always sets `Vary: Cookie` so CDN stores separate cache entries for
 *   authenticated (preview) and anonymous visitors.
 * - If the `sanity-preview-id` cookie is present (set by the Sanity visual
 *   editing flow), overrides cache headers to `no-store` and disables Nitro's
 *   SWR/cache for the current request, ensuring editors always see live data.
 */
export default defineEventHandler((event) => {
  const cookies = parseCookies(event);

  // Set Vary: Cookie only on page routes, not on API routes or static assets
  const path = getRequestURL(event).pathname;
  const isApiRoute = path.startsWith("/api/");
  const isStaticAsset = /\.(js|css|woff2?|ico|png|svg)$/.test(path);
  if (!isApiRoute && !isStaticAsset) {
    setResponseHeader(event, "Vary", "Cookie");
  }

  const isPreview = Boolean(cookies["sanity-preview-id"]);

  if (!isPreview) return;
  setResponseHeader(event, "cache-control", "no-store");
  if (!event.context._nitro) {
    event.context._nitro = {};
  }
  event.context._nitro.routeRules = {
    cache: false,
    swr: false,
    isr: false,
  };
});
