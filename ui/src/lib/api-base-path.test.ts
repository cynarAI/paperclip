import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBasePath, joinApiPath, resolveApiUrl } from "./api-base-path";

describe("api base path helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to /api at root deploy", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(getApiBasePath()).toBe("/api");
    expect(joinApiPath("/companies")).toBe("/api/companies");
    expect(joinApiPath("/api/health")).toBe("/api/health");
    expect(resolveApiUrl("/api/attachments/a/content")).toBe("/api/attachments/a/content");
  });

  it("prefixes API calls with the configured UI base path", () => {
    vi.stubEnv("BASE_URL", "/board/");
    expect(getApiBasePath()).toBe("/board/api");
    expect(joinApiPath("/companies")).toBe("/board/api/companies");
    expect(joinApiPath("/api/companies")).toBe("/board/api/companies");
    expect(joinApiPath("/api/auth/get-session")).toBe("/board/api/auth/get-session");
    expect(resolveApiUrl("/api/assets/asset-1/content")).toBe("/board/api/assets/asset-1/content");
  });

  it("leaves non-API absolute paths unchanged", () => {
    vi.stubEnv("BASE_URL", "/board/");
    expect(resolveApiUrl("https://example.com/file")).toBe("https://example.com/file");
    expect(resolveApiUrl("/AIS/dashboard")).toBe("/AIS/dashboard");
  });
});
