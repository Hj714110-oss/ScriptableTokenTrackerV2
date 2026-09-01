from __future__ import annotations
from datetime import date,datetime,timedelta
from store import Store
from config import SOURCES

METRICS="SUM(prompt_tokens+completion_tokens) tokens,SUM(prompt_tokens) prompt_tokens,SUM(completion_tokens) completion_tokens,SUM(cache_tokens) cache_tokens,SUM(cache_creation_tokens) cache_creation_tokens,SUM(cache_basis) cache_basis,SUM(request_count) requests,CASE WHEN SUM(CASE WHEN use_time>0 THEN 1 ELSE 0 END)>0 THEN AVG(CASE WHEN use_time>0 THEN use_time END) ELSE 0 END avg_latency"
FAMILY_CASE="""CASE
 WHEN lower(model) LIKE 'claude-%' THEN 'Claude'
 WHEN lower(model) LIKE 'gpt-%' OR lower(model) LIKE '%codex%' OR lower(model) GLOB 'o[1-9]-*' THEN 'OpenAI'
 WHEN lower(model) LIKE 'grok-%' THEN 'Grok'
 WHEN lower(model) LIKE 'gemini-%' OR lower(model) LIKE 'nano banana%' OR lower(model) LIKE 'nano-banana%' THEN 'Gemini'
 WHEN lower(model) LIKE 'deepseek-%' THEN 'DeepSeek'
 WHEN lower(model) LIKE 'glm-%' THEN 'GLM'
 WHEN lower(model) LIKE 'qwen%' THEN 'Qwen'
 WHEN lower(model) LIKE 'minimax-%' OR lower(model) LIKE 'abab%' THEN 'MiniMax'
 WHEN lower(model) LIKE 'mimo-%' THEN 'MiMo'
 WHEN lower(model) LIKE 'kimi-%' OR lower(model) LIKE 'moonshot-%' THEN 'Kimi'
 WHEN lower(model) LIKE 'doubao-%' THEN 'Doubao'
 WHEN lower(model) LIKE 'llama-%' THEN 'Llama'
 WHEN lower(model) LIKE 'mistral-%' OR lower(model) LIKE 'mixtral-%' THEN 'Mistral'
 ELSE CASE WHEN instr(lower(model),'-')>1 THEN upper(substr(lower(model),1,1)) || substr(lower(model),2,instr(lower(model),'-')-2) ELSE 'Other' END END"""

def pct(a,b):return round((a/b*100),1) if b else 0

def family(model:str)->str:
 m=model.lower()
 if m.startswith("claude-"):return "Claude"
 if m.startswith("gpt-") or "codex" in m or (len(m)>2 and m[0]=="o" and m[1].isdigit() and m[2]=="-"):return "OpenAI"
 if m.startswith("grok-"):return "Grok"
 if m.startswith("gemini-") or m.startswith(("nano banana","nano-banana")):return "Gemini"
 if m.startswith("deepseek-"):return "DeepSeek"
 if m.startswith("glm-"):return "GLM"
 if m.startswith("qwen"):return "Qwen"
 if m.startswith(("minimax-","abab")):return "MiniMax"
 if m.startswith("mimo-"):return "MiMo"
 if m.startswith(("kimi-","moonshot-")):return "Kimi"
 if m.startswith("doubao-"):return "Doubao"
 if m.startswith("llama-"):return "Llama"
 if m.startswith(("mistral-","mixtral-")):return "Mistral"
 root=m.split("-",1)[0].strip()
 return root[:1].upper()+root[1:] if root else "Other"

def rowdict(row):
 d=dict(row);d["tokens"]=int(d.get("tokens") or 0);d["prompt_tokens"]=int(d.get("prompt_tokens") or 0);d["completion_tokens"]=int(d.get("completion_tokens") or 0);d["cache_tokens"]=int(d.get("cache_tokens") or 0);d["cache_creation_tokens"]=int(d.get("cache_creation_tokens") or 0);d["cache_basis"]=int(d.get("cache_basis") or d["prompt_tokens"]);d["requests"]=int(d.get("requests") or 0);d["avg_latency"]=round(float(d.get("avg_latency") or 0),2);d["cache_rate"]=pct(d["cache_tokens"],d["cache_basis"]);return d

def aggregate(c,start,end,source=None,model=None):
 where="date BETWEEN ? AND ?";args=[start,end]
 if source:where+=" AND source=?";args.append(source)
 if model:where+=" AND model=?";args.append(model)
 return rowdict(c.execute(f"SELECT {METRICS} FROM usage_events WHERE {where}",args).fetchone())

