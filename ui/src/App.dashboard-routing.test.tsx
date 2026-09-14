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

const AIS_COMPANY = {
  id: "company-ais",
  name: "AIstronaut",
  issuePrefix: "AIS",
  status: "active",
};

const PAP_COMPANY = {
  id: "company-1",
  name: "Paperclip",
  issuePrefix: "PAP",
  status: "active",
};

let companyState = {
  companies: [AIS_COMPANY] as Array<typeof AIS_COMPANY>,
  selected: AIS_COMPANY as typeof AIS_COMPANY | null,
};

vi.mock("./components/Layout", async () => {
  const reactRouterDom = await import("react-router-dom");
  return {
    Layout: () => {
      const { companyPrefix } = reactRouterDom.useParams();
      const matched = companyState.companies.find(
        (company) => company.issuePrefix.toUpperCase() === companyPrefix?.toUpperCase(),
      );
      const hasUnknownCompanyPrefix =
        Boolean(companyPrefix) && companyState.companies.length > 0 && !matched;
      if (hasUnknownCompanyPrefix) {
        return <div>{`NOT_FOUND:invalid_company_prefix:${companyPrefix}`}</div>;
      }
      return <reactRouterDom.Outlet />;
    },
  };
});

vi.mock("./components/Layout.production", async () => {
  const reactRouterDom = await import("react-router-dom");
  return {
    Layout: () => {
      const { companyPrefix } = reactRouterDom.useParams();
      const matched = companyState.companies.find(
        (company) => company.issuePrefix.toUpperCase() === companyPrefix?.toUpperCase(),
      );
      const hasUnknownCompanyPrefix =
        Boolean(companyPrefix) && companyState.companies.length > 0 && !matched;
      if (hasUnknownCompanyPrefix) {
        return <div>{`NOT_FOUND:invalid_company_prefix:${companyPrefix}`}</div>;
      }
      return <reactRouterDom.Outlet />;
    },
  };
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

vi.mock("./context/CompanyContext", () => ({
  useCompany: () => ({
    companies: companyState.companies,
    selectedCompanyId: companyState.selected?.id ?? null,
    selectedCompany: companyState.selected,
    loading: false,
  }),
  CompanyProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

/** Map router-relative paths to MemoryRouter entries (basename requires deploy-absolute URLs). */
function toMemoryRouterEntry(path: string, basename?: string): string {
  if (!basename) return path;
  if (path === basename || path.startsWith(`${basename}/`)) return path;
  if (path === "/") return `${basename}/`;
  return `${basename}${path.startsWith("/") ? path : `/${path}`}`;
}

function renderAppAt(container: HTMLElement, path: string, basename?: string) {
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <MemoryRouter basename={basename} initialEntries={[toMemoryRouterEntry(path, basename)]}>
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
    const root = renderAppAt(container, "/dashboard", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/PAP/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND");
    expect(container.textContent).not.toContain("invalid_company_prefix");
    flushSync(() => root.unmount());
  });
});

describe("App board basename routing (AIS company)", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    companyState = { companies: [AIS_COMPANY], selected: AIS_COMPANY };
    streamlinedUiState.enabled = true;
    streamlinedUiState.loaded = true;
    vi.stubEnv("BASE_URL", "/board/");
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("redirects / to /AIS/dashboard under basename /board", async () => {
    const root = renderAppAt(container, "/", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix");
    flushSync(() => root.unmount());
  });

  it("renders /AIS/dashboard without invalid_company_prefix", async () => {
    const root = renderAppAt(container, "/AIS/dashboard", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix:board");
    flushSync(() => root.unmount());
  });

  it("redirects /dashboard to /AIS/dashboard under basename /board", async () => {
    const root = renderAppAt(container, "/dashboard", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix");
    flushSync(() => root.unmount());
  });

  it("never treats board as companyPrefix inside the router", async () => {
    const root = renderAppAt(container, "/AIS/dashboard", "/board");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix:board");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix:dashboard");
    flushSync(() => root.unmount());
  });

  it("recovers when the pathname still contains the UI base segment as companyPrefix", async () => {
    const root = renderAppAt(container, "/board/AIS/dashboard");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix:board");
    flushSync(() => root.unmount());
  });

  it("recovers /board/ to the company dashboard when basename is missing", async () => {
    const root = renderAppAt(container, "/board/");
    await waitForRoute(container, "DASHBOARD_PAGE@/AIS/dashboard");
    expect(container.textContent).not.toContain("NOT_FOUND:invalid_company_prefix:board");
    flushSync(() => root.unmount());
  });
});
