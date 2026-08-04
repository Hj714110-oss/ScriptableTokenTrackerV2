# 部署指南

## 前置条件

- Python 3.11+ 或 Docker + Docker Compose
- 一个或多个兼容 `/api/log/self` 的用量日志来源
- HTTPS 反向代理（公网使用时强烈建议）

## 配置文件

```bash
cp backend/.env.example backend/.env
cp backend/sources.example.json backend/sources.json
```

### `.env`

- `TOKEN_API_KEY`：客户端访问 Tracker API 的随机长密钥
- `TOKEN_PORT`：内部监听端口，默认 `8799`
- `TOKEN_TIMEZONE`：统计时区，默认 `Asia/Shanghai`
- `TOKEN_SOURCES_FILE`：`sources.json` 路径
- 其余凭据变量由 `sources.json` 的 `secret_env` / `user_env` 引用

生成随机 API Key：

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
```

### `sources.json`

每个顶层 key 都是稳定的来源 ID：

```json
{
  "relay_a": {
    "label": "Relay A",
    "url": "https://relay.example.com/api/log/self",
    "auth": "bearer",
    "secret_env": "RELAY_A_TOKEN",
    "user_env": "RELAY_A_USER",
    "default_user": ""
  }
}
```

认证类型：

- `bearer`：发送 `Authorization: Bearer <secret>`
- `cookie`：发送 `Cookie: session=<secret>`

若 `user_env` 或 `default_user` 有值，还会发送 `New-Api-User`。

## Docker Compose

```bash
cd deploy
docker compose up -d --build
```

首次全量同步：

```bash
docker compose exec tracker python sync.py full
```

以后增量同步：

```bash
docker compose exec tracker python sync.py
```

Compose 默认只把服务映射到 `127.0.0.1:8799`，请由 Caddy / Nginx / Traefik 提供 HTTPS。

## systemd

把仓库放到 `/opt/token-tracker`：

```bash
sudo cp deploy/token-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now token-tracker.service
```

定时同步建议使用 systemd timer：

```bash
sudo cp deploy/token-tracker-sync.service deploy/token-tracker-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now token-tracker-sync.timer
```

Timer 每 10 分钟执行一次增量同步，`sync.py` 自带非阻塞文件锁，避免并发任务重叠。

## Nginx 示例

```nginx
location /token-tracker/ {
    proxy_pass http://127.0.0.1:8799/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

配置 Scriptable 时填写：

```text
https://your-domain.example/token-tracker/v2
```

## 健康检查

```bash
curl -H 'X-N8N-API-KEY: YOUR_KEY' \
  https://your-domain.example/token-tracker/health
```

## 备份

运行时数据默认是 SQLite：

```text
backend/data/tokens.db    # 本地直跑
/opt/token-tracker/data/  # 示例部署
```

备份前可使用 SQLite 在线备份命令；不要把数据库提交到 Git。
