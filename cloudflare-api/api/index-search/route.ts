type InstrumentKind = "index" | "etf" | "commodity";
type IndexItem = { code:string; symbol:string; name:string; market:string; kind?:InstrumentKind };
type CatalogItem = IndexItem & { aliases:string[] };

const COMMON: CatalogItem[] = [
  { code:"GOLD.CN", symbol:"518880.SS", name:"国内黄金（华安黄金ETF）", market:"中国内地 · 人民币", kind:"etf", aliases:["黄金","黄金ETF","金价","AU9999","518880"] },
  { code:"GOLD", symbol:"GC=F", name:"国际黄金（COMEX）", market:"全球 · 美元/盎司", kind:"commodity", aliases:["黄金","国际金价","COMEX GOLD","GC"] },
  { code:"NDX", symbol:"^NDX", name:"纳斯达克100", market:"美国", aliases:["纳指100","NASDAQ100"] },
  { code:"SPX", symbol:"^GSPC", name:"标普500", market:"美国", aliases:["标准普尔500","S&P500","SP500"] },
  { code:"DJI", symbol:"^DJI", name:"道琼斯工业指数", market:"美国", aliases:["道指","DOW"] },
  { code:"IXIC", symbol:"^IXIC", name:"纳斯达克综合指数", market:"美国", aliases:["纳斯达克综合","NASDAQ"] },
  { code:"RUT", symbol:"^RUT", name:"罗素2000", market:"美国", aliases:["RUSSELL2000"] },
  { code:"SOX", symbol:"^SOX", name:"费城半导体指数", market:"美国", aliases:["半导体指数","PHLX"] },
  { code:"VIX", symbol:"^VIX", name:"标普500波动率指数", market:"美国", aliases:["恐慌指数"] },
  { code:"000300", symbol:"000300.SS", name:"沪深300", market:"中国内地", aliases:["CSI300"] },
  { code:"000510", symbol:"000510.SS", name:"中证A500", market:"中国内地", aliases:["A500"] },
  { code:"000905", symbol:"000905.SS", name:"中证500", market:"中国内地", aliases:["CSI500"] },
  { code:"000906", symbol:"000906.SS", name:"中证800", market:"中国内地", aliases:["CSI800"] },
  { code:"000852", symbol:"000852.SS", name:"中证1000", market:"中国内地", aliases:["CSI1000"] },
  { code:"932000", symbol:"932000.CSI", name:"中证2000", market:"中国内地", aliases:["CSI2000"] },
  { code:"000985", symbol:"000985.SS", name:"中证全指", market:"中国内地", aliases:["全市场"] },
  { code:"000016", symbol:"000016.SS", name:"上证50", market:"中国内地", aliases:["SSE50"] },
  { code:"000010", symbol:"000010.SS", name:"上证180", market:"中国内地", aliases:["SSE180"] },
  { code:"000009", symbol:"000009.SS", name:"上证380", market:"中国内地", aliases:["SSE380"] },
  { code:"000001", symbol:"000001.SS", name:"上证指数", market:"中国内地", aliases:["上证综指","SSECOMP"] },
  { code:"399001", symbol:"399001.SZ", name:"深证成指", market:"中国内地", aliases:["SZCOMP"] },
  { code:"399106", symbol:"399106.SZ", name:"深证综指", market:"中国内地", aliases:["深圳综合"] },
  { code:"399006", symbol:"399006.SZ", name:"创业板指", market:"中国内地", aliases:["创业板","CHINEXT"] },
  { code:"399673", symbol:"399673.SZ", name:"创业板50", market:"中国内地", aliases:["创业板50指数"] },
  { code:"399330", symbol:"399330.SZ", name:"深证100", market:"中国内地", aliases:["深证100指数"] },
  { code:"000688", symbol:"000688.SS", name:"科创50", market:"中国内地", aliases:["STAR50"] },
  { code:"000698", symbol:"000698.SS", name:"科创100", market:"中国内地", aliases:["STAR100"] },
  { code:"000015", symbol:"000015.SS", name:"上证红利", market:"中国内地", aliases:["红利指数"] },
  { code:"000922", symbol:"000922.SS", name:"中证红利", market:"中国内地", aliases:["CSI红利"] },
  { code:"930955", symbol:"930955.CSI", name:"中证红利低波动", market:"中国内地", aliases:["红利低波","红利低波动"] },
  { code:"000932", symbol:"000932.SS", name:"中证消费", market:"中国内地", aliases:["主要消费"] },
  { code:"000933", symbol:"000933.SS", name:"中证医药", market:"中国内地", aliases:["医药指数"] },
  { code:"000935", symbol:"000935.SS", name:"中证信息", market:"中国内地", aliases:["信息技术指数"] },
  { code:"000990", symbol:"000990.SS", name:"全指消费", market:"中国内地", aliases:["全指主要消费"] },
  { code:"000991", symbol:"000991.SS", name:"全指医药", market:"中国内地", aliases:["医药卫生"] },
  { code:"000993", symbol:"000993.SS", name:"全指信息", market:"中国内地", aliases:["信息技术"] },
  { code:"HSI", symbol:"^HSI", name:"恒生指数", market:"中国香港", aliases:["恒指"] },
  { code:"HSTECH", symbol:"HSTECH.HK", name:"恒生科技指数", market:"中国香港", aliases:["恒生科技"] },
  { code:"HSCEI", symbol:"^HSCE", name:"恒生中国企业指数", market:"中国香港", aliases:["国企指数","H股指数"] },
  { code:"N225", symbol:"^N225", name:"日经225", market:"日本", aliases:["日经指数","NIKKEI225"] },
  { code:"TOPX", symbol:"^TOPX", name:"东证指数", market:"日本", aliases:["TOPIX"] },
  { code:"KS11", symbol:"^KS11", name:"韩国综合指数", market:"韩国", aliases:["KOSPI"] },
  { code:"TWII", symbol:"^TWII", name:"台湾加权指数", market:"中国台湾", aliases:["台股加权"] },
  { code:"STOXX50E", symbol:"^STOXX50E", name:"欧洲斯托克50", market:"欧洲", aliases:["EUROSTOXX50"] },
  { code:"FTSE", symbol:"^FTSE", name:"英国富时100", market:"英国", aliases:["富时100"] },
  { code:"GDAXI", symbol:"^GDAXI", name:"德国DAX", market:"德国", aliases:["DAX"] },
  { code:"FCHI", symbol:"^FCHI", name:"法国CAC40", market:"法国", aliases:["CAC40"] },
  { code:"AXJO", symbol:"^AXJO", name:"澳大利亚标普200", market:"澳大利亚", aliases:["ASX200"] },
  { code:"BSESN", symbol:"^BSESN", name:"印度孟买SENSEX", market:"印度", aliases:["SENSEX"] },
];

