// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: chart-column;
/*
 * Token Tracker V3 · Pixel Edition · Cloud Parcel Ledger
 * Usage rhythm: seven real days + baseline + peak + projection.
 * Layouts: independently composed small / medium / large.
 */
const SETTINGS=loadV3Settings();
const API_URL=String(SETTINGS.apiUrl||"").replace(/\/+$/,""),API_KEY=String(SETTINGS.apiKey||"");
const CACHE_PREFIX="token_v3_pixel_rhythm";
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
 const h=w.addStack();h.centerAlignContent();add(h,"七日节奏",title(10),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer(5);const hero=w.addStack();hero.centerAlignContent();const copy=hero.addStack();copy.layoutVertically();add(copy,"今日真实用量",body(9),UI.muted);copy.addSpacer(1);fit(add(copy,compact(v.today),numberFont(24),UI.ink),1,.9);copy.addSpacer(1);add(copy,`${number(v.requests)} 次请求`,mono(8),UI.muted);hero.addSpacer();const stamp=hero.addImage(drawStatusStamp(v.status.kind));stamp.imageSize=new Size(20,20);
 w.addSpacer(4);const chart=w.addImage(drawRhythm(v.history,v.average,v.projection,148,42,"small"));chart.imageSize=new Size(148,42);chart.centerAlignImage();
 w.addSpacer();rule(w);w.addSpacer(4);const foot=w.addStack();foot.centerAlignContent();miniMetric(foot,"日均",compact(v.average));foot.addSpacer();miniMetric(foot,"预计",compact(v.projection));foot.addSpacer();miniMetric(foot,"较昨日",signed(v.deltaPercent));
 return w;
}
function createMedium(v){
 const w=baseWidget([10,13,8,13]);
 const h=w.addStack();h.centerAlignContent();const head=h.addStack();head.layoutVertically();add(head,"用量节奏",title(11),UI.ink);head.addSpacer(1);add(head,"7 DAYS · TRUE TOKEN VOLUME",mono(8),UI.muted);h.addSpacer();const value=h.addStack();value.layoutVertically();const today=add(value,compact(v.today),numberFont(21),UI.ink);today.rightAlignText();const req=add(value,`${number(v.requests)} 次请求`,mono(8),UI.muted);req.rightAlignText();h.addSpacer(8);addStatus(h,v.status,8);
 w.addSpacer(5);const chart=w.addImage(drawRhythm(v.history,v.average,v.projection,338,72,"medium"));chart.imageSize=new Size(338,72);chart.centerAlignImage();
 w.addSpacer(3);const foot=w.addStack();foot.centerAlignContent();add(foot,`日均 ${compact(v.average)}`,body(9),UI.muted);foot.addSpacer();add(foot,`预计 ${compact(v.projection)}`,label(9),UI.accentText);foot.addSpacer();add(foot,`较昨日 ${signed(v.deltaPercent)}`,body(9),deltaColor(v.deltaPercent));
 return w;
}
function createLarge(v){
 const w=baseWidget([13,15,11,15]);
 const h=w.addStack();h.centerAlignContent();const head=h.addStack();head.layoutVertically();add(head,"七日用量分拣簿",title(13),UI.ink);head.addSpacer(1);add(head,`${windowLabel(v.history)} · ${number(v.requests)} 次请求`,mono(8),UI.muted);h.addSpacer();const courier=h.addImage(drawCourier(v.status.kind,38));courier.imageSize=new Size(38,38);h.addSpacer(8);addStatus(h,v.status,8);
 w.addSpacer(7);const hero=w.addStack();hero.layoutHorizontally();hero.centerAlignContent();const total=hero.addStack();total.layoutVertically();add(total,"今日真实用量",body(9),UI.muted);total.addSpacer(1);fit(add(total,compact(v.today),numberFont(30),UI.ink),1,.92);hero.addSpacer();const parcel=hero.addImage(drawParcelStack(v.today,v.average));parcel.imageSize=new Size(58,44);
 w.addSpacer(7);const metrics=w.addStack();metrics.layoutHorizontally();pixelMetric(metrics,"七日日均",v.average>0?compact(v.average):"暂无");metrics.addSpacer(8);pixelMetric(metrics,"今日预计",compact(v.projection));metrics.addSpacer(8);pixelMetric(metrics,"较昨日",signed(v.deltaPercent));
 w.addSpacer(8);const chartHead=w.addStack();chartHead.centerAlignContent();add(chartHead,"真实日柱 · 峰值邮戳",label(9),UI.ink);chartHead.addSpacer();add(chartHead,"预计为空心延伸",mono(8),UI.muted);
 w.addSpacer(4);const chart=w.addImage(drawRhythm(v.history,v.average,v.projection,334,112,"large"));chart.imageSize=new Size(334,112);chart.centerAlignImage();
 w.addSpacer(4);const foot=w.addStack();foot.centerAlignContent();add(foot,`峰值 ${dayLabel(v.peak?.date)} · ${compact(v.peak?.tokens)}`,body(9),UI.muted);foot.addSpacer();add(foot,statusDetail(v),mono(8),UI.muted);
 return w;
}
function createFatalWidget(family){return createStateWidget(family,{status:{kind:"error",label:"错误",sync:0},empty:true});}
function createStateWidget(family,v){
 const pads=family==="large"?[15,15,13,15]:family==="medium"?[13,14,11,14]:[12,12,11,12],w=baseWidget(pads);
 const h=w.addStack();h.centerAlignContent();add(h,"七日用量分拣簿",title(family==="large"?14:10),UI.ink);h.addSpacer();addStatus(h,v.status,8);
 w.addSpacer();const row=w.addStack();row.layoutHorizontally();row.centerAlignContent();const sprite=row.addImage(drawCourier(v.status.kind,family==="large"?72:48));sprite.imageSize=family==="large"?new Size(72,72):new Size(48,48);row.addSpacer(family==="small"?8:15);const copy=row.addStack();copy.layoutVertically();add(copy,v.status.kind==="error"?"连接失败":"暂无节奏记录",title(family==="large"?18:13),v.status.kind==="error"?UI.errorText:UI.ink);copy.addSpacer(5);const detail=add(copy,v.status.kind==="error"?"没有可用缓存，稍后会自动重试":"收到真实日用量后，这里会开始分拣",body(family==="large"?10:9),UI.muted);detail.lineLimit=2;detail.minimumScaleFactor=1;
 if(family!=="small"){w.addSpacer();rule(w);w.addSpacer(8);add(w,"日柱来自 history_7d · 预测不计入真实用量",mono(9),UI.muted);}return w;
}
function makeViewModel(result){
 const d=result.data||{},s=d.summary||{},today=s.today||{},history=Array.isArray(d.history_7d)?d.history_7d:[],sync=Number(d.meta?.last_sync_at||result.ts/1000||0),now=Math.floor(Date.now()/1000),hasPayload=Boolean(d.summary||d.meta||history.length),hasUsage=Number(today.tokens||0)>0||history.some(x=>Number(x.tokens)>0),peak=history.reduce((best,x)=>Number(x.tokens)>Number(best?.tokens||0)?x:best,null);
 let kind,label;if(!hasPayload){kind="error";label="连接失败";}else if(!sync||now-sync>=STALE_SECONDS||d.meta?.status==="stale"){kind="stale";label="稍旧";}else if(!result.live||d.meta?.status!=="live"){kind="cache";label="缓存";}else if(!hasUsage){kind="empty";label="暂无";}else{kind="live";label="实时";}
 return{empty:!hasUsage,status:{kind,label,sync},today:Number(today.tokens)||0,requests:Number(today.requests)||0,average:Number(s.baseline_7d?.daily_average)||0,projection:Number(s.projection)||0,deltaPercent:Number(s.delta?.percent)||0,deltaTokens:Number(s.delta?.tokens)||0,history,peak};
}
async function loadPayload(){
 const fm=FileManager.local(),primary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-a.json`),secondary=fm.joinPath(fm.documentsDirectory(),`${CACHE_PREFIX}-b.json`),path=fm.fileExists(primary)&&!fm.fileExists(secondary)?secondary:primary;
 try{const q=new Request(API_URL);q.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};q.timeoutInterval=15;const data=await q.loadJSON();if(!validPayload(data))throw new Error("Invalid payload");const saved={data,ts:Date.now()};fm.writeString(path,JSON.stringify(saved));return{...saved,live:true};}
 catch(error){console.warn(String(error));const candidates=[primary,secondary].filter(p=>fm.fileExists(p)).map(p=>{try{const x=JSON.parse(fm.readString(p));return x?.data&&validPayload(x.data)?x:null;}catch(_){return null;}}).filter(Boolean).sort((a,b)=>Number(b.ts||0)-Number(a.ts||0));if(candidates.length)return{...candidates[0],live:false,error:String(error)};return{data:{},ts:0,live:false,error:String(error)};}
}
function validPayload(data){return Boolean(data&&typeof data==="object"&&data.summary&&typeof data.summary==="object"&&data.meta&&typeof data.meta==="object"&&Array.isArray(data.history_7d));}
function miniMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();add(x,k,body(9),UI.muted);add(x,v,label(9),UI.ink);}
function pixelMetric(parent,k,v){const x=parent.addStack();x.layoutVertically();x.size=new Size(106,44);x.backgroundImage=cutPanel(106,44,C.surface,C.rule);x.setPadding(5,7,5,7);add(x,k,body(9),UI.muted);x.addSpacer(2);fit(add(x,v,label(10),UI.ink),1,.9);}
function addStatus(parent,status,size){const s=parent.addStack();s.centerAlignContent();const dot=s.addImage(statusDot(status.kind));dot.imageSize=new Size(size-1,size-1);s.addSpacer(4);add(s,status.label,mono(size),statusColor(status.kind));}
function statusColor(kind){return kind==="live"?UI.healthyText:kind==="stale"?UI.warnText:kind==="error"?UI.errorText:UI.muted;}
function statusDetail(v){if(v.status.kind==="error")return"连接失败";if(v.status.kind==="empty")return"暂无记录";if(v.status.kind==="cache")return`缓存 · ${relative(v.status.sync)}`;if(v.status.kind==="stale")return`稍旧 · ${relative(v.status.sync)}`;return relative(v.status.sync);}
function deltaColor(n){return Number(n)>0?UI.accentText:Number(n)<0?UI.healthyText:UI.muted;}
function rule(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=UI.rule;}
function cutPanel(w,h,fill,stroke){const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;const p=new Path(),k=4;p.move(new Point(k,0));p.addLine(new Point(w-k,0));p.addLine(new Point(w,k));p.addLine(new Point(w,h-k));p.addLine(new Point(w-k,h));p.addLine(new Point(k,h));p.addLine(new Point(0,h-k));p.addLine(new Point(0,k));p.closeSubpath();c.addPath(p);c.setFillColor(fill);c.fillPath();c.setFillColor(stroke);c.fillRect(new Rect(k,0,w-k*2,1));c.fillRect(new Rect(k,h-1,w-k*2,1));c.fillRect(new Rect(0,k,1,h-k*2));c.fillRect(new Rect(w-1,k,1,h-k*2));return c.getImage();}
function drawRhythm(items,avg,projection,w,h,mode){
 const c=new DrawContext();c.size=new Size(w,h);c.opaque=false;c.respectScreenScale=true;
 const detailed=mode!=="small",large=mode==="large",m={l:large?10:6,r:large?6:4,t:large?14:detailed?10:2,b:large?18:detailed?14:2},gw=w-m.l-m.r,gh=h-m.t-m.b,base=m.t+gh,days=normalizeDays(items),vals=days.map(x=>Number(x.tokens)||0),max=Math.max(...vals,Number(projection)||0,Number(avg)||0,1)*1.06,slot=gw/7,bw=Math.max(6,Math.floor(slot*(large?.54:.5)/2)*2);
 c.setFillColor(C.rule);c.fillRect(new Rect(m.l,base,gw,1));
 if(detailed&&avg>0){const y=snap2(base-(avg/max)*gh);c.setFillColor(C.muted);for(let x=snap2(m.l);x<m.l+gw;x+=10)c.fillRect(new Rect(x,y,4,1));if(large){c.setFont(new Font("PingFangSC-Regular",8));c.setTextColor(C.muted);c.drawTextInRect(`日均 ${compact(avg)}`,new Rect(m.l,Math.max(0,y-10),74,9));}}
 vals.forEach((v,i)=>{const x=snap2(m.l+i*slot+(slot-bw)/2),bh=v<=0?0:Math.max(2,snap2(v/max*gh)),y=base-bh;if(bh>0)colorBar(c,new Rect(x,y,bw,bh),i===6?C.actual:C.rule,i===6?C.actualDark:C.muted);if(detailed){c.setFont(new Font("PingFangSC-Regular",8));c.setTextColor(i===6?C.actual:C.muted);c.setTextAlignedCenter();c.drawTextInRect(i===6?"今":dayLabel(days[i].date),new Rect(x-3,base+3,bw+6,10));}});
 const peak=vals.indexOf(Math.max(...vals));if(peak>=0&&vals[peak]>0){const x=snap2(m.l+peak*slot+slot/2),y=snap2(base-(vals[peak]/max)*gh);c.setFillColor(C.actual);c.fillRect(new Rect(x-2,Math.max(0,y-6),4,4));if(large){c.setFont(new Font("Menlo-Regular",8));c.setTextColor(C.actual);c.setTextAlignedCenter();c.drawTextInRect("PEAK",new Rect(x-20,Math.max(0,y-16),40,9));}}
 if(projection>vals[6]){const x=snap2(m.l+6*slot+(slot-bw)/2),y=snap2(base-(projection/max)*gh),actualY=snap2(base-(vals[6]/max)*gh);c.setFillColor(C.forecast);c.fillRect(new Rect(x,y,bw,1));c.fillRect(new Rect(x,y,1,Math.max(1,actualY-y)));c.fillRect(new Rect(x+bw-1,y,1,Math.max(1,actualY-y)));for(let yy=y+3;yy<actualY;yy+=6)c.fillRect(new Rect(x+2,yy,Math.max(1,bw-4),1));}
 return c.getImage();
}
function normalizeDays(items){const a=Array.isArray(items)?items.slice(-7).map(x=>({date:String(x?.date||""),tokens:Number(x?.tokens)||0})):[];while(a.length<7)a.unshift({date:"",tokens:0});return a;}
function colorBar(c,r,color,edge){c.setFillColor(color);c.fillRect(r);if(r.width>5){c.setFillColor(edge);c.fillRect(new Rect(r.x+r.width-1,r.y,1,r.height));}}
function drawParcelStack(today,avg){const c=new DrawContext();c.size=new Size(58,44);c.opaque=false;c.respectScreenScale=true;const ratio=avg>0?Math.min(1,today/avg):0,blocks=Math.round(ratio*6);for(let i=0;i<6;i++){const col=i%3,row=Math.floor(i/3),x=2+col*18,y=5+row*18;c.setFillColor(i<blocks?C.actual:C.rule);c.fillRect(new Rect(x,y,14,12));c.setFillColor(i<blocks?C.actualDark:C.muted);c.fillRect(new Rect(x+13,y,1,12));c.setFillColor(C.white);c.fillRect(new Rect(x+5,y,4,2));}return c.getImage();}
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
function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"");}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}function signed(n){n=Number(n)||0;return`${n>0?"+":""}${n.toFixed(1)}%`;}
function snap2(n){return Math.round(n/2)*2;}function dayLabel(s){if(!s)return"—";try{return["日","一","二","三","四","五","六"][new Date(`${s}T00:00:00+08:00`).getDay()];}catch(_){return"—";}}function windowLabel(items){const a=Array.isArray(items)?items.filter(x=>x?.date):[];return a.length?`${a[0].date.slice(5)}—${a[a.length-1].date.slice(5)}`:"近 7 日";}
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
