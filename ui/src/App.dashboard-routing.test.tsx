// @vitest-environment jsdom

// Regression guard for subdirectory deploys (`PAPERCLIP_UI_BASE_PATH=/board`):
// unprefixed `/dashboard` must redirect to `/:company/dashboard` instead of
// matching `:companyPrefix="dashboard"` and 404ing. Drives the real <App> route
// table so removing the redirect routes fails loudly.

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const streamlinedUiState = vi.hoisted(() => ({ enabled: true, loaded: true }));

vi.mock("./hooks/useStreamlinedUiEnabled", () => ({
  useStreamlinedUiEnabled: () => streamlinedUiState,
}));

vi.hoisted(() => {
  const sheetProto = window.CSSStyleSheet.prototype as unknown as {
    insertRule: (rule: string, index?: number) => number;
    __papDashboardRoutingPatched?: boolean;
  };
  if (!sheetProto.__papDashboardRoutingPatched) {
    const original = sheetProto.insertRule;
    sheetProto.insertRule = function patched(this: CSSStyleSheet, rule: string, index?: number) {
      try {
        return original.call(this, rule, index);
      } catch {
        try {
          return original.call(this, ".pap-dashboard-routing-noop{}", index);
        } catch {
          return this.cssRules?.length ?? 0;
        }
      }
    };
    sheetProto.__papDashboardRoutingPatched = true;
  }
});

vi.mock("./components/Layout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { Layout: () => <Outlet /> };
});

vi.mock("./components/Layout.production", async () => {
  const { Outlet } = await import("react-router-dom");
  return { Layout: () => <Outlet /> };
});

vi.mock("./components/OnboardingWizardVariant", () => ({
  OnboardingWizardVariant: () => null,
}));

vi.mock("./components/CloudAccessGate", async () => {
  const { Outlet } = await import("react-router-dom");
  return { CloudAccessGate: () => <Outlet /> };
});

vi.mock("./pages/Dashboard", () => ({
  Dashboard: () => {
    const location = useLocation();
    return <div>{`DASHBOARD_PAGE@${location.pathname}`}</div>;
  },
}));

vi.mock("./pages/DashboardLive", () => ({
  DashboardLive: () => {
    const location = useLocation();
    return <div>{`DASHBOARD_LIVE_PAGE@${location.pathname}`}</div>;
  },
}));

vi.mock("./pages/NotFound", () => ({
  NotFoundPage: ({ scope }: { scope: string }) => <div>{`NOT_FOUND:${scope}`}</div>,
}));

const PAP_COMPANY = {
  id: "company-1",
  name: "Paperclip",
  issuePrefix: "PAP",
  status: "active",
};

let companyState = {
  companies: [PAP_COMPANY] as Array<typeof PAP_COMPANY>,
  selected: PAP_COMPANY as typeof PAP_COMPANY | null,
};

vi.mock("./context/CompanyContext", () => ({
  useCompany: () => ({
    companies: companyState.companies,
    selectedCompanyId: companyState.selected?.id ?? null,
    selectedCompany: companyState.selected,
    loading: false,
  }),
  CompanyProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderAppAt(container: HTMLElement, path: string, basename?: string) {
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <MemoryRouter basename={basename} initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });
  return root;
}

async function waitForRoute(container: HTMLElement, text: string) {
  await vi.waitFor(() => expect(container.textContent).toContain(text));
}

describe("App dashboard routing under UI base path", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    companyState = { companies: [PAP_COMPANY], selected: PAP_COMPANY };
    streamlinedUiState.enabled = true;
    streamlinedUiState.loaded = true;
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("redirects bare /dashboard to the prefixed dashboard", async () => {
    const root = renderAppAt(container, "/dashboard");
    await waitForRoute(container, "DASHBOARD_PAGE@/PAP/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND");
    flushSync(() => root.unmount());
  });

  it("redirects bare /dashboard/live to the prefixed live dashboard", async () => {
    const root = renderAppAt(container, "/dashboard/live");
    await waitForRoute(container, "DASHBOARD_LIVE_PAGE@/PAP/dashboard/live");
    expect(container.textContent).not.toContain("NOT_FOUND");
    flushSync(() => root.unmount());
  });

  it("does not treat /dashboard as companyPrefix=dashboard under basename /board", async () => {
    vi.stubEnv("BASE_URL", "/board/");
    const root = renderAppAt(container, "/board/dashboard", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/PAP/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND");
    expect(container.textContent).not.toContain("NOT_FOUND:company");
    flushSync(() => root.unmount());
  });
});
