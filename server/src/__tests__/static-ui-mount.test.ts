import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { mountStaticUi } from "../static-ui-mount.js";

describe("mountStaticUi", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function createUiDist(html = "<html><body>App</body></html>") {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-ui-dist-"));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    fs.writeFileSync(path.join(dir, "assets", "app.js"), "console.log('ok');");
    fs.writeFileSync(path.join(dir, "sw.js"), "self.addEventListener('install', () => {});");
    return dir;
  }

  it("serves the SPA shell at root and under a configured base path", async () => {
    const uiDist = createUiDist();
    const app = express();
    mountStaticUi(app, uiDist, "/board");

    await request(app).get("/").expect(200, "<html><body>App</body></html>");
    await request(app).get("/board/invite").expect(200, "<html><body>App</body></html>");
    await request(app).get("/board/assets/app.js").expect(200, "console.log('ok');");
  });

  it("returns 404 for missing hashed assets instead of the SPA shell", async () => {
    const uiDist = createUiDist();
    const app = express();
    mountStaticUi(app, uiDist, "/board");

    await request(app).get("/board/assets/missing.js").expect(404);
  });
});
