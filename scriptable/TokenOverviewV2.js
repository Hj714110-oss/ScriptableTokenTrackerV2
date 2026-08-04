/* Token Tracker V2 · Warm Ledger Overview
 * Function: overview + forecast + cache + top models + seven-day rhythm.
 */
const SETTINGS=loadSettings();
const API_URL=SETTINGS.apiUrl;
const API_KEY=SETTINGS.apiKey;
const CACHE_FILE="token_v2_overview.json",REFRESH_MINUTES=5;
const UI={
 bg:Color.dynamic(new Color("#F3F0E8"),new Color("#272522")),
 surface:Color.dynamic(new Color("#E9E4DA"),new Color("#322F2B")),
 ink:Color.dynamic(new Color("#2E2A26"),new Color("#F2EDE5")),
 muted:Color.dynamic(new Color("#675F57"),new Color("#AFA69C")),
 rule:Color.dynamic(new Color("#D2C9BC"),new Color("#4A4640")),
 accent:Color.dynamic(new Color("#9A4930"),new Color("#E08B68")),
 good:Color.dynamic(new Color("#596F53"),new Color("#9CB596"))
};
const DARK=Device.isUsingDarkAppearance();
const DRAW=DARK?{bg:new Color("#272522"),muted:new Color("#AFA69C"),rule:new Color("#4A4640"),bar:new Color("#625D56"),accent:new Color("#E08B68"),ink:new Color("#F2EDE5")}:{bg:new Color("#F3F0E8"),muted:new Color("#675F57"),rule:new Color("#D2C9BC"),bar:new Color("#BDB4A8"),accent:new Color("#9A4930"),ink:new Color("#2E2A26")};

const widget=await createWidget();
if(config.runsInWidget)Script.setWidget(widget);else await widget.presentLarge();
Script.complete();

