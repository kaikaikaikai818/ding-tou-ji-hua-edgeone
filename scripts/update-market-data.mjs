import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMMON } from "../edge-functions/api/index-search.js";
import { GET as getMarket } from "../edge-functions/api/market.js";

const targetArg = process.argv.find(arg => arg.startsWith("--target="));
const target = path.resolve(targetArg ? targetArg.slice("--target=".length) : "public");
const catalogOnly = process.argv.includes("--catalog-only");
const marketPath = path.join(target, "market-data.json");
const catalogPath = path.join(target, "index-catalog.json");

await mkdir(target, { recursive: true });
await writeFile(catalogPath, `${JSON.stringify(COMMON, null, 2)}\n`, "utf8");

let previous = { updatedAt: null, lastAttemptAt: null, markets: {} };
try {
  previous = JSON.parse(await readFile(marketPath, "utf8"));
} catch {}

if (catalogOnly) {
  await writeFile(marketPath, `${JSON.stringify(previous, null, 2)}\n`, "utf8");
  console.log(`Wrote catalog with ${COMMON.length} entries to ${target}`);
  process.exit(0);
}

const unique = [...new Map(COMMON.map(item => [item.symbol.toUpperCase(), item])).values()];
const records = { ...(previous.markets || {}) };
let cursor = 0;
let succeeded = 0;

async function worker() {
  while (cursor < unique.length) {
    const item = unique[cursor++];
    const query = new URLSearchParams({
      code: item.code,
      symbol: item.symbol,
      name: item.name,
      kind: item.kind || "index",
    });
    try {
      const response = await getMarket(new Request(`https://local.invalid/api/market?${query}`));
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`);
      const record = { ...data, name: item.name, market: item.market, kind: item.kind || "index" };
      records[item.symbol.toUpperCase()] = record;
      records[item.code.toUpperCase()] = record;
      succeeded += 1;
    } catch (error) {
      console.warn(`Keeping previous data for ${item.symbol}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
const now = new Date().toISOString();
const output = {
  updatedAt: succeeded ? now : previous.updatedAt,
  lastAttemptAt: now,
  markets: records,
};
await writeFile(marketPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Updated ${succeeded}/${unique.length} instruments at ${now}`);
if (!succeeded && !Object.keys(records).length) console.warn("No market source succeeded; deploying the app with an empty market cache.");
