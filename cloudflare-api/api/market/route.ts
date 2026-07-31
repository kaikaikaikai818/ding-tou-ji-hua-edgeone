type Signal = {
  level: "多投" | "正常投" | "少投";
  multiplier: number;
  metricLabel: string;
  metricValue: string;
  reason: string;
};

type Strategy = "dividend" | "value" | "growth" | "small" | "gold" | "broad";
type InstrumentKind = "index" | "etf" | "commodity";
type HistoryResult = {
  price:number; previous:number; timestamp:number; closes:number[]; source:string;
  referenceNote?:string; priceUnit?:string; valueLabel?:string;
};

const LEGACY_SYMBOLS: Record<string, string> = {
  NDX: "^NDX", SPX: "^GSPC", CSI300: "000300.SS", CSI500: "000905.SS",
  CSI1000: "000852.SS", SSE50: "000016.SS", HSTECH: "HSTECH.HK",
  GOLD: "GC=F", "GOLD.CN": "518880.SS",
};

const TRACKING_PROXIES: Record<string, { symbol:string; name:string; unit:string }> = {
  "000922.SS": { symbol:"515080.SS", name:"招商中证红利ETF", unit:"元" },
  "000852.SS": { symbol:"512100.SS", name:"南方中证1000ETF", unit:"元" },
  "000905.SS": { symbol:"510500.SS", name:"南方中证500ETF", unit:"元" },
  "000300.SS": { symbol:"510300.SS", name:"华泰柏瑞沪深300ETF", unit:"元" },
  "000016.SS": { symbol:"510050.SS", name:"华夏上证50ETF", unit:"元" },
  "000015.SS": { symbol:"510880.SS", name:"华泰柏瑞上证红利ETF", unit:"元" },
  "399006.SZ": { symbol:"159915.SZ", name:"易方达创业板ETF", unit:"元" },
  "000688.SS": { symbol:"588000.SS", name:"华夏科创50ETF", unit:"元" },
  "930955.CSI": { symbol:"512890.SS", name:"华泰柏瑞红利低波ETF", unit:"元" },
  "HSTECH.HK": { symbol:"3033.HK", name:"南方东英恒生科技ETF", unit:"港元" },
};

const NAME_SYMBOLS: Array<[RegExp, string, string]> = [
  [/中证红利/, "000922", "000922.SS"],
  [/中证1000/, "000852", "000852.SS"],
  [/中证500/, "000905", "000905.SS"],
  [/沪深300/, "000300", "000300.SS"],
  [/恒生科技/, "HSTECH", "HSTECH.HK"],
  [/(国内黄金|黄金ETF|华安黄金)/, "GOLD.CN", "518880.SS"],
  [/(国际黄金|COMEX黄金)/i, "GOLD", "GC=F"],
];

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentileRank(values: number[], current: number) {
  if (!values.length) return 50;
  return (values.filter((value) => value <= current).length / values.length) * 100;
}

function inferStrategy(code: string, name: string): Strategy {
  const text = `${code} ${name}`.toUpperCase();
  if (/(黄金|GOLD|GC=F|518880)/.test(text)) return "gold";
  if (/(红利|DIVIDEND|低波|股息)/.test(text)) return "dividend";
  if (/(NASDAQ|NDX|科技|TECH|SOX|半导体|芯片|创业板|科创|GROWTH|人工智能|AI)/.test(text)) return "growth";
  if (/(1000|2000|SMALL|小盘|中证500|CSI500|RUT)/.test(text)) return "small";
  if (/(上证50|SSE50|沪深300|CSI300|VALUE|价值|银行|央企)/.test(text)) return "value";
  return "broad";
}

