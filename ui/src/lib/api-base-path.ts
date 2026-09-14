import { joinUiBasePath } from "@paperclipai/shared";
import { getUiBasePath } from "./ui-base-path";

/** Browser-facing API mount, e.g. `/api` at root or `/board/api` under a UI prefix. */
export function getApiBasePath(): string {
  return joinUiBasePath(getUiBasePath(), "/api");
}

function stripApiMount(path: string): string {
  const base = getApiBasePath();
  if (base && (path === base || path.startsWith(`${base}/`))) {
    return path.slice(base.length) || "/";
  }
  const ui = getUiBasePath();
  // Defend against double UI prefix: /board/board/api/... → /api/...
  if (ui && path.startsWith(`${ui}${ui}/`)) {
    return path.slice(ui.length);
  }
  return path;
}

/**
 * Prefix a path with the configured API mount.
 * Accepts `/companies`, `/health`, `/api/...`, or already-prefixed `/board/api/...`.
 * Idempotent — never produces `/board/board/api`.
 */
export function joinApiPath(path: string): string {
  let normalized = path.startsWith("/") ? path : `/${path}`;
  normalized = stripApiMount(normalized);
  if (normalized === "/api" || normalized.startsWith("/api/")) {
    return joinUiBasePath(getUiBasePath(), normalized);
  }
  return `${getApiBasePath()}${normalized}`;
}

/** Resolve same-origin API URLs returned by the server or built in the UI. */
export function resolveApiUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed.startsWith("/")) return trimmed;
  if (
    trimmed === "/api" ||
    trimmed.startsWith("/api/") ||
    trimmed.startsWith(`${getApiBasePath()}/`) ||
    trimmed === getApiBasePath()
  ) {
    return joinApiPath(trimmed);
  }
  return trimmed;
}
