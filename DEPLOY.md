# 安居集团 AI 资产管理平台 — 部署文档

## 环境要求

- **Node.js** 18+（推荐 20 LTS）
- **npm**（随 Node.js 自带）
- **网络**：需能访问数据库 `10.16.230.61:3306`（内网环境）
- **操作系统**：Windows / macOS / Linux 均可

---

## 一、快速部署（标准流程）

### 1. 克隆项目

```bash
git clone https://github.com/Fayven-zhao/store-insight.git
cd store-insight
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../frontend && npm install

# 回到项目根目录
cd ..
```

> **⚠️ 关于 npm 镜像**：如果 `npm install` 报 404 错误，说明你使用的 npm 镜像（如 npmmirror）可能缺少某些包。可以切换到官方源安装：
> ```bash
> npm install --registry=https://registry.npmjs.org
> ```
> 或者一次性配置为官方源：
> ```bash
> npm config set registry https://registry.npmjs.org
> npm install
> ```

### 3. 配置数据库

```bash
# 从模板创建 .env 配置文件
cp server/.env.example server/.env
```

编辑 `server/.env`，填入真实的数据库密码：

```ini
DB_HOST=10.16.230.61     # 数据库服务器地址（无需修改）
DB_PORT=3306             # 数据库端口（无需修改）
DB_USER=common           # 数据库用户名（无需修改）
DB_PASSWORD=你的数据库密码  # ⚠️ 必须修改为正确的密码
DB_NAME=omnidemo         # 数据库名称（无需修改）
PORT=3001                # 后端服务端口（无需修改）
```

> `.env` 文件包含敏感信息，已被 `.gitignore` 排除，不会提交到 Git。

### 4. 启动服务

需要同时启动后端和前端，**请打开两个终端**：

**终端 1 — 启动后端 API（端口 3001）**：
```bash
cd server
npm start
```

**终端 2 — 启动前端页面（端口 5173）**：
```bash
cd frontend
npm run dev
```

> **Windows 用户注意**：如果修改文件后需要重启，按 `Ctrl+C` 停止后重新执行 `npm start`。
> 或者使用 `npm run dev`（后端）或 `npm run dev`（前端），它们会自动监听文件变化并重启。

### 5. 访问

浏览器打开：**http://localhost:5173**

---

## 二、验证服务是否正常

### 检查后端 API

启动后端后，用浏览器访问或执行：

```bash
curl http://localhost:3001/api/insights?page=1&pageSize=5
```

如果返回 JSON 数据，说明后端正常工作。

### 常见错误排查

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `Access denied for user 'common'@'...' (using password: NO)` | `.env` 文件不存在或密码未加载 | 确认已执行 `cp .env.example .env` 并在 `.env` 中填写了正确密码 |
| `Access denied for user 'common'@'...' (using password: YES)` | 数据库密码不正确 | 检查 `.env` 中 `DB_PASSWORD` 是否正确 |
| `Cannot find module 'xxx'` | 依赖未安装 | 执行 `npm install` |
| `connect ECONNREFUSED 10.16.230.61:3306` | 无法连接数据库服务器 | 确认本机可以访问内网数据库（检查网络/VPN） |
| `MODULE_NOT_FOUND` / `ERR_MODULE_NOT_FOUND` | 包未安装 | 检查 `server/` 和 `frontend/` 目录下都已执行 `npm install` |

---

## 三、局域网访问

如需要局域网内其他设备访问：

```bash
# 启动前端（允许局域网访问）
cd frontend
npm run dev -- --host
```

其他设备通过 `http://<你的IP>:5173` 访问。

---

## 四、离线地图瓦片（可选）

> 不下载瓦片不影响系统使用，只是地图区域背景为空白。

本项目已预配高德地图和 Leaflet 瓦片代理，默认联网加载瓦片。
如果需要下载离线瓦片，有两种方式：

### 方式 1：Node.js 脚本（推荐）

```bash
# 先确保前端正在运行（npm run dev）
node scripts/download-tiles.js
```

### 方式 2：Shell 脚本（需安装 curl、bc）

```bash
bash scripts/download-tiles.sh
```

下载的瓦片会保存在 `frontend/public/tiles/` 目录下。

---

## 五、目录结构

```
store-insight/
├── frontend/                    # 前端（React + Vite + Ant Design）
│   ├── public/tiles/            # 离线地图瓦片（可选，约 34,000+ 张）
│   ├── package.json
│   └── vite.config.ts
├── server/                      # 后端 API（Express + MySQL）
│   ├── .env                     # 数据库配置（⚠️ 不提交到 Git）
│   ├── .env.example             # 配置模板
│   ├── db.js                    # 数据库连接（自动加载 .env）
│   ├── index.js                 # API 服务入口
│   └── package.json
├── scripts/                     # 工具脚本
│   ├── download-tiles.js        # 离线瓦片下载（Node.js 版）
│   └── download-tiles.sh        # 离线瓦片下载（Shell 版）
├── docs/                        # 文档
├── DEPLOY.md                    # 本文件
└── .gitignore
```

---

## 六、开发相关

### 开发模式启动

```bash
# 后端 — 文件修改后自动重启
cd server && npm run dev

# 前端 — 开发服务器（热更新）
cd frontend && npm run dev
```

### 构建生产版本

```bash
cd frontend
npm run build     # 输出到 frontend/dist/
```