function buildSignal(strategy: Strategy, closes: number[], price: number): Signal {
  const recentYear = closes.slice(-Math.min(252, closes.length));
  const recentLong = closes.slice(-Math.min(756, closes.length));
  const maWindow = closes.slice(-Math.min(200, closes.length));
  const ma200 = average(maWindow);
  const high = Math.max(...recentYear);
  const low = Math.min(...recentYear);
  const drawdown = high ? ((price - high) / high) * 100 : 0;
  const maGap = ma200 ? ((price - ma200) / ma200) * 100 : 0;
  const rangePosition = high > low ? ((price - low) / (high - low)) * 100 : 50;
  const longPercentile = percentileRank(recentLong, price);

  if (strategy === "gold") {
    const metricLabel = "三年价格分位 + 200日均线（黄金）";
    const metricValue = `长期分位 ${longPercentile.toFixed(0)}%，较均线 ${maGap.toFixed(1)}%，较一年高点 ${drawdown.toFixed(1)}%`;
    if (longPercentile <= 30 && maGap <= 3) return { level:"多投", multiplier:1.25, metricLabel, metricValue, reason:"黄金处在近三年偏低位置且没有明显高于长期趋势，可适度提高本次投入。" };
    if (longPercentile >= 88 && maGap >= 15 && drawdown > -5) return { level:"少投", multiplier:0.7, metricLabel, metricValue, reason:"黄金位于近三年高位并明显高于长期均线，本次降低金额但不断投。" };
    return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"黄金价格位置未同时达到偏低或过热条件，按基础比例投入。" };
  }

  if (strategy === "dividend") {
    const metricLabel = "三年价格分位 + 一年回撤（红利型）";
    const metricValue = `长期分位 ${longPercentile.toFixed(0)}%，较一年高点 ${drawdown.toFixed(1)}%`;
    if (longPercentile <= 30 || drawdown <= -14) return { level:"多投", multiplier:1.25, metricLabel, metricValue, reason:"红利指数价格位置偏低，适合适度提高本次投入。" };
    if (longPercentile >= 85 && drawdown > -3) return { level:"少投", multiplier:0.75, metricLabel, metricValue, reason:"红利指数处在长期高位附近，本次降低金额。" };
    return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"红利指数没有进入明显极端区间，按基础比例投入。" };
  }

  if (strategy === "value") {
    const metricLabel = "三年价格分位 + 200日均线（大盘价值）";
    const metricValue = `长期分位 ${longPercentile.toFixed(0)}%，较均线 ${maGap.toFixed(1)}%`;
    if (longPercentile <= 28 && maGap <= 5) return { level:"多投", multiplier:1.3, metricLabel, metricValue, reason:"长期价格位置偏低，适合提高本次投入。" };
    if (longPercentile >= 82 && maGap >= 12) return { level:"少投", multiplier:0.7, metricLabel, metricValue, reason:"长期位置偏高，本次继续定投但降低金额。" };
    return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"长期位置没有进入明显极端区间，按基础比例投入。" };
  }

  if (strategy === "growth") {
    const metricLabel = "一年回撤 + 200日均线（成长科技）";
    const metricValue = `较一年高点 ${drawdown.toFixed(1)}%，较均线 ${maGap.toFixed(1)}%`;
    if (drawdown <= -18 || maGap <= -12) return { level:"多投", multiplier:1.35, metricLabel, metricValue, reason:"成长指数回撤已较深，按纪律提高本次投入。" };
    if (drawdown > -3 && maGap >= 20) return { level:"少投", multiplier:0.65, metricLabel, metricValue, reason:"成长指数接近高点且偏离长期均线较多，本次降低金额。" };
    return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"成长指数尚未到极端位置，按基础比例投入。" };
  }

  if (strategy === "small") {
    const metricLabel = "一年回撤 + 区间位置（中小盘）";
    const metricValue = `较一年高点 ${drawdown.toFixed(1)}%，区间位置 ${rangePosition.toFixed(0)}%`;
    if (drawdown <= -20 && rangePosition <= 35) return { level:"多投", multiplier:1.35, metricLabel, metricValue, reason:"中小盘波动较大，当前回撤与价格位置同时偏低。" };
    if (drawdown > -4 && rangePosition >= 88) return { level:"少投", multiplier:0.65, metricLabel, metricValue, reason:"中小盘指数处于一年区间高位，本次降低金额控制波动。" };
    return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"中小盘指数未到明显极端位置，按基础比例投入。" };
  }

  const metricLabel = "一年回撤 + 200日均线（宽基）";
  const metricValue = `较一年高点 ${drawdown.toFixed(1)}%，较均线 ${maGap.toFixed(1)}%`;
  if (drawdown <= -14 || maGap <= -10) return { level:"多投", multiplier:1.3, metricLabel, metricValue, reason:"宽基指数回撤较深，适合提高本次投入。" };
  if (drawdown > -3 && maGap >= 15) return { level:"少投", multiplier:0.7, metricLabel, metricValue, reason:"宽基指数位置偏热，本次不断投但降低金额。" };
  return { level:"正常投", multiplier:1, metricLabel, metricValue, reason:"宽基指数没有出现明显极端位置，按基础比例投入。" };
}

