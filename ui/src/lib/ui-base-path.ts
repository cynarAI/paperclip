import {
  normalizeUiRouterBasename,
  stripUiBasePath as stripSharedUiBasePath,
} from "@paperclipai/shared";

function viteBaseUrl(): string {
  return import.meta.env.BASE_URL ?? "/";
}

/** Configured UI deploy prefix without trailing slash; empty at root. */
export function getUiBasePath(): string {
  const baseUrl = viteBaseUrl();
  if (baseUrl === "/" || baseUrl === "") return "";
  return baseUrl.replace(/\/+$/, "");
}

export function getUiRouterBasename(): string | undefined {
  return normalizeUiRouterBasename(getUiBasePath());
}

/** First URL segment of the configured UI deploy prefix, e.g. `board` for `/board`. */
export function getUiBasePathSegment(): string | null {
  const base = getUiBasePath();
  if (!base) return null;
  const segment = base.replace(/^\/+|\/+$/g, "").toLowerCase();
  return segment || null;
}

export function stripUiBasePath(pathname: string): string {
  const basePath = getUiBasePath();
  if (!basePath) return pathname;

  let current = pathname;
  for (;;) {
    const next = stripSharedUiBasePath(current, basePath);
    if (next === current) break;
    current = next;
  }
  return current;
}
