const LEGACY_SYMBOLS = {
  NDX: "^NDX",
  SPX: "^GSPC",
  CSI300: "000300.SS",
  CSI500: "000905.SS",
  CSI1000: "000852.SS",
  SSE50: "000016.SS",
  HSTECH: "HSTECH.HK",
  GOLD: "GC=F",
  "GOLD.CN": "518880.SS"
};
const TRACKING_PROXIES = {
  "000922.SS": { symbol: "515080.SS", name: "\u62DB\u5546\u4E2D\u8BC1\u7EA2\u5229ETF", unit: "\u5143" },
  "000852.SS": { symbol: "512100.SS", name: "\u5357\u65B9\u4E2D\u8BC11000ETF", unit: "\u5143" },
  "000905.SS": { symbol: "510500.SS", name: "\u5357\u65B9\u4E2D\u8BC1500ETF", unit: "\u5143" },
  "000300.SS": { symbol: "510300.SS", name: "\u534E\u6CF0\u67CF\u745E\u6CAA\u6DF1300ETF", unit: "\u5143" },
  "000016.SS": { symbol: "510050.SS", name: "\u534E\u590F\u4E0A\u8BC150ETF", unit: "\u5143" },
  "000015.SS": { symbol: "510880.SS", name: "\u534E\u6CF0\u67CF\u745E\u4E0A\u8BC1\u7EA2\u5229ETF", unit: "\u5143" },
  "399006.SZ": { symbol: "159915.SZ", name: "\u6613\u65B9\u8FBE\u521B\u4E1A\u677FETF", unit: "\u5143" },
  "000688.SS": { symbol: "588000.SS", name: "\u534E\u590F\u79D1\u521B50ETF", unit: "\u5143" },
  "930955.CSI": { symbol: "512890.SS", name: "\u534E\u6CF0\u67CF\u745E\u7EA2\u5229\u4F4E\u6CE2ETF", unit: "\u5143" },
  "HSTECH.HK": { symbol: "3033.HK", name: "\u5357\u65B9\u4E1C\u82F1\u6052\u751F\u79D1\u6280ETF", unit: "\u6E2F\u5143" }
};
const NAME_SYMBOLS = [
  [/中证红利/, "000922", "000922.SS"],
  [/中证1000/, "000852", "000852.SS"],
  [/中证500/, "000905", "000905.SS"],
  [/沪深300/, "000300", "000300.SS"],
  [/恒生科技/, "HSTECH", "HSTECH.HK"],
  [/(国内黄金|黄金ETF|华安黄金)/, "GOLD.CN", "518880.SS"],
  [/(国际黄金|COMEX黄金)/i, "GOLD", "GC=F"]
];
function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function percentileRank(values, current) {
  if (!values.length) return 50;
  return values.filter((value) => value <= current).length / values.length * 100;
}
function inferStrategy(code, name) {
  const text = `${code} ${name}`.toUpperCase();
  if (/(黄金|GOLD|GC=F|518880)/.test(text)) return "gold";
  if (/(红利|DIVIDEND|低波|股息)/.test(text)) return "dividend";
  if (/(NASDAQ|NDX|科技|TECH|SOX|半导体|芯片|创业板|科创|GROWTH|人工智能|AI)/.test(text)) return "growth";
  if (/(1000|2000|SMALL|小盘|中证500|CSI500|RUT)/.test(text)) return "small";
  if (/(上证50|SSE50|沪深300|CSI300|VALUE|价值|银行|央企)/.test(text)) return "value";
  return "broad";
}
function buildSignal(strategy, closes, price) {
  const recentYear = closes.slice(-Math.min(252, closes.length));
  const recentLong = closes.slice(-Math.min(756, closes.length));
  const maWindow = closes.slice(-Math.min(200, closes.length));
  const ma200 = average(maWindow);
  const high = Math.max(...recentYear);
  const low = Math.min(...recentYear);
  const drawdown = high ? (price - high) / high * 100 : 0;
  const maGap = ma200 ? (price - ma200) / ma200 * 100 : 0;
  const rangePosition = high > low ? (price - low) / (high - low) * 100 : 50;
  const longPercentile = percentileRank(recentLong, price);
  if (strategy === "gold") {
    const metricLabel2 = "\u4E09\u5E74\u4EF7\u683C\u5206\u4F4D + 200\u65E5\u5747\u7EBF\uFF08\u9EC4\u91D1\uFF09";
    const metricValue2 = `\u957F\u671F\u5206\u4F4D ${longPercentile.toFixed(0)}%\uFF0C\u8F83\u5747\u7EBF ${maGap.toFixed(1)}%\uFF0C\u8F83\u4E00\u5E74\u9AD8\u70B9 ${drawdown.toFixed(1)}%`;
    if (longPercentile <= 30 && maGap <= 3) return { level: "\u591A\u6295", multiplier: 1.25, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u9EC4\u91D1\u5904\u5728\u8FD1\u4E09\u5E74\u504F\u4F4E\u4F4D\u7F6E\u4E14\u6CA1\u6709\u660E\u663E\u9AD8\u4E8E\u957F\u671F\u8D8B\u52BF\uFF0C\u53EF\u9002\u5EA6\u63D0\u9AD8\u672C\u6B21\u6295\u5165\u3002" };
    if (longPercentile >= 88 && maGap >= 15 && drawdown > -5) return { level: "\u5C11\u6295", multiplier: 0.7, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u9EC4\u91D1\u4F4D\u4E8E\u8FD1\u4E09\u5E74\u9AD8\u4F4D\u5E76\u660E\u663E\u9AD8\u4E8E\u957F\u671F\u5747\u7EBF\uFF0C\u672C\u6B21\u964D\u4F4E\u91D1\u989D\u4F46\u4E0D\u65AD\u6295\u3002" };
    return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u9EC4\u91D1\u4EF7\u683C\u4F4D\u7F6E\u672A\u540C\u65F6\u8FBE\u5230\u504F\u4F4E\u6216\u8FC7\u70ED\u6761\u4EF6\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
  }
  if (strategy === "dividend") {
    const metricLabel2 = "\u4E09\u5E74\u4EF7\u683C\u5206\u4F4D + \u4E00\u5E74\u56DE\u64A4\uFF08\u7EA2\u5229\u578B\uFF09";
    const metricValue2 = `\u957F\u671F\u5206\u4F4D ${longPercentile.toFixed(0)}%\uFF0C\u8F83\u4E00\u5E74\u9AD8\u70B9 ${drawdown.toFixed(1)}%`;
    if (longPercentile <= 30 || drawdown <= -14) return { level: "\u591A\u6295", multiplier: 1.25, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u7EA2\u5229\u6307\u6570\u4EF7\u683C\u4F4D\u7F6E\u504F\u4F4E\uFF0C\u9002\u5408\u9002\u5EA6\u63D0\u9AD8\u672C\u6B21\u6295\u5165\u3002" };
    if (longPercentile >= 85 && drawdown > -3) return { level: "\u5C11\u6295", multiplier: 0.75, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u7EA2\u5229\u6307\u6570\u5904\u5728\u957F\u671F\u9AD8\u4F4D\u9644\u8FD1\uFF0C\u672C\u6B21\u964D\u4F4E\u91D1\u989D\u3002" };
    return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u7EA2\u5229\u6307\u6570\u6CA1\u6709\u8FDB\u5165\u660E\u663E\u6781\u7AEF\u533A\u95F4\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
  }
  if (strategy === "value") {
    const metricLabel2 = "\u4E09\u5E74\u4EF7\u683C\u5206\u4F4D + 200\u65E5\u5747\u7EBF\uFF08\u5927\u76D8\u4EF7\u503C\uFF09";
    const metricValue2 = `\u957F\u671F\u5206\u4F4D ${longPercentile.toFixed(0)}%\uFF0C\u8F83\u5747\u7EBF ${maGap.toFixed(1)}%`;
    if (longPercentile <= 28 && maGap <= 5) return { level: "\u591A\u6295", multiplier: 1.3, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u957F\u671F\u4EF7\u683C\u4F4D\u7F6E\u504F\u4F4E\uFF0C\u9002\u5408\u63D0\u9AD8\u672C\u6B21\u6295\u5165\u3002" };
    if (longPercentile >= 82 && maGap >= 12) return { level: "\u5C11\u6295", multiplier: 0.7, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u957F\u671F\u4F4D\u7F6E\u504F\u9AD8\uFF0C\u672C\u6B21\u7EE7\u7EED\u5B9A\u6295\u4F46\u964D\u4F4E\u91D1\u989D\u3002" };
    return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u957F\u671F\u4F4D\u7F6E\u6CA1\u6709\u8FDB\u5165\u660E\u663E\u6781\u7AEF\u533A\u95F4\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
  }
  if (strategy === "growth") {
    const metricLabel2 = "\u4E00\u5E74\u56DE\u64A4 + 200\u65E5\u5747\u7EBF\uFF08\u6210\u957F\u79D1\u6280\uFF09";
    const metricValue2 = `\u8F83\u4E00\u5E74\u9AD8\u70B9 ${drawdown.toFixed(1)}%\uFF0C\u8F83\u5747\u7EBF ${maGap.toFixed(1)}%`;
    if (drawdown <= -18 || maGap <= -12) return { level: "\u591A\u6295", multiplier: 1.35, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u6210\u957F\u6307\u6570\u56DE\u64A4\u5DF2\u8F83\u6DF1\uFF0C\u6309\u7EAA\u5F8B\u63D0\u9AD8\u672C\u6B21\u6295\u5165\u3002" };
    if (drawdown > -3 && maGap >= 20) return { level: "\u5C11\u6295", multiplier: 0.65, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u6210\u957F\u6307\u6570\u63A5\u8FD1\u9AD8\u70B9\u4E14\u504F\u79BB\u957F\u671F\u5747\u7EBF\u8F83\u591A\uFF0C\u672C\u6B21\u964D\u4F4E\u91D1\u989D\u3002" };
    return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u6210\u957F\u6307\u6570\u5C1A\u672A\u5230\u6781\u7AEF\u4F4D\u7F6E\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
  }
  if (strategy === "small") {
    const metricLabel2 = "\u4E00\u5E74\u56DE\u64A4 + \u533A\u95F4\u4F4D\u7F6E\uFF08\u4E2D\u5C0F\u76D8\uFF09";
    const metricValue2 = `\u8F83\u4E00\u5E74\u9AD8\u70B9 ${drawdown.toFixed(1)}%\uFF0C\u533A\u95F4\u4F4D\u7F6E ${rangePosition.toFixed(0)}%`;
    if (drawdown <= -20 && rangePosition <= 35) return { level: "\u591A\u6295", multiplier: 1.35, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u4E2D\u5C0F\u76D8\u6CE2\u52A8\u8F83\u5927\uFF0C\u5F53\u524D\u56DE\u64A4\u4E0E\u4EF7\u683C\u4F4D\u7F6E\u540C\u65F6\u504F\u4F4E\u3002" };
    if (drawdown > -4 && rangePosition >= 88) return { level: "\u5C11\u6295", multiplier: 0.65, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u4E2D\u5C0F\u76D8\u6307\u6570\u5904\u4E8E\u4E00\u5E74\u533A\u95F4\u9AD8\u4F4D\uFF0C\u672C\u6B21\u964D\u4F4E\u91D1\u989D\u63A7\u5236\u6CE2\u52A8\u3002" };
    return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel: metricLabel2, metricValue: metricValue2, reason: "\u4E2D\u5C0F\u76D8\u6307\u6570\u672A\u5230\u660E\u663E\u6781\u7AEF\u4F4D\u7F6E\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
  }
  const metricLabel = "\u4E00\u5E74\u56DE\u64A4 + 200\u65E5\u5747\u7EBF\uFF08\u5BBD\u57FA\uFF09";
  const metricValue = `\u8F83\u4E00\u5E74\u9AD8\u70B9 ${drawdown.toFixed(1)}%\uFF0C\u8F83\u5747\u7EBF ${maGap.toFixed(1)}%`;
  if (drawdown <= -14 || maGap <= -10) return { level: "\u591A\u6295", multiplier: 1.3, metricLabel, metricValue, reason: "\u5BBD\u57FA\u6307\u6570\u56DE\u64A4\u8F83\u6DF1\uFF0C\u9002\u5408\u63D0\u9AD8\u672C\u6B21\u6295\u5165\u3002" };
  if (drawdown > -3 && maGap >= 15) return { level: "\u5C11\u6295", multiplier: 0.7, metricLabel, metricValue, reason: "\u5BBD\u57FA\u6307\u6570\u4F4D\u7F6E\u504F\u70ED\uFF0C\u672C\u6B21\u4E0D\u65AD\u6295\u4F46\u964D\u4F4E\u91D1\u989D\u3002" };
  return { level: "\u6B63\u5E38\u6295", multiplier: 1, metricLabel, metricValue, reason: "\u5BBD\u57FA\u6307\u6570\u6CA1\u6709\u51FA\u73B0\u660E\u663E\u6781\u7AEF\u4F4D\u7F6E\uFF0C\u6309\u57FA\u7840\u6BD4\u4F8B\u6295\u5165\u3002" };
}
function mainlandCode(rawSymbol, code) {
  const fromSymbol = rawSymbol.match(/(^|[^0-9])(\d{6})(?:\.(?:SS|SZ|CSI))?$/i)?.[2];
  const fromCode = code.match(/^\d{6}$/)?.[0];
  return fromSymbol || fromCode || null;
}
async function fetchEastmoney(rawSymbol, code, kind = "index") {
  const numeric = mainlandCode(rawSymbol, code);
  if (!numeric) throw new Error("not-mainland");
  const market = rawSymbol.toUpperCase().endsWith(".SZ") || numeric.startsWith("399") ? "0" : "1";
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${numeric}&klt=101&fqt=1&beg=0&end=20500101&lmt=1000&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56`;
  const response = await fetchWithTimeout(url, { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" });
  if (!response.ok) throw new Error("eastmoney-upstream");
  const payload = await response.json();
  const rows = payload.data?.klines ?? [];
  const closes = rows.map((row) => Number(row.split(",")[2])).filter(Number.isFinite);
  if (closes.length < 30) throw new Error("eastmoney-history");
  return {
    price: closes.at(-1),
    previous: closes.at(-2),
    timestamp: Date.now(),
    closes,
    source: "\u4E1C\u65B9\u8D22\u5BCC",
    valueLabel: kind === "etf" ? "\u57FA\u91D1\u5E02\u573A\u4EF7" : "\u6307\u6570\u70B9\u4F4D",
    priceUnit: kind === "etf" ? "\u5143" : "\u70B9"
  };
}
async function fetchEastmoneyHongKong(rawSymbol) {
  const indexCode = rawSymbol.replace(/\.HK$/i, "").replace(/^\^/, "");
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=124.${indexCode}&klt=101&fqt=1&beg=0&end=20500101&lmt=1000&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56`;
  const response = await fetchWithTimeout(url, { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" });
  if (!response.ok) throw new Error("eastmoney-hk-upstream");
  const payload = await response.json();
  const closes = (payload.data?.klines ?? []).map((row) => Number(row.split(",")[2])).filter(Number.isFinite);
  if (closes.length < 30) throw new Error("eastmoney-hk-history");
  return { price: closes.at(-1), previous: closes.at(-2), timestamp: Date.now(), closes, source: "\u4E1C\u65B9\u8D22\u5BCC", valueLabel: "\u6307\u6570\u70B9\u4F4D", priceUnit: "\u70B9" };
}
async function fetchWithTimeout(url, headers, timeoutMs = 3200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
async function fetchYahoo(rawSymbol, kind = "index") {
  const symbol = encodeURIComponent(rawSymbol);
  const response = await fetchWithTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3y&interval=1d`, { "User-Agent": "Mozilla/5.0" });
  if (!response.ok) throw new Error("yahoo-upstream");
  const data = await response.json();
  const result = data.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close?.filter((v) => typeof v === "number") ?? [];
  const price = Number(result?.meta?.regularMarketPrice ?? closes.at(-1));
  const previous = Number(result?.meta?.chartPreviousClose ?? closes.at(-2));
  if (!Number.isFinite(price) || closes.length < 30) throw new Error("yahoo-history");
  const isGoldFuture = rawSymbol === "GC=F";
  return {
    price,
    previous,
    timestamp: result?.meta?.regularMarketTime ? result.meta.regularMarketTime * 1e3 : Date.now(),
    closes,
    source: "Yahoo Finance",
    valueLabel: isGoldFuture ? "\u56FD\u9645\u9EC4\u91D1\u4EF7\u683C" : kind === "etf" ? "\u57FA\u91D1\u5E02\u573A\u4EF7" : "\u6307\u6570\u70B9\u4F4D",
    priceUnit: isGoldFuture ? "\u7F8E\u5143/\u76CE\u53F8" : kind === "index" ? "\u70B9" : void 0
  };
}
async function fetchTrackingProxy(rawSymbol) {
  const proxy = TRACKING_PROXIES[rawSymbol];
  if (!proxy) throw new Error("no-tracking-proxy");
  const history = await fetchYahoo(proxy.symbol, "etf");
  return {
    ...history,
    source: `Yahoo Finance \xB7 ${proxy.name}`,
    valueLabel: "\u8DDF\u8E2A\u57FA\u91D1\u53C2\u8003\u4EF7",
    referenceNote: `\u6307\u6570\u70B9\u4F4D\u6682\u4E0D\u53EF\u8FBE\uFF0C\u672C\u6B21\u4EC5\u7528${proxy.name}\u7684\u5386\u53F2\u8D70\u52BF\u8F85\u52A9\u5224\u65AD\uFF1B\u8FD9\u91CC\u663E\u793A\u7684\u662F\u57FA\u91D1\u4EF7\u683C\uFF0C\u4E0D\u662F\u6307\u6570\u70B9\u4F4D`,
    priceUnit: proxy.unit
  };
}
async function GET(request) {
  const params = new URL(request.url).searchParams;
  let code = (params.get("code") ?? "").trim().toUpperCase();
  const name = (params.get("name") ?? code).trim().slice(0, 80);
  const requestedKind = (params.get("kind") ?? "index").trim();
  const kind = requestedKind === "etf" || requestedKind === "commodity" ? requestedKind : "index";
  let rawSymbol = (params.get("symbol") ?? LEGACY_SYMBOLS[code] ?? code).trim().toUpperCase();
  const nameMatch = NAME_SYMBOLS.find(([pattern]) => pattern.test(name));
  if ((!code || !rawSymbol) && nameMatch) [code, rawSymbol] = [nameMatch[1], nameMatch[2]];
  if (rawSymbol === "^HSTECH") rawSymbol = "HSTECH.HK";
  if (!rawSymbol || rawSymbol.length > 32 || !/^[A-Z0-9.^=_-]+$/i.test(rawSymbol)) {
    return Response.json({ error: "\u6307\u6570\u4EE3\u7801\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u8BF7\u91CD\u65B0\u6DFB\u52A0" }, { status: 400 });
  }
  try {
    const isMainland = Boolean(mainlandCode(rawSymbol, code));
    let history;
    if (isMainland) {
      try {
        history = await fetchEastmoney(rawSymbol, code, kind);
      } catch {
        try {
          history = await fetchYahoo(rawSymbol, kind);
        } catch {
          history = await fetchTrackingProxy(rawSymbol);
        }
      }
    } else if (rawSymbol === "HSTECH.HK") {
      try {
        history = await fetchYahoo(rawSymbol, "index");
      } catch {
        try {
          history = await fetchEastmoneyHongKong(rawSymbol);
        } catch {
          history = await fetchTrackingProxy(rawSymbol);
        }
      }
    } else history = await fetchYahoo(rawSymbol, kind);
    if (rawSymbol === "518880.SS") {
      history.priceUnit = "\u5143";
      history.valueLabel = "\u56FD\u5185\u9EC4\u91D1ETF\u4EF7\u683C";
    }
    const strategy = inferStrategy(code, name);
    const signal = buildSignal(strategy, history.closes, history.price);
    return Response.json({
      code,
      symbol: rawSymbol,
      price: history.price,
      changePct: history.previous ? (history.price - history.previous) / history.previous * 100 : null,
      timestamp: history.timestamp,
      source: history.source,
      delayNote: history.referenceNote || "\u884C\u60C5\u53EF\u80FD\u5EF6\u8FDF\uFF1B\u5224\u65AD\u57FA\u4E8E\u5386\u53F2\u4EF7\u683C\u4F4D\u7F6E",
      referenceNote: history.referenceNote,
      priceUnit: history.priceUnit,
      valueLabel: history.valueLabel,
      signal
    });
  } catch {
    return Response.json({ error: "\u6682\u65F6\u53D6\u4E0D\u5230\u8FD9\u4E2A\u4EE3\u7801\u7684\u5386\u53F2\u884C\u60C5\uFF0C\u8BF7\u6838\u5BF9\u4EE3\u7801\u540E\u91CD\u8BD5" }, { status: 503 });
  }
}
export {
  GET
};
export { GET as onRequestGet };