function mainlandCode(rawSymbol:string, code:string) {
  const fromSymbol = rawSymbol.match(/(^|[^0-9])(\d{6})(?:\.(?:SS|SZ|CSI))?$/i)?.[2];
  const fromCode = code.match(/^\d{6}$/)?.[0];
  return fromSymbol || fromCode || null;
}

async function fetchEastmoney(rawSymbol:string, code:string, kind:InstrumentKind="index"):Promise<HistoryResult> {
  const numeric = mainlandCode(rawSymbol, code);
  if (!numeric) throw new Error("not-mainland");
  const market = rawSymbol.toUpperCase().endsWith(".SZ") || numeric.startsWith("399") ? "0" : "1";
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${numeric}&klt=101&fqt=1&beg=0&end=20500101&lmt=1000&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56`;
  const response = await fetchWithTimeout(url, { "User-Agent":"Mozilla/5.0", "Referer":"https://quote.eastmoney.com/" });
  if (!response.ok) throw new Error("eastmoney-upstream");
  const payload = await response.json() as { data?:{ klines?:string[] } };
  const rows = payload.data?.klines ?? [];
  const closes = rows.map(row=>Number(row.split(",")[2])).filter(Number.isFinite);
  if (closes.length < 30) throw new Error("eastmoney-history");
  return {
    price:closes.at(-1)!, previous:closes.at(-2)!, timestamp:Date.now(), closes, source:"东方财富",
    valueLabel:kind==="etf"?"基金市场价":"指数点位", priceUnit:kind==="etf"?"元":"点",
  };
}

async function fetchEastmoneyHongKong(rawSymbol:string):Promise<HistoryResult> {
  const indexCode = rawSymbol.replace(/\.HK$/i, "").replace(/^\^/, "");
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=124.${indexCode}&klt=101&fqt=1&beg=0&end=20500101&lmt=1000&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56`;
  const response = await fetchWithTimeout(url, { "User-Agent":"Mozilla/5.0", "Referer":"https://quote.eastmoney.com/" });
  if (!response.ok) throw new Error("eastmoney-hk-upstream");
  const payload = await response.json() as { data?:{ klines?:string[] } };
  const closes = (payload.data?.klines ?? []).map(row=>Number(row.split(",")[2])).filter(Number.isFinite);
  if (closes.length < 30) throw new Error("eastmoney-hk-history");
  return { price:closes.at(-1)!, previous:closes.at(-2)!, timestamp:Date.now(), closes, source:"东方财富", valueLabel:"指数点位", priceUnit:"点" };
}

async function fetchWithTimeout(url:string, headers:Record<string,string>, timeoutMs=3200) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeoutMs);
  try { return await fetch(url, { headers, signal:controller.signal }); }
  finally { clearTimeout(timer); }
}

