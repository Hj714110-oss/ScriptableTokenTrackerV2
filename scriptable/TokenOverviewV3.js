// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: cloud-sun;
/*
 * Token Tracker V3 · Pixel Edition · Cloud Parcel Ledger
 * Vertical slice: overview + forecast + Top models + seven-day rhythm.
 * Layouts: independently composed small / medium / large.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_overview";
const REFRESH_MINUTES=2,STALE_SECONDS=1800;
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
const requested=String(config.widgetFamily||args.queryParameters?.family||"large").toLowerCase();
if(!["small","medium","large"].includes(requested))throw new Error(`Unsupported widget family: ${requested}`);
const FAMILY=requested;
let widget;
try{
 const result=await loadPayload();
 const vm=makeViewModel(result);
 widget=await createWidget(FAMILY,vm);
 widget.url=`scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&family=${FAMILY}`;
}catch(error){
 console.error(String(error));
 widget=createFatalWidget(FAMILY,error);
}
if(config.runsInWidget)Script.setWidget(widget);
else if(FAMILY==="small")await widget.presentSmall();
else if(FAMILY==="medium")await widget.presentMedium();
else await widget.presentLarge();
Script.complete();

async function createWidget(family,vm){
 if(vm.empty)return createStateWidget(family,vm);
 if(family==="small")return createSmall(vm);
 if(family==="medium")return createMedium(vm);
 return createLarge(vm);
}
function baseWidget(padding){
 const w=new ListWidget();w.backgroundColor=UI.canvas;w.setPadding(...padding);w.refreshAfterDate=nextRefreshDate();return w;
}
function createSmall(v){
 const w=baseWidget([11,11,10,11]);
 const h=w.addStack();h.centerAlignContent();add(h,"云端账本",title(9),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer(9);add(w,"至今使用总量",body(9),UI.muted);w.addSpacer(1);fit(add(w,compact(v.allTime),numberFont(26),UI.ink),1,.86);
 w.addSpacer(5);const pair=w.addStack();pair.centerAlignContent();miniMetric(pair,"今日",compact(v.today));pair.addSpacer(18);miniMetric(pair,"预计",compact(v.projection));
 w.addSpacer();rule(w);w.addSpacer(5);
 const bottom=w.addStack();bottom.centerAlignContent();const copy=bottom.addStack();copy.layoutVertically();const name=add(copy,shortModel(v.top1?.model)||"暂无模型",label(9),UI.ink);fit(name,1,1);copy.addSpacer(1);add(copy,v.top1?`${number(v.top1.requests)}次 · 缓存 ${fmt(v.top1.cache_rate)}%`:statusDetail(v),mono(8),UI.muted);bottom.addSpacer();if(v.top1)add(bottom,`${fmt(v.top1.cache_rate)}% 缓存`,mono(8),UI.accentText);bottom.addSpacer(4);const courier=bottom.addImage(drawStatusStamp(v.status.kind));courier.imageSize=new Size(16,16);
 return w;
}
function createMedium(v){
 const w=baseWidget([10,13,8,13]);
 const top=w.addStack();top.layoutHorizontally();
 const summary=top.addStack();summary.layoutVertically();summary.size=new Size(116,78);
 const head=summary.addStack();head.centerAlignContent();add(head,"云端账本",title(9),UI.ink);head.addSpacer();addStatus(head,v.status,8);
 summary.addSpacer(7);add(summary,"至今使用总量",body(9),UI.muted);fit(add(summary,compact(v.allTime),numberFont(20),UI.ink),1,.9);summary.addSpacer(1);add(summary,`今日 ${compact(v.today)}`,mono(9),UI.ink);summary.addSpacer(1);add(summary,`预计 ${compact(v.projection)}`,mono(9),UI.muted);
 top.addSpacer(8);
 const focus=top.addStack();focus.layoutHorizontally();focus.centerAlignContent();focus.size=new Size(214,78);focus.backgroundImage=cutPanel(214,78,C.surface,C.rule);focus.setPadding(8,9,7,9);
 const focusCopy=focus.addStack();focusCopy.layoutVertically();add(focusCopy,"今日主模型",body(9),UI.muted);focusCopy.addSpacer(3);const mn=add(focusCopy,shortModel(v.top1?.model)||"暂无模型",label(9),UI.ink);fit(mn,1,1);focusCopy.addSpacer(3);add(focusCopy,v.top1?`${compact(v.top1.tokens)} · ${number(v.top1.requests)}次`:statusDetail(v),mono(9),UI.muted);if(v.top1){focusCopy.addSpacer(1);add(focusCopy,`缓存 ${fmt(v.top1.cache_rate)}%`,mono(9),UI.accentText);}focus.addSpacer();const sprite=focus.addImage(drawCourier(v.status.kind,28));sprite.imageSize=new Size(28,28);
 w.addSpacer(4);const image=w.addImage(drawPostage(v.history,v.average,v.projection,336,43,false));image.imageSize=new Size(336,43);image.centerAlignImage();
 const cap=w.addStack();cap.centerAlignContent();add(cap,"七日节奏",mono(9),UI.muted);cap.addSpacer();add(cap,`日均 ${compact(v.average)} · 预计 ${compact(v.projection)}`,mono(9),UI.muted);
 return w;
}
function createLarge(v){
 const w=baseWidget([13,15,11,15]);
 const h=w.addStack();h.centerAlignContent();const hc=h.addStack();hc.layoutVertically();add(hc,"云端值班账本",title(12),UI.ink);hc.addSpacer(1);add(hc,`${statusDetail(v)} · ${number(v.events)}次记录`,mono(8),UI.muted);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer(6);
 const hero=w.addStack();hero.layoutHorizontally();hero.centerAlignContent();
 const total=hero.addStack();total.layoutVertically();add(total,"至今使用总量",body(9),UI.muted);total.addSpacer(1);fit(add(total,compact(v.allTime),numberFont(28),UI.ink),1,.9);total.addSpacer(1);add(total,`今日 ${compact(v.today)} · 预计 ${compact(v.projection)}`,mono(9),UI.muted);
 hero.addSpacer();const stamp=hero.addImage(drawDateStamp());stamp.imageSize=new Size(31,39);hero.addSpacer(7);const courier=hero.addImage(drawCourier(v.status.kind,48));courier.imageSize=new Size(48,48);
 w.addSpacer(7);
 const metrics=w.addStack();metrics.layoutHorizontally();pixelMetric(metrics,"今日真实",compact(v.today));metrics.addSpacer(8);pixelMetric(metrics,"今日预计",compact(v.projection));metrics.addSpacer(8);pixelMetric(metrics,v.average>0?"较七日均值":"七日基线",v.average>0?signed(v.vsAverage):"暂无");
 w.addSpacer(7);modelBand(w,v.top1,1);w.addSpacer(4);modelBand(w,v.top2,2);
 w.addSpacer(6);const chart=w.addImage(drawPostage(v.history,v.average,v.projection,334,82,true));chart.imageSize=new Size(334,82);chart.centerAlignImage();
 return w;
}
function createFatalWidget(family,error){const w=baseWidget(family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12]);const h=w.addStack();h.centerAlignContent();add(h,"云端账本",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,{kind:"error",label:"错误"},8);w.addSpacer();add(w,"组件暂时无法显示",title(family==="large"?18:13),UI.errorText);w.addSpacer(5);const detail=add(w,"稍后会自动重试",body(9),UI.muted);detail.lineLimit=1;return w;}
function createStateWidget(family,v){
 const pads=family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12],w=baseWidget(pads);
 const h=w.addStack();h.centerAlignContent();add(h,"云端账本",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer();const row=w.addStack();row.layoutHorizontally();row.centerAlignContent();const sprite=row.addImage(drawCourier(v.status.kind,family==="large"?72:48));sprite.imageSize=family==="large"?new Size(72,72):new Size(48,48);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.status.kind==="error"?"连接失败":"暂无用量记录",title(family==="large"?18:13),v.status.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.status.kind==="error"?"没有可用缓存，稍后会自动重试":"收到第一条真实日志后，这里会开始分拣",body(family==="large"?10:8),UI.muted);detail.lineLimit=2;detail.minimumScaleFactor=1;
 if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"主 Token = Prompt + Completion · Cache 单独统计",mono(9),UI.muted);}return w;
}
function makeViewModel(result){
 const d=result.data||{},s=d.summary||{},today=s.today||{},models=d.top_models?.today||[],history=Array.isArray(d.history_7d)?d.history_7d:[],sync=Number(d.meta?.last_sync_at||result.ts/1000||0),now=Math.floor(Date.now()/1000),hasPayload=Boolean(d.summary||d.meta||history.length||models.length),hasUsage=Number(s.all_time_total??s.year_total??0)>0||Number(today.tokens||0)>0||models.length>0||history.some(x=>Number(x.tokens)>0);
 let kind,label;if(!hasPayload){kind="error";label="连接失败";}else if(!sync||now-sync>=STALE_SECONDS||d.meta?.status==="stale"){kind="stale";label="稍旧";}else if(!result.live||d.meta?.status!=="live"){kind="cache";label="缓存";}else if(!hasUsage){kind="empty";label="暂无";}else{kind="live";label="实时";}
 return{empty:!hasUsage,status:{kind,label,sync},allTime:Number(s.all_time_total??s.year_total??0)||0,today:Number(today.tokens)||0,projection:Number(s.projection)||0,average:Number(s.baseline_7d?.daily_average)||0,vsAverage:Number(s.vs_average_percent)||0,events:Number(d.meta?.event_count)||0,top1:models[0]||null,top2:models[1]||null,history};
}
async function loadPayload(){
 const fm=FileManager.local(),primary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),secondary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`),path=fm.fileExists(primary)&&!fm.fileExists(secondary)?secondary:primary;
 try{const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()};fm.writeString(path,JSON.stringify(saved));return{...saved,live:true};}
 catch(error){console.warn(String(error));const candidates=[primary,secondary].filter(p=>fm.fileExists(p)).map(p=>{try{const x=JSON.parse(fm.readString(p));return x?.data&&validPayload(x.data)?x:null;}catch(_){return null;}}).filter(Boolean).sort((a,b)=>Number(b.ts||0)-Number(a.ts||0));if(candidates.length)return{...candidates[0],live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};}
}
function validPayload(data){return Boolean(data&&typeof data==="object"&&data.summary&&typeof data.summary==="object"&&data.meta&&typeof data.meta==="object"&&Array.isArray(data.history_7d)&&data.top_models&&typeof data.top_models==="object");}
function miniMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();add(x,k,body(9),UI.muted);add(x,v,label(9),UI.ink);}
function pixelMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();x.size=new Size(106,44);x.backgroundImage=cutPanel(106,44,C.surface,C.rule);x.setPadding(5,7,5,7);add(x,k,body(9),UI.muted);x.addSpacer(2);fit(add(x,v,label(10),UI.ink),1,.9);}
function modelBand(parent,m,rank){const band=parent.addStack();band.layoutHorizontally();band.centerAlignContent();band.setPadding(5,3,5,3);band.backgroundImage=bandImage(334,31);const left=band.addStack();left.layoutVertically();left.size=new Size(180,0);add(left,rank===1?"今日 TOP 1":"今日 TOP 2",body(9),UI.muted);const name=add(left,shortModel(m?.model)||"暂无第二模型",label(9),m?UI.ink:UI.muted);fit(name,1,1);band.addSpacer(8);const right=band.addStack();right.layoutVertically();right.size=new Size(138,0);if(m){const amount=add(right,`${compact(m.tokens)} · ${fmt(m.share)}%占比`,label(9),rank===1?UI.accentText:UI.ink);amount.rightAlignText();const meta=add(right,`${number(m.requests)}次 · 缓存 ${fmt(m.cache_rate)}%`,mono(8),UI.muted);meta.rightAlignText();}else{const note=add(right,"等待更多模型",mono(9),UI.muted);note.rightAlignText();}}
function addStatus(parent,status,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(status.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,status.label,mono(size),statusColor(status.kind));}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function statusDetail(v){if(v.status.kind==="error")return"连接失败";if(v.status.kind==="empty")return"暂无记录";if(v.status.kind==="cache")return`缓存 · ${relative(v.status.sync)}`;if(v.status.kind==="stale")return`稍旧 · ${relative(v.status.sync)}`;return relative(v.status.sync);}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function bandImage(w,h){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;c.setFillColor(C.rule);c.fillRect(new Rect(0,0,w,1));c.fillRect(new Rect(0,h-1,w,1));return c.getImage();}
function cutPanel(w,h,fill,stroke){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const p=new Path(),k=4;p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,1));c.fillRect(new Rect(k,h-1,w-k*2,1));c.fillRect(new Rect(0,k,1,h-k*2));c.fillRect(new Rect(w-1,k,1,h-k*2));return c.getImage();}
function drawPostage(items,avg,projection,w,h,detailed){
 const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;
 const m={l:8,r:6,t:detailed?11:4,b:detailed?13:3},gw=w-m.l-m.r,gh=h-m.t-m.b,base=m.t+gh,vals=(items||[]).slice(-7).map(x=>Number(x.tokens)||0);while(vals.length<7)vals.unshift(0);const max=Math.max(...vals,Number(projection)||0,Number(avg)||0,1)*1.06,slot=gw/7,bw=Math.max(8,Math.floor(slot*.56/2)*2);
 c.setFillColor(C.rule);c.fillRect(new Rect(m.l,base,gw,1));
 if(detailed&&avg>0){const y=Math.round((base-(avg/max)*gh)/2)*2;c.setFillColor(C.muted);for(let x=m.l;x<m.l+gw;x+=10)c.fillRect(new Rect(x,y,5,1));c.setFont(new Font("Menlo-Regular",8));c.setTextColor(C.muted);c.drawTextInRect(`日均 ${compact(avg)}`,new Rect(m.l,Math.max(0,y-9),70,9));}
 const startDay=new Date(`${items?.[Math.max(0,(items?.length||1)-7)]?.date||"2026-01-01"}T00:00:00+08:00`).getDay(),labels=Array.from({length:7},(_,i)=>["日","一","二","三","四","五","六"][(startDay+i)%7]);
 vals.forEach((v,i)=>{const x=Math.round((m.l+i*slot+(slot-bw)/2)/2)*2,bh=v<=0?0:Math.max(2,Math.round((v/max*gh)/2)*2),y=base-bh;if(bh>0)colorBar(c,new Rect(x,y,bw,bh),i===6?C.actual:C.rule,i===6?C.actualDark:C.muted);if(detailed){c.setFont(new Font("PingFangSC-Regular",8));c.setTextColor(C.muted);c.setTextAlignedCenter();c.drawTextInRect(i===6?"今":labels[i],new Rect(x-3,base+3,bw+6,9));}});
 const peak=vals.indexOf(Math.max(...vals));if(detailed&&peak>=0&&vals[peak]>0){const x=Math.round((m.l+peak*slot+slot/2)/2)*2,y=Math.round((base-(vals[peak]/max)*gh)/2)*2;c.setFillColor(C.actual);c.fillRect(new Rect(x-2,Math.max(0,y-6),4,4));}
 if(projection>vals[6]){const x=Math.round((m.l+6*slot+(slot-bw)/2)/2)*2,y=Math.round((base-(projection/max)*gh)/2)*2,actualY=Math.round((base-(vals[6]/max)*gh)/2)*2;c.setFillColor(C.forecast);for(let yy=y;yy<actualY;yy+=6)c.fillRect(new Rect(x+bw/2,yy,1,Math.min(3,actualY-yy)));if(detailed)c.fillRect(new Rect(x,y,bw,1));}
 return c.getImage();
}
function colorBar(c,r,color,edge){c.setFillColor(color);c.fillRect(r);if(r.width>6){c.setFillColor(edge);c.fillRect(new Rect(r.x+r.width-1,r.y,1,r.height));}}
function drawCourier(kind,size){
 const grid=32,unit=size/grid,c=new DrawContext();c.size=new Size(size,size);c.opaque=false;c.respectScreenScale=true;const fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x*unit,y*unit,w*unit,h*unit));};
 fill(7,2,15,2,C.outline);fill(4,4,22,4,C.outline);fill(6,1,6,4,C.outline);fill(16,0,6,5,C.outline);fill(7,3,15,1,C.white);fill(5,5,20,2,C.white);fill(7,2,4,3,C.white);fill(17,1,4,4,C.white);
 fill(7,7,16,2,C.outline);fill(5,9,19,10,C.outline);fill(7,7,5,5,C.outline);fill(18,7,5,6,C.outline);fill(8,9,12,9,C.skin);fill(7,11,14,5,C.skin);fill(6,13,3,4,C.skin);fill(8,9,4,4,C.outline);fill(18,9,3,5,C.outline);fill(10,13,2,1,C.outline);fill(16,13,2,1,C.outline);fill(13,16,4,1,C.outline);
 fill(9,18,11,2,C.outline);fill(7,20,15,8,C.outline);fill(9,18,10,3,C.forecast);fill(9,20,11,7,C.actual);fill(6,21,4,5,C.outline);fill(19,20,4,6,C.outline);fill(8,27,5,4,C.outline);fill(17,27,5,4,C.outline);fill(12,20,5,2,C.white);fill(13,22,5,3,C.forecast);
 if(kind==="live"){fill(23,8,1,18,C.outline);fill(24,8,7,2,C.outline);fill(24,10,6,6,C.actual);fill(24,15,7,2,C.outline);fill(21,22,3,3,C.skin);}else if(kind==="cache"){fill(22,20,8,7,C.outline);fill(23,21,6,5,C.forecast);fill(24,22,4,1,C.white);}else if(kind==="stale"){fill(23,18,8,8,C.outline);fill(24,19,6,6,C.white);fill(27,20,1,3,C.actual);fill(27,22,2,1,C.actual);}else if(kind==="error"){fill(20,8,11,2,C.outline);fill(18,10,14,2,C.sakura);fill(25,12,1,14,C.outline);fill(24,25,3,1,C.outline);}else fill(23,23,5,4,C.rule);
 return c.getImage();
}
function drawDateStamp(){const c=new DrawContext();c.size=new Size(31,39);c.opaque=false;c.respectScreenScale=true;c.setFillColor(C.actual);c.fillRect(new Rect(0,0,31,1));c.fillRect(new Rect(0,38,31,1));c.fillRect(new Rect(0,0,1,39));c.fillRect(new Rect(30,0,1,39));c.setTextAlignedCenter();c.setTextColor(C.actual);c.setFont(new Font("Menlo-Bold",8));c.drawTextInRect(monthShort(),new Rect(1,7,29,9));c.setFont(new Font("Menlo-Bold",13));c.drawTextInRect(shanghaiDay(),new Rect(1,18,29,15));return c.getImage();}
function statusDot(kind){const c=new DrawContext();c.size=new Size(6,6);c.opaque=false;c.respectScreenScale=true;c.setFillColor(kind==="live"?C.healthy:kind==="stale"?C.forecast:kind==="error"?C.sakura:C.rule);c.fillRect(new Rect(0,0,6,6));return c.getImage();}
function drawStatusStamp(kind){const c=new DrawContext();c.size=new Size(16,16);c.opaque=false;c.respectScreenScale=true;const fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x,y,w,h));};fill(4,1,8,2,C.outline);fill(2,3,12,10,C.outline);fill(4,3,8,8,C.skin);fill(5,5,2,1,C.outline);fill(9,5,2,1,C.outline);fill(6,8,4,1,C.outline);fill(4,11,8,4,kind==="live"?C.actual:kind==="cache"?C.forecast:kind==="stale"?C.sky:kind==="error"?C.sakura:C.rule);if(kind==="live"){fill(13,2,1,9,C.outline);fill(14,2,2,4,C.actual);}return c.getImage();}
function nextRefreshDate(){const step=REFRESH_MINUTES*60000;return new Date(Math.ceil((Date.now()+1000)/step)*step);}
function add(p,x,font,color){const t=p.addText(String(x));t.font=font;t.textColor=color;return t;}
function fit(t,lines,scale){t.lineLimit=lines;t.minimumScaleFactor=scale;return t;}
function title(s){return new Font("PingFangSC-Semibold",s);}function body(s){return new Font("PingFangSC-Regular",s);}function label(s){return new Font("AvenirNext-DemiBold",s);}function numberFont(s){return new Font("AvenirNext-DemiBold",s);}function mono(s){return new Font("Menlo-Regular",s);}
function compact(n){n=Number(n)||0;const a=Math.abs(n);if(a>=999950000000)return trim(n/1e12)+"T";if(a>=999950000)return trim(n/1e9)+"B";if(a>=999950)return trim(n/1e6)+"M";if(a>=999.95)return trim(n/1e3)+"K";return String(Math.round(n));}
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"");}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function fmt(n){return(Number(n)||0).toFixed(1).replace(/\.0$/,"");}function signed(n){n=Number(n)||0;return`${n>0?"+":""}${n.toFixed(1)}%`;}
function shortModel(s){const raw=String(s||"").trim(),rules=[[/^deepseek-v4-flash-vision-exp$/i,"DeepSeek V4 Flash"],[/^gemini-3\.1-pro-preview$/i,"Gemini 3.1 Pro"],[/^gpt-5\.6-sol$/i,"GPT 5.6 sol"],[/^gpt-5\.6-terra$/i,"GPT 5.6 terra"]];for(const[r,v]of rules)if(r.test(raw))return v;return raw.replace(/^claude-/i,"Claude ").replace(/^gpt-/i,"GPT ").replace(/-/g," ").replace(/\s+/g," ").trim();}
function relative(ts){if(!ts)return"未同步";const m=Math.max(0,Math.floor((Date.now()/1000-ts)/60));return m<1?"刚刚":m<60?`${m}分钟前`:m<1440?`${Math.floor(m/60)}小时前`:`${Math.floor(m/1440)}天前`;}
function shanghaiParts(){try{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",month:"short",day:"2-digit"}).formatToParts(new Date()),get=t=>parts.find(x=>x.type===t)?.value||"";return{month:get("month").toUpperCase(),day:get("day")};}catch(_){const d=new Date(Date.now()+8*3600000);return{month:["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getUTCMonth()],day:String(d.getUTCDate()).padStart(2,"0")};}}function monthShort(){return shanghaiParts().month;}function shanghaiDay(){return shanghaiParts().day;}

function loadV3Settings(){
 const fm=FileManager.local(),names=["token-tracker-v3-settings.json","token-tracker-v2-settings.json"];
 for(const name of names){
  const path=fm.joinPath(fm.documentsDirectory(),name);
  if(!fm.fileExists(path))continue;
  try{const value=JSON.parse(fm.readString(path));if(/^https?:\/\//.test(value?.apiUrl||"")&&value?.apiKey)return value;}catch(_){ }
 }
 return{apiUrl:"",apiKey:""};
}
