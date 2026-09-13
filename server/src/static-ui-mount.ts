import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { joinUiBasePath, normalizeUiBasePath, stripUiBasePath } from "@paperclipai/shared";
import { readBrandedStaticIndexHtml } from "./static-index-html.js";
import { staticUiCacheControl } from "./static-ui-cache.js";

function mountStaticUiAtPrefix(
  app: Express,
  uiDist: string,
  mountPrefix: string,
): void {
  const assetsMount = joinUiBasePath(mountPrefix, "/assets");
  app.use(
    assetsMount,
    express.static(path.join(uiDist, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );

  const indexPaths = mountPrefix
    ? [mountPrefix, `${mountPrefix}/`, `${mountPrefix}/index.html`]
    : ["/", "/index.html"];
  app.get(indexPaths, (_req, res) => {
    res.type("html").set("Cache-Control", "no-cache").send(readBrandedStaticIndexHtml(uiDist));
  });

  app.use(
    mountPrefix || "/",
    express.static(uiDist, {
      maxAge: "1h",
      setHeaders(res, filePath) {
        const override = staticUiCacheControl(filePath);
        if (override) {
          res.set("Cache-Control", override);
        }
      },
    }),
  );

  const serveSpaShell: express.RequestHandler = (req, res) => {
    const relativePath = mountPrefix ? stripUiBasePath(req.path, mountPrefix) : req.path;
    if (relativePath.startsWith("/assets/")) {
      res.status(404).end();
      return;
    }
    res
      .status(200)
      .set("Content-Type", "text/html")
      .set("Cache-Control", "no-cache")
      .end(readBrandedStaticIndexHtml(uiDist));
  };

  if (mountPrefix) {
    const escapedPrefix = mountPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    app.get(new RegExp(`^${escapedPrefix}(?:/.*)?$`), serveSpaShell);
  } else {
    app.get(/.*/, serveSpaShell);
  }
}

export function mountStaticUi(app: Express, uiDist: string, uiBasePath?: string | null): void {
  const normalizedBasePath = normalizeUiBasePath(uiBasePath);
  if (normalizedBasePath) {
    mountStaticUiAtPrefix(app, uiDist, normalizedBasePath);
  }
  mountStaticUiAtPrefix(app, uiDist, "");
}

export function resolveUiDistCandidates(serverDirname: string): string | null {
  const candidates = [
    path.resolve(serverDirname, "../ui-dist"),
    path.resolve(serverDirname, "../../ui/dist"),
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) ?? null;
}
