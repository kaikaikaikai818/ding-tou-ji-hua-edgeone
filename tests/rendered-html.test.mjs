import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders installable static app metadata", async () => {
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /rel="manifest" href="[^"]*\/manifest\.webmanifest"/i);
  assert.match(html, /mobile-web-app-capable/i);
  assert.match(html, /apple-mobile-web-app-title/i);
});

test("uses device-local persistence without a state API dependency", async () => {
  const source = await readFile(new URL("../app/slow-invest-app.tsx", import.meta.url), "utf8");
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /localStorage\.getItem\(STORAGE_KEY/);
  assert.doesNotMatch(source, /fetch\(["']\/api\/state/);
  assert.doesNotMatch(source, /fetch\([`"']\/api\/(?:market|index-search)/);
  assert.match(source, /market-data\.json/);
  assert.match(source, /index-catalog\.json/);
  await readFile(new URL("../public\/sw.js", import.meta.url), "utf8");
});
