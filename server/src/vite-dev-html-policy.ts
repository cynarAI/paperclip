import type { Request as ExpressRequest } from "express";
import { stripUiBasePath } from "@paperclipai/shared";

const VITE_DEV_ASSET_PREFIXES = [
  "/@fs/",
  "/@id/",
  "/@react-refresh",
  "/@vite/",
  "/assets/",
  "/node_modules/",
  "/src/",
];

const VITE_DEV_STATIC_PATHS = new Set([
  "/apple-touch-icon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon.ico",
  "/favicon.svg",
  "/site.webmanifest",
  "/sw.js",
]);

export function shouldServeViteDevHtml(
  req: ExpressRequest,
  uiBasePath?: string | null,
): boolean {
  const pathname = stripUiBasePath(req.path, uiBasePath);
  if (VITE_DEV_STATIC_PATHS.has(pathname)) return false;
  if (VITE_DEV_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return false;
  return req.accepts(["html"]) === "html";
}
