# World Monitor 页面布局分析报告

> **分析对象**: `https://www.worldmonitor.app/dashboard?lat=12.4730&lon=-1.6872&zoom=1.38&view=global&timeRange=7d&layers=conflicts%2Cbases%2Chotspots%2Cnuclear%2Csanctions%2Cweather%2Ceconomic%2Cwaterways%2Coutages%2Cmilitary%2Cnatural%2CiranAttacks`
>
> **分析日期**: 2026-07-03
>
> **项目仓库**: [github.com/koala73/worldmonitor](https://github.com/koala73/worldmonitor) (AGPL-3.0, 41,000+ Stars)

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [整体页面布局](#3-整体页面布局)
4. [Header 顶部导航栏](#4-header-顶部导航栏)
5. [地图容器与图层系统](#5-地图容器与图层系统)
6. [面板网格系统](#6-面板网格系统)
7. [布局预设系统](#7-布局预设系统)
8. [时间维度控制](#8-时间维度控制)
9. [滑出面板：Country Deep-Dive](#9-滑出面板country-deep-dive)
10. [Widget Picker 面板选择器](#10-widget-picker-面板选择器)
11. [Z-Index 层级体系](#11-z-index-层级体系)
12. [设计令牌与视觉系统](#12-设计令牌与视觉系统)
13. [响应式设计](#13-响应式设计)
14. [性能优化策略](#14-性能优化策略)
15. [URL 参数解析](#15-url-参数解析)
16. [参考来源](#16-参考来源)

---

## 1. 项目概述

World Monitor 是一个**开源、免费的实时全球情报仪表盘**，由 Elie Habib（Anghami CEO）创建。自 2026 年 1 月以来已获得 **440 万次访问**和 **41,000+ GitHub Stars**，被媒体称为"地缘政治领域的彭博终端"。

### 核心能力

- **45+ 可切换数据图层**，覆盖地缘政治、军事、基础设施、金融、自然灾害
- **AI 驱动威胁分类**：双阶段管道（关键词分类器 + LLM 分类器 Groq Llama 3.1 8B）
- **异常检测**：Welford 在线算法 + Z-Score 偏离标记 + 多信号融合告警
- **6 个应用变体**（Full / Tech / Finance / Commodity / Happy / Energy），单代码库产出

---

## 2. 技术架构

### 2.1 前端技术栈

| 类别 | 技术 |
|---|---|
| **语言** | TypeScript (纯 Vanilla，无 UI 框架) |
| **构建** | Vite |
| **3D 地球** | `globe.gl` + Three.js |
| **2D 地图** | deck.gl + MapLibre GL JS |
| **图表** | D3.js |
| **AI (浏览器端)** | Transformers.js / onnxruntime-web |
| **AI (服务端)** | Ollama / Groq / OpenRouter |
| **API 协议** | Protocol Buffers + Sebuf (自研 RPC 框架) |
| **桌面应用** | Tauri v2 (Rust + Node.js sidecar) |
| **部署** | Vercel Edge Functions (60+) + Railway 中继 |
| **缓存** | Redis (Upstash), 24h TTL |

### 2.2 组件架构

所有 UI 组件继承自基类 `Panel`，遵循统一生命周期：

```
constructor → render → destroy
```

项目包含 **~50 个 Panel 子类**，按领域组织：

```
src/
├── components/     # Panel 子类 (~50 个)
├── services/       # 数据获取模块
├── config/         # 静态数据与变体配置
├── generated/      # 自动生成的 Sebuf 桩代码
├── types/          # TypeScript 类型定义
├── locales/        # 国际化 (24 种语言)
├── workers/        # Web Workers (分析计算)
├── styles/         # CSS 样式表
│   ├── header.css
│   ├── main.css
│   └── country-deep-dive.css
server/             # Sebuf 处理器 (34 个领域服务)
api/                # Vercel Edge Functions
proto/              # Protobuf 定义 (276 个 proto, 34 个服务)
```

---

## 3. 整体页面布局

### 3.1 布局示意图

```
┌──────────────────────────────────────────────────────────────────┐
│  .header  (z-index: 600, position: relative)                     │
│  ┌──────┬──────────────────────────────┬──────────────────────┐ │
│  │ Logo │ [Intelligence] [Market] [..] │ [搜索] [+面板] [设置]│ │
│  └──────┴──────────────────────────────┴──────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  .map-controls  (z-index: 500)                                   │
│  ┌─────────────────┐                    ┌────┐ ┌──────────────┐ │
│  │ 图层切换面板     │                    │ +/-│ │ Focus: Global│ │
│  │ (可折叠侧边栏)   │                    │缩放│ │ [下拉选择]   │ │
│  └─────────────────┘                    └────┘ └──────────────┘ │
│                                                                  │
│                  ┌────────────────────────────┐                  │
│                  │                            │                  │
│                  │   MapLibre GL / deck.gl    │                  │
│                  │   3D 地球 / 2D 平面地图     │                  │
│                  │   (z-index: 0, 全幅背景)    │                  │
│                  │                            │                  │
│                  │   叠加 45+ 数据图层         │                  │
│                  │   · 冲突区域热力/标记       │                  │
│                  │   · 军事基地图标            │                  │
│                  │   · 实时航班轨迹            │                  │
│                  │   · 舰船 AIS 信号           │                  │
│                  │   · 核设施标记              │                  │
│                  │   · ...                     │                  │
│                  └────────────────────────────┘                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  .deckgl-time-slider                                             │
│  [1h]  [6h]  [24h]  [48h]  [7d]                                 │
├──────────────────────────────────────────────────────────────────┤
│  .panels-grid  (z-index: 1, CSS Grid auto-fill)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Panel 1  │ │ Panel 2  │ │ Panel 3  │ │ Panel 4  │           │
│  │ 实时新闻  │ │ CII 指数  │ │ 冲突事件  │ │ 战略评估  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Panel 5  │ │ Panel 6  │ │ Panel 7  │ │ Panel 8  │           │
│  │ 监视关键词│ │ GDELT    │ │ 洞察摘要  │ │ 经济指标  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                        │
│  │  + 添加面板                          │  ← .add-panel-block   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 URL 视图快照

你当前的 URL 参数决定了以下视图状态：

| 参数 | 值 | 含义 |
|---|---|---|
| `lat=12.4730` | 北纬 12.47° | 地图中心：布基纳法索附近 (西非萨赫勒地区) |
| `lon=-1.6872` | 西经 1.69° | 同上 |
| `zoom=1.38` | 缩放级别 1.38 | 近乎全球视野 |
| `view=global` | Global 预设 | 全局态势视图布局 |
| `timeRange=7d` | 7 天 | 数据时间窗口为过去一周 |
| `layers=...` | 12 个图层 | 启用的地图数据覆盖层 |

---

## 4. Header 顶部导航栏

### 4.1 CSS 定位

```css
.header {
  position: relative;
  z-index: 600;
}
```

设置独立层叠上下文的目的是确保 Header 下拉菜单（Intelligence Findings、Pentagon Pizza Index 等）能正确渲染在内容网格 (`z-index: 1`) 和地图控件 (`z-index: 500`) 之上，同时保持低于搜索叠加层 (`z-index: 2000`) 和模态框 (`3000-10000+`)。

### 4.2 组件分解

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [🌐 World Monitor]  ← Logo / 品牌标识                           │
│                                                                  │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────┐ │
│  │ Intelligence  │ │ Market Watch │ │Breaking News │ │Minimal│ │
│  │   Analyst     │ │              │ │              │ │       │ │
│  └───────────────┘ └──────────────┘ └──────────────┘ └───────┘ │
│  ↑ 布局预设 Tab (pill 按钮)                                      │
│                                                                  │
│  [🔍 搜索...]  [+ 添加面板]  [⚙ 设置]  [? 帮助]                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 布局预设 Tab 样式

```css
/* 小写大写的 pill 按钮 */
.tab-btn {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  padding: 6px 14px;
  border-radius: 20px;
}

.tab-btn.active {
  color: var(--accent);       /* #0f8 亮绿色 */
  background: rgba(0, 255, 136, 0.08);
}
```

---

## 5. 地图容器与图层系统

### 5.1 双引擎渲染架构

| 模式 | 引擎 | 用途 | 特点 |
|---|---|---|---|
| **3D 地球** | `globe.gl` + Three.js | 旋转、倾斜、全局鸟瞰 | 沉浸式态势感知 |
| **2D 平面** | deck.gl + MapLibre GL JS | 精确区域查看 | 60 FPS, 支持聚类 |

两个模式**共享 45+ 数据图层配置**，仅切换渲染后端。

### 5.2 图层控制面板（左侧可折叠侧边栏）

```
┌────────────────────────────┐
│  🔍 [搜索图层...]          │  ← input.layer-search
│     实时过滤 45 个图层      │
│                            │
│  [?] 图层指南              │  ← button.layer-help-btn
│      48×48px 触控目标       │     (WCAG 2.5.8 合规)
├────────────────────────────┤
│  ⚔ 地缘政治                │
│  ──────────────────────── │
│  ☑ 冲突区域 (conflicts)    │  ✓ 已启用
│  ☑ 情报热点 (hotspots)     │  ✓ 已启用
│  ☑ 制裁区域 (sanctions)    │  ✓ 已启用
│  ☑ 伊朗攻击 (iranAttacks)  │  ✓ 已启用
│  ☐ 社会动荡 (unrest)       │
│                            │
│  🎖 军事与战略              │
│  ──────────────────────── │
│  ☑ 军事基地 (bases)        │  ✓ 已启用
│  ☑ 军事活动 (military)     │  ✓ 已启用
│  ☑ 核设施 (nuclear)        │  ✓ 已启用
│  ☐ 航班追踪 (flights)      │
│  ☐ 舰船追踪 (naval)        │
│                            │
│  🌍 自然与环境              │
│  ──────────────────────── │
│  ☑ 天气 (weather)          │  ✓ 已启用
│  ☑ 自然灾害 (natural)      │  ✓ 已启用
│  ☐ 野火 (wildfires)        │
│  ☐ 地震 (earthquakes)      │
│                            │
│  🏗 基础设施                │
│  ──────────────────────── │
│  ☑ 水道航线 (waterways)    │  ✓ 已启用
│  ☑ 网络中断 (outages)      │  ✓ 已启用
│  ☐ 海底光缆 (cables)       │
│  ☐ 油气管道 (pipelines)    │
│  ☐ AI 数据中心 (datacenters)│
│                            │
│  💹 经济金融                │
│  ──────────────────────── │
│  ☑ 经济指标 (economic)     │  ✓ 已启用
│  ☐ 交易所 (exchanges)      │
│  ☐ 央行 (centralBanks)     │
│                            │
│  [▼ 收起面板]              │  ← toggle-collapse
└────────────────────────────┘
```

**你的 URL 已启用的 12 个图层**（加粗为活跃状态）：

| # | 图层 ID | 中文名称 | 数据来源 |
|---|---|---|---|
| 1 | `conflicts` | 冲突区域 | ACLED + GDELT |
| 2 | `bases` | 军事基地 | 220+ 全球基地数据库 |
| 3 | `hotspots` | 情报热点 | AI 异常检测 + 多信号融合 |
| 4 | `nuclear` | 核设施 | IAEA + 公开情报 |
| 5 | `sanctions` | 制裁区域 | 各国制裁清单 |
| 6 | `weather` | 天气 | 全球气象数据 |
| 7 | `economic` | 经济指标 | 多源经济数据 |
| 8 | `waterways` | 水道/航线 | AIS 船舶数据 |
| 9 | `outages` | 网络中断 | Cloudflare Radar |
| 10 | `military` | 军事活动 | ADS-B + 公开情报 |
| 11 | `natural` | 自然灾害 | USGS + NASA |
| 12 | `iranAttacks` | 伊朗攻击 | 专属追踪 |

### 5.3 图层状态管理

- **深拷贝状态隔离**：内部状态与外部突变解耦，防止图层开关"冻结/卡住"
- **URL 编码同步**：图层选择实时反映到 URL query string → **视图可分享/书签**
- **懒加载性能优化**：禁用的图层跳过 `filterByTime()` 调用
- **图标图集预计算**：提升为模块级常量，避免每帧刷新

### 5.4 地图交互控件

| 控件 | 位置 | 交互方式 |
|---|---|---|
| **缩放** (`+`/`-`) | 右侧 | 滚轮 + 按钮点击 |
| **平移** | 任意位置 | 拖拽 |
| **旋转/倾斜** | 3D 模式 | 右键拖拽 / 双指手势 |
| **区域预设** | 顶部居中下拉 | 一键跳转 8 个区域 |
| **Pin 固定** | 右下角 | 锁定地图，面板滚动时地图保持可见 |
| **3D/2D 切换** | 右上角 | globe.gl ↔ deck.gl |

---

## 6. 面板网格系统

### 6.1 CSS Grid 布局

```css
.panels-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  padding: 12px;
}

/* 网格尺寸通过 CSS 自定义属性控制，确保骨架屏与实网一致 */
:root {
  --grid-col-min: 320px;
  --grid-gap: 12px;
}
```

### 6.2 单个面板卡片结构

```
┌──────────────────────────────────────┐
│  .panel-header                       │
│  ┌──────────────────────────────┐   │
│  │ [📊 面板标题]    [42 条]  [✕]│   │
│  │  .panel-header-left  .count  │   │
│  │                    .panel-   │   │
│  │                    close-btn │   │
│  └──────────────────────────────┘   │
│  ─────────────────────────────────  │  ← border-bottom: 1px solid var(--border)
│                                      │
│  .panel-body                         │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │  图表 / 表格 / 列表 / 新闻流  │   │
│  │                              │   │
│  │  (D3.js 渲染的数据可视化)     │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  .panel-footer (可选)                │
│  ─────────────────────────────────  │
│  [查看更多 →]                        │
└──────────────────────────────────────┘
```

### 6.3 面板 Header 样式细节

```css
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: var(--overlay-subtle);
  border-bottom: 1px solid var(--border);
}

/* 自动推进第一个右对齐元素 */
.panel-header > .panel-header-left + * {
  margin-left: auto;
}

.panel-count {
  font-size: 10px;
  color: var(--text-dim);
}
```

### 6.4 关闭按钮 — Hover 显现模式

```css
.panel-header .icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.panel-header .panel-close-btn {
  font-size: 14px;
  opacity: 0;                          /* 默认隐藏 */
  order: 999;                          /* 始终位于最右 */
  transition: opacity 0.15s ease;
}

/* 面板 hover 时显示关闭按钮 */
.panel:hover .panel-close-btn,
.panel-close-btn:focus-visible {
  opacity: 1;
}

/* 危险色 hover */
.panel-header .panel-close-btn:hover {
  background: color-mix(in srgb, var(--semantic-critical) 15%, transparent);
  color: var(--semantic-critical);
}

/* 触屏设备始终可见 */
@media (hover: none) {
  .panel-header .panel-close-btn {
    opacity: 0.7;
  }
}
```

### 6.5 添加面板块（`+` 占位符）

```css
.add-panel-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  border: 2px dashed var(--border);
  border-radius: var(--panel-radius, 6px);
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.add-panel-block:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 255, 136, 0.04);
}

.add-panel-block-icon {
  font-size: 28px;
  line-height: 1;
}

.add-panel-block-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## 7. 布局预设系统

Header 中 4 个 Tab 对应 4 套面板组合，一键切换整体信息架构：

### 7.1 Intelligence Analyst（情报分析师）

面向地缘政治/安全分析师的全景视图：

| 面板 | 说明 |
|---|---|
| **CII Panel** | 国家不稳定指数，覆盖 20 个国家，多维度评分 |
| **Strategic Posture** | 战略态势评估，综合军力/经济/外交 |
| **Threat Timeline** | 威胁时间线，按时间轴排列安全事件 |
| **Live News** | 实时新闻流，100-450+ RSS 源，AI 威胁标注 |
| **Insights** | AI 生成的态势洞察摘要 |
| **Monitor** | 自定义关键词监控面板 |
| **GDELT** | 全球事件、语言和语调数据库可视化 |
| **Satellites** | 卫星过境追踪 |
| **Displacement** | 人口流离失所追踪 |
| **Cascade** | 事件级联分析 |

### 7.2 Market Watch（市场观察）

面向金融交易员/分析师：

| 面板 | 说明 |
|---|---|
| **Markets** | 92 个证券交易所实时行情 |
| **Commodities** | 大宗商品价格追踪 |
| **Crypto** | BTC/ETH/SOL/XRP 实时价格 |
| **Macro Signals** | 7 信号复合雷达 + BUY/CASH/SELL 判据 |
| **Fear & Greed** | 市场恐慌贪婪指数 |
| **ETF Flows** | BTC 现货 ETF 流追踪 (IBIT/FBTC/GBTC) |
| **Stablecoins** | 稳定币锚定健康度监控 |
| **Gulf Economies** | GCC 金融市场数据 (Tadawul/DFM/ADX) |
| **Heatmap** | 市场热力图 |

### 7.3 Breaking News（突发新闻）

面向新闻编辑/传播分析师：

| 面板 | 说明 |
|---|---|
| **Live News** | 实时新闻主面板 |
| **Politics** | 政治新闻 |
| **US / Europe / Middle East** | 区域新闻面板 |
| **Africa / LatAm / Asia** | 区域新闻面板 |
| **Live Webcams** | 直播视频流 (Bloomberg/Sky News/Al Jazeera) |

### 7.4 Minimal（极简模式）

纯地图 + 核心面板，适合展示/嵌入：

| 面板 | 说明 |
|---|---|
| **Map** | 全幅地图 |
| **Live News** | 新闻流 |
| **Insights** | AI 洞察 |
| **Strategic Posture** | 战略评估 |

---

## 8. 时间维度控制

### 8.1 时间范围选择器

位于地图下方，`.deckgl-time-slider` 组件：

```
┌──────────────────────────────────────────────┐
│   [1h]    [6h]    [24h]    [48h]    [7d]     │
│                                      ▲       │
│                                 当前选中     │
└──────────────────────────────────────────────┘
```

```css
.time-btn {
  min-width: 48px;
  min-height: 48px;        /* WCAG 2.5.8: 最小触控目标 */
  padding: 8px 16px;
  border-radius: 6px;
}

.time-btn.active {
  background: var(--accent);
  color: #000;
}
```

### 8.2 时间过滤影响范围

选择 `7d` 时，同时影响两个维度：

| 维度 | 影响 |
|---|---|
| **地图图层** | 仅渲染过去 7 天内的事件标记 (deck.gl `filterByTime()`) |
| **面板数据** | 新闻流、冲突事件、经济指标等均限定 7 天窗口 |
| **AI 分析** | 异常检测基于 7 天滑动窗口 |

---

## 9. 滑出面板：Country Deep-Dive

点击地图上的国家标记时，从右侧滑入 430px 宽的国家深度分析面板。

### 9.1 CSS 动画

```css
/* 关闭态 - 隐藏在屏幕右侧 */
#country-deep-dive-panel.country-deep-dive[aria-hidden="true"] {
  right: -460px;
  visibility: hidden;
  transition: right 0.3s ease, visibility 0.3s;
}

/* 打开态 - 滑入可视区域 */
.country-deep-dive.active {
  right: 0;
  visibility: visible;
}

/* 最大化 - 全屏铺满 */
.country-deep-dive.maximized {
  inset: 0;
}
```

### 9.2 面板内容

```
                              ┌──────────────────────────┐
                              │  Country Deep-Dive       │
                              │  ─────────────────────── │
                              │  ┌────────────────────┐  │
                              │  │ 🏳 国旗 + 国家名称  │  │
                              │  │ 首都 · 人口 · GDP  │  │
                              │  └────────────────────┘  │
                              │                          │
                              │  📊 CII 评分             │
                              │  ┌────────────────────┐  │
                              │  │ ████████░░ 78/100   │  │
                              │  │ 不稳定风险: 高       │  │
                              │  └────────────────────┘  │
                              │                          │
                              │  📅 近期事件时间线        │
                              │  · 07-02  边境冲突升级   │
                              │  · 06-29  制裁公告       │
                              │  · 06-25  抗议活动       │
                              │                          │
                              │  💹 经济指标             │
                              │  通胀率 · 汇率 · 外储    │
                              │                          │
                              │  📰 相关新闻              │
                              │  · 新闻标题 1            │
                              │  · 新闻标题 2            │
                              │                          │
                              │  [最大化] [📌 固定] [✕] │
                              └──────────────────────────┘
```

---

## 10. Widget Picker 面板选择器

Header 右侧的 `+` 按钮触发弹出层。

### 10.1 CSS 定位

```css
.widget-picker {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  width: 280px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 6px;
  background: var(--bg-elevated);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### 10.2 内容结构

```
┌──────────────────────────┐
│  添加面板                 │
│  ──────────────────────  │
│                          │
│  GEO POLITICAL           │  ← 分类标题 (dim 大写)
│  ──────────────────────  │
│  ○ CII Index             │
│  ○ Strategic Posture     │
│  ○ Threat Timeline       │
│  ○ ...                   │
│                          │
│  MARKETS & FINANCE       │
│  ──────────────────────  │
│  ○ Markets               │
│  ○ Commodities           │
│  ○ Crypto                │
│  ○ Heatmap               │
│  ○ ...                   │
│                          │
│  NEWS & MEDIA            │
│  ──────────────────────  │
│  ○ Live News             │
│  ○ Live Webcams          │
│  ○ Monitor               │
│  ○ ...                   │
│                          │
└──────────────────────────┘
```

- 点击选项 → 面板添加到 `.panels-grid` 末尾
- 点击外部 / Escape → 关闭
- 每个选项 `padding: 8px 12px`，hover 高亮

---

## 11. Z-Index 层级体系

设计精密的层叠上下文，确保各 UI 层正确覆盖：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  10000+  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Modal 模态对话框              │
│   3000   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Toast / 通知                  │
│   2000   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Search Overlay 搜索叠加层      │
│   1000   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Widget Picker 面板选择器       │
│    600   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  .header 顶栏 + 下拉菜单        │
│    500   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  .map-controls 地图控件         │
│      1   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  .panels-grid 面板网格          │
│      0   ░░░░░░░░░░░░░░░  Map 地图画布 (背景层)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| 层级 | Z-Index | 组件 | 说明 |
|---|---|---|---|
| **背景层** | 0 / auto | MapLibre GL / deck.gl 画布 | 全幅地图渲染 |
| **内容层** | 1 | `.panels-grid` | 面板卡片网格 |
| **地图控件** | 500 | `.map-controls` | 图层切换、缩放、区域预设 |
| **Header** | 600 | `.header` | 顶栏及所有下拉菜单 |
| **面板选择器** | 1000 | Widget Picker | 添加面板弹出层 |
| **搜索** | 2000 | Search Overlay | 全局搜索覆盖 |
| **模态** | 3000-10000+ | Modal / Toast | 对话框、通知 |

---

## 12. 设计令牌与视觉系统

### 12.1 CSS 自定义属性

```css
:root {
  /* 文字 */
  --text:            #ffffff;        /* 主文字色 (暗色主题) */
  --text-dim:        rgba(255,255,255,0.5);  /* 次要/暗淡文字 */

  /* 背景与叠加 */
  --overlay-subtle:  rgba(255,255,255,0.05);  /* 微妙叠加背景 */
  --bg-elevated:     #1a1a2e;        /* 弹出层背景 */

  /* 边框 */
  --border:          rgba(255,255,255,0.1);  /* 低对比度线框 */

  /* 语义色 */
  --accent:          #00ff88;        /* 强调色 - 亮绿 */
  --semantic-critical: #ff4444;      /* 危险/删除 - 红色 */
  --semantic-warning:  #ffaa00;      /* 警告 - 橙色 */
  --semantic-info:     #4488ff;      /* 信息 - 蓝色 */

  /* 形状 */
  --panel-radius:    6px;            /* 面板圆角 */
}
```

### 12.2 视觉风格定位

| 方面 | 描述 |
|---|---|
| **主题** | 暗色模式 (Dark Mode) |
| **风格** | 军事/情报指挥中心 (CIC)，高信息密度 |
| **字体** | 系统等宽/无衬线，11px 小字大写标签 |
| **配色** | 深色背景 + 亮绿强调 (#0f8) + 红/橙语义标记 |
| **质感** | 半透明面板、微光泽边框、低对比度分隔线 |
| **动效** | 150ms-300ms 过渡，opacity/transform 驱动 |

---

## 13. 响应式设计

### 13.1 断点策略

| 断点 | 布局行为 |
|---|---|
| **< 768px** (移动) | 面板全宽堆叠，初始渲染 4 个面板，底部弹出面板 |
| **768px - 1200px** (平板) | 2 列网格，侧边栏折叠 |
| **1200px - 2000px** (桌面) | 3-4 列网格，初始渲染 8 个面板 |
| **> 2000px** (超宽) | L 型布局，地图左 + 面板右，多列 |

### 13.2 移动端适配

```css
/* 移动端面板约束 */
#container-dashboard {
  max-width: 100vw;
  margin: 0;
}

/* 图表 iframe 缩放 */
#graphBox > iframe {
  height: 50vh;
  width: 80vw;
}

/* 侧边栏安全宽度 */
#div-offcanvas-body {
  max-width: 90vw;
  padding: 1em;
  border-radius: 2em;
}
```

### 13.3 触控优化

- 所有交互按钮最小 **48×48px** 触控目标（WCAG 2.5.8 AA 合规）
- 关闭按钮在触屏设备上始终可见 (`@media (hover: none)`)
- `clamp()` 函数弹性尺寸 (`clamp(2em, 2.25em, 10vh)`)

---

## 14. 性能优化策略

### 14.1 首屏加载优化

| 策略 | 实现 |
|---|---|
| **CLS 防止** | 预设 Pro Banner → Header → Tabs 垂直空间，CSS 变量统一骨架屏与实网尺寸 |
| **延迟挂载** | 折叠线以下面板替换为轻量惰性壳，`IntersectionObserver` 触发真实挂载 |
| **预算常量** | 桌面端 8 个面板 / 移动端 4 个面板 初始渲染 |
| **content-visibility** | `.panel { content-visibility: auto; contain-intrinsic-size: 260px; }` |

### 14.2 渲染性能

| 策略 | 实现 |
|---|---|
| **图层过滤跳过** | 禁用图层跳过 `filterByTime()` |
| **懒加载聚类** | `getLeaves()` 从视口变更延迟到点击时刻 |
| **图标图集预计算** | 提升为模块级常量，避免每帧刷新 |
| **GeoJSON 预计算** | 冲突区域数据消除每层重建 |
| **拾取层精简** | 11 个冗余拾取层减至 1 个 (`pickingRadius: 10` 足够) |
| **代码分割** | Panel chunk 按领域拆分，懒加载导入 |

### 14.3 数据处理

| 策略 | 实现 |
|---|---|
| **浏览器优先计算** | 分析在客户端运行，Edge Functions 仅做 CORS 代理和缓存 |
| **Redis 缓存** | 24h TTL，减少 API 调用 |
| **Web Workers** | 数据分析在独立线程执行，不阻塞 UI |
| **Progressive Loading** | 分领域刷新调度 (news → markets → intelligence → ...) |

---

## 15. URL 参数解析

### 15.1 完整参数表

```
https://www.worldmonitor.app/dashboard
  ?lat=12.4730          → 地图中心纬度 (北纬 12.47°，布基纳法索附近)
  &lon=-1.6872          → 地图中心经度 (西经 1.69°)
  &zoom=1.38            → 缩放级别 (1.38 ≈ 全球视野)
  &view=global          → 布局预设 (Global)
  &timeRange=7d         → 时间范围 (7 天)
  &layers=conflicts,    → 启用的地图图层 (逗号分隔, 12 个)
          bases,
          hotspots,
          nuclear,
          sanctions,
          weather,
          economic,
          waterways,
          outages,
          military,
          natural,
          iranAttacks
```

### 15.2 URL 驱动状态

所有 UI 状态均编码在 URL 中，实现：

- **可分享**：复制 URL 即可分享完全相同视图
- **可书签**：浏览器书签直接保存当前分析状态
- **可回溯**：浏览器前进/后退恢复之前的视图
- **深度链接**：外部系统可通过 URL 参数直接定位到特定分析场景

---

## 16. 参考来源

| 来源 | 链接 |
|---|---|
| GitHub 主仓库 | [github.com/koala73/worldmonitor](https://github.com/koala73/worldmonitor) |
| Dark Web Informer 深度解析 | [25 Data Layers + AI Threat Classification](https://darkwebinformer.com/world-monitor-a-free-open-source-global-intelligence-dashboard-with-25-data-layers-and-ai-powered-threat-classification/) |
| Telegraph India 报道 | [Internet 'war rooms' emerge](https://www.telegraphindia.com/world/missiles-on-news-channels-thats-so-last-century-internet-war-rooms-emerge-new-way-to-watch/cid/2150804) |
| Header z-index 修复 (PR #4644) | [fix: render header dropdown panels above the content grid](https://github.com/koala73/worldmonitor/pull/4644) |
| CLS 修复 / Grid 布局 (PR #4346) | [perf: Fix dashboard first-load CLS](https://github.com/koala73/worldmonitor/pull/4346) |
| 无障碍控件 (PR #4412) | [fix(a11y): finish phase 23 controls and labels](https://github.com/koala73/worldmonitor/pull/4412) |
| 地图性能优化 (PR #620) | [perf(map): optimize DeckGLMap pan/zoom](https://github.com/koala73/worldmonitor/pull/620) |
| 图层状态隔离修复 (PR #1248) | [fix(map): stop deckgl layer toggles from getting stuck](https://github.com/koala73/worldmonitor/pull/1248) |
| 面板关闭按钮 (Commit fa36b5d) | [feat(ui): add close buttons on panels and Add Panel block](https://github.com/koala73/worldmonitor/commit/fa36b5d) |
| Widget Picker (Commit c99314a) | [feat: widget picker, layout tabs & panel close buttons](https://github.com/koala73/worldmonitor/commit/c99314a) |
| Panel chunk 分割 (PR #4382) | [perf: split panel chunks by domain](https://github.com/koala73/worldmonitor/pull/4382) |
| PhilStar 报道 | ['God's view': The rise of AI war dashboards](https://www.philstar.com/lifestyle/gadgets/2026/03/16/2514729/gods-view-rise-ai-war-dashboards/amp/) |
| 微信技术解析 | [实时感知全球态势：我研究了 World Monitor 一整周](https://mp.weixin.qq.com/s?__biz=MzkxMzY3MTgxNA==&mid=2247483874&idx=1&sn=4e0318134063e67136cc0ba409ec45ff) |

---

> **分析结论**：World Monitor 是一个技术架构极为精良的全局情报仪表盘。其核心亮点包括：(1) 纯 Vanilla TypeScript + 自定义 Panel 类的组件架构，避免了框架开销；(2) deck.gl + MapLibre GL 双引擎地图渲染，支持 45+ 图层的高性能叠加；(3) 完善的 Z-Index 层级体系确保复杂交互的层叠正确性；(4) URL 驱动状态管理实现视图的可分享性；(5) 全面的性能优化策略（content-visibility、延迟挂载、懒加载聚类、代码分割）；(6) WCAG 2.5.8 级别的无障碍触控目标。整体呈现军事指挥中心风格的高信息密度暗色仪表盘。