def daily(c,start,end,source=None):
 where="date BETWEEN ? AND ?";args=[start,end]
 if source:where+=" AND source=?";args.append(source)
 rows=c.execute(f"SELECT date,{METRICS} FROM usage_events WHERE {where} GROUP BY date ORDER BY date",args).fetchall();by={r["date"]:rowdict(r) for r in rows};out=[];d=date.fromisoformat(start);stop=date.fromisoformat(end)
 while d<=stop:
  key=d.isoformat();out.append({"date":key,**by.get(key,{"tokens":0,"prompt_tokens":0,"completion_tokens":0,"cache_tokens":0,"cache_creation_tokens":0,"cache_basis":0,"requests":0,"avg_latency":0,"cache_rate":0})});d+=timedelta(days=1)
 return out

def top_models(c,start,end,history_start,source=None,limit=5):
 where="date BETWEEN ? AND ?";args=[start,end]
 if source:where+=" AND source=?";args.append(source)
 rows=c.execute(f"SELECT model,{METRICS} FROM usage_events WHERE {where} GROUP BY model ORDER BY tokens DESC,model LIMIT ?",args+[limit]).fetchall();items=[rowdict(r) for r in rows]
 all_total=aggregate(c,start,end,source)["tokens"]
 for item in items:
  item["family"]=family(item["model"]);item["share"]=pct(item["tokens"],all_total);w="model=? AND date BETWEEN ? AND ?";a=[item["model"],history_start,end]
  if source:w+=" AND source=?";a.append(source)
  points=c.execute(f"SELECT date,SUM(prompt_tokens+completion_tokens) val FROM usage_events WHERE {w} GROUP BY date ORDER BY date",a).fetchall();mp={r["date"]:int(r["val"] or 0) for r in points};d=date.fromisoformat(history_start);stop=date.fromisoformat(end);item["history_7d"]=[]
  while d<=stop:item["history_7d"].append({"date":d.isoformat(),"val":mp.get(d.isoformat(),0)});d+=timedelta(days=1)
 return items

def model_families(c,start,end,history_start,limit=12):
 rows=c.execute(f"SELECT {FAMILY_CASE} family,{METRICS} FROM usage_events WHERE date BETWEEN ? AND ? GROUP BY family ORDER BY tokens DESC,family LIMIT ?",(start,end,limit)).fetchall();items=[rowdict(r) for r in rows];all_total=aggregate(c,start,end)["tokens"]
 for item in items:
  item["share"]=pct(item["tokens"],all_total);name=item["family"];points=c.execute(f"SELECT date,SUM(prompt_tokens+completion_tokens) val FROM usage_events WHERE date BETWEEN ? AND ? AND {FAMILY_CASE}=? GROUP BY date ORDER BY date",(history_start,end,name)).fetchall();mp={r["date"]:int(r["val"] or 0) for r in points};d=date.fromisoformat(history_start);stop=date.fromisoformat(end);item["history_30d"]=[]
  while d<=stop:item["history_30d"].append({"date":d.isoformat(),"val":mp.get(d.isoformat(),0)});d+=timedelta(days=1)
 return items

def historical_models(c,history_start,end,limit=8):
 rows=c.execute(f"SELECT model,{METRICS} FROM usage_events GROUP BY model ORDER BY tokens DESC,model LIMIT ?",(limit,)).fetchall();items=[rowdict(r) for r in rows]
 all_total=int(c.execute("SELECT COALESCE(SUM(prompt_tokens+completion_tokens),0) FROM usage_events").fetchone()[0] or 0)
 for item in items:
  model=item["model"];item["family"]=family(model);item["share"]=pct(item["tokens"],all_total)
  source_rows=c.execute(f"SELECT source,{METRICS} FROM usage_events WHERE model=? GROUP BY source ORDER BY tokens DESC,source",(model,)).fetchall();item["source_breakdown"]=[]
  for source_row in source_rows:
   source_item=rowdict(source_row);source=source_row["source"];source_item["source"]=source;source_item["share"]=pct(source_item["tokens"],item["tokens"]);source_item["label"]=SOURCES.get(source,{}).get("label",source);item["source_breakdown"].append(source_item)
  points=c.execute("SELECT date,SUM(prompt_tokens+completion_tokens) val FROM usage_events WHERE model=? AND date BETWEEN ? AND ? GROUP BY date ORDER BY date",(model,history_start,end)).fetchall();mp={r["date"]:int(r["val"] or 0) for r in points};d=date.fromisoformat(history_start);stop=date.fromisoformat(end);item["history_30d"]=[]
  while d<=stop:item["history_30d"].append({"date":d.isoformat(),"val":mp.get(d.isoformat(),0)});d+=timedelta(days=1)
 return items

