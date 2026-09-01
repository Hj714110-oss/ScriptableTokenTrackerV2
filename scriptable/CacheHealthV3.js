// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: archive;
/*
 * Token Tracker V3 · Cache Health · Cloud Parcel Ledger
 * Cache read, cache creation, cache basis, main-token composition, and 30-day rate trend.
 * Widget parameter: period,source — today|7d|month plus any key in payload.sources.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_cache_health";
const REFRESH_MINUTES=2,STALE_SECONDS=1800;
const RAW_PARAMETER=String(args.widgetParameter??args.queryParameters?.parameter??"");
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
 surface:new Color("#37312C"),surface2:new Color("#322F2B"),ink:new Color("#F2EDE5"),muted:new Color("#B8ADA1"),rule:new Color("#4A4640"),actual:new Color("#E08B68"),forecast:new Color("#D99A62"),healthy:new Color("#9CB596"),outline:new Color("#1D1815"),skin:new Color("#E5A984"),white:new Color("#F2EDE5"),sky:new Color("#8EB4C6"),sakura:new Color("#D797A0")
}:{
 surface:new Color("#FFFDF8"),surface2:new Color("#E9E4DA"),ink:new Color("#2E2A26"),muted:new Color("#756B61"),rule:new Color("#D2C9BC"),actual:new Color("#C9653A"),forecast:new Color("#F0B56D"),healthy:new Color("#6D8668"),outline:new Color("#46352C"),skin:new Color("#F0B58A"),white:new Color("#FFFDF8"),sky:new Color("#8FB9CF"),sakura:new Color("#D98591")
};
const requested=String(config.widgetFamily||args.queryParameters?.family||"large").toLowerCase();
if(!["small","medium","large"].includes(requested))throw new Error(`Unsupported widget family: ${requested}`);
const FAMILY=requested;
let widget;
try{
 const result=await loadPayload();
 const vm=makeViewModel(result,RAW_PARAMETER);
 widget=await createWidget(FAMILY,vm);
 widget.url=`scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&family=${FAMILY}&parameter=${encodeURIComponent(`${vm.period},${vm.source}`)}`;
}catch(error){
 console.error(String(error));
 widget=createFatalWidget(FAMILY);
}
if(config.runsInWidget)Script.setWidget(widget);
else if(FAMILY==="small")await widget.presentSmall();
else if(FAMILY==="medium")await widget.presentMedium();
else await widget.presentLarge();
Script.complete();

async function createWidget(family,v){
 if(v.status.kind==="error"||v.empty)return createStateWidget(family,v);
 if(family==="small")return createSmall(v);
 if(family==="medium")return createMedium(v);
 return createLarge(v);
}
function baseWidget(padding){
 const w=new ListWidget();w.backgroundColor=UI.canvas;w.setPadding(...padding);w.refreshAfterDate=nextRefreshDate();return w;
}
function createSmall(v){
 const w=baseWidget([11,11,10,11]);
 const h=w.addStack();h.centerAlignContent();add(h,"缓存分拣",title(9),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer(3);const meta=add(w,selectionLine(v),mono(8),UI.muted);fit(meta,1,1);
 w.addSpacer(6);const hero=w.addStack();hero.centerAlignContent();const copy=hero.addStack();copy.layoutVertically();add(copy,"缓存复用率",body(9),UI.muted);copy.addSpacer(1);fit(add(copy,`${fmt(v.rate)}%`,numberFont(22),UI.ink),1,.9);hero.addSpacer();const courier=hero.addImage(drawCourier(v.status.kind,"cache",32));courier.imageSize=new Size(32,32);
 w.addSpacer(5);const row=w.addStack();row.centerAlignContent();miniMetric(row,"读取",compact(v.read));row.addSpacer();miniMetric(row,"创建",compact(v.creation));row.addSpacer();miniMetric(row,"基数",compact(v.basis));
 w.addSpacer();rule(w);w.addSpacer(4);const foot=w.addStack();foot.centerAlignContent();add(foot,`Prompt ${compact(v.prompt)}`,mono(9),UI.muted);foot.addSpacer();add(foot,`${number(v.requests)} 次`,mono(9),UI.muted);
 return w;
}
function createMedium(v){
 const w=baseWidget([9,13,8,13]);
 const h=w.addStack();h.centerAlignContent();add(h,"缓存分拣台",title(10),UI.ink);h.addSpacer();add(h,selectionLine(v),mono(8),UI.muted);h.addSpacer(7);addStatus(h,v.status,8);
 w.addSpacer(5);const cards=w.addStack();cards.centerAlignContent();rateCard(cards,v,108,46,"cache");cards.addSpacer(6);metricCard(cards,"缓存读取",compact(v.read),70,46);cards.addSpacer(6);metricCard(cards,"缓存创建",compact(v.creation),70,46);cards.addSpacer(6);metricCard(cards,"计量基数",compact(v.basis),70,46);cards.addSpacer(2);
 w.addSpacer(5);const comp=w.addStack();comp.centerAlignContent();add(comp,"主 Token 构成",body(9),UI.muted);comp.addSpacer();add(comp,`Prompt ${compact(v.prompt)} · Output ${compact(v.output)}`,mono(9),UI.muted);
 w.addSpacer(2);const meter=w.addImage(drawComposition(v.prompt,v.output,336,12));meter.imageSize=new Size(336,12);meter.centerAlignImage();
 w.addSpacer(5);const trend=w.addImage(drawRateTrend(v.trend,336,30));trend.imageSize=new Size(336,30);trend.centerAlignImage();
 const cap=w.addStack();cap.centerAlignContent();add(cap,"30日缓存率",mono(9),UI.muted);cap.addSpacer();add(cap,`最近 ${latestRate(v.trend)} · ${number(v.requests)} 次`,mono(9),UI.muted);
 return w;
}
function createLarge(v){
 const w=baseWidget([13,15,11,15]);
 const h=w.addStack();h.centerAlignContent();const hc=h.addStack();hc.layoutVertically();add(hc,"云端缓存账本",title(12),UI.ink);hc.addSpacer(2);const info=add(hc,`${selectionLine(v)} · ${statusDetail(v.status)}`,mono(8),UI.muted);fit(info,1,1);h.addSpacer();const courier=h.addImage(drawCourier(v.status.kind,"cache",32));courier.imageSize=new Size(32,32);h.addSpacer(7);addStatus(h,v.status,8);
 w.addSpacer(8);const cards=w.addStack();rateCard(cards,v,100,66,"cache");cards.addSpacer(6);metricCard(cards,"缓存读取",compact(v.read),72,66);cards.addSpacer(6);metricCard(cards,"缓存创建",compact(v.creation),72,66);cards.addSpacer(6);metricCard(cards,"计量基数",compact(v.basis),72,66);
 w.addSpacer(8);const mix=w.addStack();mix.layoutVertically();mix.size=new Size(334,46);mix.backgroundImage=drawCutPanel(334,46,C.surface,C.rule);mix.setPadding(6,8,6,8);const ml=mix.addStack();ml.centerAlignContent();add(ml,"主 Token 构成",body(9),UI.muted);ml.addSpacer();add(ml,`Prompt ${compact(v.prompt)} · Output ${compact(v.output)}`,mono(9),UI.ink);mix.addSpacer(5);const meter=mix.addImage(drawComposition(v.prompt,v.output,318,12));meter.imageSize=new Size(318,12);
 w.addSpacer(8);const th=w.addStack();th.centerAlignContent();add(th,"30 日缓存率格",title(9),UI.ink);th.addSpacer();add(th,`${rangeLabel(v.trend)} · 最近 ${latestRate(v.trend)}`,mono(8),UI.muted);
 w.addSpacer(3);const trend=w.addImage(drawRateTrend(v.trend,334,62));trend.imageSize=new Size(334,62);trend.centerAlignImage();
 w.addSpacer(7);const context=w.addStack();contextCard(context,"请求数",`${number(v.requests)} 次`,162,44);context.addSpacer(10);contextCard(context,"主 Token",compact(v.tokens),162,44);
 w.addSpacer();const footer=w.addStack();footer.centerAlignContent();add(footer,`来源 ${v.sourceLabel}${v.partial?" · 今日部分数据":""}`,mono(8),UI.muted);footer.addSpacer();add(footer,`计量基数 ${compact(v.basis)}`,mono(9),UI.muted);
 return w;
}
function makeViewModel(result,raw){
 const d=result.data||{},parsed=parseParameter(raw),sourceKeys=Object.keys(d.sources||{}),source=parsed.source==="all"||sourceKeys.includes(parsed.source)?parsed.source:"all",period=parsed.period;
 const selected=source==="all"?d.periods?.[period]:d.source_periods?.[source]?.[period],trendRaw=source==="all"?d.history_30d:d.source_history_30d?.[source],sourceInfo=source==="all"?null:d.sources?.[source],status=resolveStatus(result,d,Boolean(selected));
 const hasActivity=selected&&["tokens","prompt_tokens","completion_tokens","cache_tokens","cache_creation_tokens","cache_basis","requests"].some(k=>finite(selected[k])&&Number(selected[k])!==0),empty=status.kind!=="error"&&!hasActivity;
 if(empty){status.kind="empty";status.label="暂无";}
 return{status,empty,period,source,sourceLabel:source==="all"?"全部来源":String(sourceInfo?.label||source),partial:Boolean(sourceInfo?.today_partial&&period==="today"),tokens:num(selected?.tokens),prompt:num(selected?.prompt_tokens),output:num(selected?.completion_tokens),read:num(selected?.cache_tokens),creation:num(selected?.cache_creation_tokens),basis:num(selected?.cache_basis),requests:num(selected?.requests),rate:num(selected?.cache_rate),trend:Array.isArray(trendRaw)?trendRaw.slice(-30):[]};
}
function parseParameter(raw){const parts=String(raw||"").split(",").map(x=>x.trim().toLowerCase()),p=parts[0],period=p==="7d"||p==="week"||p==="近7天"?"7d":p==="month"||p==="本月"?"month":"today",source=parts[1]||"all";return{period,source};}
function resolveStatus(result,d,valid){
 const sync=normaliseEpoch(d.meta?.last_sync_at)||(result.ts?Math.floor(result.ts/1000):0),age=sync?Math.max(0,Math.floor(Date.now()/1000)-sync):Infinity,backend=String(d.meta?.status||"").toLowerCase();
 if(!valid)return{kind:"error",label:"错误",sync};
 if(age>=STALE_SECONDS||backend==="stale")return{kind:"stale",label:"稍旧",sync};
 if(!result.live||backend!=="live")return{kind:"cache",label:"缓存",sync};
 return{kind:"live",label:"实时",sync};
}
async function loadPayload(){
 const fm=FileManager.local(),a=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),b=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`);
 try{
  const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()},target=olderSlot(fm,a,b);atomicWrite(fm,target,saved);return{...saved,live:true};
 }catch(error){
  console.warn(String(error));const cached=[readSlot(fm,a),readSlot(fm,b)].filter(Boolean).sort((x,y)=>snapshotTime(y)-snapshotTime(x));if(cached.length)return{...cached[0],live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};
 }
}
function validPayload(d){return Boolean(d&&typeof d==="object"&&d.meta&&typeof d.meta==="object"&&d.periods&&typeof d.periods==="object"&&d.sources&&typeof d.sources==="object"&&d.source_periods&&typeof d.source_periods==="object"&&Array.isArray(d.history_30d)&&d.source_history_30d&&typeof d.source_history_30d==="object");}
function olderSlot(fm,a,b){const aa=readSlot(fm,a),bb=readSlot(fm,b);if(!aa)return a;if(!bb)return b;return snapshotTime(aa)<=snapshotTime(bb)?a:b;}
function atomicWrite(fm,path,value){const tmp=`${path}.tmp`;fm.writeString(tmp,JSON.stringify(value));if(fm.fileExists(path))fm.remove(path);fm.move(tmp,path);}
function readSlot(fm,path){if(!fm.fileExists(path))return null;try{const x=JSON.parse(fm.readString(path));return x&&validPayload(x.data)&&finite(x.ts)?x:null;}catch(_){return null;}}
function snapshotTime(x){return normaliseEpoch(x?.data?.meta?.last_sync_at)*1000||Number(x?.ts)||0;}
function normaliseEpoch(x){const n=Number(x);if(!Number.isFinite(n)||n<=0)return 0;return n>1e12?Math.floor(n/1000):Math.floor(n);}
function createFatalWidget(family){const w=baseWidget(family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12]);const h=w.addStack();h.centerAlignContent();add(h,"缓存分拣台",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,{kind:"error",label:"错误"},8);w.addSpacer();add(w,"组件暂时无法显示",title(family==="large"?18:13),UI.errorText);w.addSpacer(5);add(w,"稍后会自动重试",body(9),UI.muted);return w;}
function createStateWidget(family,v){
 const w=baseWidget(family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12]);const h=w.addStack();h.centerAlignContent();add(h,"缓存分拣台",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,v.status,8);w.addSpacer();const row=w.addStack();row.centerAlignContent();const sprite=row.addImage(drawCourier(v.status.kind,"cache",family==="large"?72:48));sprite.imageSize=family==="large"?new Size(72,72):new Size(48,48);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.status.kind==="error"?"连接失败":"暂无缓存记录",title(family==="large"?18:13),v.status.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.status.kind==="error"?"没有可用缓存，稍后会自动重试":`${periodLabel(v.period)} · ${v.sourceLabel} 暂无适用请求`,body(family==="large"?10:9),UI.muted);detail.lineLimit=2;if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"缓存读取、创建与计量基数保持独立",mono(9),UI.muted);}return w;
}
function rateCard(parent,v,w,h){const x=parent.addStack();x.layoutVertically();x.size=new Size(w,h);x.backgroundImage=drawCutPanel(w,h,C.surface,C.rule);x.setPadding(5,7,5,7);add(x,"复用率",body(9),UI.muted);x.addSpacer(2);fit(add(x,`${fmt(v.rate)}%`,numberFont(h>50?20:15),UI.ink),1,.9);}
function metricCard(parent,k,v,w,h){const x=parent.addStack();x.layoutVertically();x.size=new Size(w,h);x.backgroundImage=drawCutPanel(w,h,C.surface,C.rule);x.setPadding(5,6,5,6);add(x,k,body(9),UI.muted);x.addSpacer(2);fit(add(x,v,label(h>50?12:10),UI.ink),1,.9);}
function contextCard(parent,k,v,w,h){const x=parent.addStack();x.layoutVertically();x.size=new Size(w,h);x.backgroundImage=drawBand(w,h);x.setPadding(6,8,6,8);add(x,k,body(9),UI.muted);x.addSpacer(3);add(x,v,label(11),UI.ink);}
function miniMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();add(x,k,body(9),UI.muted);fit(add(x,v,label(9),UI.ink),1,.9);}
function selectionLine(v){return`${periodLabel(v.period)} · ${v.sourceLabel}${v.partial?" · 部分":""}`;}
function periodLabel(p){return p==="7d"?"近7天":p==="month"?"本月":"今日";}
function latestRate(items){const valid=(items||[]).filter(x=>finite(x?.cache_rate));return valid.length?`${fmt(valid[valid.length-1].cache_rate)}%`:"暂无";}
function rangeLabel(items){const valid=(items||[]).filter(x=>finite(x?.cache_rate));if(!valid.length)return"暂无样本";const vals=valid.map(x=>Number(x.cache_rate));return`${fmt(Math.min(...vals))}–${fmt(Math.max(...vals))}%`;}
function drawCutPanel(w,h,fill,stroke){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const k=4,p=new Path();p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,1));c.fillRect(new Rect(k,h-1,w-k*2,1));c.fillRect(new Rect(0,k,1,h-k*2));c.fillRect(new Rect(w-1,k,1,h-k*2));return c.getImage();}
function drawBand(w,h){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;c.setFillColor(C.rule);c.fillRect(new Rect(0,0,w,1));c.fillRect(new Rect(0,h-1,w,1));return c.getImage();}
function drawComposition(prompt,output,w,h){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const total=Math.max(0,num(prompt)+num(output));c.setFillColor(C.rule);c.fillRect(new Rect(0,0,w,h));if(total>0){const pw=Math.max(2,Math.min(w,Math.round((num(prompt)/total*w)/2)*2));c.setFillColor(C.actual);c.fillRect(new Rect(0,0,pw,h));if(pw<w){c.setFillColor(C.sky);c.fillRect(new Rect(pw,0,w-pw,h));}c.setFillColor(C.surface);for(let x=8;x<w;x+=10)c.fillRect(new Rect(x,0,2,h));}return c.getImage();}
function drawRateTrend(items,w,h){
 const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const rows=Array.isArray(items)?items.slice(-30):[],n=30,slot=w/n,tile=Math.max(4,Math.floor((slot-2)/2)*2),vals=[];for(let i=0;i<n;i++){const x=rows[i];vals.push(x&&finite(x.cache_rate)?Math.max(0,Math.min(100,Number(x.cache_rate))):null);}c.setFillColor(C.rule);c.fillRect(new Rect(0,h-1,w,1));
 vals.forEach((v,i)=>{const x=Math.round((i*slot+(slot-tile)/2)/2)*2;if(v===null){c.setFillColor(C.rule);c.fillRect(new Rect(x,h-4,tile,2));return;}const bh=v<=0?0:Math.max(2,Math.round((v/100*(h-4))/2)*2);if(bh>0){c.setFillColor(i===n-1?C.actual:C.healthy);c.fillRect(new Rect(x,h-1-bh,tile,bh));if(i===n-1){c.setFillColor(C.outline);c.fillRect(new Rect(x+tile-1,h-1-bh,1,bh));}}});return c.getImage();
}
function drawCourier(kind,tool,size){
 const grid=32,unit=size/grid,c=new DrawContext();c.size=new Size(size,size);c.opaque=false;c.respectScreenScale=true;const fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x*unit,y*unit,w*unit,h*unit));};
 fill(7,2,15,2,C.outline);fill(4,4,22,4,C.outline);fill(6,1,6,4,C.outline);fill(16,0,6,5,C.outline);fill(7,3,15,1,C.white);fill(5,5,20,2,C.white);fill(7,2,4,3,C.white);fill(17,1,4,4,C.white);fill(7,7,16,2,C.outline);fill(5,9,19,10,C.outline);fill(7,7,5,5,C.outline);fill(18,7,5,6,C.outline);fill(8,9,12,9,C.skin);fill(7,11,14,5,C.skin);fill(6,13,3,4,C.skin);fill(8,9,4,4,C.outline);fill(18,9,3,5,C.outline);fill(10,13,2,1,C.outline);fill(16,13,2,1,C.outline);fill(13,16,4,1,C.outline);fill(9,18,11,2,C.outline);fill(7,20,15,8,C.outline);fill(9,18,10,3,C.forecast);fill(9,20,11,7,C.actual);fill(6,21,4,5,C.outline);fill(19,20,4,6,C.outline);fill(8,27,5,4,C.outline);fill(17,27,5,4,C.outline);fill(12,20,5,2,C.white);fill(13,22,5,3,C.forecast);
 if(kind==="error"){fill(20,8,11,2,C.outline);fill(18,10,14,2,C.sakura);fill(25,12,1,14,C.outline);fill(24,25,3,1,C.outline);}else if(kind==="stale"){fill(23,18,8,8,C.outline);fill(24,19,6,6,C.white);fill(27,20,1,3,C.actual);fill(27,22,2,1,C.actual);}else if(kind==="empty"){fill(22,23,8,5,C.rule);fill(23,22,6,1,C.outline);}else{fill(21,18,10,10,C.outline);fill(23,20,6,6,kind==="live"?C.actual:C.forecast);fill(23,22,6,1,C.white);fill(25,18,2,2,C.outline);}return c.getImage();
}
function addStatus(parent,status,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(status.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,status.label,mono(size),statusColor(status.kind));}
function statusDot(kind){const c=new DrawContext();c.size=new Size(6,6);c.opaque=false;c.respectScreenScale=true;c.setFillColor(kind==="live"?C.healthy:kind==="stale"?C.forecast:kind==="error"?C.sakura:C.rule);c.fillRect(new Rect(0,0,6,6));return c.getImage();}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function statusDetail(s){if(s.kind==="error")return"连接失败";if(s.kind==="empty")return"暂无记录";if(s.kind==="cache")return`缓存 · ${relative(s.sync)}`;if(s.kind==="stale")return`稍旧 · ${relative(s.sync)}`;return relative(s.sync);}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function nextRefreshDate(){const step=REFRESH_MINUTES*60000;return new Date(Math.ceil((Date.now()+1000)/step)*step);}
function add(p,x,font,color){const t=p.addText(String(x));t.font=font;t.textColor=color;return t;}
function fit(t,lines,scale){t.lineLimit=lines;t.minimumScaleFactor=scale;return t;}
function title(s){return new Font("PingFangSC-Semibold",s);}function body(s){return new Font("PingFangSC-Regular",s);}function label(s){return new Font("AvenirNext-DemiBold",s);}function numberFont(s){return new Font("AvenirNext-DemiBold",s);}function mono(s){return new Font("Menlo-Regular",s);}
function finite(x){return Number.isFinite(Number(x));}function num(x){return finite(x)?Number(x):0;}
function compact(n){n=num(n);const a=Math.abs(n);if(a>=999950000000)return trim(n/1e12)+"T";if(a>=999950000)return trim(n/1e9)+"B";if(a>=999950)return trim(n/1e6)+"M";if(a>=999.95)return trim(n/1e3)+"K";return String(Math.round(n));}
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/," ").trim();}function number(n){return Math.round(num(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function fmt(n){return num(n).toFixed(1).replace(/\.0$/," ").trim();}
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
