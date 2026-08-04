from __future__ import annotations
import json,logging,math,os,time
import requests
from config import SOURCES
from store import Store
LOG=logging.getLogger("sources")

def read_env(path)->dict:
 out=dict(os.environ)
 if path.exists():
  for raw in path.read_text().splitlines():
   if "=" in raw and not raw.lstrip().startswith("#"):
    k,v=raw.split("=",1);out[k.strip()]=v.strip()
 return out

def parse_other(raw)->dict:
 if isinstance(raw,dict):return raw
 try:return json.loads(raw or "{}")
 except (ValueError,TypeError):return {}

def cache_basis(model,prompt,cache):
 return prompt+cache if model.lower().startswith("claude-") and cache>prompt else prompt

def normalize_model(raw):
 m=str(raw or "unknown")
 aliases={
  "claude-fable-5-V":"claude-fable-5",
  "claude-opus-4-6-A":"claude-opus-4-6",
  "claude-opus-4-6-T2":"claude-opus-4-6",
  "claude-opus-4-7-thinking-A":"claude-opus-4-7-thinking",
 }
 return aliases.get(m,m)

def to_event(item,store,source):
 other=parse_other(item.get("other"));ts=int(item.get("created_at") or 0);model=normalize_model(item.get("model_name"));prompt=int(item.get("prompt_tokens") or 0);completion=int(item.get("completion_tokens") or 0)
 cache=int(item.get("cache_read_tokens") or other.get("cache_tokens") or 0)
 creation=int(item.get("cache_creation_tokens") or other.get("cache_creation_tokens") or 0)
 rid=str(item.get("request_id") or "")
 return {"event_key":f"{source}:{rid}","source":source,"request_id":rid,"created_at":ts,"date":store.date_for(ts),"model":model,"prompt_tokens":prompt,"completion_tokens":completion,"cache_tokens":cache,"cache_creation_tokens":creation,"cache_basis":cache_basis(model,prompt,cache),"token_id":item.get("token_id"),"token_name":str(item.get("token_name") or ""),"channel_id":item.get("channel"),"channel_name":str(item.get("channel_name") or ""),"use_time":float(item.get("use_time") or 0),"quota":int(item.get("quota") or 0),"is_stream":1 if item.get("is_stream") else 0}

class SourceClient:
 def __init__(self,name,env,timeout=25):
  self.name=name;self.cfg=SOURCES[name];self.timeout=timeout;secret=env.get(self.cfg["secret_env"]);user_env=self.cfg.get("user_env") or "";user=env.get(user_env,self.cfg.get("default_user", ""))
  if not secret:raise RuntimeError(f"{self.cfg['secret_env']} missing")
  self.s=requests.Session();headers={"Accept":"application/json","User-Agent":"TokenTrackerV2/3.0"}
  if user:headers["New-Api-User"]=user
  if self.cfg["auth"]=="cookie":headers["Cookie"]="session="+secret
  else:headers["Authorization"]="Bearer "+secret
  self.s.headers.update(headers)
 def page(self,p,size=100):
  last=None
  for attempt in range(3):
   try:
    r=self.s.get(self.cfg["url"],params={"p":p,"page_size":size,"order":"id","sort":"desc"},timeout=self.timeout);r.raise_for_status();d=r.json()
    if not d.get("success"):raise RuntimeError(d.get("message") or f"{self.name} rejected request")
    return d["data"]
   except (requests.RequestException,ValueError,RuntimeError) as e:
    last=e
    if attempt<2:time.sleep(2**attempt)
  raise RuntimeError(f"{self.name} page {p} failed: {last}")

def full_sync_source(store,client):
 first=client.page(1);total=int(first.get("total") or 0);pages=math.ceil(total/100);seen=set();batch=[];written=0
 for p in range(1,pages+1):
  data=first if p==1 else client.page(p)
  for item in data.get("items",[]):
   rid=str(item.get("request_id") or "")
   if item.get("type")!=2 or not rid or rid in seen:continue
   seen.add(rid);batch.append(to_event(item,store,client.name))
  if len(batch)>=1000:written+=store.upsert_events(batch);batch=[]
  if p%100==0:LOG.info("source=%s full page=%s/%s",client.name,p,pages)
 if batch:written+=store.upsert_events(batch)
 result={"source":client.name,"mode":"full","remote_total":total,"usage_events":len(seen),"written":written,"finished_at":int(time.time())};store.set_state(f"sync:{client.name}",result);return result

def incremental_sync_source(store,client):
 first=client.page(1)
 with store.connect() as c:max_seen=int(c.execute("SELECT COALESCE(MAX(created_at),0) FROM usage_events WHERE source=?",(client.name,)).fetchone()[0])
 pages=math.ceil(int(first.get("total") or 0)/100);seen=set();events=[];old_pages=0
 for p in range(1,min(pages,200)+1):
  data=first if p==1 else client.page(p);items=data.get("items",[])
  for item in items:
   rid=str(item.get("request_id") or "")
   if item.get("type")==2 and rid and rid not in seen:seen.add(rid);events.append(to_event(item,store,client.name))
  if items and max(int(x.get("created_at") or 0) for x in items)<max_seen:
   old_pages+=1
   if old_pages>=2:break
  else:old_pages=0
 written=store.upsert_events(events);result={"source":client.name,"mode":"incremental","scanned":len(seen),"written":written,"finished_at":int(time.time())};store.set_state(f"sync:{client.name}",result);return result

def sync_all(store,env,mode):
 results=[];errors=[]
 for name in SOURCES:
  try:
   client=SourceClient(name,env);results.append(full_sync_source(store,client) if mode=="full" else incremental_sync_source(store,client))
  except Exception as e:LOG.exception("source=%s failed",name);errors.append({"source":name,"error":str(e)})
 if not results:raise RuntimeError(f"all sources failed: {errors}")
 store.rebuild_daily();summary={"mode":mode,"sources":results,"errors":errors,"event_count":store.event_count(),"finished_at":int(time.time())};store.set_state("last_sync",summary);return summary