def streak(days,through):
 used={x["date"] for x in days if x["tokens"]>0};cur=0;d=through
 while d.isoformat() in used:cur+=1;d-=timedelta(days=1)
 longest=run=0
 for x in days:
  run=run+1 if x["tokens"]>0 else 0;longest=max(longest,run)
 return cur,longest

def build_v3(store:Store,now=None):
 tz=store.tz;now=now or datetime.now(tz);today=now.date();yesterday=today-timedelta(days=1);d7=today-timedelta(days=6);prev7=today-timedelta(days=7);d30=today-timedelta(days=29);d180=today-timedelta(days=179);month=today.replace(day=1);year=today.replace(month=1,day=1)
 with store.connect() as c:
  hist180=daily(c,d180.isoformat(),today.isoformat());hist30=hist180[-30:];hist7=hist180[-7:];current=aggregate(c,today.isoformat(),today.isoformat());yd=aggregate(c,yesterday.isoformat(),yesterday.isoformat());baseline=aggregate(c,prev7.isoformat(),yesterday.isoformat());baseline["daily_average"]=round(baseline["tokens"]/7);elapsed=now.hour*60+now.minute;projection=current["tokens"] if elapsed<60 else round(current["tokens"]*min(4,1440/elapsed));year_total=aggregate(c,year.isoformat(),today.isoformat())["tokens"];all_time_total=aggregate(c,"0000-01-01",today.isoformat())["tokens"]
  sources={};source_periods={};source_history_30d={}
  for source,cfg in SOURCES.items():
   sm=aggregate(c,today.isoformat(),today.isoformat(),source);all_source=aggregate(c,"0000-01-01",today.isoformat(),source);total_source=all_source["tokens"];state=store.get_state(f"sync:{source}",{}) or {};sources[source]={"label":cfg["label"],"today":sm,"all_time":all_source,"all_time_total":total_source,"share":pct(total_source,all_time_total),"last_sync_at":state.get("updated_at",0)};source_periods[source]={"today":{"start":today.isoformat(),"end":today.isoformat(),**sm},"7d":{"start":d7.isoformat(),"end":today.isoformat(),**aggregate(c,d7.isoformat(),today.isoformat(),source)},"month":{"start":month.isoformat(),"end":today.isoformat(),**aggregate(c,month.isoformat(),today.isoformat(),source)}};source_history_30d[source]=daily(c,d30.isoformat(),today.isoformat(),source)
  periods={"today":{"start":today.isoformat(),"end":today.isoformat(),**current},"7d":{"start":d7.isoformat(),"end":today.isoformat(),**aggregate(c,d7.isoformat(),today.isoformat())},"month":{"start":month.isoformat(),"end":today.isoformat(),**aggregate(c,month.isoformat(),today.isoformat())}}
  tops={k:top_models(c,v["start"],v["end"],d7.isoformat()) for k,v in periods.items()};source_tops={s:{k:top_models(c,v["start"],v["end"],d7.isoformat(),s) for k,v in periods.items()} for s in SOURCES};historical=historical_models(c,d30.isoformat(),today.isoformat(),8);families={k:model_families(c,v["start"],v["end"],d30.isoformat()) for k,v in periods.items()};families["all_time"]=model_families(c,"0000-01-01",today.isoformat(),d30.isoformat())
 cur,longest=streak(hist180,today);sync=store.get_state("last_sync",{}) or {};sync_at=sync.get("updated_at",0)
 return {"version":3,"meta":{"generated_at":int(now.timestamp()),"last_sync_at":sync_at,"status":"live" if sync_at and int(now.timestamp())-sync_at<1800 else "stale","timezone":str(tz),"event_count":store.event_count()},"summary":{"today":current,"yesterday":yd,"delta":{"tokens":current["tokens"]-yd["tokens"],"percent":round((current["tokens"]-yd["tokens"])/yd["tokens"]*100,1) if yd["tokens"] else 0},"baseline_7d":baseline,"vs_average_percent":round((current["tokens"]-baseline["daily_average"])/baseline["daily_average"]*100,1) if baseline["daily_average"] else 0,"projection":projection,"year_total":year_total,"all_time_total":all_time_total,"active_days_180":sum(x["tokens"]>0 for x in hist180),"current_streak":cur,"longest_streak_180":longest},"periods":periods,"sources":sources,"source_periods":source_periods,"top_models":tops,"model_families":families,"source_top_models":source_tops,"historical_models":historical,"history_7d":hist7,"history_30d":hist30,"source_history_30d":source_history_30d,"history_180d":hist180}
