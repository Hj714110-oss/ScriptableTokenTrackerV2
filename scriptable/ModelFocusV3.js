// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: crosshairs;
/*
 * Token Tracker V3 · Pixel Edition · Cloud Parcel Ledger
 * Ranked model focus. Parameter: rank,period,source.
 * V2 rank/period/source normalization is preserved exactly.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_focus";
const REFRESH_MINUTES=2,STALE_SECONDS=1800;
const PARAM=parseParam(args.widgetParameter);
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
const requested=String(config.widgetFamily||args.queryParameters?.family||"small").toLowerCase();
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
 const w=baseWidget([8,10,7,10]);
 const h=w.addStack();h.centerAlignContent();add(h,`MODEL · 0${v.rank}`,mono(8),UI.muted);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(5);const name=add(w,shortModel(v.model.model),title(13),UI.ink);name.lineLimit=1;w.addSpacer(1);const context=add(w,`${v.model.family||"未知家族"} · ${periodName(v.period)} · ${sourceName(v.source,v.data)}`,body(9),UI.muted);context.lineLimit=1;
 w.addSpacer(4);const hero=w.addStack();hero.layoutHorizontally();hero.centerAlignContent();const amount=hero.addStack();amount.layoutVertically();add(amount,compact(v.model.tokens),label(22),UI.accentText);amount.addSpacer(1);add(amount,`${fmt(v.model.share)}% 占比`,mono(9),UI.muted);hero.addSpacer();const ring=hero.addImage(drawPixelRing(v.model.share,48));ring.imageSize=new Size(48,48);
 w.addSpacer(3);rule(w);w.addSpacer(3);const metrics=w.addStack();focusMetric(metrics,"请求",number(v.model.requests));metrics.addSpacer();focusMetric(metrics,"缓存",`${fmt(v.model.cache_rate)}%`);metrics.addSpacer();focusMetric(metrics,"平均耗时",latency(v.model.avg_latency));
 w.addSpacer(3);const trend=w.addImage(drawSpark(v.model.history_7d||[],150,14,true));trend.imageSize=new Size(150,14);trend.centerAlignImage();
 return w;
}
function createMedium(v){
 const w=baseWidget([9,13,7,13]);
 const h=w.addStack();h.centerAlignContent();add(h,`MODEL · 0${v.rank}`,mono(8),UI.muted);h.addSpacer(7);add(h,`${periodName(v.period)} · ${sourceName(v.source,v.data)}`,label(9),UI.accentText);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(4);const bodyRow=w.addStack();bodyRow.layoutHorizontally();bodyRow.centerAlignContent();
 const identity=bodyRow.addStack();identity.layoutVertically();identity.size=new Size(136,69);const name=add(identity,shortModel(v.model.model),title(15),UI.ink);name.lineLimit=1;identity.addSpacer(2);add(identity,v.model.family||"未知家族",body(9),UI.muted);identity.addSpacer(5);add(identity,`${compact(v.model.tokens)} TOKENS`,label(13),UI.accentText);identity.addSpacer(1);add(identity,`${fmt(v.model.share)}% 占比`,mono(9),UI.muted);
 bodyRow.addSpacer(8);const contribution=bodyRow.addStack();contribution.layoutHorizontally();contribution.centerAlignContent();contribution.size=new Size(192,69);contribution.backgroundImage=pixelPanel(192,69,C.surface,C.rule);contribution.setPadding(7,8,7,8);const cards=contribution.addStack();cards.layoutVertically();metricLine(cards,"请求",number(v.model.requests));cards.addSpacer(3);metricLine(cards,"缓存命中率",`${fmt(v.model.cache_rate)}%`);cards.addSpacer(3);metricLine(cards,"平均响应耗时",latency(v.model.avg_latency));contribution.addSpacer();const ring=contribution.addImage(drawPixelRing(v.model.share,48));ring.imageSize=new Size(48,48);
 w.addSpacer(4);const chart=w.addImage(drawFocusTrend(v.model.history_7d||[],328,46));chart.imageSize=new Size(328,46);chart.centerAlignImage();
 return w;
}
function createLarge(v){
 const w=baseWidget([12,15,10,15]);
 const h=w.addStack();h.centerAlignContent();const hc=h.addStack();hc.layoutVertically();add(hc,"云端模型档案",title(13),UI.ink);hc.addSpacer(1);add(hc,`排行 0${v.rank} · ${periodName(v.period)} · ${sourceName(v.source,v.data)} · ${stateDetail(v.state)}`,mono(8),UI.muted);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer(6);const hero=w.addStack();hero.layoutHorizontally();hero.centerAlignContent();
 const identity=hero.addStack();identity.layoutVertically();identity.size=new Size(204,79);add(identity,v.model.family||"未知家族",body(9),UI.muted);identity.addSpacer(2);const name=add(identity,shortModel(v.model.model),title(17),UI.ink);name.lineLimit=1;identity.addSpacer(5);add(identity,compact(v.model.tokens),label(24),UI.accentText);identity.addSpacer(1);add(identity,"所选周期主 Token",body(9),UI.muted);
 hero.addSpacer();const stamp=hero.addImage(drawRankStamp(v.rank));stamp.imageSize=new Size(34,44);hero.addSpacer(8);const ring=hero.addImage(drawPixelRing(v.model.share,64));ring.imageSize=new Size(64,64);
 w.addSpacer(7);const cards=w.addStack();cards.layoutHorizontally();largeMetric(cards,"请求数",number(v.model.requests));cards.addSpacer(8);largeMetric(cards,"模型缓存率",`${fmt(v.model.cache_rate)}%`);cards.addSpacer(8);largeMetric(cards,"平均响应耗时",latency(v.model.avg_latency));
 w.addSpacer(7);const mix=w.addStack();mix.layoutVertically();mix.size=new Size(334,54);mix.backgroundImage=pixelPanel(334,54,C.surface,C.rule);mix.setPadding(6,8,5,8);const mh=mix.addStack();mh.centerAlignContent();add(mh,"Token 构成",title(9),UI.ink);mh.addSpacer();add(mh,"主 Token = Prompt + Completion · Cache 单独统计",mono(8),UI.muted);mix.addSpacer(4);const parts=mix.addStack();parts.centerAlignContent();mixPart(parts,"Prompt",v.model.prompt_tokens);parts.addSpacer();mixPart(parts,"Completion",v.model.completion_tokens);parts.addSpacer();mixPart(parts,"Cache Read",v.model.cache_tokens);parts.addSpacer();mixPart(parts,"Cache Create",v.model.cache_creation_tokens);
 w.addSpacer(6);const chartBox=w.addStack();chartBox.layoutVertically();chartBox.size=new Size(334,90);chartBox.backgroundImage=pixelPanel(334,90,C.surface,C.rule);chartBox.setPadding(7,9,6,9);const ch=chartBox.addStack();ch.centerAlignContent();add(ch,"模型近 7 日邮戳",title(9),UI.ink);ch.addSpacer();add(ch,`贡献占比 ${fmt(v.model.share)}%`,mono(9),UI.muted);chartBox.addSpacer(3);const chart=chartBox.addImage(drawFocusTrend(v.model.history_7d||[],316,54));chart.imageSize=new Size(316,54);chart.centerAlignImage();
 return w;
}
function focusMetric(parent,k,v){const box=parent.addStack();box.layoutVertically();add(box,k,body(9),UI.muted);add(box,v,label(9),UI.ink);}
function metricLine(parent,k,v){const row=parent.addStack();row.centerAlignContent();add(row,k,body(9),UI.muted);row.addSpacer();add(row,v,label(9),UI.ink);}
function largeMetric(parent,k,v){const box=parent.addStack();box.layoutVertically();box.size=new Size(106,49);box.backgroundImage=pixelPanel(106,49,C.surface,C.rule);box.setPadding(6,7,5,7);add(box,k,body(9),UI.muted);box.addSpacer(3);const value=add(box,v,label(11),UI.ink);value.lineLimit=1;}
function mixPart(parent,k,v){const x=parent.addStack();x.layoutVertically();add(x,k,mono(8),UI.muted);add(x,compact(v),label(9),UI.ink);}
function createStateWidget(family,v){
 const pads=family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12],w=baseWidget(pads);
 const h=w.addStack();h.centerAlignContent();add(h,`MODEL · 0${v.rank}`,mono(family==="large"?10:8),UI.muted);h.addSpacer();addStatus(h,v.state,8);
 w.addSpacer();const row=w.addStack();row.centerAlignContent();const spriteSize=family==="large"?64:32,courier=row.addImage(drawCourier(v.state.kind,spriteSize));courier.imageSize=new Size(spriteSize,spriteSize);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.state.kind==="error"?"连接失败":"暂无模型记录",title(family==="large"?18:13),v.state.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.state.kind==="error"?"没有可用缓存，稍后会自动重试":`请更换排行序号或周期 · ${periodName(v.period)} · ${sourceName(v.source,v.data)}`,body(family==="large"?10:9),UI.muted);detail.lineLimit=2;
 if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"仅聚焦所选排行模型 · 不替换为其他名次",mono(9),UI.muted);}return w;
}
function createFatalWidget(family){const w=baseWidget(family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12]);const h=w.addStack();h.centerAlignContent();add(h,"模型档案",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,{kind:"error",label:"错误"},8);w.addSpacer();add(w,"组件暂时无法显示",title(family==="large"?18:13),UI.errorText);w.addSpacer(5);add(w,"稍后会自动重试",body(9),UI.muted);return w;}
function makeViewModel(result){
 const d=result.data||{},source=resolveSource(PARAM.source,d),list=source==="all"?d.top_models?.[PARAM.period]:d.source_top_models?.[source]?.[PARAM.period],models=Array.isArray(list)?list:[],model=models[PARAM.rank-1]||null,aggregate=source==="all"?d.periods?.[PARAM.period]:d.source_periods?.[source]?.[PARAM.period],state=resolveState(result,d,Array.isArray(list),model);
 return{data:d,models,model:enrichModel(model,aggregate),state,rank:PARAM.rank,period:PARAM.period,source};
}
function enrichModel(model,aggregate){if(!model)return null;return{...model,prompt_tokens:Number(model.prompt_tokens??aggregate?.prompt_tokens)||0,completion_tokens:Number(model.completion_tokens??aggregate?.completion_tokens)||0,cache_tokens:Number(model.cache_tokens??aggregate?.cache_tokens)||0,cache_creation_tokens:Number(model.cache_creation_tokens??aggregate?.cache_creation_tokens)||0};}
function resolveState(result,d,validList,model){
 const sync=normalizeSeconds(d.meta?.last_sync_at||result.ts),now=Math.floor(Date.now()/1000),valid=Boolean(d.meta&&validList);
 let kind,label;if(!valid){kind="error";label="连接失败";}else if(!model){kind="empty";label="暂无";}else if(!sync||now-sync>=STALE_SECONDS||d.meta?.status==="stale"){kind="stale";label="稍旧";}else if(!result.live||d.meta?.status!=="live"){kind="cache";label="缓存";}else{kind="live";label="实时";}return{kind,label,sync};
}
async function loadPayload(){
 const fm=FileManager.local(),a=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),b=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`);
 try{const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()};writeNextSlot(fm,a,b,saved);return{...saved,live:true};}
 catch(error){console.warn(String(error));const cached=readNewest(fm,[a,b]);if(cached)return{...cached,live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};}
}
function validPayload(d){return Boolean(d&&typeof d==="object"&&d.meta&&d.top_models&&d.source_top_models&&d.periods&&d.source_periods&&d.sources);}
function writeNextSlot(fm,a,b,saved){let target=a;const aa=readSlot(fm,a),bb=readSlot(fm,b);if(!aa)target=a;else if(!bb)target=b;else target=Number(aa.ts||0)<=Number(bb.ts||0)?a:b;fm.writeString(target,JSON.stringify(saved));}
function readNewest(fm,paths){return paths.map(p=>readSlot(fm,p)).filter(Boolean).sort((x,y)=>Number(y.ts||0)-Number(x.ts||0))[0]||null;}
function readSlot(fm,p){if(!fm.fileExists(p))return null;try{const x=JSON.parse(fm.readString(p));return x?.data&&validPayload(x.data)?x:null;}catch(_){return null;}}
function parseParam(p){const a=String(p||"1,today,all").toLowerCase().split(",").map(x=>x.trim());return{rank:Math.max(1,Math.min(5,Number.parseInt(a[0],10)||1)),period:["7d","month"].includes(a[1])?a[1]:"today",source:normalizeSource(a[2])};}
function normalizeSource(source){source=String(source||"all").toLowerCase().trim();return source||"all";}
function resolveSource(source,d){if(source==="all")return"all";const keys=new Set([...Object.keys(d?.sources||{}),...Object.keys(d?.source_top_models||{})].map(x=>String(x).toLowerCase()));return keys.has(source)?source:"all";}
function sourceName(source,d){return source==="all"?"全部来源":d.sources?.[source]?.label||source;}
function periodName(p){return p==="7d"?"近7日":p==="month"?"本月":"今日";}
function stateDetail(s){if(s.kind==="error")return"连接失败";if(s.kind==="empty")return"暂无记录";if(s.kind==="cache")return`缓存 · ${relative(s.sync)}`;if(s.kind==="stale")return`稍旧 · ${relative(s.sync)}`;return relative(s.sync);}
function latency(n){n=Number(n)||0;return n>0?`${fmt(n)}s`:"无样本";}
function addStatus(parent,state,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(state.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,state.label,mono(size),statusColor(state.kind));}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function pixelPanel(w,h,fill,stroke){const c=ctx(w,h),k=4,p=new Path();p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,2));c.fillRect(new Rect(k,h-2,w-k*2,2));c.fillRect(new Rect(0,k,2,h-k*2));c.fillRect(new Rect(w-2,k,2,h-k*2));return c.getImage();}
function drawPixelRing(share,size){const c=ctx(size,size),inset=2,end=Math.max(0,Math.min(16,Math.round((Number(share)||0)/100*16))),segments=[[8,0,8,2],[16,2,8,2],[24,4,4,4],[28,8,4,8],[28,16,4,8],[24,24,4,4],[16,28,8,4],[8,28,8,4],[4,24,4,4],[0,16,4,8],[0,8,4,8],[4,4,4,4],[8,2,8,2],[16,0,8,2],[24,2,4,2],[28,4,2,4]];const scale=size/32;c.setFillColor(C.rule);segments.forEach(([x,y,w,h])=>c.fillRect(new Rect(x*scale,y*scale,w*scale,h*scale)));c.setFillColor(C.actual);segments.slice(0,end).forEach(([x,y,w,h])=>c.fillRect(new Rect(x*scale,y*scale,w*scale,h*scale)));c.setTextAlignedCenter();c.setTextColor(C.ink);c.setFont(new Font("AvenirNext-DemiBold",Math.max(9,Math.floor(size*.22))));c.drawTextInRect(`${Math.round(Number(share)||0)}%`,new Rect(inset,size*.38,size-inset*2,size*.28));return c.getImage();}
function drawSpark(items,w,h,highlight){const c=ctx(w,h),vals=(items||[]).slice(-7).map(x=>Number(x.val)||0);while(vals.length<7)vals.unshift(0);const max=Math.max(...vals,1),slot=w/7,base=h-1;vals.forEach((v,i)=>{if(v<=0)return;const x=Math.round((i*slot+slot*.2)/2)*2,bw=Math.max(2,Math.floor(slot*.58/2)*2),bh=Math.max(2,Math.round(v/max*(h-3)/2)*2);c.setFillColor(highlight&&i===6?C.actual:C.rule);c.fillRect(new Rect(x,base-bh,bw,bh));});c.setFillColor(C.rule);c.fillRect(new Rect(0,h-2,w,2));return c.getImage();}
function drawFocusTrend(items,w,h){const c=ctx(w,h),rows=(items||[]).slice(-7),vals=rows.map(x=>Number(x.val)||0);while(vals.length<7)vals.unshift(0);const max=Math.max(...vals,1),m={l:6,r:4,t:4,b:14},gw=w-m.l-m.r,gh=h-m.t-m.b,slot=gw/7,base=m.t+gh,bw=Math.max(4,Math.floor(slot*.52/2)*2);c.setFillColor(C.rule);c.fillRect(new Rect(m.l,base,gw,2));vals.forEach((v,i)=>{const x=Math.round((m.l+i*slot+(slot-bw)/2)/2)*2,bh=v<=0?0:Math.max(2,Math.round(v/max*gh/2)*2);if(bh){c.setFillColor(i===6?C.actual:C.rule);c.fillRect(new Rect(x,base-bh,bw,bh));if(bw>6){c.setFillColor(i===6?C.actualDark:C.muted);c.fillRect(new Rect(x+bw-2,base-bh,2,bh));}}c.setTextAlignedCenter();c.setTextColor(C.muted);c.setFont(new Font("Menlo-Regular",8));c.drawTextInRect(i===6?"今":dayLabel(rows[i]?.date,i),new Rect(x-2,base+3,bw+4,9));});const peak=vals.indexOf(Math.max(...vals));if(peak>=0&&vals[peak]>0){const x=Math.round((m.l+peak*slot+slot/2)/2)*2,y=Math.round((base-vals[peak]/max*gh)/2)*2;c.setFillColor(C.actual);c.fillRect(new Rect(x-2,Math.max(0,y-6),4,4));}return c.getImage();}
function dayLabel(date,i){if(!date)return String(i+1);try{return["日","一","二","三","四","五","六"][new Date(`${date}T00:00:00+08:00`).getDay()];}catch(_){return String(i+1);}}
function drawRankStamp(rank){const c=ctx(34,44);c.setFillColor(C.actual);c.fillRect(new Rect(0,0,34,1));c.fillRect(new Rect(0,43,34,1));c.fillRect(new Rect(0,0,1,44));c.fillRect(new Rect(33,0,1,44));c.setTextAlignedCenter();c.setTextColor(C.actual);c.setFont(new Font("Menlo-Bold",8));c.drawTextInRect("RANK",new Rect(1,8,32,9));c.setFont(new Font("AvenirNext-DemiBold",17));c.drawTextInRect(`0${rank}`,new Rect(1,20,32,19));return c.getImage();}
function statusDot(kind){const c=ctx(6,6);c.setFillColor(kind==="live"?C.healthy:kind==="stale"?C.forecast:kind==="error"?C.sakura:C.rule);c.fillRect(new Rect(0,0,6,6));return c.getImage();}
function drawCourier(kind,size){const grid=32,unit=size/grid,c=ctx(size,size),fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x*unit,y*unit,w*unit,h*unit));};fill(7,2,15,2,C.outline);fill(4,4,22,4,C.outline);fill(6,1,6,4,C.outline);fill(16,0,6,5,C.outline);fill(7,3,15,1,C.white);fill(5,5,20,2,C.white);fill(7,2,4,3,C.white);fill(17,1,4,4,C.white);fill(7,7,16,2,C.outline);fill(5,9,19,10,C.outline);fill(7,7,5,5,C.outline);fill(18,7,5,6,C.outline);fill(8,9,12,9,C.skin);fill(7,11,14,5,C.skin);fill(6,13,3,4,C.skin);fill(8,9,4,4,C.outline);fill(18,9,3,5,C.outline);fill(10,13,2,1,C.outline);fill(16,13,2,1,C.outline);fill(13,16,4,1,C.outline);fill(9,18,11,2,C.outline);fill(7,20,15,8,C.outline);fill(9,18,10,3,C.forecast);fill(9,20,11,7,C.actual);fill(6,21,4,5,C.outline);fill(19,20,4,6,C.outline);fill(8,27,5,4,C.outline);fill(17,27,5,4,C.outline);fill(12,20,5,2,C.white);fill(13,22,5,3,C.forecast);if(kind==="live"){fill(23,8,1,18,C.outline);fill(24,8,7,2,C.outline);fill(24,10,6,6,C.actual);fill(24,15,7,2,C.outline);}else if(kind==="cache"){fill(22,20,8,7,C.outline);fill(23,21,6,5,C.forecast);}else if(kind==="stale"){fill(23,18,8,8,C.outline);fill(24,19,6,6,C.white);fill(27,20,1,3,C.actual);}else if(kind==="error"){fill(20,8,11,2,C.outline);fill(18,10,14,2,C.sakura);fill(25,12,1,14,C.outline);}return c.getImage();}
function ctx(w,h){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;return c;}
function nextRefreshDate(){const step=REFRESH_MINUTES*60000;return new Date(Math.ceil((Date.now()+1000)/step)*step);}
function normalizeSeconds(n){n=Number(n)||0;return n>1e12?Math.floor(n/1000):Math.floor(n);}
function add(p,x,font,color){const t=p.addText(String(x));t.font=font;t.textColor=color;return t;}
function title(s){return new Font("PingFangSC-Semibold",s);}function body(s){return new Font("PingFangSC-Regular",s);}function label(s){return new Font("AvenirNext-DemiBold",s);}function mono(s){return new Font("Menlo-Regular",s);}
function shortModel(s){const raw=String(s||"").trim(),rules=[[/^deepseek-v4-flash-vision-exp$/i,"DeepSeek V4 Flash"],[/^gemini-3\.1-pro-preview$/i,"Gemini 3.1 Pro"],[/^gpt-5\.6-sol$/i,"GPT 5.6 sol"],[/^gpt-5\.6-terra$/i,"GPT 5.6 terra"]];for(const[r,v]of rules)if(r.test(raw))return v;return raw.replace(/^claude-/i,"Claude ").replace(/^gpt-/i,"GPT ").replace(/-/g," ").replace(/\s+/g," ").trim();}
function compact(n){n=Number(n)||0;const a=Math.abs(n);if(a>=999950000000)return trim(n/1e12)+"T";if(a>=999950000)return trim(n/1e9)+"B";if(a>=999950)return trim(n/1e6)+"M";if(a>=999.95)return trim(n/1e3)+"K";return String(Math.round(n));}
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"");}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function fmt(n){return(Number(n)||0).toFixed(1).replace(/\.0$/,"");}
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
