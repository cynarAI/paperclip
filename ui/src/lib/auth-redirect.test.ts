import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAuthNextLink, resolveAuthNextPath } from "./auth-redirect";

describe("auth redirect helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips a configured UI prefix from deploy-absolute next paths", () => {
    vi.stubEnv("BASE_URL", "/board/");
    expect(resolveAuthNextPath("/board/")).toBe("/");
    expect(resolveAuthNextPath("/board/dashboard")).toBe("/");
    expect(buildAuthNextLink("/board/dashboard")).toBe("/auth?next=%2F");
  });

  it("rewrites unprefixed dashboard targets to the app root at any deploy", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(resolveAuthNextPath("/dashboard")).toBe("/");
    expect(resolveAuthNextPath("/dashboard/live")).toBe("/");
    expect(buildAuthNextLink("/dashboard")).toBe("/auth?next=%2F");
    expect(resolveAuthNextPath("/PAP/dashboard")).toBe("/PAP/dashboard");
  });
});