function normalized(value:string) { return value.toUpperCase().replace(/[\s._^&-]/g, ""); }
function score(item:CatalogItem, query:string) {
  const q=normalized(query);
  const values=[item.code,item.symbol,item.name,...item.aliases].map(normalized);
  return values.some(v=>v===q)?3:values.some(v=>v.startsWith(q))?2:values.some(v=>v.includes(q))?1:0;
}

function manualResult(query:string):IndexItem|null {
  const raw=query.trim().toUpperCase();
  if (/^\d{6}$/.test(raw)) {
    const symbol=raw.startsWith("399")?`${raw}.SZ`:`${raw}.SS`;
    return { code:raw, symbol, name:`指数 ${raw}`, market:"中国内地（按代码添加）", kind:"index" };
  }
  if (/^\^[A-Z0-9._-]{1,20}$/.test(raw) || /^[A-Z0-9][A-Z0-9.^=_-]{0,24}\.(?:SS|SZ|HK|CSI)$/.test(raw) || /^[A-Z0-9][A-Z0-9.^=_-]{0,24}=F$/.test(raw)) {
    const kind:InstrumentKind = raw.endsWith("=F") ? "commodity" : "index";
    return { code:raw.replace(/^\^/,""), symbol:raw, name:`${kind==="index"?"指数":"品种"} ${raw}`, market:"按行情代码添加", kind };
  }
  return null;
}

export async function GET(request:Request) {
  const query=(new URL(request.url).searchParams.get("q")??"").trim().slice(0,80);
  if (!query) return Response.json({ results:COMMON.slice(0,12) });
  const local=COMMON.map(item=>({item,value:score(item,query)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).map(x=>x.item);
  let remote:IndexItem[]=[];
  try {
    const response=await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`, { headers:{"User-Agent":"Mozilla/5.0"} });
    if (response.ok) {
      const data=await response.json() as { quotes?:Array<{symbol?:string;shortname?:string;longname?:string;exchange?:string;exchDisp?:string;quoteType?:string}> };
      remote=(data.quotes??[]).filter(item=>item.symbol&&(item.quoteType==="INDEX"||item.quoteType==="ETF"))
        .map(item=>({code:item.symbol!.replace(/^\^/,""),symbol:item.symbol!,name:item.longname||item.shortname||item.symbol!,market:item.exchDisp||item.exchange||"其他市场",kind:item.quoteType==="ETF"?"etf" as const:"index" as const}));
    }
  } catch {}
  const manual=manualResult(query);
  const seen=new Set<string>();
  const results=[...local,...remote,...(manual?[manual]:[])].filter(item=>{const key=item.symbol.toUpperCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,20);
  return Response.json({ results });
}
