// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: calendar-days;
/*
 * Token Tracker V3 · Pixel Edition · Cloud Parcel Ledger
 * Activity ledger: 180-day activity + streaks + V2 cache/request context.
 * Layouts: independently composed small / medium / large.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_activity";
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
 canvas:new Color("#292521"),surface:new Color("#37312C"),surface2:new Color("#322F2B"),ink:new Color("#F2EDE5"),muted:new Color("#B8ADA1"),rule:new Color("#4A4640"),empty:new Color("#3A3733"),l1:new Color("#644A3E"),l2:new Color("#9D614A"),l3:new Color("#E08B68"),actual:new Color("#E08B68"),forecast:new Color("#D99A62"),healthy:new Color("#9CB596"),outline:new Color("#1D1815"),skin:new Color("#E5A984"),white:new Color("#F2EDE5"),sky:new Color("#8EB4C6"),sakura:new Color("#D797A0")
}:{
 canvas:new Color("#F3F0E8"),surface:new Color("#FFFDF8"),surface2:new Color("#E9E4DA"),ink:new Color("#2E2A26"),muted:new Color("#756B61"),rule:new Color("#D2C9BC"),empty:new Color("#E3DDD2"),l1:new Color("#E9C6B5"),l2:new Color("#D89373"),l3:new Color("#9A4930"),actual:new Color("#C9653A"),forecast:new Color("#F0B56D"),healthy:new Color("#6D8668"),outline:new Color("#46352C"),skin:new Color("#F0B58A"),white:new Color("#FFFDF8"),sky:new Color("#8FB9CF"),sakura:new Color("#D98591")
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
 widget=createFatalWidget(FAMILY);
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
function baseWidget(padding){const w=new ListWidget();w.backgroundColor=UI.canvas;w.setPadding(...padding);w.refreshAfterDate=nextRefreshDate();return w;}
function createSmall(v){
 const w=baseWidget([11,11,9,11]);
 const h=w.addStack();h.centerAlignContent();add(h,"180日活动簿",title(10),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer(5);const hero=w.addStack();hero.centerAlignContent();const copy=hero.addStack();copy.layoutVertically();add(copy,"当前连续使用",body(9),UI.muted);copy.addSpacer(1);const value=heroValue(copy,v.currentStreak,"天",24);copy.addSpacer(1);add(copy,`活跃 ${number(v.activeDays)} · 最长 ${number(v.longestStreak)} 天`,mono(8),UI.muted);hero.addSpacer();const stamp=hero.addImage(drawStatusStamp(v.status.kind));stamp.imageSize=new Size(20,20);
 w.addSpacer(4);const heat=w.addImage(drawHeatmap(v.history,148,50,"small"));heat.imageSize=new Size(148,50);heat.centerAlignImage();
 w.addSpacer();rule(w);w.addSpacer(4);const foot=w.addStack();foot.centerAlignContent();add(foot,`今日缓存 ${fmt(v.cacheRate)}%`,body(9),UI.muted);foot.addSpacer();add(foot,`${number(v.requests)} 次请求`,mono(8),UI.muted);
 return w;
}
function createMedium(v){
 const w=baseWidget([10,13,8,13]);
 const h=w.addStack();h.centerAlignContent();const head=h.addStack();head.layoutVertically();add(head,"活动与缓存",title(11),UI.ink);head.addSpacer(1);add(head,"180 DAYS · ACTIVITY LEDGER",mono(8),UI.muted);h.addSpacer();addStatus(h,v.status,8);h.addSpacer(8);const sync=add(h,relative(v.status.sync),body(9),UI.muted);sync.rightAlignText();
 w.addSpacer(5);const metrics=w.addStack();metrics.layoutHorizontally();pixelMetric(metrics,"活跃天数",number(v.activeDays));metrics.addSpacer(8);pixelMetric(metrics,"连续使用",`${number(v.currentStreak)} 天`);metrics.addSpacer(8);pixelMetric(metrics,"今日缓存",`${fmt(v.cacheRate)}%`);
 w.addSpacer(4);const heat=w.addImage(drawHeatmap(v.history,338,55,"medium"));heat.imageSize=new Size(338,55);heat.centerAlignImage();
 w.addSpacer(3);const foot=w.addStack();foot.centerAlignContent();add(foot,`缓存 ${compact(v.cacheTokens)}`,body(9),UI.muted);foot.addSpacer();add(foot,`${number(v.requests)} 次请求`,body(9),UI.muted);foot.addSpacer();add(foot,`最长 ${number(v.longestStreak)} 天`,label(9),UI.accentText);
 return w;
}
function createLarge(v){
 const w=baseWidget([13,15,11,15]);
 const h=w.addStack();h.centerAlignContent();const head=h.addStack();head.layoutVertically();add(head,"180日云端值班簿",title(13),UI.ink);head.addSpacer(1);add(head,`过去 180 天 · ${relative(v.status.sync)}`,mono(8),UI.muted);h.addSpacer();const courier=h.addImage(drawCourier(v.status.kind,38));courier.imageSize=new Size(38,38);h.addSpacer(8);addStatus(h,v.status,8);
 w.addSpacer(7);const hero=w.addStack();hero.layoutHorizontally();hero.centerAlignContent();const streak=hero.addStack();streak.layoutVertically();add(streak,"当前连续使用",body(9),UI.muted);streak.addSpacer(1);heroValue(streak,v.currentStreak,"天",30);streak.addSpacer(1);add(streak,`最长记录 ${number(v.longestStreak)} 天`,mono(9),UI.muted);hero.addSpacer();const parcels=hero.addImage(drawActivityParcels(v.activeDays));parcels.imageSize=new Size(78,48);
 w.addSpacer(7);const metrics=w.addStack();metrics.layoutHorizontally();pixelMetric(metrics,"活跃天数",number(v.activeDays));metrics.addSpacer(8);pixelMetric(metrics,"今日缓存",`${fmt(v.cacheRate)}%`);metrics.addSpacer(8);pixelMetric(metrics,"今日请求",number(v.requests));
 w.addSpacer(7);const cap=w.addStack();cap.centerAlignContent();add(cap,"26 周活动邮格",label(9),UI.ink);cap.addSpacer();add(cap,"深色 = 更多真实 Token",mono(8),UI.muted);
 w.addSpacer(4);const heat=w.addImage(drawHeatmap(v.history,334,126,"large"));heat.imageSize=new Size(334,126);heat.centerAlignImage();
 w.addSpacer(4);const foot=w.addStack();foot.centerAlignContent();add(foot,`今日缓存读取 ${compact(v.cacheTokens)}`,body(9),UI.muted);foot.addSpacer();add(foot,statusDetail(v),mono(8),UI.muted);
 return w;
}
function heroValue(parent,n,suffix,size){const row=parent.addStack();row.centerAlignContent();fit(add(row,number(n),numberFont(size),UI.ink),1,.92);row.addSpacer(3);add(row,suffix,label(10),UI.muted);return row;}
function createFatalWidget(family){return createStateWidget(family,{status:{kind:"error",label:"错误",sync:0},empty:true});}
function createStateWidget(family,v){
 const pads=family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12],w=baseWidget(pads);
 const h=w.addStack();h.centerAlignContent();add(h,"180日活动簿",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer();const row=w.addStack();row.layoutHorizontally();row.centerAlignContent();const sprite=row.addImage(drawCourier(v.status.kind,family==="large"?72:48));sprite.imageSize=family==="large"?new Size(72,72):new Size(48,48);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.status.kind==="error"?"连接失败":"暂无活动记录",title(family==="large"?18:13),v.status.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.status.kind==="error"?"没有可用缓存，稍后会自动重试":"收到真实日志后，180日邮格会开始着色",body(family==="large"?10:9),UI.muted);detail.lineLimit=2;detail.minimumScaleFactor=1;
 if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"活跃日只按 history_180d 中 tokens > 0 判断",mono(9),UI.muted);}return w;
}
function makeViewModel(result){
 const d=result.data||{},s=d.summary||{},today=s.today||{},history=Array.isArray(d.history_180d)?d.history_180d:[],sync=Number(d.meta?.last_sync_at||result.ts/1000||0),now=Math.floor(Date.now()/1000),hasPayload=Boolean(d.summary||d.meta||history.length),hasUsage=Number(s.active_days_180||0)>0||Number(s.current_streak||0)>0||history.some(x=>Number(x.tokens)>0);
 let kind,label;if(!hasPayload){kind="error";label="连接失败";}else if(!sync||now-sync>=STALE_SECONDS||d.meta?.status==="stale"){kind="stale";label="稍旧";}else if(!result.live||d.meta?.status!=="live"){kind="cache";label="缓存";}else if(!hasUsage){kind="empty";label="暂无";}else{kind="live";label="实时";}
 return{empty:!hasUsage,status:{kind,label,sync},activeDays:Number(s.active_days_180)||0,currentStreak:Number(s.current_streak)||0,longestStreak:Number(s.longest_streak_180)||0,cacheRate:Number(today.cache_rate)||0,cacheTokens:Number(today.cache_tokens)||0,requests:Number(today.requests)||0,history};
}
async function loadPayload(){
 const fm=FileManager.local(),primary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),secondary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`),path=fm.fileExists(primary)&&!fm.fileExists(secondary)?secondary:primary;
 try{const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()};fm.writeString(path,JSON.stringify(saved));return{...saved,live:true};}
 catch(error){console.warn(String(error));const candidates=[primary,secondary].filter(p=>fm.fileExists(p)).map(p=>{try{const x=JSON.parse(fm.readString(p));return x?.data&&validPayload(x.data)?x:null;}catch(_){return null;}}).filter(Boolean).sort((a,b)=>Number(b.ts||0)-Number(a.ts||0));if(candidates.length)return{...candidates[0],live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};}
}
function validPayload(data){return Boolean(data&&typeof data==="object"&&data.summary&&typeof data.summary==="object"&&data.meta&&typeof data.meta==="object"&&Array.isArray(data.history_180d));}
function pixelMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();x.size=new Size(106,44);x.backgroundImage=cutPanel(106,44,C.surface,C.rule);x.setPadding(5,7,5,7);add(x,k,body(9),UI.muted);x.addSpacer(2);fit(add(x,v,label(10),UI.ink),1,.9);}
function addStatus(parent,status,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(status.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,status.label,mono(size),statusColor(status.kind));}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function statusDetail(v){if(v.status.kind==="error")return"连接失败";if(v.status.kind==="empty")return"暂无记录";if(v.status.kind==="cache")return`缓存 · ${relative(v.status.sync)}`;if(v.status.kind==="stale")return`稍旧 · ${relative(v.status.sync)}`;return relative(v.status.sync);}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function cutPanel(w,h,fill,stroke){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const p=new Path(),k=4;p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,1));c.fillRect(new Rect(k,h-1,w-k*2,1));c.fillRect(new Rect(0,k,1,h-k*2));c.fillRect(new Rect(w-1,k,1,h-k*2));return c.getImage();}
function drawHeatmap(items,w,h,mode){
 const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const large=mode==="large",weeks=26,gap=2,top=large?16:2,bottom=large?4:2,cell=Math.max(2,Math.floor(Math.min((w-4-(weeks-1)*gap)/weeks,(h-top-bottom-(7-1)*gap)/7)/2)*2),gridW=weeks*cell+(weeks-1)*gap,gridH=7*cell+6*gap,x0=Math.floor((w-gridW)/4)*2,y0=top+Math.max(0,Math.floor((h-top-bottom-gridH)/4)*2),map={};
 (Array.isArray(items)?items:[]).forEach(x=>{if(x?.date)map[String(x.date)]=Number(x.tokens)||0;});const values=Object.values(map).filter(v=>v>0).sort((a,b)=>a-b),q1=percentile(values,.34),q2=percentile(values,.67),today=shanghaiTodayKey(),end=parseShanghaiDay(today),start=startWeek(addDays(end,-(weeks-1)*7)),months=[];
 for(let col=0;col<weeks;col++)for(let row=0;row<7;row++){const dt=addDays(start,col*7+row),date=dayKey(dt),x=x0+col*(cell+gap),y=y0+row*(cell+gap);if(large&&row===0&&(col===0||dt.getUTCMonth()!==addDays(start,(col-1)*7).getUTCMonth()))months.push({x,label:monthLabel(dt.getUTCMonth())});if(date>today){c.setFillColor(C.rule);c.fillRect(new Rect(x,y,cell,1));c.fillRect(new Rect(x,y,1,cell));continue;}c.setFillColor(level(map[date]||0,q1,q2));c.fillRect(new Rect(x,y,cell,cell));if(date===today){c.setFillColor(C.ink);c.fillRect(new Rect(x,y,cell,1));c.fillRect(new Rect(x,y+cell-1,cell,1));c.fillRect(new Rect(x,y,1,cell));c.fillRect(new Rect(x+cell-1,y,1,cell));}}
 if(large){c.setFont(new Font("Menlo-Regular",8));c.setTextColor(C.muted);months.forEach(m=>c.drawTextInRect(m.label,new Rect(m.x,1,28,9)));}
 return c.getImage();
}
function level(v,a,b){return v<=0?C.empty:v<=a?C.l1:v<=b?C.l2:C.l3;}function percentile(a,p){return a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;}
function drawActivityParcels(activeDays){const c=new DrawContext();c.size=new Size(78,48);c.opaque=false;c.respectScreenScale=true;const blocks=Math.max(0,Math.min(12,Math.round(Number(activeDays||0)/15)));for(let i=0;i<12;i++){const col=i%4,row=Math.floor(i/4),x=2+col*19,y=2+row*15;c.setFillColor(i<blocks?C.actual:C.empty);c.fillRect(new Rect(x,y,15,11));c.setFillColor(i<blocks?C.l3:C.rule);c.fillRect(new Rect(x+14,y,1,11));c.setFillColor(C.white);c.fillRect(new Rect(x+5,y,4,2));}return c.getImage();}
function drawCourier(kind,size){
 const grid=32,unit=size/grid,c=new DrawContext();c.size=new Size(size,size);c.opaque=false;c.respectScreenScale=true;const fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x*unit,y*unit,w*unit,h*unit));};
 fill(7,2,15,2,C.outline);fill(4,4,22,4,C.outline);fill(6,1,6,4,C.outline);fill(16,0,6,5,C.outline);fill(7,3,15,1,C.white);fill(5,5,20,2,C.white);fill(7,2,4,3,C.white);fill(17,1,4,4,C.white);fill(7,7,16,2,C.outline);fill(5,9,19,10,C.outline);fill(7,7,5,5,C.outline);fill(18,7,5,6,C.outline);fill(8,9,12,9,C.skin);fill(7,11,14,5,C.skin);fill(6,13,3,4,C.skin);fill(8,9,4,4,C.outline);fill(18,9,3,5,C.outline);fill(10,13,2,1,C.outline);fill(16,13,2,1,C.outline);fill(13,16,4,1,C.outline);fill(9,18,11,2,C.outline);fill(7,20,15,8,C.outline);fill(9,18,10,3,C.forecast);fill(9,20,11,7,C.actual);fill(6,21,4,5,C.outline);fill(19,20,4,6,C.outline);fill(8,27,5,4,C.outline);fill(17,27,5,4,C.outline);fill(12,20,5,2,C.white);fill(13,22,5,3,C.forecast);
 if(kind==="live"){fill(23,8,1,18,C.outline);fill(24,8,7,2,C.outline);fill(24,10,6,6,C.actual);fill(24,15,7,2,C.outline);fill(21,22,3,3,C.skin);}else if(kind==="cache"){fill(22,20,8,7,C.outline);fill(23,21,6,5,C.forecast);fill(24,22,4,1,C.white);}else if(kind==="stale"){fill(23,18,8,8,C.outline);fill(24,19,6,6,C.white);fill(27,20,1,3,C.actual);fill(27,22,2,1,C.actual);}else if(kind==="error"){fill(20,8,11,2,C.outline);fill(18,10,14,2,C.sakura);fill(25,12,1,14,C.outline);fill(24,25,3,1,C.outline);}else fill(23,23,5,4,C.rule);return c.getImage();
}
function statusDot(kind){const c=new DrawContext();c.size=new Size(6,6);c.opaque=false;c.respectScreenScale=true;c.setFillColor(kind==="live"?C.healthy:kind==="stale"?C.forecast:kind==="error"?C.sakura:C.rule);c.fillRect(new Rect(0,0,6,6));return c.getImage();}
function drawStatusStamp(kind){const c=new DrawContext();c.size=new Size(20,20);c.opaque=false;c.respectScreenScale=true;const fill=(x,y,w,h,color)=>{c.setFillColor(color);c.fillRect(new Rect(x,y,w,h));};fill(4,2,12,2,C.outline);fill(2,4,16,12,C.outline);fill(4,4,12,10,C.skin);fill(6,7,2,2,C.outline);fill(12,7,2,2,C.outline);fill(8,11,4,1,C.outline);fill(4,14,12,4,kind==="live"?C.actual:kind==="cache"?C.forecast:kind==="stale"?C.sky:kind==="error"?C.sakura:C.rule);return c.getImage();}
function nextRefreshDate(){const step=REFRESH_MINUTES*60000;return new Date(Math.ceil((Date.now()+1000)/step)*step);}
function add(p,x,font,color){const t=p.addText(String(x));t.font=font;t.textColor=color;return t;}
function fit(t,lines,scale){t.lineLimit=lines;t.minimumScaleFactor=scale;return t;}
function title(s){return new Font("PingFangSC-Semibold",s);}function body(s){return new Font("PingFangSC-Regular",s);}function label(s){return new Font("AvenirNext-DemiBold",s);}function numberFont(s){return new Font("AvenirNext-DemiBold",s);}function mono(s){return new Font("Menlo-Regular",s);}
function compact(n){n=Number(n)||0;const a=Math.abs(n);if(a>=999950000000)return trim(n/1e12)+"T";if(a>=999950000)return trim(n/1e9)+"B";if(a>=999950)return trim(n/1e6)+"M";if(a>=999.95)return trim(n/1e3)+"K";return String(Math.round(n));}
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"");}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function fmt(n){return(Number(n)||0).toFixed(1).replace(/\.0$/,"");}
function parseShanghaiDay(s){return new Date(`${s}T00:00:00+08:00`);}function startWeek(d){const x=new Date(d);x.setUTCDate(x.getUTCDate()-x.getUTCDay());return x;}function addDays(d,n){const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x;}function dayKey(d){return`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;}function monthLabel(i){return["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][i];}
function shanghaiTodayKey(){try{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),get=t=>parts.find(x=>x.type===t)?.value||"";return`${get("year")}-${get("month")}-${get("day")}`;}catch(_){const d=new Date(Date.now()+8*3600000);return`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;}}
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
