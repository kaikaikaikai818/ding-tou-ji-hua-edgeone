"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InstrumentKind = "index"|"etf"|"commodity";
type Asset = { id:string; name:string; code:string; symbol?:string; kind?:InstrumentKind; ratio:number; cost:number; value:number };
type BuyRecord = { id:string; date:string; assetId:string; assetName?:string; amount:number };
type Account = { id:string; name:string; balance:number; tone:string };
type AccountRecord = { id:string; date:string; accountId:string; accountName?:string; delta:number; note:string };
type Signal = { level:"多投"|"正常投"|"少投"; multiplier:number; metricLabel:string; metricValue:string; reason:string };
type Market = { price?:number; changePct?:number|null; timestamp?:number; source?:string; delayNote?:string; referenceNote?:string; priceUnit?:string; valueLabel?:string; signal?:Signal; error?:string };
type IndexSearchResult = { code:string; symbol:string; name:string; market:string; kind?:InstrumentKind };
type Cadence = "daily"|"weekly"|"biweekly"|"monthly";
type InvestPlan = { cadence:Cadence; weekday:number; monthlyDay:number; anchorDate:string };
type AppState = {
  surplus:number; emergencyTarget:number; investMonthly:number; investDay:number;
  investPlan:InvestPlan;
  assets:Asset[]; records:BuyRecord[]; accounts:Account[]; accountRecords:AccountRecord[];
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome:"accepted"|"dismissed" }>;
};

const STORAGE_KEY = "ding-tou-ji-hua:state:v1";

const defaultAccounts: Account[] = [
  { id:"living", name:"生活账户", balance:0, tone:"blue" },
  { id:"investing", name:"投资账户", balance:0, tone:"jade" },
  { id:"opportunity", name:"机会账户", balance:0, tone:"orange" },
  { id:"reserve", name:"备用金", balance:0, tone:"purple" },
];

const legacyMethods:Record<string,string> = {
  NDX:"高点回撤 + 200日均线（成长型）", SPX:"一年回撤 + 200日均线（宽基）",
  CSI300:"三年价格分位 + 200日均线", CSI500:"波动回撤 + 一年价格位置（小盘型）",
  CSI1000:"波动回撤 + 一年价格位置（小盘型）", SSE50:"三年价格分位 + 200日均线",
};

const money = (n:number) => `¥${Number(n || 0).toLocaleString("zh-CN", { maximumFractionDigits:2, minimumFractionDigits:2 })}`;
const today = () => new Date().toLocaleDateString("sv-SE");
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const atMidnight = (d=new Date()) => new Date(d.getFullYear(),d.getMonth(),d.getDate());
const parseLocalDate = (value:string) => { const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d); };
const dateKey = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const monthLabel = (value:string) => { const [y,m]=value.split("-").map(Number); return `${y}年${m}月`; };
const daysInMonth = (year:number,month:number) => new Date(year,month+1,0).getDate();
function monthSchedule(plan:InvestPlan,year:number,month:number){
  const dates:Date[]=[];
  const last=daysInMonth(year,month);
  if(plan.cadence==="daily") for(let day=1;day<=last;day++) dates.push(new Date(year,month,day));
  if(plan.cadence==="weekly") for(let day=1;day<=last;day++){const d=new Date(year,month,day);if(d.getDay()===plan.weekday)dates.push(d);}
  if(plan.cadence==="monthly") dates.push(new Date(year,month,Math.min(last,Math.max(1,plan.monthlyDay))));
  if(plan.cadence==="biweekly"){
    const anchor=parseLocalDate(plan.anchorDate||today());
    for(let day=1;day<=last;day++){const d=new Date(year,month,day);const diff=Math.round((d.getTime()-anchor.getTime())/86400000);if(diff%14===0)dates.push(d);}
  }
  return dates;
}
function nextScheduledDate(plan:InvestPlan,from=new Date()){
  const base=atMidnight(from);
  for(let offset=0;offset<14;offset++){
    const probe=new Date(base.getFullYear(),base.getMonth()+offset,1);
    const found=monthSchedule(plan,probe.getFullYear(),probe.getMonth()).find(d=>d>=base);
    if(found)return found;
  }
  return base;
}
const cadenceLabel=(plan:InvestPlan)=>plan.cadence==="daily"?"每天":plan.cadence==="weekly"?`每周${["日","一","二","三","四","五","六"][plan.weekday]}`:plan.cadence==="biweekly"?"每两周":`每月 ${plan.monthlyDay} 日`;
const signalClass = (level?:Signal["level"]) => level==="多投"?"signal-more":level==="少投"?"signal-less":"signal-normal";
const moneyDraft = (value:string) => {
  const cleaned=value.replace(/[^\d.]/g,"");
  const [whole="",...decimalParts]=cleaned.split(".");
  const normalizedWhole=whole.replace(/^0+(?=\d)/,"");
  return decimalParts.length
    ? `${normalizedWhole||"0"}.${decimalParts.join("").slice(0,2)}`
    : normalizedWhole;
};

