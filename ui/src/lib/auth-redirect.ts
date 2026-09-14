import { normalizeAuthNextPath } from "@paperclipai/shared";
import { getUiBasePath } from "./ui-base-path";

/** Normalize a post-login `next` query value for basename-aware router navigation. */
export function resolveAuthNextPath(value: string | null | undefined): string {
  return normalizeAuthNextPath(value, getUiBasePath());
}

/** Build an `/auth?next=…` link with a router-relative post-login target. */
export function buildAuthNextLink(next: string): string {
  return `/auth?next=${encodeURIComponent(resolveAuthNextPath(next))}`;
}
