import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getUiBasePath,
  getUiRouterBasename,
  stripUiBasePath,
} from "./ui-base-path";
import { PaperclipRouter } from "./router";

describe("ui base path runtime config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to root deploy when Vite base is /", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(getUiBasePath()).toBe("");
    expect(getUiRouterBasename()).toBeUndefined();
    expect(stripUiBasePath("/invite")).toBe("/invite");
  });

  it("reads subdirectory deploy settings from Vite base", () => {
    vi.stubEnv("BASE_URL", "/board/");
    expect(getUiBasePath()).toBe("/board");
    expect(getUiRouterBasename()).toBe("/board");
    expect(stripUiBasePath("/board/invite")).toBe("/invite");
    expect(stripUiBasePath("/invite")).toBe("/invite");
  });

  it("exports PaperclipRouter for basename-aware BrowserRouter wiring", () => {
    expect(PaperclipRouter).toBeTypeOf("function");
  });
});