async function createWidget(){
 const family=config.widgetFamily||"large",result=await fetchV2(),d=result.data,s=d.summary||{},today=s.today||{},avg=s.baseline_7d?.daily_average||0,models=d.top_models?.today||[];
 if(family==="small")return createSmall(result,d,s,today,avg,models);
 if(family==="medium")return createMedium(result,d,s,today,avg,models);
 return createLarge(result,d,s,today,avg,models);
}
function baseWidget(top,right,bottom,left){const w=new ListWidget();w.backgroundColor=UI.bg;w.setPadding(top,right,bottom,left);w.refreshAfterDate=new Date(Date.now()+REFRESH_MINUTES*60000);return w;}
function createSmall(result,d,s,today,avg,models){
 const w=baseWidget(11,11,10,11),top=models[0];
 const head=w.addStack();head.centerAlignContent();add(head,"TOKEN · V2",mono(7),UI.muted);head.addSpacer();addCompactStatus(head,result,d.meta);
 w.addSpacer(7);add(w,"至今使用总量",display(12),UI.ink);w.addSpacer(1);const main=add(w,compact(totalToDate(s)),numberFont(28),UI.accent);main.minimumScaleFactor=.62;main.lineLimit=1;
 w.addSpacer(3);const context=w.addStack();context.centerAlignContent();add(context,`今日 ${compact(today.tokens)}`,body(7),UI.muted);context.addSpacer();add(context,`预计 ${compact(s.projection)}`,label(7),UI.accent);
 w.addSpacer();addRule(w);w.addSpacer(6);
 if(top){const model=w.addStack();model.centerAlignContent();const name=add(model,shortModel(top.model),label(9),UI.ink);name.lineLimit=1;name.minimumScaleFactor=.7;model.addSpacer();add(model,`${fmt(top.share)}%`,mono(8),UI.muted);w.addSpacer(3);const stats=w.addStack();stats.centerAlignContent();add(stats,compact(top.tokens),numberFont(13),UI.accent);stats.addSpacer();add(stats,`${number(top.requests)} req · cache ${fmt(top.cache_rate)}%`,mono(6),UI.muted);}else add(w,"等待真实模型",body(8),UI.muted);
 return w;
}
function createMedium(result,d,s,today,avg,models){
 const w=baseWidget(11,13,9,13),top=models[0];
 const head=w.addStack();head.centerAlignContent();add(head,"Token 用量总览",display(14),UI.ink);head.addSpacer(6);add(head,`TODAY ${compact(today.tokens)}`,mono(6),UI.muted);head.addSpacer();addCompactStatus(head,result,d.meta);
 w.addSpacer(5);const bodyRow=w.addStack();bodyRow.layoutHorizontally();bodyRow.centerAlignContent();
 const summary=bodyRow.addStack();summary.layoutVertically();summary.size=new Size(132,50);add(summary,"至今使用总量",body(8),UI.muted);const value=add(summary,compact(totalToDate(s)),numberFont(22),UI.accent);value.minimumScaleFactor=.65;summary.addSpacer(1);add(summary,`今日 ${compact(today.tokens)} · 预计 ${compact(s.projection)}`,mono(6),UI.muted);
 bodyRow.addSpacer(8);const focus=bodyRow.addStack();focus.layoutVertically();
 if(top){const line=focus.addStack();line.centerAlignContent();const name=add(line,shortModel(top.model),label(9),UI.ink);name.lineLimit=1;name.minimumScaleFactor=.65;line.addSpacer();add(line,`${fmt(top.share)}%`,mono(7),UI.muted);focus.addSpacer(2);const info=focus.addStack();info.centerAlignContent();add(info,compact(top.tokens),numberFont(13),UI.accent);info.addSpacer();add(info,`${number(top.requests)} req`,mono(6),UI.muted);}else add(focus,"等待真实模型",body(8),UI.muted);
 w.addSpacer(4);addRule(w);w.addSpacer(3);const chart=w.addImage(drawRhythm(d.history_7d||[],avg,s.projection));chart.imageSize=new Size(294,54);chart.centerAlignImage();return w;
}
function createLarge(result,d,s,today,avg,models){
 const w=baseWidget(15,15,13,15);
 const head=w.addStack();head.centerAlignContent();
 const title=head.addStack();title.layoutVertically();add(title,"Token 用量总览",display(17),UI.ink);title.addSpacer(2);add(title,`至今 ${compact(totalToDate(s))} · ${number(d.meta?.event_count)} EVENTS`,mono(7),UI.muted);
 head.addSpacer();addStatus(head,result,d.meta);
 w.addSpacer(9);
 const row=w.addStack();row.layoutHorizontally();
 metricCard(row,"至今使用总量",compact(totalToDate(s)),`今日 ${compact(today.tokens)}`,UI.muted,`预计 ${compact(s.projection)}`);row.addSpacer(8);
 metricCard(row,"对比 7 日均值",`${ratio(today.tokens,avg)}%`,`均值 ${compact(avg)}`,UI.muted,`${signed(s.vs_average_percent)} vs AVG`);
 w.addSpacer(8);
 const modelRow=w.addStack();modelRow.layoutHorizontally();
 modelCard(modelRow,models[0],1);modelRow.addSpacer(8);modelCard(modelRow,models[1],2);
 w.addSpacer(8);
 const chartBox=w.addStack();chartBox.layoutVertically();chartBox.backgroundColor=UI.surface;chartBox.cornerRadius=13;chartBox.setPadding(9,10,8,10);
 const chartHead=chartBox.addStack();chartHead.centerAlignContent();add(chartHead,"近 7 日真实用量",label(11),UI.ink);chartHead.addSpacer();add(chartHead,`日均 ${compact(avg)}`,mono(7),UI.muted);
 chartBox.addSpacer(4);const chart=chartBox.addImage(drawRhythm(d.history_7d||[],avg,s.projection));chart.imageSize=new Size(292,85);chart.centerAlignImage();
 return w;
}
function metricCard(parent,title,value,line,lineColor,foot){
 const c=parent.addStack();c.layoutVertically();c.backgroundColor=UI.surface;c.cornerRadius=13;c.setPadding(10,10,9,10);c.size=new Size(145,88);
 add(c,title,body(9),UI.muted);c.addSpacer(2);const v=add(c,value,numberFont(22),UI.ink);v.minimumScaleFactor=.65;v.lineLimit=1;c.addSpacer(3);
 const r=c.addStack();r.centerAlignContent();add(r,line,label(9),lineColor);r.addSpacer();add(r,foot,body(7),UI.muted);
}
function modelCard(parent,m,rank){
 const c=parent.addStack();c.layoutVertically();c.backgroundColor=UI.surface;c.cornerRadius=13;c.setPadding(9,10,8,10);c.size=new Size(145,76);
 if(!m){add(c,"暂无第二模型",label(10),UI.muted);c.addSpacer();add(c,"等待真实日志",body(8),UI.muted);return;}
 const h=c.addStack();h.centerAlignContent();add(h,`0${rank}`,mono(7),UI.accent);h.addSpacer(5);const n=add(h,shortModel(m.model),label(10),UI.ink);n.lineLimit=1;n.minimumScaleFactor=.72;h.addSpacer();add(h,`${m.share}%`,mono(8),UI.muted);
 c.addSpacer(4);const v=c.addStack();v.centerAlignContent();add(v,compact(m.tokens),numberFont(16),UI.accent);v.addSpacer();add(v,`${number(m.requests)} req`,mono(7),UI.muted);
 c.addSpacer(5);progress(c,m.share/100);
}
function drawRhythm(items,avg,projection){
 const W=584,H=170,m={t:21,b:31,l:10,r:10},gw=W-m.l-m.r,gh=H-m.t-m.b,ctx=new DrawContext();ctx.size=new Size(W,H);ctx.opaque=false;ctx.respectScreenScale=true;
 if(!items.length)return ctx.getImage();const vals=items.map(x=>Number(x.tokens)||0),max=Math.max(...vals,projection||0,avg||0,1)*1.12,base=m.t+gh,slot=gw/items.length,bw=34;
 const ay=base-(avg/max)*gh;dash(ctx,m.l,W-m.r,ay,DRAW.rule);
 const pts=[];items.forEach((x,i)=>{const v=vals[i],px=m.l+i*slot+slot/2,h=v/max*gh,y=base-h;roundRect(ctx,new Rect(px-bw/2,y,bw,Math.max(2,h)),i===items.length-1?DRAW.accent:DRAW.bar,7);pts.push(new Point(px,y));ctx.setFont(new Font("Menlo-Regular",11));ctx.setTextColor(DRAW.muted);ctx.setTextAlignedCenter();ctx.drawTextInRect(day(x.date),new Rect(px-18,base+8,36,15));});
 if(pts.length>1){const p=new Path();p.move(pts[0]);for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=(b.x-a.x)*.4;p.addCurve(b,new Point(a.x+dx,a.y),new Point(b.x-dx,b.y));}ctx.addPath(p);ctx.setStrokeColor(DRAW.accent);ctx.setLineWidth(3);ctx.strokePath();}
 pts.forEach((p,i)=>{ctx.setFillColor(i===pts.length-1?DRAW.accent:DRAW.bg);ctx.fillEllipse(new Rect(p.x-4,p.y-4,8,8));});
 const peak=vals.indexOf(Math.max(...vals));diamond(ctx,pts[peak].x,Math.max(8,pts[peak].y-10));
 if(projection>vals[vals.length-1]){const x=pts.at(-1).x,y=base-projection/max*gh;verticalDash(ctx,x,y,pts.at(-1).y,DRAW.accent);ctx.setFont(new Font("AvenirNext-DemiBold",12));ctx.setTextColor(DRAW.accent);ctx.setTextAlignedRight();ctx.drawTextInRect(`≈${compact(projection)}`,new Rect(x-80,Math.max(0,y-16),78,15));}
 return ctx.getImage();
}
async function fetchV2(){const fm=FileManager.local(),p=fm.joinPath(fm.documentsDirectory(),CACHE_FILE);try{const r=new Request(API_URL);r.headers={"X-N8N-API-KEY":API_KEY,"Accept":"application/json"};r.timeoutInterval=15;const data=await r.loadJSON();const payload={data,ts:Date.now()};fm.writeString(p,JSON.stringify(payload));return{...payload,live:true};}catch(e){console.warn(e.message);if(fm.fileExists(p)){try{return{...JSON.parse(fm.readString(p)),live:false};}catch(_){}}return{data:{summary:{},top_models:{today:[]},history_7d:[]},ts:0,live:false};}}
function addRule(p){const x=p.addStack();x.size=new Size(0,1);x.backgroundColor=UI.rule;}
function addCompactStatus(parent,result,meta){add(parent,result.live&&meta?.status==="live"?"● LIVE":"CACHE",mono(6),result.live&&meta?.status==="live"?UI.good:UI.muted);}
function addStatus(parent,result,meta){const s=parent.addStack();s.layoutVertically();const pill=s.addStack();pill.backgroundColor=result.live&&meta?.status==="live"?UI.good:UI.rule;pill.cornerRadius=6;pill.setPadding(2,6,2,6);const a=add(pill,result.live?"● LIVE":"CACHE",label(7),result.live?UI.bg:UI.muted);a.lineLimit=1;const t=add(s,relative(meta?.last_sync_at||result.ts/1000),body(7),UI.muted);t.rightAlignText();}
function progress(p,v){const track=p.addStack();track.size=new Size(0,4);track.backgroundColor=UI.rule;track.cornerRadius=2;const fill=track.addStack();fill.size=new Size(Math.max(4,125*clamp(v,0,1)),4);fill.backgroundColor=UI.accent;fill.cornerRadius=2;track.addSpacer();}
function roundRect(c,r,color,rad){const p=new Path();p.addRoundedRect(r,rad,rad);c.addPath(p);c.setFillColor(color);c.fillPath();}
function dash(c,x1,x2,y,color){c.setStrokeColor(color);c.setLineWidth(1);for(let x=x1;x<x2;x+=15){const p=new Path();p.move(new Point(x,y));p.addLine(new Point(Math.min(x+8,x2),y));c.addPath(p);c.strokePath();}}
function verticalDash(c,x,y1,y2,color){c.setStrokeColor(color);c.setLineWidth(1);for(let y=y1;y<y2;y+=14){const p=new Path();p.move(new Point(x,y));p.addLine(new Point(x,Math.min(y+7,y2)));c.addPath(p);c.strokePath();}}
function diamond(c,x,y){const p=new Path();p.move(new Point(x,y-5));p.addLine(new Point(x+5,y));p.addLine(new Point(x,y+5));p.addLine(new Point(x-5,y));p.closeSubpath();c.addPath(p);c.setFillColor(DRAW.accent);c.fillPath();}
function add(p,x,f,c){const t=p.addText(String(x));t.font=f;t.textColor=c;return t;}function display(s){return new Font("NewYork-Semibold",s)}function body(s){return new Font("AvenirNext-Medium",s)}function label(s){return new Font("AvenirNext-DemiBold",s)}function numberFont(s){return new Font("AvenirNext-DemiBold",s)}function mono(s){return new Font("Menlo-Regular",s)}
function compact(n){n=Number(n)||0;const a=Math.abs(n);if(a>=1e9)return trim(n/1e9)+"B";if(a>=1e6)return trim(n/1e6)+"M";if(a>=1e3)return trim(n/1e3)+"K";return String(Math.round(n))}function totalToDate(s){return Number(s?.all_time_total??s?.year_total??0)||0}function trim(n){return n.toFixed(Math.abs(n)>=100?0:1).replace(/\.0$/,"")}function number(n){return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")}function fmt(n){return(Number(n)||0).toFixed(1).replace(/\.0$/,"")}function signed(n){n=Number(n)||0;return`${n>0?"+":""}${n.toFixed(1)}%`}function ratio(a,b){return b?Math.round(a/b*100):0}function deltaText(d){return`${Number(d?.tokens)>=0?"↗":"↘"} ${compact(Math.abs(d?.tokens||0))}`}function deltaColor(d){return Number(d?.tokens)>0?UI.accent:UI.good}function shortModel(s){return String(s||"").replace(/^claude-/i,"").replace(/^gpt-/i,"GPT ").replace(/-/g," ")}function day(s){const d=new Date(`${s}T00:00:00`);return["S","M","T","W","T","F","S"][d.getDay()]}function relative(ts){if(!ts)return"暂无同步";const m=Math.max(0,Math.floor((Date.now()/1000-ts)/60));return m<1?"刚刚":m<60?`${m}分钟前`:`${Math.floor(m/60)}小时前`}function clamp(x,a,b){return Math.max(a,Math.min(b,x))}

function loadSettings(){const fm=FileManager.local(),path=fm.joinPath(fm.documentsDirectory(),"token-tracker-v2-settings.json");if(!fm.fileExists(path))throw new Error("Missing token-tracker-v2-settings.json. Run SetupTokenTrackerV2.js first.");const value=JSON.parse(fm.readString(path));if(!/^https?:\/\//.test(value.apiUrl||"")||!value.apiKey)throw new Error("Invalid Token Tracker V2 settings.");return value;}
