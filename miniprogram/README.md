# SayNote 微信小程序（Android 局域网开发版）

此目录是一个可导入微信开发者工具的原生小程序工程，只实现当前已验证的 Today 文字记录闭环。它复用 SayNote FastAPI 与 SQLite；记录存放在运行 API 的电脑，不存放在微信云端。

## 本机网络配置

`config.js` 默认使用 `127.0.0.1` 安全占位地址，适用于电脑上的开发工具本地预览。Android 真机预览前，请将 `API_BASE_URL` 改为电脑当前的 WLAN IPv4，例如 `http://192.168.1.23:8011/api/v1`。手机与电脑需连接同一可信 Wi-Fi；电脑换网后重新检查地址。

### 1. 启动只绑定 WLAN 地址的 API

在项目根目录打开 PowerShell：

```powershell
.\scripts\run-miniprogram-api.ps1
```

脚本会检测 Wi-Fi/WLAN IPv4，只将 API 绑定到该地址的 `8011` 端口。它不会绑定到所有网卡，也不会更改 Windows 防火墙。窗口需保持运行。

### 2. 在微信开发者工具中导入

选择本目录 `miniprogram/`。`project.config.json` 使用 `touristappid` 开发占位值；当前没有真实 AppID，不上传到微信平台。

在工具的“详情 → 本地设置”中启用“开发环境不校验请求域名、TLS 版本及 HTTPS 证书”。工具预览可先验证页面；真机预览需手机连同一 Wi-Fi，并在微信里开启小程序调试模式。小程序页面直接请求电脑的 WLAN API 地址。

## 重要边界

- 仅供私人局域网开发/体验，不是可提交审核的生产版本。
- 不要在访客 Wi-Fi、公共 Wi-Fi 上使用；同一局域网中可访问该 API 的设备可能读取或写入记录。
- 正式发布需要经过单独评审：有效 HTTPS 服务域名、证书与微信后台域名配置。当前不创建公网服务器、不上传记录、不发布小程序。
- 首屏保留：快速文字输入、Today 列表、原始事实与解释层分离。其他一级页面和后续能力均未实现。

## 自检

从项目根目录执行：

```powershell
node .\scripts\validate-miniprogram.mjs
python -m pytest backend\tests -q
cd frontend
npm run build
```

项目自检检查 JSON 配置、页面路由、仅本机/私有局域网 API 地址及脚本语法。真机预览需在微信开发者工具中人工扫码完成。
