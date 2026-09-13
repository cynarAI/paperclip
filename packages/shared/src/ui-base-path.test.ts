import { describe, expect, it } from "vitest";
import {
  joinUiBasePath,
  normalizeUiBasePath,
  normalizeUiRouterBasename,
  normalizeUiViteBase,
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
});
