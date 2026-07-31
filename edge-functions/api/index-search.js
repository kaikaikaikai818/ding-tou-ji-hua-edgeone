const COMMON = [
  { code: "GOLD.CN", symbol: "518880.SS", name: "\u56FD\u5185\u9EC4\u91D1\uFF08\u534E\u5B89\u9EC4\u91D1ETF\uFF09", market: "\u4E2D\u56FD\u5185\u5730 \xB7 \u4EBA\u6C11\u5E01", kind: "etf", aliases: ["\u9EC4\u91D1", "\u9EC4\u91D1ETF", "\u91D1\u4EF7", "AU9999", "518880"] },
  { code: "GOLD", symbol: "GC=F", name: "\u56FD\u9645\u9EC4\u91D1\uFF08COMEX\uFF09", market: "\u5168\u7403 \xB7 \u7F8E\u5143/\u76CE\u53F8", kind: "commodity", aliases: ["\u9EC4\u91D1", "\u56FD\u9645\u91D1\u4EF7", "COMEX GOLD", "GC"] },
  { code: "NDX", symbol: "^NDX", name: "\u7EB3\u65AF\u8FBE\u514B100", market: "\u7F8E\u56FD", aliases: ["\u7EB3\u6307100", "NASDAQ100"] },
  { code: "SPX", symbol: "^GSPC", name: "\u6807\u666E500", market: "\u7F8E\u56FD", aliases: ["\u6807\u51C6\u666E\u5C14500", "S&P500", "SP500"] },
  { code: "DJI", symbol: "^DJI", name: "\u9053\u743C\u65AF\u5DE5\u4E1A\u6307\u6570", market: "\u7F8E\u56FD", aliases: ["\u9053\u6307", "DOW"] },
  { code: "IXIC", symbol: "^IXIC", name: "\u7EB3\u65AF\u8FBE\u514B\u7EFC\u5408\u6307\u6570", market: "\u7F8E\u56FD", aliases: ["\u7EB3\u65AF\u8FBE\u514B\u7EFC\u5408", "NASDAQ"] },
  { code: "RUT", symbol: "^RUT", name: "\u7F57\u7D202000", market: "\u7F8E\u56FD", aliases: ["RUSSELL2000"] },
  { code: "SOX", symbol: "^SOX", name: "\u8D39\u57CE\u534A\u5BFC\u4F53\u6307\u6570", market: "\u7F8E\u56FD", aliases: ["\u534A\u5BFC\u4F53\u6307\u6570", "PHLX"] },
  { code: "VIX", symbol: "^VIX", name: "\u6807\u666E500\u6CE2\u52A8\u7387\u6307\u6570", market: "\u7F8E\u56FD", aliases: ["\u6050\u614C\u6307\u6570"] },
  { code: "000300", symbol: "000300.SS", name: "\u6CAA\u6DF1300", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI300"] },
  { code: "000510", symbol: "000510.SS", name: "\u4E2D\u8BC1A500", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["A500"] },
  { code: "000905", symbol: "000905.SS", name: "\u4E2D\u8BC1500", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI500"] },
  { code: "000906", symbol: "000906.SS", name: "\u4E2D\u8BC1800", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI800"] },
  { code: "000852", symbol: "000852.SS", name: "\u4E2D\u8BC11000", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI1000"] },
  { code: "932000", symbol: "932000.CSI", name: "\u4E2D\u8BC12000", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI2000"] },
  { code: "000985", symbol: "000985.SS", name: "\u4E2D\u8BC1\u5168\u6307", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u5168\u5E02\u573A"] },
  { code: "000016", symbol: "000016.SS", name: "\u4E0A\u8BC150", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["SSE50"] },
  { code: "000010", symbol: "000010.SS", name: "\u4E0A\u8BC1180", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["SSE180"] },
  { code: "000009", symbol: "000009.SS", name: "\u4E0A\u8BC1380", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["SSE380"] },
  { code: "000001", symbol: "000001.SS", name: "\u4E0A\u8BC1\u6307\u6570", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u4E0A\u8BC1\u7EFC\u6307", "SSECOMP"] },
  { code: "399001", symbol: "399001.SZ", name: "\u6DF1\u8BC1\u6210\u6307", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["SZCOMP"] },
  { code: "399106", symbol: "399106.SZ", name: "\u6DF1\u8BC1\u7EFC\u6307", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u6DF1\u5733\u7EFC\u5408"] },
  { code: "399006", symbol: "399006.SZ", name: "\u521B\u4E1A\u677F\u6307", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u521B\u4E1A\u677F", "CHINEXT"] },
  { code: "399673", symbol: "399673.SZ", name: "\u521B\u4E1A\u677F50", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u521B\u4E1A\u677F50\u6307\u6570"] },
  { code: "399330", symbol: "399330.SZ", name: "\u6DF1\u8BC1100", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u6DF1\u8BC1100\u6307\u6570"] },
  { code: "000688", symbol: "000688.SS", name: "\u79D1\u521B50", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["STAR50"] },
  { code: "000698", symbol: "000698.SS", name: "\u79D1\u521B100", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["STAR100"] },
  { code: "000015", symbol: "000015.SS", name: "\u4E0A\u8BC1\u7EA2\u5229", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u7EA2\u5229\u6307\u6570"] },
  { code: "000922", symbol: "000922.SS", name: "\u4E2D\u8BC1\u7EA2\u5229", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["CSI\u7EA2\u5229"] },
  { code: "930955", symbol: "930955.CSI", name: "\u4E2D\u8BC1\u7EA2\u5229\u4F4E\u6CE2\u52A8", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u7EA2\u5229\u4F4E\u6CE2", "\u7EA2\u5229\u4F4E\u6CE2\u52A8"] },
  { code: "000932", symbol: "000932.SS", name: "\u4E2D\u8BC1\u6D88\u8D39", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u4E3B\u8981\u6D88\u8D39"] },
  { code: "000933", symbol: "000933.SS", name: "\u4E2D\u8BC1\u533B\u836F", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u533B\u836F\u6307\u6570"] },
  { code: "000935", symbol: "000935.SS", name: "\u4E2D\u8BC1\u4FE1\u606F", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u4FE1\u606F\u6280\u672F\u6307\u6570"] },
  { code: "000990", symbol: "000990.SS", name: "\u5168\u6307\u6D88\u8D39", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u5168\u6307\u4E3B\u8981\u6D88\u8D39"] },
  { code: "000991", symbol: "000991.SS", name: "\u5168\u6307\u533B\u836F", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u533B\u836F\u536B\u751F"] },
  { code: "000993", symbol: "000993.SS", name: "\u5168\u6307\u4FE1\u606F", market: "\u4E2D\u56FD\u5185\u5730", aliases: ["\u4FE1\u606F\u6280\u672F"] },
  { code: "HSI", symbol: "^HSI", name: "\u6052\u751F\u6307\u6570", market: "\u4E2D\u56FD\u9999\u6E2F", aliases: ["\u6052\u6307"] },
  { code: "HSTECH", symbol: "HSTECH.HK", name: "\u6052\u751F\u79D1\u6280\u6307\u6570", market: "\u4E2D\u56FD\u9999\u6E2F", aliases: ["\u6052\u751F\u79D1\u6280"] },
  { code: "HSCEI", symbol: "^HSCE", name: "\u6052\u751F\u4E2D\u56FD\u4F01\u4E1A\u6307\u6570", market: "\u4E2D\u56FD\u9999\u6E2F", aliases: ["\u56FD\u4F01\u6307\u6570", "H\u80A1\u6307\u6570"] },
  { code: "N225", symbol: "^N225", name: "\u65E5\u7ECF225", market: "\u65E5\u672C", aliases: ["\u65E5\u7ECF\u6307\u6570", "NIKKEI225"] },
  { code: "TOPX", symbol: "^TOPX", name: "\u4E1C\u8BC1\u6307\u6570", market: "\u65E5\u672C", aliases: ["TOPIX"] },
  { code: "KS11", symbol: "^KS11", name: "\u97E9\u56FD\u7EFC\u5408\u6307\u6570", market: "\u97E9\u56FD", aliases: ["KOSPI"] },
  { code: "TWII", symbol: "^TWII", name: "\u53F0\u6E7E\u52A0\u6743\u6307\u6570", market: "\u4E2D\u56FD\u53F0\u6E7E", aliases: ["\u53F0\u80A1\u52A0\u6743"] },
  { code: "STOXX50E", symbol: "^STOXX50E", name: "\u6B27\u6D32\u65AF\u6258\u514B50", market: "\u6B27\u6D32", aliases: ["EUROSTOXX50"] },
  { code: "FTSE", symbol: "^FTSE", name: "\u82F1\u56FD\u5BCC\u65F6100", market: "\u82F1\u56FD", aliases: ["\u5BCC\u65F6100"] },
  { code: "GDAXI", symbol: "^GDAXI", name: "\u5FB7\u56FDDAX", market: "\u5FB7\u56FD", aliases: ["DAX"] },
  { code: "FCHI", symbol: "^FCHI", name: "\u6CD5\u56FDCAC40", market: "\u6CD5\u56FD", aliases: ["CAC40"] },
  { code: "AXJO", symbol: "^AXJO", name: "\u6FB3\u5927\u5229\u4E9A\u6807\u666E200", market: "\u6FB3\u5927\u5229\u4E9A", aliases: ["ASX200"] },
  { code: "BSESN", symbol: "^BSESN", name: "\u5370\u5EA6\u5B5F\u4E70SENSEX", market: "\u5370\u5EA6", aliases: ["SENSEX"] }
];
function normalized(value) {
  return value.toUpperCase().replace(/[\s._^&-]/g, "");
}
function score(item, query) {
  const q = normalized(query);
  const values = [item.code, item.symbol, item.name, ...item.aliases].map(normalized);
  return values.some((v) => v === q) ? 3 : values.some((v) => v.startsWith(q)) ? 2 : values.some((v) => v.includes(q)) ? 1 : 0;
}
function manualResult(query) {
  const raw = query.trim().toUpperCase();
  if (/^\d{6}$/.test(raw)) {
    const symbol = raw.startsWith("399") ? `${raw}.SZ` : `${raw}.SS`;
    return { code: raw, symbol, name: `\u6307\u6570 ${raw}`, market: "\u4E2D\u56FD\u5185\u5730\uFF08\u6309\u4EE3\u7801\u6DFB\u52A0\uFF09", kind: "index" };
  }
  if (/^\^[A-Z0-9._-]{1,20}$/.test(raw) || /^[A-Z0-9][A-Z0-9.^=_-]{0,24}\.(?:SS|SZ|HK|CSI)$/.test(raw) || /^[A-Z0-9][A-Z0-9.^=_-]{0,24}=F$/.test(raw)) {
    const kind = raw.endsWith("=F") ? "commodity" : "index";
    return { code: raw.replace(/^\^/, ""), symbol: raw, name: `${kind === "index" ? "\u6307\u6570" : "\u54C1\u79CD"} ${raw}`, market: "\u6309\u884C\u60C5\u4EE3\u7801\u6DFB\u52A0", kind };
  }
  return null;
}
async function GET(request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!query) return Response.json({ results: COMMON.slice(0, 12) });
  const local = COMMON.map((item) => ({ item, value: score(item, query) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).map((x) => x.item);
  let remote = [];
  try {
    const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (response.ok) {
      const data = await response.json();
      remote = (data.quotes ?? []).filter((item) => item.symbol && (item.quoteType === "INDEX" || item.quoteType === "ETF")).map((item) => ({ code: item.symbol.replace(/^\^/, ""), symbol: item.symbol, name: item.longname || item.shortname || item.symbol, market: item.exchDisp || item.exchange || "\u5176\u4ED6\u5E02\u573A", kind: item.quoteType === "ETF" ? "etf" : "index" }));
    }
  } catch {
  }
  const manual = manualResult(query);
  const seen = /* @__PURE__ */ new Set();
  const results = [...local, ...remote, ...manual ? [manual] : []].filter((item) => {
    const key = item.symbol.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
  return Response.json({ results });
}
export {
  GET
};
export { GET as onRequestGet };
