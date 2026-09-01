// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: list-ol;
/*
 * Token Tracker V3 · Pixel Edition · Cloud Parcel Ledger
 * Model ranking. Parameter: period,source.
 * V2 period aliases and invalid-value fallbacks are preserved.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_ranking";
const REFRESH_MINUTES=2,STALE_SECONDS=1800;
const PARAM=parseRankingParam(args.widgetParameter||"today,all");
const DARK=Device.isUsingDarkAppearance();
const UI={
 canvas:Color.dynamic(new Color("#F3F0E8"),new Color("#292521")),
 surface:Color.dynamic(new Color("#FFFDF8"),new Color("#37312C")),
 surface2:Color.dynamic(new Color("#E9E4DA"),new Color("#322F2B")),
 ink:Color.dynamic(new Color("#2E2A26"),new Color("#F2EDE5")),
 muted:Color.dynamic(new Color("#756B61"),new Color("#B8ADA1")),
 rule:Color.dynamic(new Color("#D2C9BC"),new Color("#4A4640")),
 accentText:Color.dynamic(new Color("#9A4930"),new Color("#E08B68")),
 healthyText:Color.dynamic(new Color("#53694D"),new Color("#9CB596")),
 warnText:Color.dynamic(new Color("#8A5A2D"),new Color("#D99A62")),
 errorText:Color.dynamic(new Color("#8A3F3B"),new Color("#D797A0"))
};
const C=DARK?{
 canvas:new Color("#292521"),surface:new Color("#37312C"),surface2:new Color("#322F2B"),ink:new Color("#F2EDE5"),muted:new Color("#B8ADA1"),rule:new Color("#4A4640"),actual:new Color("#E08B68"),actualDark:new Color("#A95E42"),forecast:new Color("#D99A62"),healthy:new Color("#9CB596"),outline:new Color("#1D1815"),skin:new Color("#E5A984"),white:new Color("#F2EDE5"),sky:new Color("#8EB4C6"),sakura:new Color("#D797A0")
}:{
 canvas:new Color("#F3F0E8"),surface:new Color("#FFFDF8"),surface2:new Color("#E9E4DA"),ink:new Color("#2E2A26"),muted:new Color("#756B61"),rule:new Color("#D2C9BC"),actual:new Color("#C9653A"),actualDark:new Color("#9A4930"),forecast:new Color("#F0B56D"),healthy:new Color("#6D8668"),outline:new Color("#46352C"),skin:new Color("#F0B58A"),white:new Color("#FFFDF8"),sky:new Color("#8FB9CF"),sakura:new Color("#D98591")
};
const requested=String(config.widgetFamily||args.queryParameters?.family||"medium").toLowerCase();
if(!["small","medium","large"].includes(requested))throw new Error(`Unsupported widget family: ${requested}`);
const FAMILY=requested;
let widget;
try{
 const result=await loadPayload(),view=makeViewModel(result);
 widget=view.state.kind==="empty"||view.state.kind==="error"?createStateWidget(FAMILY,view):createWidget(FAMILY,view);
 widget.url=`scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&family=${FAMILY}`;
}catch(error){console.error(String(error));widget=createFatalWidget(FAMILY);}
if(config.runsInWidget)Script.setWidget(widget);
else if(FAMILY==="small")await widget.presentSmall();
else if(FAMILY==="medium")await widget.presentMedium();
else await widget.presentLarge();
Script.complete();

function createWidget(family,v){if(family==="small")return createSmall(v);if(family==="medium")return createMedium(v);return createLarge(v);}
function baseWidget(padding){const w=new ListWidget();w.backgroundColor=UI.canvas;w.setPadding(...padding);w.refreshAfterDate=nextRefreshDate();return w;}
function createSmall(v){
 const w=baseWidget([9,10,8,10]);
 const h=w.addStack();h.centerAlignContent();add(h,"模型排行",title(9),UI.ink);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(3);const scope=w.addStack();scope.centerAlignContent();add(scope,scopeName(v),label(9),UI.ink);scope.addSpacer();add(scope,rangeName(v.aggregate),mono(8),UI.muted);
 const summary=w.addStack();summary.centerAlignContent();add(summary,`总 ${compact(v.aggregate?.tokens)}`,mono(8),UI.muted);summary.addSpacer();add(summary,`${number(v.aggregate?.requests)}次 · 缓存 ${fmt(v.aggregate?.cache_rate)}%`,mono(8),UI.muted);
 w.addSpacer(4);smallLeader(w,v.models[0],v.state);w.addSpacer(4);smallRankLine(w,v.models[1],2);w.addSpacer(2);smallRankLine(w,v.models[2],3);
 return w;
}
function smallLeader(parent,m,state){
 const box=parent.addStack();box.layoutHorizontally();box.centerAlignContent();box.size=new Size(150,48);box.backgroundImage=pixelPanel(150,48,C.surface,C.rule);box.setPadding(5,6,5,6);
 const copy=box.addStack();copy.layoutVertically();copy.size=new Size(106,0);
 const top=copy.addStack();top.centerAlignContent();add(top,"01",mono(8),UI.accentText);top.addSpacer(5);const name=add(top,shortModel(m?.model)||"等待更多模型",label(9),m?UI.ink:UI.muted);name.lineLimit=1;
 copy.addSpacer(2);add(copy,m?`${compact(m.tokens)} · ${fmt(m.share)}% 占比`:"暂无真实记录",label(9),m?UI.accentText:UI.muted);
 if(m){copy.addSpacer(1);add(copy,`${number(m.requests)}次 · 缓存 ${fmt(m.cache_rate)}%`,mono(8),UI.muted);}
 box.addSpacer();const courier=box.addImage(drawCourier(state.kind,32));courier.imageSize=new Size(32,32);
}
function smallRankLine(parent,m,rank){const row=parent.addStack();row.centerAlignContent();add(row,`0${rank}`,mono(8),rank===2?UI.accentText:UI.muted);row.addSpacer(6);const name=add(row,shortModel(m?.model)||"等待更多模型",label(9),m?UI.ink:UI.muted);name.lineLimit=1;row.addSpacer();if(m){add(row,compact(m.tokens),label(9),UI.ink);row.addSpacer(5);add(row,`${fmt(m.share)}%`,mono(9),UI.muted);}}
function createMedium(v){
 const w=baseWidget([9,13,7,13]);
 const h=w.addStack();h.centerAlignContent();add(h,"模型用量排行",title(12),UI.ink);h.addSpacer(7);add(h,scopeName(v),label(9),UI.accentText);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(2);const summary=w.addStack();summary.centerAlignContent();add(summary,`${compact(v.aggregate?.tokens)} TOKENS`,mono(8),UI.muted);summary.addSpacer();add(summary,`${number(v.aggregate?.requests)} REQUESTS`,mono(8),UI.muted);summary.addSpacer();add(summary,`CACHE ${fmt(v.aggregate?.cache_rate)}%`,mono(8),UI.muted);
 w.addSpacer(4);rule(w);w.addSpacer(3);
 for(let i=0;i<3;i++){mediumRankRow(w,v.models[i],i+1);if(i<2)w.addSpacer(3);}
 return w;
}
function mediumRankRow(parent,m,rank){
 const row=parent.addStack();row.layoutHorizontally();row.centerAlignContent();row.size=new Size(338,29);
 const no=row.addStack();no.size=new Size(18,18);no.backgroundImage=rankTile(rank);no.centerAlignContent();no.addSpacer();add(no,String(rank),label(9),rank===1?UI.surface:UI.muted);no.addSpacer();row.addSpacer(6);
 const copy=row.addStack();copy.layoutVertically();copy.size=new Size(126,27);
 if(!m){add(copy,"等待更多模型",label(9),UI.muted);copy.addSpacer(1);add(copy,"暂无真实记录",body(9),UI.muted);row.addSpacer();return;}
 const name=add(copy,shortModel(m.model),label(9),UI.ink);name.lineLimit=1;copy.addSpacer(1);add(copy,`${m.family||"未知家族"} · ${number(m.requests)}次 · 缓存 ${fmt(m.cache_rate)}%`,body(9),UI.muted);
 row.addSpacer(6);const metric=row.addStack();metric.layoutVertically();metric.size=new Size(64,27);const amount=add(metric,compact(m.tokens),label(10),rank===1?UI.accentText:UI.ink);amount.rightAlignText();const share=add(metric,`${fmt(m.share)}% 占比`,mono(9),UI.muted);share.rightAlignText();row.addSpacer(8);
 const spark=row.addImage(drawSpark(m.history_7d||[],52,20));spark.imageSize=new Size(52,20);row.addSpacer(6);const meter=row.addImage(drawShareMeter(m.share,50,6,rank===1));meter.imageSize=new Size(50,6);
}
function createLarge(v){
 const w=baseWidget([12,15,10,15]);
 const h=w.addStack();h.centerAlignContent();const hc=h.addStack();hc.layoutVertically();add(hc,"云端模型分拣簿",title(13),UI.ink);hc.addSpacer(1);add(hc,`${scopeName(v)} · ${rangeName(v.aggregate)} · ${stateDetail(v.state)}`,mono(8),UI.muted);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(5);const cards=w.addStack();cards.layoutHorizontally();summaryCard(cards,"周期 Token",compact(v.aggregate?.tokens));cards.addSpacer(8);summaryCard(cards,"请求数",number(v.aggregate?.requests));cards.addSpacer(8);summaryCard(cards,"缓存命中率",`${fmt(v.aggregate?.cache_rate)}%`);
 w.addSpacer(6);const heading=w.addStack();heading.centerAlignContent();add(heading,"名次 / 模型与家族",body(9),UI.muted);heading.addSpacer();add(heading,"用量 / 占比 / 七日邮戳",body(9),UI.muted);w.addSpacer(2);rule(w);w.addSpacer(3);
 for(let i=0;i<5;i++){largeRankRow(w,v.models[i],i+1);if(i<4)w.addSpacer(3);}
 return w;
}
function summaryCard(parent,k,v){const box=parent.addStack();box.layoutVertically();box.size=new Size(106,42);box.backgroundImage=pixelPanel(106,42,C.surface,C.rule);box.setPadding(5,7,5,7);add(box,k,body(9),UI.muted);box.addSpacer(2);const value=add(box,v,label(11),UI.ink);value.lineLimit=1;}
function largeRankRow(parent,m,rank){
 const row=parent.addStack();row.layoutHorizontally();row.centerAlignContent();row.size=new Size(334,43);row.backgroundImage=rankBand(334,43,rank===1);row.setPadding(4,5,4,5);
 const no=row.addStack();no.size=new Size(22,22);no.backgroundImage=rankTile(rank);no.centerAlignContent();no.addSpacer();add(no,String(rank),label(9),rank===1?UI.surface:UI.muted);no.addSpacer();row.addSpacer(7);
 const copy=row.addStack();copy.layoutVertically();copy.size=new Size(130,34);
 if(!m){add(copy,"等待更多模型",label(9),UI.muted);copy.addSpacer(2);add(copy,"本范围暂无第此名次",body(9),UI.muted);row.addSpacer();return;}
 const name=add(copy,shortModel(m.model),label(10),UI.ink);name.lineLimit=1;copy.addSpacer(2);add(copy,`${m.family||"未知家族"} · ${number(m.requests)}次 · 缓存 ${fmt(m.cache_rate)}%`,body(9),UI.muted);
 row.addSpacer(7);const metric=row.addStack();metric.layoutVertically();metric.size=new Size(67,34);const amount=add(metric,compact(m.tokens),label(11),rank===1?UI.accentText:UI.ink);amount.rightAlignText();const share=add(metric,`${fmt(m.share)}% 占比`,mono(9),UI.muted);share.rightAlignText();row.addSpacer(8);
 const trend=row.addStack();trend.layoutVertically();trend.size=new Size(78,34);const spark=trend.addImage(drawSpark(m.history_7d||[],78,20));spark.imageSize=new Size(78,20);trend.addSpacer(2);const meter=trend.addImage(drawShareMeter(m.share,78,6,rank===1));meter.imageSize=new Size(78,6);
}
function createStateWidget(family,v){
 const pads=family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12],w=baseWidget(pads);
 const h=w.addStack();h.centerAlignContent();add(h,"模型排行",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer();const row=w.addStack();row.centerAlignContent();const spriteSize=family==="large"?64:32,courier=row.addImage(drawCourier(v.state.kind,spriteSize));courier.imageSize=new Size(spriteSize,spriteSize);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.state.kind==="error"?"连接失败":"暂无模型记录",title(family==="large"?18:13),v.state.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.state.kind==="error"?"没有可用缓存，稍后会自动重试":`${scopeName(v)} 暂无真实模型记录`,body(family==="large"?10:9),UI.muted);detail.lineLimit=2;
 if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"模型按主 Token 排名 · 占比使用所选周期总量",mono(9),UI.muted);}return w;
}
function createFatalWidget(family){const w=baseWidget(family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12]);const h=w.addStack();h.centerAlignContent();add(h,"模型排行",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,{kind:"error",label:"错误"},8);w.addSpacer();add(w,"组件暂时无法显示",title(family==="large"?18:13),UI.errorText);w.addSpacer(5);add(w,"稍后会自动重试",body(9),UI.muted);return w;}
function makeViewModel(result){
 const d=result.data||{},source=resolveSource(PARAM.source,d),aggregate=source==="all"?d.periods?.[PARAM.period]:d.source_periods?.[source]?.[PARAM.period],models=source==="all"?d.top_models?.[PARAM.period]:d.source_top_models?.[source]?.[PARAM.period],state=resolveState(result,d,aggregate,models);
 return{data:d,aggregate:aggregate||{},models:Array.isArray(models)?models:[],state,period:PARAM.period,source};
}
function resolveState(result,d,aggregate,models){
 const sync=normalizeSeconds(d.meta?.last_sync_at||result.ts),now=Math.floor(Date.now()/1000),valid=Boolean(d.meta&&aggregate&&Array.isArray(models)),hasRecords=valid&&(Number(aggregate.tokens)>0||Number(aggregate.requests)>0||models.length>0);
 let kind,label;if(!valid){kind="error";label="连接失败";}else if(!hasRecords){kind="empty";label="暂无";}else if(!sync||now-sync>=STALE_SECONDS||d.meta?.status==="stale"){kind="stale";label="稍旧";}else if(!result.live||d.meta?.status!=="live"){kind="cache";label="缓存";}else{kind="live";label="实时";}return{kind,label,sync};
}
async function loadPayload(){
 const fm=FileManager.local(),a=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),b=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`);
 try{const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()};writeNextSlot(fm,a,b,saved);return{...saved,live:true};}
 catch(error){console.warn(String(error));const cached=readNewest(fm,[a,b]);if(cached)return{...cached,live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};}
}
function validPayload(d){return Boolean(d&&typeof d==="object"&&d.meta&&d.periods&&d.source_periods&&d.top_models&&d.source_top_models&&d.sources);}
function writeNextSlot(fm,a,b,saved){let target=a;const aa=readSlot(fm,a),bb=readSlot(fm,b);if(!aa)target=a;else if(!bb)target=b;else target=Number(aa.ts||0)<=Number(bb.ts||0)?a:b;fm.writeString(target,JSON.stringify(saved));}
function readNewest(fm,paths){return paths.map(p=>readSlot(fm,p)).filter(Boolean).sort((x,y)=>Number(y.ts||0)-Number(x.ts||0))[0]||null;}
function readSlot(fm,p){if(!fm.fileExists(p))return null;try{const x=JSON.parse(fm.readString(p));return x?.data&&validPayload(x.data)?x:null;}catch(_){return null;}}
function parseRankingParam(p){const a=String(p||"today,all").toLowerCase().split(",").map(x=>x.trim()),period=normalizePeriod(a[0]),source=normalizeSource(a[1]);return{period,source};}
function normalizePeriod(p){p=String(p).toLowerCase().trim();return["7d","week","近7天"].includes(p)?"7d":["month","本月"].includes(p)?"month":"today";}
function normalizeSource(source){source=String(source||"all").toLowerCase().trim();return source||"all";}
function resolveSource(source,d){if(source==="all")return"all";const keys=new Set([...Object.keys(d?.sources||{}),...Object.keys(d?.source_periods||{}),...Object.keys(d?.source_top_models||{})].map(x=>String(x).toLowerCase()));return keys.has(source)?source:"all";}
function scopeName(v){return`${periodName(v.period)} · ${sourceName(v.source,v.data)}`;}
function sourceName(source,d){return source==="all"?"全部来源":d.sources?.[source]?.label||source;}
function periodName(p){return p==="7d"?"近7天":p==="month"?"本月":"今日";}
function rangeName(a){return a?.start&&a?.end?a.start===a.end?a.start:`${shortDate(a.start)}–${shortDate(a.end)}`:"未标记周期";}
function shortDate(s){const a=String(s||"").split("-");return a.length===3?`${Number(a[1])}/${Number(a[2])}`:String(s||"");}
function stateDetail(s){if(s.kind==="error")return"连接失败";if(s.kind==="empty")return"暂无记录";if(s.kind==="cache")return`缓存 · ${relative(s.sync)}`;if(s.kind==="stale")return`稍旧 · ${relative(s.sync)}`;return relative(s.sync);}
function addStatus(parent,state,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(state.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,state.label,mono(size),statusColor(state.kind));}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function pixelPanel(w,h,fill,stroke){const c=ctx(w,h),k=4,p=new Path();p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,2));c.fillRect(new Rect(k,h-2,w-k*2,2));c.fillRect(new Rect(0,k,2,h-k*2));c.fillRect(new Rect(w-2,k,2,h-k*2));return c.getImage();}
function rankBand(w,h,leader){const c=ctx(w,h);c.setFillColor(leader?C.surface:C.surface2);c.fillRect(new Rect(0,0,w,h));c.setFillColor(C.rule);c.fillRect(new Rect(0,0,w,1));c.fillRect(new Rect(0,h-1,w,1));c.fillRect(new Rect(0,0,1,h));c.fillRect(new Rect(w-1,0,1,h));if(leader){c.setFillColor(C.actual);c.fillRect(new Rect(0,0,2,h));}return c.getImage();}
function rankTile(rank){const c=ctx(18,18);c.setFillColor(rank===1?C.actual:C.rule);c.fillRect(new Rect(2,0,14,2));c.fillRect(new Rect(0,2,18,14));c.fillRect(new Rect(2,16,14,2));return c.getImage();}
function drawSpark(items,w,h){const c=ctx(w,h),vals=(items||[]).slice(-7).map(x=>Number(x.val)||0);while(vals.length<7)vals.unshift(0);const max=Math.max(...vals,1),slot=w/7,base=h-2;vals.forEach((v,i)=>{if(v<=0)return;const x=Math.round((i*slot+slot*.2)/2)*2,bw=Math.max(2,Math.floor(slot*.58/2)*2),bh=Math.max(2,Math.round(v/max*(h-4)/2)*2);c.setFillColor(i===6?C.actual:C.rule);c.fillRect(new Rect(x,base-bh,bw,bh));});c.setFillColor(C.rule);c.fillRect(new Rect(0,h-2,w,2));return c.getImage();}
function drawShareMeter(share,w,h,leader){const c=ctx(w,h),v=clamp(Number(share)||0,0,100),fill=v<=0?0:Math.max(2,Math.round((w*v/100)/2)*2);c.setFillColor(C.rule);c.fillRect(new Rect(0,2,w,2));if(fill){c.setFillColor(leader?C.actual:C.muted);c.fillRect(new Rect(0,0,Math.min(w,fill),6));}return c.getImage();}
function statusDot(kind){const c=ctx(6,6);c.setFillColor(kind==="live"?C.healthy:kind==="stale"?C.forecast:kind==="error"?C.sakura:C.rule);c.fillRect(new Rect(0,0,6,6));return c.getImage();}
function drawCourier(kind,size){const grid=32,unit=size/grid,c=ctx(size,size),fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x*unit,y*unit,w*unit,h*unit));};fill(7,2,15,2,C.outline);fill(4,4,22,4,C.outline);fill(6,1,6,4,C.outline);fill(16,0,6,5,C.outline);fill(7,3,15,1,C.white);fill(5,5,20,2,C.white);fill(7,2,4,3,C.white);fill(17,1,4,4,C.white);fill(7,7,16,2,C.outline);fill(5,9,19,10,C.outline);fill(7,7,5,5,C.outline);fill(18,7,5,6,C.outline);fill(8,9,12,9,C.skin);fill(7,11,14,5,C.skin);fill(6,13,3,4,C.skin);fill(8,9,4,4,C.outline);fill(18,9,3,5,C.outline);fill(10,13,2,1,C.outline);fill(16,13,2,1,C.outline);fill(13,16,4,1,C.outline);fill(9,18,11,2,C.outline);fill(7,20,15,8,C.outline);fill(9,18,10,3,C.forecast);fill(9,20,11,7,C.actual);fill(6,21,4,5,C.outline);fill(19,20,4,6,C.outline);fill(8,27,5,4,C.outline);fill(17,27,5,4,C.outline);fill(12,20,5,2,C.white);fill(13,22,5,3,C.forecast);if(kind==="live"){fill(23,8,1,18,C.outline);fill(24,8,7,2,C.outline);fill(24,10,6,6,C.actual);fill(24,15,7,2,C.outline);}else if(kind==="cache"){fill(22,20,8,7,C.outline);fill(23,21,6,5,C.forecast);}else if(kind==="stale"){fill(23,18,8,8,C.outline);fill(24,19,6,6,C.white);fill(27,20,1,3,C.actual);}else if(kind==="error"){fill(20,8,11,2,C.outline);fill(18,10,14,2,C.sakura);fill(25,12,1,14,C.outline);}return c.getImage();}
function ctx(w,h){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;return c;}
function nextRefreshDate(){const step=REFRESH_MINUTES*60000;return new Date(Math.ceil((Date.now()+1000)/step)*step);}
function normalizeSeconds(n){n=Number(n)||0;return n>1e12?Math.floor(n/1000):Math.floor(n);}
function add(p,x,font,color){const t=p.addText(String(x));t.font=font;t.textColor=color;return t;}
function title(s){return new Font("PingFangSC-Semibold",s);}function body(s){return new Font("PingFangSC-Regular",s);}function label(s){return new Font("AvenirNext-DemiBold",s);}function mono(s){return new Font("Menlo-Regular",s);}
function shortModel(s){const raw=String(s||"").trim(),rules=[[/^deepseek-v4-flash-vision-exp$/i,"DeepSeek V4 Flash"],[/^gemini-3\.1-pro-preview$/i,"Gemini 3.1 Pro"],[/^gpt-5\.6-sol$/i,"GPT 5.6 sol"],[/^gpt-5\.6-terra$/i,"GPT 5.6 terra"]];for(const[r,v]of rules)if(r.test(raw))return v;return raw.replace(/^claude-/i,"Claude ").replace(/^gpt-/i,"GPT ").replace(/-/g," ").replace(/\s+/g," ").trim();}
function compact(n){n=Number(n)||0;const a=Math.abs(n);if(a>=999950000000)return trim(n/1e12)+"T";if(a>=999950000)return trim(n/1e9)+"B";if(a>=999950)return trim(n/1e6)+"M";if(a>=999.95)return trim(n/1e3)+"K";return String(Math.round(n));}
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"");}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function fmt(n){return(Number(n)||0).toFixed(1).replace(/\.0$/,"");}function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function relative(ts){if(!ts)return"未同步";const m=Math.max(0,Math.floor((Date.now()/1000-ts)/60));return m<1?"刚刚":m<60?`${m}分钟前`:m<1440?`${Math.floor(m/60)}小时前`:`${Math.floor(m/1440)}天前`;}

function loadV3Settings(){
 const fm=FileManager.local(),names=["token-tracker-v3-settings.json","token-tracker-v2-settings.json"];
 for(const name of names){
  const path=fm.joinPath(fm.documentsDirectory(),name);
  if(!fm.fileExists(path))continue;
  try{const value=JSON.parse(fm.readString(path));if(/^https?:\/\//.test(value?.apiUrl||"")&&value?.apiKey)return value;}catch(_){ }
 }
 return{apiUrl:"",apiKey:""};
}
