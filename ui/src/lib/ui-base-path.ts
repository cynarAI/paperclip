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

export function stripUiBasePath(pathname: string): string {
  return stripSharedUiBasePath(pathname, getUiBasePath());
}
