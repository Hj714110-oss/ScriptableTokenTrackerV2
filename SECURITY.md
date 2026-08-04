# Security Policy

## Supported version

安全更新仅面向 `main` 分支的最新版本。

## Reporting a vulnerability

请不要公开提交包含以下内容的 Issue：

- 可用的 API Key、Cookie 或访问令牌
- 能绕过 API 鉴权的细节
- 真实数据库、日志或个人用量数据

请通过 GitHub 仓库的 **Security → Report a vulnerability** 私下报告。报告中请包含影响范围、复现步骤和建议修复方式。维护者会尽快确认。

## Deployment guidance

- 仅通过 HTTPS 暴露 API。
- 使用随机长 `TOKEN_API_KEY`。
- 限制 `.env`、`sources.json` 和 SQLite 文件权限。
- 反向代理和云防火墙只开放必要端口。
- 定期轮换各来源的凭据。
