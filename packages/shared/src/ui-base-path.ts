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

function splitAuthNextPath(value: string): { pathname: string; search: string; hash: string } {
  const match = value.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    pathname: match?.[1] ?? value,
    search: match?.[2] ?? "",
    hash: match?.[3] ?? "",
  };
}

/**
 * Normalize a post-login `next` target for React Router navigation.
 *
 * Callers may pass either router-relative paths (`/dashboard`) or deploy-absolute
 * paths that already include the UI prefix (`/board/dashboard`). The configured
 * prefix is stripped when present so a basename-aware router does not double-prefix.
 */
export function normalizeAuthNextPath(value: string | null | undefined, basePath?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "/";
  if (!trimmed.startsWith("/")) return "/";
  // `//host` and `/\host` are both browser-recognized protocol-relative forms.
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "/";
  // Control characters and raw whitespace can split a `Location` header.
  if (/[\u0000-\u0020\u007f]/.test(trimmed)) return "/";

  const { pathname, search, hash } = splitAuthNextPath(trimmed);
  const normalizedPathname = stripUiBasePath(pathname, basePath);
  return `${normalizedPathname}${search}${hash}`;
}

/**
 * Resolve an auth redirect for HTTP `Location` headers (full browser navigation).
 * Router-relative paths are prefixed with the configured UI base path.
 */
export function resolveAuthRedirectLocation(value: string, basePath?: string | null): string {
  const normalized = normalizeAuthNextPath(value, basePath);
  return joinUiBasePath(basePath, normalized);
}
