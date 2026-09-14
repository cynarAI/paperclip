import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAuthNextLink, resolveAuthNextPath } from "./auth-redirect";

describe("auth redirect helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips a configured UI prefix from deploy-absolute next paths", () => {
    vi.stubEnv("BASE_URL", "/board/");
    expect(resolveAuthNextPath("/board/")).toBe("/");
    expect(resolveAuthNextPath("/board/dashboard")).toBe("/dashboard");
    expect(buildAuthNextLink("/board/dashboard")).toBe("/auth?next=%2Fdashboard");
  });

  it("leaves router-relative paths unchanged at root deploy", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(resolveAuthNextPath("/dashboard")).toBe("/dashboard");
    expect(buildAuthNextLink("/dashboard")).toBe("/auth?next=%2Fdashboard");
  });
});
