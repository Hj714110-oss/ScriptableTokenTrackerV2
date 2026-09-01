from __future__ import annotations
import json,sqlite3
from contextlib import contextmanager
from datetime import date,datetime,timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

SCHEMA="""
CREATE TABLE IF NOT EXISTS logs(date TEXT,tokens INTEGER,source TEXT DEFAULT 'manual');
CREATE TABLE IF NOT EXISTS usage_events(
 event_key TEXT PRIMARY KEY,source TEXT NOT NULL,request_id TEXT NOT NULL,created_at INTEGER NOT NULL,date TEXT NOT NULL,model TEXT NOT NULL,
 prompt_tokens INTEGER NOT NULL DEFAULT 0,completion_tokens INTEGER NOT NULL DEFAULT 0,cache_tokens INTEGER NOT NULL DEFAULT 0,cache_creation_tokens INTEGER NOT NULL DEFAULT 0,cache_basis INTEGER NOT NULL DEFAULT 0,
 token_id INTEGER,token_name TEXT NOT NULL DEFAULT '',channel_id INTEGER,channel_name TEXT NOT NULL DEFAULT '',use_time REAL NOT NULL DEFAULT 0,quota INTEGER NOT NULL DEFAULT 0,is_stream INTEGER NOT NULL DEFAULT 0,request_count INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_source_request ON usage_events(source,request_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_events(date);
CREATE INDEX IF NOT EXISTS idx_usage_model_date ON usage_events(model,date);
CREATE INDEX IF NOT EXISTS idx_usage_source_date ON usage_events(source,date);
CREATE TABLE IF NOT EXISTS sync_state(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at INTEGER NOT NULL);
"""

class Store:
 def __init__(self,path:Path,tz="Asia/Shanghai"):
  self.path=path;self.tz=ZoneInfo(tz);path.parent.mkdir(parents=True,exist_ok=True)
  with self.connect() as c:self._migrate(c);c.executescript(SCHEMA)
 @contextmanager
 def connect(self):
  c=sqlite3.connect(self.path,timeout=30);c.row_factory=sqlite3.Row
  try:yield c;c.commit()
  finally:c.close()
 def _migrate(self,c):
  exists=c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='usage_events'").fetchone()
  if not exists:return
  cols={r[1] for r in c.execute("PRAGMA table_info(usage_events)")}
  if "source" not in cols:return
  if "cache_creation_tokens" not in cols:
   c.execute("ALTER TABLE usage_events ADD COLUMN cache_creation_tokens INTEGER NOT NULL DEFAULT 0")
  if "request_count" not in cols:
   c.execute("ALTER TABLE usage_events ADD COLUMN request_count INTEGER NOT NULL DEFAULT 1")
 def date_for(self,ts):return datetime.fromtimestamp(ts,self.tz).date().isoformat()
 def upsert_events(self,events):
  sql="""INSERT INTO usage_events(event_key,source,request_id,created_at,date,model,prompt_tokens,completion_tokens,cache_tokens,cache_creation_tokens,cache_basis,token_id,token_name,channel_id,channel_name,use_time,quota,is_stream,request_count) VALUES(:event_key,:source,:request_id,:created_at,:date,:model,:prompt_tokens,:completion_tokens,:cache_tokens,:cache_creation_tokens,:cache_basis,:token_id,:token_name,:channel_id,:channel_name,:use_time,:quota,:is_stream,:request_count) ON CONFLICT(event_key) DO UPDATE SET created_at=excluded.created_at,date=excluded.date,model=excluded.model,prompt_tokens=excluded.prompt_tokens,completion_tokens=excluded.completion_tokens,cache_tokens=excluded.cache_tokens,cache_creation_tokens=excluded.cache_creation_tokens,cache_basis=excluded.cache_basis,token_id=excluded.token_id,token_name=excluded.token_name,channel_id=excluded.channel_id,channel_name=excluded.channel_name,use_time=excluded.use_time,quota=excluded.quota,is_stream=excluded.is_stream,request_count=excluded.request_count"""
  with self.connect() as c:
   c.executemany(sql,events);return len(events)
 def set_state(self,key,value):
  with self.connect() as c:c.execute("INSERT INTO sync_state VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at",(key,json.dumps(value,separators=(",",":"),ensure_ascii=False),int(datetime.now().timestamp())))
 def get_state(self,key,default=None):
  with self.connect() as c:r=c.execute("SELECT value,updated_at FROM sync_state WHERE key=?",(key,)).fetchone()
  if not r:return default
  try:return {"value":json.loads(r["value"]),"updated_at":r["updated_at"]}
  except json.JSONDecodeError:return default
 def rebuild_daily(self):
  with self.connect() as c:
   c.execute("DELETE FROM logs WHERE source LIKE 'tracker:%'")
   c.execute("INSERT INTO logs(date,tokens,source) SELECT date,SUM(prompt_tokens+completion_tokens),'tracker:'||source FROM usage_events GROUP BY date,source")
 def event_count(self):
  with self.connect() as c:return c.execute("SELECT COUNT(*) FROM usage_events").fetchone()[0]
 def legacy_stats(self,today=None):
  today=today or datetime.now(self.tz).date();start=today-timedelta(days=179)
  with self.connect() as c:
   rows=c.execute("SELECT date,SUM(tokens) val FROM logs WHERE date BETWEEN ? AND ? GROUP BY date",(start.isoformat(),today.isoformat())).fetchall();year_total=c.execute("SELECT COALESCE(SUM(tokens),0) FROM logs WHERE date LIKE ?",(f"{today.year}%",)).fetchone()[0] or 0
  vals={r["date"]:r["val"] for r in rows};hist=[]
  for i in range(180):
   d=(start+timedelta(days=i)).isoformat();hist.append({"date":d,"val":vals.get(d,0)})
  return {"today":hist[-1]["val"],"yesterday":hist[-2]["val"],"year_total":year_total,"history_7d":hist[-7:],"history_180d":hist}
