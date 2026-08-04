#!/usr/bin/env python3
from __future__ import annotations
import fcntl,json,logging,sys
from config import DB_PATH,ENV_PATH,TIMEZONE
from sources import read_env,sync_all
from store import Store
logging.basicConfig(level=logging.INFO,format="%(asctime)s %(levelname)s %(name)s %(message)s")
mode=sys.argv[1] if len(sys.argv)>1 else "incremental"
try:
 lock=(DB_PATH.parent/"sync.lock").open("w")
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:raise RuntimeError("another sync is already running")
 result=sync_all(Store(DB_PATH,TIMEZONE),read_env(ENV_PATH),mode);print(json.dumps(result,ensure_ascii=False))
except Exception:
 logging.exception("sync failed");raise SystemExit(1)
