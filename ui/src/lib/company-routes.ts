import { getUiBasePathSegment, stripUiBasePath } from "./ui-base-path";

const BOARD_ROUTE_ROOTS = new Set([
  "dashboard",
  "companies",
  "company",
  "skills",
  "teams-catalog",
  "org",
  "agents",
  "chats",
  "apps",
  "projects",
  "workspaces",
  "execution-workspaces",
  "issues",
  "tasks",
  "routines",
  "goals",
  "artifacts",
  "tools",
  "approvals",
  "costs",
  "usage",
  "activity",
  "audit",
  "decisions",
  "inbox",
  "board-chat",
  "artifacts",
  "u",
  "design-guide",
  "search",
  "settings",
  "timeline",
]);

const GLOBAL_ROUTE_ROOTS = new Set(["auth", "invite", "board-claim", "cli-auth", "docs", "instance"]);

export function normalizeCompanyPrefix(prefix: string): string {
  return prefix.trim().toUpperCase();
}

function splitPath(path: string): { pathname: string; search: string; hash: string } {
  const match = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    pathname: match?.[1] ?? path,
    search: match?.[2] ?? "",
    hash: match?.[3] ?? "",
  };
}

function normalizeAppPathname(pathname: string): string {
  let normalized = stripUiBasePath(pathname);
  const baseSegment = getUiBasePathSegment();
  if (!baseSegment) return normalized;

  let segments = normalized.split("/").filter(Boolean);
  while (segments[0] === baseSegment) {
    segments = segments.slice(1);
  }
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function isUiBasePathSegment(segment: string): boolean {
  const baseSegment = getUiBasePathSegment();
  // Match the deploy prefix literally (usually lowercase `board`). Do not
  // case-fold: a company whose issue prefix is `BOARD` must keep `/BOARD/...`.
  return baseSegment !== null && segment === baseSegment;
}

function getRootSegment(pathname: string): string | null {
  const segment = normalizeAppPathname(pathname).split("/").filter(Boolean)[0];
  return segment ?? null;
}

export function isGlobalPath(pathname: string): boolean {
  const appPathname = normalizeAppPathname(pathname);
  if (appPathname === "/" || appPathname === "") return true;
  const root = getRootSegment(pathname);
  if (!root) return true;
  return GLOBAL_ROUTE_ROOTS.has(root.toLowerCase());
}

export function isBoardPathWithoutPrefix(pathname: string): boolean {
  const root = getRootSegment(pathname);
  if (!root) return false;
  return BOARD_ROUTE_ROOTS.has(root.toLowerCase());
}

export function extractCompanyPrefixFromPath(pathname: string): string | null {
  const segments = normalizeAppPathname(pathname).split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0]!;
  if (isUiBasePathSegment(first)) return null;
  const firstLower = first.toLowerCase();
  if (GLOBAL_ROUTE_ROOTS.has(firstLower) || BOARD_ROUTE_ROOTS.has(firstLower)) {
    return null;
  }
  return normalizeCompanyPrefix(first);
}

export function applyCompanyPrefix(path: string, companyPrefix: string | null | undefined): string {
  const { pathname, search, hash } = splitPath(path);
  if (!pathname.startsWith("/")) return path;
  const appPathname = normalizeAppPathname(pathname);
  if (isGlobalPath(appPathname)) return path;
  if (!companyPrefix) return path;

  const prefix = normalizeCompanyPrefix(companyPrefix);
  const activePrefix = extractCompanyPrefixFromPath(appPathname);
  if (activePrefix) return path;

  return `/${prefix}${appPathname}${search}${hash}`;
}

/**
 * Build a company-prefixed href for an experimental Cases route, e.g.
 * `caseHref("PAP", "PAP-C5")` → `/PAP/cases/PAP-C5`.
 *
 * Case paths carry identifiers like `PAP-C5` in the first segment, which the
 * generic {@link applyCompanyPrefix} mistakes for a company prefix ("CASES") and
 * therefore leaves `/cases/...` unprefixed — every case link then only resolves
 * via the PAP-13002 unprefixed→prefixed redirect. This builder emits the
 * prefixed href directly so case-to-case navigation matches the rest of the app.
 * Falls back to the unprefixed path (still valid via the redirect) when no
 * company is active.
 */
export function caseHref(
  companyPrefix: string | null | undefined,
  ...segments: string[]
): string {
  const suffix = ["cases", ...segments].filter(Boolean).join("/");
  if (!companyPrefix) return `/${suffix}`;
  return `/${normalizeCompanyPrefix(companyPrefix)}/${suffix}`;
}

export function toCompanyRelativePath(path: string): string {
  const { pathname, search, hash } = splitPath(path);
  const segments = normalizeAppPathname(pathname).split("/").filter(Boolean);

  if (segments.length >= 2) {
    const second = segments[1]!.toLowerCase();
    if (!GLOBAL_ROUTE_ROOTS.has(segments[0]!.toLowerCase()) && BOARD_ROUTE_ROOTS.has(second)) {
      return `/${segments.slice(1).join("/")}${search}${hash}`;
    }
  }

  return `${pathname}${search}${hash}`;
}