async function fetchYahoo(rawSymbol:string, kind:InstrumentKind="index"):Promise<HistoryResult> {
  const symbol = encodeURIComponent(rawSymbol);
  const response = await fetchWithTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3y&interval=1d`, { "User-Agent":"Mozilla/5.0" });
  if (!response.ok) throw new Error("yahoo-upstream");
  const data = await response.json() as { chart?:{ result?:Array<{ meta?:{ regularMarketPrice?:number; chartPreviousClose?:number; regularMarketTime?:number }; indicators?:{ quote?:Array<{ close?:Array<number|null> }> } }> } };
  const result = data.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close?.filter((v):v is number=>typeof v === "number") ?? [];
  const price = Number(result?.meta?.regularMarketPrice ?? closes.at(-1));
  const previous = Number(result?.meta?.chartPreviousClose ?? closes.at(-2));
  if (!Number.isFinite(price) || closes.length < 30) throw new Error("yahoo-history");
  const isGoldFuture = rawSymbol === "GC=F";
  return {
    price, previous,
    timestamp:result?.meta?.regularMarketTime ? result.meta.regularMarketTime*1000 : Date.now(),
    closes, source:"Yahoo Finance",
    valueLabel:isGoldFuture?"国际黄金价格":kind==="etf"?"基金市场价":"指数点位",
    priceUnit:isGoldFuture?"美元/盎司":kind==="index"?"点":undefined,
  };
}

async function fetchTrackingProxy(rawSymbol:string):Promise<HistoryResult> {
  const proxy = TRACKING_PROXIES[rawSymbol];
  if (!proxy) throw new Error("no-tracking-proxy");
  const history = await fetchYahoo(proxy.symbol, "etf");
  return {
    ...history,
    source:`Yahoo Finance · ${proxy.name}`,
    valueLabel:"跟踪基金参考价",
    referenceNote:`指数点位暂不可达，本次仅用${proxy.name}的历史走势辅助判断；这里显示的是基金价格，不是指数点位`,
    priceUnit:proxy.unit,
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let code = (params.get("code") ?? "").trim().toUpperCase();
  const name = (params.get("name") ?? code).trim().slice(0, 80);
  const requestedKind = (params.get("kind") ?? "index").trim() as InstrumentKind;
  const kind:InstrumentKind = requestedKind === "etf" || requestedKind === "commodity" ? requestedKind : "index";
  let rawSymbol = (params.get("symbol") ?? LEGACY_SYMBOLS[code] ?? code).trim().toUpperCase();
  const nameMatch = NAME_SYMBOLS.find(([pattern])=>pattern.test(name));
  if ((!code || !rawSymbol) && nameMatch) [code, rawSymbol] = [nameMatch[1], nameMatch[2]];
  if (rawSymbol === "^HSTECH") rawSymbol = "HSTECH.HK";
  if (!rawSymbol || rawSymbol.length > 32 || !/^[A-Z0-9.^=_-]+$/i.test(rawSymbol)) {
    return Response.json({ error:"指数代码格式不正确，请重新添加" }, { status:400 });
  }
  try {
    const isMainland = Boolean(mainlandCode(rawSymbol, code));
    let history:HistoryResult;
    if (isMainland) {
      // Mainland index codes are most reliably returned as real index points by
      // Eastmoney. Only use a tracking ETF after both index sources fail.
      try { history = await fetchEastmoney(rawSymbol, code, kind); }
      catch {
        try { history = await fetchYahoo(rawSymbol, kind); }
        catch { history = await fetchTrackingProxy(rawSymbol); }
      }
    } else if (rawSymbol === "HSTECH.HK") {
      try { history = await fetchYahoo(rawSymbol, "index"); }
      catch {
        try { history = await fetchEastmoneyHongKong(rawSymbol); }
        catch { history = await fetchTrackingProxy(rawSymbol); }
      }
    } else history = await fetchYahoo(rawSymbol, kind);
    if (rawSymbol === "518880.SS") {
      history.priceUnit = "元";
      history.valueLabel = "国内黄金ETF价格";
    }
    const strategy = inferStrategy(code, name);
    const signal = buildSignal(strategy, history.closes, history.price);
    return Response.json({
      code, symbol:rawSymbol, price:history.price,
      changePct:history.previous ? ((history.price-history.previous)/history.previous)*100 : null,
      timestamp:history.timestamp, source:history.source,
      delayNote:history.referenceNote||"行情可能延迟；判断基于历史价格位置",
      referenceNote:history.referenceNote, priceUnit:history.priceUnit, valueLabel:history.valueLabel,
      signal,
    });
  } catch {
    return Response.json({ error:"暂时取不到这个代码的历史行情，请核对代码后重试" }, { status:503 });
  }
}
