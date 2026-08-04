#!/usr/bin/env python3
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
from analytics import build_v3
from config import API_KEY,DB_PATH,PORT,TIMEZONE
from store import Store

STORE=Store(DB_PATH,TIMEZONE)
class Handler(BaseHTTPRequestHandler):
 def authorized(self):return bool(API_KEY) and self.headers.get("X-N8N-API-KEY")==API_KEY
 def reply(self,code,payload):
  body=json.dumps(payload,ensure_ascii=False,separators=(",",":")).encode();self.send_response(code);self.send_header("Content-Type","application/json; charset=utf-8");self.send_header("Cache-Control","no-store");self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body)
 def do_GET(self):
  if not self.authorized():return self.reply(401,{"error":"unauthorized"})
  path=urlparse(self.path).path.rstrip("/") or "/"
  try:
   if path in ("/","/token-tracker"):return self.reply(200,STORE.legacy_stats())
   if path in ("/v2","/token-tracker/v2","/v3","/token-tracker/v3"):return self.reply(200,build_v3(STORE))
   if path in ("/health","/token-tracker/health"):
    state=STORE.get_state("last_sync",{}) or {};return self.reply(200,{"ok":True,"version":3,"events":STORE.event_count(),"last_sync_at":state.get("updated_at",0)})
   return self.reply(404,{"error":"not_found"})
  except Exception as e:return self.reply(500,{"error":"internal_error","message":str(e)})
 def do_POST(self):
  if not self.authorized():return self.reply(401,{"error":"unauthorized"})
  try:
   n=int(self.headers.get("Content-Length",0));body=json.loads(self.rfile.read(n) or b"{}");tokens=int(body.get("tokens",0));day=body.get("date");source=body.get("source","manual")
   if not day:
    from datetime import datetime
    day=datetime.now(STORE.tz).date().isoformat()
   with STORE.connect() as c:c.execute("INSERT INTO logs VALUES(?,?,?)",(day,tokens,source))
   return self.reply(200,{"ok":True,"date":day,"tokens":tokens})
  except (ValueError,TypeError,json.JSONDecodeError) as e:return self.reply(400,{"error":"invalid_request","message":str(e)})
 def log_message(self,fmt,*args):pass

if __name__=="__main__":
 if not API_KEY:raise SystemExit("TOKEN_API_KEY is required")
 print(f"Token Tracker V3 listening on :{PORT}",flush=True)
 ThreadingHTTPServer(("0.0.0.0",PORT),Handler).serve_forever()
