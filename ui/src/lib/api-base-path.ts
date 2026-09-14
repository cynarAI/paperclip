import { joinUiBasePath } from "@paperclipai/shared";
import { getUiBasePath } from "./ui-base-path";

/** Browser-facing API mount, e.g. `/api` at root or `/board/api` under a UI prefix. */
export function getApiBasePath(): string {
  return joinUiBasePath(getUiBasePath(), "/api");
}

/**
 * Prefix a path with the configured API mount.
 * Accepts `/companies`, `/health`, or deploy-absolute `/api/...` inputs.
 */
export function joinApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/api" || normalized.startsWith("/api/")) {
    return joinUiBasePath(getUiBasePath(), normalized);
  }
  return `${getApiBasePath()}${normalized}`;
}

/** Resolve same-origin API URLs returned by the server or built in the UI. */
export function resolveApiUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed.startsWith("/")) return trimmed;
  if (trimmed === "/api" || trimmed.startsWith("/api/")) {
    return joinApiPath(trimmed);
  }
  return trimmed;
}
