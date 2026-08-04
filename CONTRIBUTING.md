# Contributing

感谢参与改进 Token Tracker V2。

## 开发流程

1. Fork 仓库并从 `main` 创建分支。
2. 保持改动聚焦，不提交 `.env`、`sources.json`、数据库或个人 API 地址。
3. 运行 `python3 verify.py`。
4. 提交 Pull Request，说明问题、改动与验证结果。

## 项目约定

- 后端保持 Python 3.11+ 兼容。
- Scriptable 代码不能引入 Node.js 专用 API 或外部运行时依赖。
- 总 Token 继续使用 `prompt + completion` 口径；缓存字段不重复计入。
- 新数据源通过通用配置或适配层接入，不在代码中硬编码个人服务。
- UI 修改应同时检查亮色、暗色与推荐小组件尺寸。

## Commit

推荐使用简洁的 Conventional Commit 风格：

```text
feat: add source adapter option
fix: avoid duplicate request events
docs: clarify reverse proxy setup
```