const initialState: AppState = {
  surplus:2000, emergencyTarget:12000, investMonthly:800, investDay:15,
  investPlan:{ cadence:"monthly", weekday:1, monthlyDay:15, anchorDate:today() },
  accounts:defaultAccounts, accountRecords:[],
  assets:[
    { id:"ndx", name:"纳斯达克100", code:"NDX", ratio:50, cost:0, value:0 },
    { id:"spx", name:"标普500", code:"SPX", ratio:30, cost:0, value:0 },
    { id:"csi300", name:"沪深300", code:"CSI300", ratio:20, cost:0, value:0 },
  ],
  records:[],
};

const knownAssetIdentity: Array<{match:(asset:Asset)=>boolean; code:string; symbol:string}> = [
  { match:a=>a.code==="GOLD.CN"||/国内黄金|黄金ETF|华安黄金/.test(a.name), code:"GOLD.CN", symbol:"518880.SS" },
  { match:a=>a.code==="GOLD"||/国际黄金|COMEX黄金/.test(a.name), code:"GOLD", symbol:"GC=F" },
  { match:a=>a.code==="CSI1000"||/中证1000/.test(a.name), code:"000852", symbol:"000852.SS" },
  { match:a=>a.code==="CSI500"||/中证500/.test(a.name), code:"000905", symbol:"000905.SS" },
  { match:a=>a.code==="CSI300"||/沪深300/.test(a.name), code:"000300", symbol:"000300.SS" },
  { match:a=>a.code==="SSE50"||/上证50/.test(a.name), code:"000016", symbol:"000016.SS" },
  { match:a=>/中证红利/.test(a.name), code:"000922", symbol:"000922.SS" },
  { match:a=>a.code==="HSTECH"||/恒生科技/.test(a.name), code:"HSTECH", symbol:"HSTECH.HK" },
  { match:a=>a.code==="NDX"||/纳斯达克100/.test(a.name), code:"NDX", symbol:"^NDX" },
  { match:a=>a.code==="SPX"||/标普500/.test(a.name), code:"SPX", symbol:"^GSPC" },
];

function normalizeAsset(asset:Asset):Asset {
  const base={id:asset.id||uid(),name:asset.name||"未命名指数",code:(asset.code||"").toUpperCase(),symbol:asset.symbol?.toUpperCase(),kind:asset.kind,ratio:Number(asset.ratio||0),cost:Number(asset.cost||0),value:Number(asset.value||0)};
  const known=knownAssetIdentity.find(item=>item.match(base));
  if (!known) return base;
  return {...base,code:known.code,symbol:known.symbol};
}

function normalizeState(raw:Partial<AppState> & { emergencySaved?:number }) : AppState {
  const accounts = Array.isArray(raw.accounts) && raw.accounts.length
    ? raw.accounts.map((account,index)=>({
        ...defaultAccounts[index],
        ...account,
        balance:Math.max(0,Number(account.balance)||0),
      }))
    : defaultAccounts.map(a=>a.id==="reserve"?{...a,balance:Number(raw.emergencySaved||0)}:a);
  return {
    ...initialState,
    ...raw,
    investPlan:raw.investPlan||{...initialState.investPlan,monthlyDay:Number(raw.investDay||15)},
    accounts,
    accountRecords:Array.isArray(raw.accountRecords)?raw.accountRecords:[],
    assets:Array.isArray(raw.assets)?raw.assets.map(normalizeAsset):initialState.assets.map(normalizeAsset),
    records:Array.isArray(raw.records)?raw.records:[],
  };
}

