# SayNote v0.1

本地优先的 Universal Record 最小垂直切片：文字输入 → FastAPI → SQLite → Today PWA。

## 启动 API

在项目目录执行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn sayn_note.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

API 默认只监听 `127.0.0.1`。数据默认写入项目根目录的 `data/saynote.sqlite3`；可通过 `SAYNOTE_DB_PATH` 指定本地路径。

打开 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 可查看和测试 API。

## 启动手机 PWA

另开终端：

```powershell
cd frontend
npm install
npm run dev
```

打开 [http://127.0.0.1:5173](http://127.0.0.1:5173)。Vite 只把 `/api` 代理到本地 FastAPI；如需临时换本地端口，可设置 `SAYNOTE_API_TARGET=http://127.0.0.1:8011`。

## Android 微信小程序（局域网开发预览）

原生微信小程序工程和导入步骤见 [miniprogram/README.md](miniprogram/README.md)。该入口复用本机 API 和 SQLite，不是 Android APK，也不是已发布到微信平台的线上小程序。电脑与手机需在同一可信 Wi-Fi；按说明启动仅监听 Wi-Fi 网卡的本地 API，再用微信开发者工具导入 `miniprogram/`。正式发布所需的 AppID、HTTPS 域名和微信后台配置尚未提供，因此不包含线上发布。

## 聚焦验证

```powershell
python -m pytest backend\tests -q
cd frontend
npm run build
```

测试覆盖：创建记录、Today 读取、关闭并重新打开 SQLite 后仍可读取、OpenAPI 路径存在。前端构建覆盖 React + TypeScript + PWA 静态资源。

## 冻结边界

已保留但未实现的接口契约位于 `backend/sayn_note/capabilities/contracts.py`：Multimodal Capture、Search Index、Memory Engine、Expense Domain。v0.1 不调用云服务、不上传记录、不实现重型 AI。
