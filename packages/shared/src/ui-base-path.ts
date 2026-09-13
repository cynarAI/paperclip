/**
 * Normalize a UI deploy prefix such as `/board` for subdirectory hosting.
 * Returns an empty string for root deploys.
 */
export function normalizeUiBasePath(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  if (trimmed === "" || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

/** Vite `base` option: trailing slash, `/` at root. */
export function normalizeUiViteBase(value: string | undefined | null): string {
  const basePath = normalizeUiBasePath(value);
  return basePath ? `${basePath}/` : "/";
}

/** React Router `basename`: no trailing slash; undefined at root. */
export function normalizeUiRouterBasename(value: string | undefined | null): string | undefined {
  const basePath = normalizeUiBasePath(value);
  return basePath || undefined;
}

/** Remove a configured UI prefix from an incoming pathname. */
export function stripUiBasePath(pathname: string, basePath?: string | null): string {
  const base = normalizeUiBasePath(basePath);
  if (!base) return pathname;
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}

/** Prefix an app-relative path with the configured UI base path. */
export function joinUiBasePath(basePath: string | undefined | null, path: string): string {
  const base = normalizeUiBasePath(basePath);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalizedPath;
  if (normalizedPath === "/") return `${base}/`;
  return `${base}${normalizedPath}`;
}