export default function SlowInvestApp() {
  const [state,setState]=useState<AppState>(initialState);
  const [loaded,setLoaded]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(false);
  const [tab,setTab]=useState<"today"|"accounts"|"indexes"|"records">("today");
  const [modal,setModal]=useState<"buy"|"asset"|"account"|"plan"|null>(null);
  const [activeAccount,setActiveAccount]=useState<string>("living");
  const [markets,setMarkets]=useState<Record<string,Market>>({});
  const [marketLoading,setMarketLoading]=useState(false);
  const [accountDrafts,setAccountDrafts]=useState<Record<string,string>>({});
  const [indexQuery,setIndexQuery]=useState("");
  const [indexResults,setIndexResults]=useState<IndexSearchResult[]>([]);
  const [selectedIndex,setSelectedIndex]=useState<IndexSearchResult|null>(null);
  const [indexSearching,setIndexSearching]=useState(false);
  const [indexSearchError,setIndexSearchError]=useState("");
  const [recordMonth,setRecordMonth]=useState(today().slice(0,7));
  const [selectedRecordDate,setSelectedRecordDate]=useState(today());
  const [installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null);
  const skipFirst=useRef(true);

  useEffect(()=>{
    queueMicrotask(()=>{
      try {
        const saved=localStorage.getItem(STORAGE_KEY);
        if(saved)setState(normalizeState(JSON.parse(saved)));
      } catch {
        setSaveError(true);
      } finally {
        setLoaded(true);
      }
    });
  },[]);
  useEffect(()=>{
    if(!loaded)return;
    if(skipFirst.current){skipFirst.current=false;return;}
    const timer=setTimeout(()=>{
      setSaving(true);
      setSaveError(false);
      try {
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      } catch {
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    },300);
    return()=>clearTimeout(timer);
  },[state,loaded]);
  useEffect(()=>{
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
    const capture=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallPromptEvent);};
    window.addEventListener("beforeinstallprompt",capture);
    return()=>window.removeEventListener("beforeinstallprompt",capture);
  },[]);
  useEffect(()=>{ if(!loaded||!state.assets.length)return; refreshMarkets(); /* refresh when the followed list changes */ // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loaded,state.assets.map(a=>a.code).join("|")]);

  const totalInvested=useMemo(()=>state.assets.reduce((sum,asset)=>sum+asset.cost,0),[state.assets]);
  const accountTotal=state.accounts.reduce((s,a)=>s+a.balance,0);
  const reserve=state.accounts.find(a=>a.id==="reserve");
  const emergencyPct=Math.min(100,state.emergencyTarget?(reserve?.balance||0)/state.emergencyTarget*100:0);
  const ratioTotal=state.assets.reduce((s,a)=>s+a.ratio,0);
  const now=atMidnight();
  const investDate=nextScheduledDate(state.investPlan,now);
  const days=Math.ceil((investDate.getTime()-new Date().setHours(0,0,0,0))/86400000);
  const thisMonthDates=monthSchedule(state.investPlan,now.getFullYear(),now.getMonth());
  const remainingDates=thisMonthDates.filter(d=>d>=now);
  const installmentCount=Math.max(1,thisMonthDates.length);
  const installmentBudget=Math.round(state.investMonthly/installmentCount*100)/100;
  const [recordYear,recordMonthNumber]=recordMonth.split("-").map(Number);
  const recordMonthDays=daysInMonth(recordYear,recordMonthNumber-1);
  const recordMonthOffset=new Date(recordYear,recordMonthNumber-1,1).getDay();
  const buyTotalsByDate=useMemo(()=>state.records.reduce<Record<string,number>>((acc,record)=>{acc[record.date]=(acc[record.date]||0)+record.amount;return acc;},{}),[state.records]);
  const accountCountsByDate=useMemo(()=>state.accountRecords.reduce<Record<string,number>>((acc,record)=>{acc[record.date]=(acc[record.date]||0)+1;return acc;},{}),[state.accountRecords]);
  const selectedBuyRecords=state.records.filter(record=>record.date===selectedRecordDate);
  const selectedAccountRecords=state.accountRecords.filter(record=>record.date===selectedRecordDate);

  const suggestions=useMemo(()=>{
    if(!state.assets.length)return [];
    const weights=state.assets.map(a=>({asset:a,weight:Math.max(0,a.ratio)*(markets[a.id]?.signal?.multiplier||1)}));
    const totalWeight=weights.reduce((s,x)=>s+x.weight,0);
    let assigned=0;
    return weights.map((x,index)=>{
      const suggested=index===weights.length-1
        ? Math.max(0,installmentBudget-assigned)
        : Math.round((totalWeight?installmentBudget*x.weight/totalWeight:0)*100)/100;
      assigned+=suggested;
      return {...x.asset,suggested,signal:markets[x.asset.id]?.signal};
    });
  },[state.assets,installmentBudget,markets]);

  const update=(patch:Partial<AppState>)=>setState(s=>({...s,...patch}));
  const setAccountBalance=(id:string,balance:number)=>setState(s=>({...s,accounts:s.accounts.map(a=>a.id===id?{...a,balance:Math.max(0,balance||0)}:a)}));
  const editAccountBalance=(id:string,value:string)=>{
    const next=moneyDraft(value);
    setAccountDrafts(d=>({...d,[id]:next}));
    setAccountBalance(id,Number(next)||0);
  };
  const finishAccountBalance=(id:string)=>setAccountDrafts(d=>{const next={...d};delete next[id];return next;});
  const changeRecordMonth=(delta:number)=>{
    const next=new Date(recordYear,recordMonthNumber-1+delta,1);
    const nextMonth=dateKey(next).slice(0,7);
    setRecordMonth(nextMonth);
    setSelectedRecordDate(`${nextMonth}-01`);
  };
  const updateAsset=(id:string,patch:Partial<Asset>)=>setState(s=>({...s,assets:s.assets.map(a=>a.id===id?{...a,...patch}:a)}));
  const removeAsset=(id:string)=>{ if(!confirm("确定取消关注这个指数吗？历史买入记录会保留。"))return; setState(s=>({...s,assets:s.assets.filter(a=>a.id!==id)})); };

  async function refreshMarkets(){
    setMarketLoading(true);
    const results=await Promise.all(state.assets.map(async a=>{
      try{
        const params=new URLSearchParams({code:a.code,name:a.name,kind:a.kind||"index"});if(a.symbol)params.set("symbol",a.symbol);
        const r=await fetch(`/api/market?${params}`,{cache:"no-store"});
        const data=await r.json() as Market;
        return [a.id,r.ok?data:{error:data.error||"暂时取不到行情，请稍后重试"}] as const;
      }catch{return[a.id,{error:"网络异常，请稍后重试"}] as const;}
    }));
    setMarkets(Object.fromEntries(results));
    setMarketLoading(false);
  }
  async function searchIndexes(){
    const query=indexQuery.trim(); if(!query)return;
    setIndexSearching(true); setIndexSearchError(""); setSelectedIndex(null);
    try{
      const r=await fetch(`/api/index-search?q=${encodeURIComponent(query)}`,{cache:"no-store"});
      const data=await r.json() as {results?:IndexSearchResult[]};
      const results=data.results||[]; setIndexResults(results);
      if(results.length===1)setSelectedIndex(results[0]);
      if(!results.length)setIndexSearchError("没有找到，请检查名称或代码。可输入如 黄金、000300、^NDX、GC=F。");
    }catch{setIndexSearchError("暂时无法搜索，请稍后再试。");setIndexResults([]);}
    finally{setIndexSearching(false);}
  }
  function openIndexModal(){
    setIndexQuery("");setIndexResults([]);setSelectedIndex(null);setIndexSearchError("");setModal("asset");
  }
  function addAsset(form:FormData){
    if(!selectedIndex)return;
    if(state.assets.some(a=>(a.symbol||a.code).toUpperCase()===selectedIndex.symbol.toUpperCase())){setIndexSearchError("这个指数已经在关注列表中。");return;}
    const displayName=String(form.get("displayName")||selectedIndex.name).trim()||selectedIndex.name;
    setState(s=>({...s,assets:[...s.assets,{id:uid(),name:displayName,code:selectedIndex.code,symbol:selectedIndex.symbol,kind:selectedIndex.kind||"index",ratio:Number(form.get("ratio")||0),cost:0,value:0}]}));
    setModal(null);
  }
  function addBuy(form:FormData){
    const date=String(form.get("date")||today());
    const entries=state.assets.map(a=>({asset:a,amount:Number(form.get(a.id)||0)})).filter(x=>x.amount>0);
    if(!entries.length)return;
    setState(s=>({...s,assets:s.assets.map(a=>{const amount=entries.find(x=>x.asset.id===a.id)?.amount||0;return{...a,cost:a.cost+amount};}),records:[...s.records,...entries.map(x=>({id:uid(),date,assetId:x.asset.id,assetName:x.asset.name,amount:x.amount}))]}));
    setModal(null);
  }
  function addAccountRecord(form:FormData){
    const account=state.accounts.find(a=>a.id===activeAccount); if(!account)return;
    const amount=Math.abs(Number(form.get("amount")||0)); if(!amount)return;
    const delta=String(form.get("direction"))==="out"?-amount:amount;
    const record:AccountRecord={id:uid(),date:String(form.get("date")||today()),accountId:account.id,accountName:account.name,delta,note:String(form.get("note")||"").trim()};
    setState(s=>({...s,accounts:s.accounts.map(a=>a.id===account.id?{...a,balance:a.balance+delta}:a),accountRecords:[...s.accountRecords,record]}));
    setModal(null);
  }
  function deleteBuyRecord(id:string){ const r=state.records.find(x=>x.id===id); if(!r||!confirm("确定删除这条买入记录吗？"))return; setState(s=>({...s,records:s.records.filter(x=>x.id!==id),assets:s.assets.map(a=>a.id===r.assetId?{...a,cost:Math.max(0,a.cost-r.amount)}:a)})); }
  function deleteAccountRecord(id:string){ const r=state.accountRecords.find(x=>x.id===id); if(!r||!confirm("确定撤销这条账户记录吗？余额会自动回退。"))return; setState(s=>({...s,accountRecords:s.accountRecords.filter(x=>x.id!==id),accounts:s.accounts.map(a=>a.id===r.accountId?{...a,balance:a.balance-r.delta}:a)})); }
  function exportData(){
    const backup={app:"定投计划",version:1,exportedAt:new Date().toISOString(),state};
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`定投计划备份-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importData(file?:File){
    if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      const restored=parsed?.app==="定投计划"&&parsed?.state?parsed.state:parsed;
      if(!restored||typeof restored!=="object"||!Array.isArray(restored.assets)||!Array.isArray(restored.accounts))throw new Error();
      if(!confirm("恢复后会覆盖这台设备当前的数据，确定继续吗？"))return;
      setState(normalizeState(restored));
      alert("备份已恢复，并已保存到这台设备。");
    }catch{alert("备份文件无法识别，请选择由本 App 下载的 JSON 文件。");}
  }
  function clearLocalData(){
    if(!confirm("确定清空这台设备里的账户、定投和记录吗？建议先下载备份。"))return;
    setState(normalizeState(initialState));
    setMarkets({});
    alert("本机数据已清空。");
  }
  async function installApp(){
    if(installPrompt){
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    alert("iPhone：用 Safari 打开，点底部分享按钮，再选“添加到主屏幕”。\n\n安卓：点浏览器菜单，选择“安装应用”或“添加到主屏幕”。");
  }
  function openAccount(id:string){setActiveAccount(id);setModal("account");}
  function savePlan(form:FormData){
    const cadence=String(form.get("cadence")||"monthly") as Cadence;
    const investPlan:InvestPlan={cadence,weekday:Number(form.get("weekday")||1),monthlyDay:Math.min(31,Math.max(1,Number(form.get("monthlyDay")||15))),anchorDate:String(form.get("anchorDate")||today())};
    setState(s=>({...s,investPlan,investDay:investPlan.monthlyDay}));
    setModal(null);
  }

  if(!loaded)return <div className="loading">正在读取你的定投计划…</div>;
  return <main className="shell">
    <header className="topbar"><div><div className="brand">定投<span>计划</span></div><div className="subtitle">账户记一笔，定投看结果</div></div><div className={`save-status ${saveError?"warn":""}`}>{saving?"保存中…":saveError?"本机保存失败":"已保存到本机"}</div></header>
    <div className="content">
      {tab==="today"&&<div className="grid-main">
        <div className="stack">
          <section className="card hero"><div className="hero-title-row"><div><div className="eyebrow">本月定投</div><div className="decision">{days===0?"今天执行定投":days<=3?`${days} 天后定投`:"本月这样投"}</div></div><button className="plan-button" onClick={()=>setModal("plan")}>设置计划</button></div><div className="decision-detail">系统已按每个指数当前所处位置，自动调整多投或少投。</div><div className="plan-summary"><span>{cadenceLabel(state.investPlan)}</span><span>本月 {thisMonthDates.length} 次</span><span>每次约 {money(installmentBudget)}</span></div><div className="month-input"><span>这个月准备投入</span><input aria-label="这个月准备投入" type="number" min="0" step="100" value={state.investMonthly} onChange={e=>update({investMonthly:Math.max(0,+e.target.value)})}/></div><div className="hero-metrics"><div className="hero-metric"><span>下次定投</span><strong>{investDate.toLocaleDateString("zh-CN",{month:"long",day:"numeric"})}</strong></div><div className="hero-metric"><span>本月剩余</span><strong>{remainingDates.length} 次</strong></div><div className="hero-metric"><span>本月预算</span><strong>{money(state.investMonthly)}</strong></div></div></section>
          <section className="card"><div className="section-head"><div><h2 className="section-title">本次直接照着投</h2><div className="muted">按你的 {cadenceLabel(state.investPlan)} 计划拆分，本次合计 {money(installmentBudget)}。</div></div></div>{suggestions.length?suggestions.map(a=>{const market=markets[a.id];const failed=Boolean(market?.error);return <div className="suggestion" key={a.id}><div className="suggestion-main"><div><div className="name">{a.name}</div><div className="muted">基础比例 {a.ratio}% · {a.signal?.metricLabel||(failed?"本次按基础比例":"正在取得行情")}</div></div><div className="suggestion-right"><span className={`signal ${signalClass(a.signal?.level)}`}>{a.signal?.level||(failed?"正常投":marketLoading?"判断中":"正常投")}</span><div className="amount">{money(a.suggested)}</div></div></div><div className="reason">{a.signal?.reason||market?.error||"行情取得后会自动说明判断依据。"}</div></div>}):<div className="empty">先到“行情”添加你关注的品种</div>}</section>
        </div>
        <aside className="stack">
          <section className="card"><div className="section-head"><div><h2 className="section-title">四个账户</h2><div className="muted">直接填写各账户现在的金额</div></div><span className="tag">合计 {money(accountTotal)}</span></div><div className="mini-accounts">{state.accounts.map(a=><label key={a.id} className={`mini-account ${a.tone}`}><span>{a.name}</span><div className="mini-account-input"><b>¥</b><input aria-label={`${a.name}当前金额`} type="text" inputMode="decimal" placeholder="0" value={accountDrafts[a.id]??(a.balance===0?"":String(a.balance))} onFocus={e=>e.currentTarget.select()} onChange={e=>editAccountBalance(a.id,e.target.value)} onBlur={()=>finishAccountBalance(a.id)}/></div></label>)}</div></section>
          <section className="card"><div className="section-head"><h2 className="section-title">备用金进度</h2><span className="tag">目标 {money(state.emergencyTarget)}</span></div><div style={{fontSize:26,fontWeight:900}}>{money(reserve?.balance||0)}</div><div className="progress"><i style={{width:`${emergencyPct}%`}} /></div><div className="muted">已完成 {emergencyPct.toFixed(0)}%。当前金额可在上方直接修改；需要记录增减时再到“账户”页记一笔。</div><label>备用金目标</label><input type="number" value={state.emergencyTarget} onChange={e=>update({emergencyTarget:Math.max(0,+e.target.value)})}/></section>
        </aside>
      </div>}

      {tab==="accounts"&&<div className="stack"><section className="card"><div className="section-head"><div><h2 className="section-title">我的账户</h2><div className="muted">每次只记增加或减少，余额由系统累计。</div></div><span className="tag">总计 {money(accountTotal)}</span></div><div className="account-grid">{state.accounts.map(a=><article className={`account-card ${a.tone}`} key={a.id}><span>{a.name}</span><strong>{money(a.balance)}</strong><button className="button small" onClick={()=>openAccount(a.id)}>＋ 记一笔</button></article>)}</div></section><section className="card"><h2 className="section-title">账户流水</h2>{state.accountRecords.length?[...state.accountRecords].reverse().map(r=><div className="row" key={r.id}><div><div className="name">{r.accountName||state.accounts.find(a=>a.id===r.accountId)?.name||"账户"}</div><div className="muted">{r.date}{r.note?` · ${r.note}`:""}</div></div><div className="actions"><span className={`amount ${r.delta>=0?"positive":"negative"}`}>{r.delta>=0?"+":"-"}{money(Math.abs(r.delta))}</span><button className="button danger small" onClick={()=>deleteAccountRecord(r.id)}>撤销</button></div></div>):<div className="empty">还没有账户流水，先给任一账户记一笔</div>}</section></div>}

      {tab==="indexes"&&<div className="stack"><section className="card"><div className="section-head"><div><h2 className="section-title">我关注的指数与黄金</h2><div className="muted">输入名称或代码添加。每个品种会自动刷新，并匹配适合自己的判断方法。</div></div><div className="actions"><button className="button small" disabled={marketLoading} onClick={refreshMarkets}>{marketLoading?"判断中…":"刷新判断"}</button><button className="button primary small" onClick={openIndexModal}>添加品种</button></div></div><div className="index-grid">{state.assets.map((a,index)=>{const m=markets[a.id];const failed=Boolean(m?.error);const status=m?.signal?.level||(failed?"暂不可用":marketLoading?"判断中":"正在判断");return <article className="index-card" key={a.id}><div className="asset-top"><div><div className="name">{a.name}</div><div className="muted">{a.code} · 目标比例 {a.ratio}%</div></div><span className={`signal ${signalClass(m?.signal?.level)}`}>{status}</span></div><div className="price-label">{m?.valueLabel||"当前点位"}</div><div className="index-price">{typeof m?.price==="number"?`${m.price.toLocaleString("zh-CN",{maximumFractionDigits:2})}${m.priceUnit?` ${m.priceUnit}`:""}`:"—"}</div><div className="reason"><strong>{m?.signal?.metricLabel||legacyMethods[a.code]||"历史价格位置 + 长期趋势"}</strong>{m?.signal?`：${m.signal.metricValue}。${m.signal.reason}`:`。${m?.error||"正在取得历史行情并计算。"}`}{m?.referenceNote&&<><br/><span className="reference-note">{m.referenceNote}</span></>}</div><div className="ratio-editor"><label>基础比例 %</label><input type="text" inputMode="decimal" placeholder="0" value={a.ratio===0?"":String(a.ratio)} onFocus={e=>e.currentTarget.select()} onChange={e=>updateAsset(a.id,{ratio:Math.max(0,Number(moneyDraft(e.target.value))||0)})}/></div><div className="tile-footer"><span className="muted">{m?.timestamp&&m.source?`${new Date(m.timestamp).toLocaleString("zh-CN")} · ${m.source}`:failed?"代码或数据源暂不可用":"正在获取行情"}</span><div className="actions"><button className="button small" disabled={index===0} onClick={()=>setState(s=>{const x=[...s.assets];[x[index-1],x[index]]=[x[index],x[index-1]];return{...s,assets:x}})}>上移</button><button className="button danger small" onClick={()=>removeAsset(a.id)}>取消关注</button></div></div></article>})}</div>{ratioTotal!==100&&<div className="notice" style={{marginTop:14}}>基础比例目前合计 {ratioTotal}%。系统仍会自动归一化，建议最终调整到 100%。</div>}<div className="notice" style={{marginTop:14}}>优先显示真实指数点位；只有指数源暂时取不到时，才使用跟踪基金走势辅助判断，并明确标注“跟踪基金参考价”。股票指数会按红利价值、成长科技、中小盘和普通宽基分别判断；黄金使用三年价格分位、回撤和 200 日均线。</div></section></div>}

      {tab==="records"&&<div className="grid-main"><div className="stack"><section className="card calendar-card"><div className="section-head"><div><h2 className="section-title">记录日历</h2><div className="muted">点日期查看当天的定投和账户变动</div></div><button className="button primary small" onClick={()=>setModal("buy")}>新增定投</button></div><div className="calendar-toolbar"><button className="calendar-nav" aria-label="上个月" onClick={()=>changeRecordMonth(-1)}>‹</button><strong>{monthLabel(recordMonth)}</strong><button className="calendar-nav" aria-label="下个月" onClick={()=>changeRecordMonth(1)}>›</button></div><div className="calendar-grid calendar-weekdays">{["日","一","二","三","四","五","六"].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({length:recordMonthOffset},(_,index)=><span className="calendar-blank" key={`blank-${index}`} />)}{Array.from({length:recordMonthDays},(_,index)=>{const day=index+1;const key=`${recordMonth}-${String(day).padStart(2,"0")}`;const buyTotal=buyTotalsByDate[key]||0;const accountCount=accountCountsByDate[key]||0;return <button key={key} className={`calendar-day ${selectedRecordDate===key?"selected":""} ${key===today()?"today":""}`} onClick={()=>setSelectedRecordDate(key)}><span>{day}</span>{buyTotal>0&&<small>{money(buyTotal)}</small>}<i className="calendar-dots">{buyTotal>0&&<b className="buy-dot" />}{accountCount>0&&<b className="account-dot" />}</i></button>})}</div><div className="calendar-legend"><span><i className="buy-dot" />定投</span><span><i className="account-dot" />账户变动</span></div></section><section className="card"><div className="section-head"><div><h2 className="section-title">{parseLocalDate(selectedRecordDate).toLocaleDateString("zh-CN",{month:"long",day:"numeric"})}的记录</h2><div className="muted">定投 {selectedBuyRecords.length} 笔 · 账户变动 {selectedAccountRecords.length} 笔</div></div></div>{selectedBuyRecords.map(r=><div className="row" key={r.id}><div><div className="name">{r.assetName||state.assets.find(x=>x.id===r.assetId)?.name||"已取消关注的指数"}</div><div className="muted">定投记录</div></div><div className="actions"><span className="amount">{money(r.amount)}</span><button className="button danger small" onClick={()=>deleteBuyRecord(r.id)}>删除</button></div></div>)}{selectedAccountRecords.map(r=><div className="row" key={r.id}><div><div className="name">{r.accountName||state.accounts.find(a=>a.id===r.accountId)?.name||"账户"}</div><div className="muted">{r.note||"账户流水"}</div></div><div className="actions"><span className={`amount ${r.delta>=0?"positive":"negative"}`}>{r.delta>=0?"+":"-"}{money(Math.abs(r.delta))}</span><button className="button danger small" onClick={()=>deleteAccountRecord(r.id)}>撤销</button></div></div>)}{!selectedBuyRecords.length&&!selectedAccountRecords.length&&<div className="empty">这一天还没有记录</div>}</section></div><aside className="stack"><section className="card"><h2 className="section-title">投入统计</h2><div className="row"><span>累计投入</span><strong>{money(totalInvested)}</strong></div><div className="muted" style={{marginTop:10}}>日历中的金额只统计你保存过的定投记录。</div></section><section className="card"><h2 className="section-title">本机数据与安装</h2><div className="notice" style={{marginTop:12}}>数据只保存在当前设备，朋友打开后会拥有各自独立的数据。换手机或清理浏览器前，请先下载备份。</div><button className="button primary full" onClick={installApp}>安装到手机桌面</button><button className="button full" onClick={exportData}>下载数据备份</button><label className="button full restore-button">从备份恢复<input type="file" accept="application/json" hidden onChange={e=>{importData(e.target.files?.[0]);e.currentTarget.value="";}}/></label><button className="button danger full" onClick={clearLocalData}>清空本机数据</button></section></aside></div>}
    </div>
    <nav className="bottom-nav">{([['today','⌂','今天'],['accounts','▦','账户'],['indexes','◇','行情'],['records','≡','记录']] as const).map(([key,icon,label])=><button key={key} className={`nav-button ${tab===key?"active":""}`} onClick={()=>setTab(key)}><b>{icon}</b>{label}</button>)}</nav>
    {modal==="asset"&&<div className="dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="dialog" action={addAsset}><h2>添加关注品种</h2><div className="muted">可搜索常见名称，也可直接输入六位国内指数代码或海外行情代码；添加后都会自动刷新判断。</div><label>名称或代码</label><div className="search-row"><input aria-label="名称或代码" value={indexQuery} onChange={e=>setIndexQuery(e.target.value)} placeholder="例如：中证红利、000922、^NDX、黄金" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();searchIndexes();}}}/><button type="button" className="button" disabled={indexSearching||!indexQuery.trim()} onClick={searchIndexes}>{indexSearching?"搜索中…":"搜索"}</button></div>{indexSearchError&&<div className="search-error">{indexSearchError}</div>}{indexResults.length>0&&<div className="index-results">{indexResults.map(item=><button type="button" key={item.symbol} className={`index-result ${selectedIndex?.symbol===item.symbol?"selected":""}`} onClick={()=>setSelectedIndex(item)}><span><strong>{item.name}</strong><small>{item.market} · {item.kind==="etf"?"基金":item.kind==="commodity"?"商品":"指数"}</small></span><b>{item.code}</b></button>)}</div>}{selectedIndex&&<><label>显示名称（可修改）</label><input key={selectedIndex.symbol} name="displayName" defaultValue={selectedIndex.name}/></>}<label>基础比例 %</label><input name="ratio" type="number" min="0" placeholder="0"/><div className="dialog-actions"><button type="button" className="button" onClick={()=>setModal(null)}>取消</button><button className="button primary" disabled={!selectedIndex}>添加关注</button></div></form></div>}
    {modal==="buy"&&<div className="dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="dialog" action={addBuy}><h2>记录本次定投</h2><label>日期</label><input name="date" type="date" defaultValue={today()}/>{suggestions.map(a=><div key={a.id}><label>{a.name} · {a.signal?.level||"正常投"}</label><input name={a.id} type="number" step="0.01" defaultValue={a.suggested.toFixed(2)}/></div>)}<div className="dialog-actions"><button type="button" className="button" onClick={()=>setModal(null)}>取消</button><button className="button primary">保存记录</button></div></form></div>}
    {modal==="account"&&<div className="dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="dialog" action={addAccountRecord}><h2>{state.accounts.find(a=>a.id===activeAccount)?.name}记一笔</h2><div className="muted">当前余额 {money(state.accounts.find(a=>a.id===activeAccount)?.balance||0)}</div><div className="form-grid"><div><label>类型</label><select name="direction" aria-label="类型"><option value="in">增加</option><option value="out">减少</option></select></div><div><label>金额</label><input name="amount" aria-label="金额" type="number" min="0.01" step="0.01" required autoFocus/></div></div><label>日期</label><input name="date" aria-label="日期" type="date" defaultValue={today()}/><label>备注（可选）</label><input name="note" aria-label="备注（可选）" placeholder="例如：本月生活费、转入备用金"/><div className="dialog-actions"><button type="button" className="button" onClick={()=>setModal(null)}>取消</button><button className="button primary">保存</button></div></form></div>}
    {modal==="plan"&&<div className="dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="dialog" action={savePlan}><h2>设置我的定投计划</h2><div className="muted">月预算保持不变，系统会按本月执行次数自动拆分每次金额。</div><label>定投频率</label><select name="cadence" defaultValue={state.investPlan.cadence}><option value="daily">每天</option><option value="weekly">每周</option><option value="biweekly">每两周</option><option value="monthly">每月</option></select><div className="form-grid"><div><label>每周执行日</label><select name="weekday" defaultValue={state.investPlan.weekday}>{["周日","周一","周二","周三","周四","周五","周六"].map((x,i)=><option key={x} value={i}>{x}</option>)}</select></div><div><label>每月执行日</label><input name="monthlyDay" type="number" min="1" max="31" defaultValue={state.investPlan.monthlyDay}/></div></div><label>每两周起始日</label><input name="anchorDate" type="date" defaultValue={state.investPlan.anchorDate}/><div className="notice" style={{marginTop:12}}>只需填写与你所选频率对应的一项：每周看“每周执行日”，每月看“每月执行日”，每两周看“起始日”。每天无需额外设置。</div><div className="dialog-actions"><button type="button" className="button" onClick={()=>setModal(null)}>取消</button><button className="button primary">保存计划</button></div></form></div>}
  </main>;
}
