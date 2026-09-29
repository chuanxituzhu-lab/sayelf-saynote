# SayNote v0.1 Build Decision Record

Status: `GO` for the explicitly scoped local vertical slice. This record is the source of truth for the v0.1 build boundary.

1. **真实任务**: 建立一个本地优先、API-first 的随手记最小闭环：手机 PWA 输入文字，经 `POST /api/v1/records` 写入 SQLite，Today 页面读取并在刷新后保留，FastAPI `/docs` 可查看和测试同一 API。
2. **最接近的既有能力**: 工作区没有既有代码。生态中已有 [mynotes](https://github.com/mikaelstaldal/mynotes)（SQLite、OpenAPI、TypeScript 前端）和 [Agaric](https://github.com/jfolcini/agaric)（本地优先、React、SQLite），证明选型成熟；本项目复用这些成熟模式，不复制其产品形态。
3. **Step 0 判定**: `Differentiate`。差异点是 Universal Record 的稳定数据契约：原始事实单独保存，解释层可选且可替换，一库多视图由同一记录源驱动。
3a. **Execution Verdict**: `GO`。任务、边界、数据位置、成功证据和回滚方式已明确。
4. **可度量改进或差异点**: v0.1 零云依赖、零登录、SQLite 单文件持久化；首条闭环只需一个写接口、一个读接口和一个前端输入路径；重型 AI 依赖数为 0。
5. **成功度量与判定证据**: 自动化测试验证 POST 返回 201、raw fact 正确落库、按 Today 读取、关闭并重新打开数据库后记录仍存在、OpenAPI 包含同一路径；前端生产构建成功；手工集成检查验证 `127.0.0.1` 上 `/docs` 可访问。
6. **最小内核**: `Record` 核心模型、SQLite Storage Adapter、FastAPI `POST/GET`、React Today 输入与列表、持久化测试。
7. **插件边界**: Capture Adapter、Search Index、Memory Engine、Expense Domain 只保留 Python Protocol 契约；未来可替换前端、存储和解释器，不在本阶段实现能力。
8. **本地优先边界**: 记录正文、数据库和 API 全部本地运行；没有同步、遥测、模型调用或上传路径。未来云能力必须通过显式适配器另行评审。
9. **数据分级与信任边界**: 用户输入默认 `Sensitive`；SQLite 文件、API 响应和开发日志留在本机。公共网络只用于获取公开依赖包和查看公开生态资料，不发送用户记录。
10. **是否公开发布**: 否。当前仅生成本地项目，不创建仓库、不提交、不推送。
11. **外发计划**: N/A。没有用户数据外发；依赖安装仅使用包名和版本元数据，不包含本地记录。
12. **状态与下一次检查触发条件**: 当前状态为 `v0.1-local-slice`；当测试失败、数据库 schema 改变、API 契约改变或新增数据流时重新检查。避免固定轮询。
13. **观测 / 推断 / 假设 / 事实**: 观测是测试输出和本地 HTTP 响应；推断是该组合适合首个垂直切片；假设是用户希望 Today 使用本地日期；事实是 SQLite 写入和重新打开后读取通过测试后才可声明。
14. **演进·验证·灰度·版本·回滚**: 以小版本扩展；每次先加契约测试，再实现适配器；本阶段无灰度流量；回滚是恢复本目录快照并保留 SQLite 文件，schema 变更必须新增迁移策略后再做。
15. **WebUI 决策**: `Required`。真实任务要求手机端输入和 Today 结果，普通用户不应接触数据库或命令行；界面遵循 `打开 → 输入 → 执行 → 结果`，技术细节仅在 `/docs` 中渐进披露。
16. **最简可靠实现**: Python FastAPI + stdlib SQLite + Pydantic；React + TypeScript + Vite；API 默认绑定 `127.0.0.1`；仅引入完成这些职责所需依赖。
17. **明确不做**: 多模态 Capture、搜索索引、Memory Engine、Expense Domain 逻辑、云同步、账号、认证、重型 AI、地图/日历/统计/人物视图、桌面快捷键、公开部署。

## Convergence check

| 意图 | 当前实现 | 状态 |
| --- | --- | --- |
| Local-first + SQLite | FastAPI 默认本地绑定，SQLite 单文件 | `matched` |
| Code-first + API-first | 后端核心模型/适配器/API 先于 UI，OpenAPI 由 FastAPI 生成 | `matched` |
| Universal Record | `Record` 包含 kind、时间、source、raw_fact、可选 interpretation | `matched` |
| 原始事实与 Memory 分离 | `raw_facts` 与 `interpretations` 分表；解释层可为空 | `matched` |
| 首条闭环 | 前端 POST、后端保存、Today GET、刷新持久化 | `matched` |
| `/docs` API Explorer | FastAPI 自动生成并由测试检查 | `matched` |
| 不扩展功能 | 未来能力只有 Protocol 契约，没有实现 | `matched` |

结论：`CONVERGED`。本阶段意图、实现和验证证据已对齐；未引入未授权功能。

## Verification evidence

- `python -m pytest backend\tests -q` → `2 passed`；覆盖 POST 201、Today GET、关闭并重新打开 SQLite 后仍可读取、OpenAPI 同一路径。
- `npm run build` → TypeScript 检查和 Vite production build 均通过。
- SQLite schema inspection → `records`、`raw_facts`、`interpretations` 三张表存在。
- 真实本地 HTTP → POST `201 Created`、Today GET `200 OK`、`/docs` `200`、`/openapi.json` `200`，OpenAPI 含 `/api/v1/records` 的 GET/POST。
- 浏览器端 → React PWA 输入测试文本后 Today 显示 1 条记录，刷新后仍显示同一条记录；临时验证数据已删除。

## Unverified / rollback limits

- 本机 `8000` 端口当时已有其他本地 Python 进程占用，因此真实 HTTP 和浏览器联调临时使用 `8011`；代码默认端口仍为 `8000`，Vite 可通过 `SAYNOTE_API_TARGET` 指向其他本地端口。
- FastAPI TestClient 报出上游 Starlette 关于 `httpx2` 的弃用提示，但不影响本次行为验证；后续依赖升级时应复查。
- 未验证多模态、搜索、记忆、费用领域、同步和云边界，因为这些明确属于后续阶段。

## Android WeChat Mini Program adapter decision

Status: `GO` for a local-development mini-program adapter. No account publication or public hosting is in scope.

1. **真实任务**: 将现有 Today 文字捕获闭环提供给 Android 微信小程序，同时继续使用同一 FastAPI API 与本机 SQLite。
2. **最接近的既有能力**: 本项目已有 REST/OpenAPI + SQLite；微信官方 [miniprogram-demo](https://github.com/wechat-miniprogram/miniprogram-demo) 提供原生项目结构参考。
3. **Step 0 判定**: `Integrate`。新增原生微信小程序前端适配器，复用现有 API 与 Record schema，不重写核心、数据库或业务逻辑。
3a. **Execution Verdict**: `GO`，限定为本机局域网开发与预览工程；生产发布状态为 `NOT_READY`。
4. **可度量改进或差异点**: 后端和 schema 改动数为 0；额外服务器依赖为 0；PWA 与小程序共用同一接口；记录仍只写本机 SQLite。
5. **成功度量与判定证据**: 原后端测试与前端生产构建保持通过；小程序 JSON 配置可解析、JS 可通过语法检查、Today 可发出 GET/POST 到本机 API；开发机 LAN 地址的 health check 返回 200。真机编译/扫码体验若无已安装 DevTools 则明确留为未验证。
6. **最小内核**: `app.json`、一个 Today 页面（WXML/WXSS/JS/JSON）、wx.request GET/POST 适配器、局域网 API 地址配置。
7. **插件边界**: Mini Program UI/API adapter 独立于 `sayn_note` 核心；将来可切换到已备案 HTTPS API，但本阶段不提供生产服务。
8. **本地优先边界**: 开发手机与电脑必须在同一可信 LAN；小程序只请求开发机 Wi‑Fi 私网地址，后端按 WLAN 地址监听。没有云端同步或公开隧道。
9. **数据分级与信任边界**: 随手记正文为 `Sensitive`；在手机与用户电脑之间经私人 LAN 发送，只用于写入本机数据库。服务只绑定 WLAN 地址，不绑定所有网卡；避免访客 Wi‑Fi/公共网络。
10. **是否公开发布**: 否。不会上传微信平台、创建公众平台配置或发布体验版/正式版。
11. **外发计划**: 公网数据外发为 N/A；本机和同 LAN 用户设备间传输仅含记录内容及 API 返回对象。无 telemetry、云函数、第三方 SDK。
12. **状态与下一次检查触发条件**: Wi‑Fi IPv4 由启动脚本运行时检测，不固化到公开源码；换 Wi‑Fi、调整 API 端口、调试校验设置改变或引入 HTTPS 后复查。
13. **观测 / 推断 / 假设 / 事实**: 已观测后端测试通过、前端构建通过、LAN health endpoint 在开发机返回 200；推断原生小程序适配能复用 Record API；手机真机请求和 UI 还未由微信 DevTools 验证。
14. **演进·验证·灰度·版本·回滚**: 小程序源单独位于 `miniprogram/`；出现问题可只停用该前端，API/schema 不变。换网络时更新本地 API endpoint；生产化须新建决策记录和经过审查的 HTTPS/域名/部署方案。
15. **WebUI 决策**: `Required`。小程序原生页面是用户输入和查看 Today 的唯一用途。
16. **最简可靠实现**: 微信原生 WXML/WXSS/JavaScript + `wx.request`；不加 Taro/React 或额外运行时。
17. **明确不做**: 公网部署、云同步、登录、微信账号数据绑定、公开二维码、微信审核发布、正式 AppID 配置、搜索/Memory/多模态/Expense。

### Mini-program verification status

- 后端虚拟环境复测：`.venv\Scripts\python.exe -m pytest backend\tests -q` → `2 passed`；React/Vite `npm run build` 通过。Starlette TestClient 保留一个不影响行为的弃用提示。系统默认 Python 未安装 pytest，不影响项目虚拟环境中的成功测试。
- 小程序自检 `node scripts\validate-miniprogram.mjs` 通过：页面路由与 JSON 配置可解析、4 个 JS 文件语法通过、API 地址为私有 WLAN IP:8011；API 启动 PowerShell 脚本解析通过。
- 隔离 SQLite LAN 冒烟测试通过：FastAPI 绑定本机 WLAN IP:8011；health GET 成功，记录 POST 成功，随后 GET 读回同一记录。测试仅使用临时 SQLite 文件，未读取或修改 SayNote 用户数据库。
- 官方网络约束参考：[腾讯云超级应用服务网络文档](https://intl.cloud.tencent.com/zh/document/product/1219/61745)；局域网请求仅用于本机开发场景。绕过域名/HTTPS 检查仅限微信开发工具和开启调试模式的设备。
- 本机未发现微信开发者工具安装，也未提供正式 AppID。因此可交付可导入工程与本机验证；实际微信工具编译、Android 扫码运行和提审尚未验证。
- 正式发布阻断项：可信 HTTPS 服务域名与证书、微信后台域名配置、真实 AppID/开发者账号；如果坚持所有记录只留在个人电脑，则应仅使用局域网开发预览，不进行公众发布。

## Public source release addendum (2026-09-29)

- **Classification / authorization**: 用户明确确认将此前 43 文件源码包归类为 `Public` 并上传到 `chuanxituzhu-lab/sayelf-saynote`。该仓库为公开仓库，已有 MIT LICENSE；保留其既有许可证。
- **Release scope**: 仅发布此前审查过的 SayNote 后端、PWA、小程序、本地验证脚本及说明文档；不发布 SQLite 数据、虚拟环境、依赖缓存、构建输出、临时记录或其他工作区新增内容。
- **Local redaction**: 发布副本将本机 WLAN 地址替换为 `127.0.0.1` 安全占位值，Android 真机预览说明改为运行时配置；移除包含个人 Windows 用户路径的命令示例。
- **Transfer boundary**: 只推送到指定公开 GitHub 仓库；无记录正文、凭据、日志、遥测或云端数据外发。提交前检查完整暂存 diff、凭据特征、数据库/本机路径，并运行聚焦测试；只允许对现有 `main` 做 fast-forward 更新。
- **Release checks**: 脱敏副本后端测试 `2 passed`；小程序配置/路由/脚本自检通过；API 启动脚本语法检查通过；PWA 前端构建已在同一源码版本通过。暂存清单为 43 个来源文件，数据库、缓存与依赖目录为 0。
- **Rollback / state check**: 保留发布前 `main` commit SHA；推送后核验新 commit 和仓库文件树。失败时不 force push、不重写历史。
