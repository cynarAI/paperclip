import { describe, expect, it } from "vitest";
import {
  joinUiBasePath,
  normalizeAuthNextPath,
  normalizeUiBasePath,
  normalizeUiRouterBasename,
  normalizeUiViteBase,
  resolveAuthRedirectLocation,
  stripUiBasePath,
} from "./ui-base-path.js";

describe("ui base path helpers", () => {
  it("normalizes deploy prefixes and root defaults", () => {
    expect(normalizeUiBasePath(undefined)).toBe("");
    expect(normalizeUiBasePath("")).toBe("");
    expect(normalizeUiBasePath("/")).toBe("");
    expect(normalizeUiBasePath("board")).toBe("/board");
    expect(normalizeUiBasePath("/board/")).toBe("/board");
  });

  it("derives Vite and React Router base values", () => {
    expect(normalizeUiViteBase("board")).toBe("/board/");
    expect(normalizeUiViteBase("/")).toBe("/");
    expect(normalizeUiRouterBasename("board")).toBe("/board");
    expect(normalizeUiRouterBasename("/")).toBeUndefined();
  });

  it("strips a configured prefix without touching unrelated paths", () => {
    expect(stripUiBasePath("/board/invite", "/board")).toBe("/invite");
    expect(stripUiBasePath("/board", "/board")).toBe("/");
    expect(stripUiBasePath("/invite", "/board")).toBe("/invite");
    expect(stripUiBasePath("/boardroom/issues", "/board")).toBe("/boardroom/issues");
  });

  it("joins app-relative paths under the configured prefix", () => {
    expect(joinUiBasePath("/board", "/auth")).toBe("/board/auth");
    expect(joinUiBasePath("", "/auth")).toBe("/auth");
    expect(joinUiBasePath("/board", "/")).toBe("/board/");
  });

  it("normalizes auth next paths for basename-aware navigation", () => {
    expect(normalizeAuthNextPath("/board/", "/board")).toBe("/");
    expect(normalizeAuthNextPath("/board/dashboard", "/board")).toBe("/");
    expect(normalizeAuthNextPath("/dashboard", "/board")).toBe("/");
    expect(normalizeAuthNextPath("/dashboard/live", "/board")).toBe("/");
    expect(normalizeAuthNextPath("/board/dashboard?tab=1", "/board")).toBe("/");
    expect(normalizeAuthNextPath("/PAP/dashboard", "/board")).toBe("/PAP/dashboard");
    expect(normalizeAuthNextPath("/board/", "")).toBe("/board/");
    expect(normalizeAuthNextPath(undefined, "/board")).toBe("/");
    expect(normalizeAuthNextPath("//evil.example", "/board")).toBe("/");
  });

  it("resolves auth redirect locations for HTTP navigation under a UI prefix", () => {
    expect(resolveAuthRedirectLocation("/", "/board")).toBe("/board/");
    expect(resolveAuthRedirectLocation("/dashboard", "/board")).toBe("/board/");
    expect(resolveAuthRedirectLocation("/board/dashboard", "/board")).toBe("/board/");
    expect(resolveAuthRedirectLocation("/PAP/dashboard", "/board")).toBe("/board/PAP/dashboard");
    expect(resolveAuthRedirectLocation("/auth", "/board")).toBe("/board/auth");
    expect(resolveAuthRedirectLocation("/dashboard", "")).toBe("/");
  });
});
