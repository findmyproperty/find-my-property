const ICON_SELECTOR =
  'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]';

function withCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

/**
 * Replace all favicon-related `<link>` tags so the browser tab updates live.
 * Browsers cache favicons aggressively, so we append a cache-busting query param.
 */
export function applyFavicon(url: string | null | undefined) {
  if (typeof document === "undefined" || !url) return;

  const href = withCacheBust(url);
  const links = document.head.querySelectorAll<HTMLLinkElement>(ICON_SELECTOR);

  if (links.length > 0) {
    links.forEach((link) => link.setAttribute("href", href));
    return;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.href = href;
  document.head.appendChild(link);
}
