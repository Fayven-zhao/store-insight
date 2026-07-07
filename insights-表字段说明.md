# insights 表字段说明（页面对接文档）

> 数据来源以 **线上 `omnidemo.insights`** 实测结构为准（`store-insight` skill 落库的那一套）。
> server/ 旧版结构（`metric_name` / `summary` / `content` / `confidence`）已作废，不再对接。
>
> 实测信息：库表 `omnidemo.insights`，主键自增，21 字段，当前约 12306 行。
> 最后核对：2026-06-18。

---

## 一、字段总表

| # | 字段 | 类型 | 可空 | 含义 | 示例 | 前端对接注意 |
|---|---|---|:--:|---|---|---|
| 1 | `id` | INT 自增 | 否 | 洞察主键 | `12306` | 列表 key、详情/追问链路由参数 |
| 2 | `session_id` | VARCHAR(64) | 否 | 巡检/会话批次号 | `policy_inspection_20260616` | 可按批次分组；非随机串，含日期语义 |
| 3 | `agent_id` | VARCHAR(32) | 是 | 产出洞察的 Agent | `null` | 线上常空，需空值兜底 |
| 4 | `insight_type` | VARCHAR(16) | 否 | 洞察类型 | `ops` | 枚举 3 值，见第二节映射 |
| 5 | `domain` | VARCHAR(32) | 否 | 业务域 | `policy` | ⚠️ 可能与 insight_type 不一致，勿互相推断 |
| 6 | `metric` | VARCHAR(64) | 否 | 指标编码 | `OCCUPANCY_RATE_BY_DISTRICT` | 英文大写编码，展示需「编码→中文名」映射 |
| 7 | `title` | VARCHAR(256) | 否 | 洞察标题 | `海珠区入住率严重偏低` | 列表主文案，直接展示 |
| 8 | `notes` | TEXT | 是 | 结论备注 | `海珠区入住率仅3.5%…低于80%阈值` | 列表副文案/摘要 |
| 9 | `analysis` | TEXT | 是 | 分析过程 | `null` | 详情页展开，线上常空 |
| 10 | `conclusion_type` | VARCHAR(64) | 否 | 结论类型 | `严重偏低` | 中文，可做标签 |
| 11 | `severity` | ENUM | 否 | 严重程度 | `critical` | `normal`/`warning`/`critical`，驱动配色 |
| 12 | `metric_value` | DECIMAL(12,4) | 是 | 指标值 | `3.5000` | ⚠️ 字符串返回，前端需 Number() 转换 |
| 13 | `normal_range` | VARCHAR(64) | 是 | 正常范围 | `≥80%` | 含符号文本，直接展示 |
| 14 | `deviation` | DECIMAL(12,4) | 是 | 偏离度 | `95.6300` | ⚠️ 字符串返回，需转数字 |
| 15 | `insight_data` | JSON | 是 | 结构化明细 | `{total,rented,district,occupancyRate}` | ⚠️ 结构随 metric 变化，防御解析 |
| 16 | `parent_id` | INT | 是 | 父洞察 id | `null` | 非空=追问链子节点，用于树形/钻取 |
| 17 | `signature` | VARCHAR(256) | 否 | 去重签名 | `b09ooo` | 内部去重用，不建议前端展示 |
| 18 | `created_at` | DATETIME | 否 | 创建时间 | `2026-06-16T14:33:25Z` | 排序/筛选主时间字段 |
| 19 | `updated_at` | DATETIME | 否 | 更新时间 | `2026-06-16T14:33:25Z` | severity 升级时会变 |
| 20 | `action` | TEXT | 是 | 可执行建议 | `null` | 有则展示「建议」区块，线上常空 |
| 21 | `data_source_timestamp` | DATETIME | 是 | 数据源时点 | `null` | 被分析数据的时间口径，线上常空 |
| 22 | `source` | VARCHAR(16) | 是 | 洞察来源 | `null` | `scheduled`/`manual`/`api`，线上常空 |

> 字段顺序按线上 `information_schema` 实际列序：`insight_type` / `action` / `data_source_timestamp` / `source` 是后加列，排在表尾。

---

## 二、枚举值映射（展示用）

### insight_type — 洞察类型

| 值 | 含义 | 业务边界 |
|---|---|---|
| `ops` | 租售房源经营洞察 | 房源利用效率、租金、退租 |
| `contract` | 合同回款风险预警 | 应收账款、逾期、到期合同 |
| `policy` | 政策与区域分布 | 空间分布、区域差异、新增趋势 |

### severity — 严重程度（建议配色）

| 值 | 含义 | 配色 |
|---|---|---|
| `normal` | 正常 | 灰 / 绿 |
| `warning` | 预警 | 橙 |
| `critical` | 严重 | 红 |

> 说明：`normal` 在巡检场景会静默跳过、不落库，因此列表中以 `warning` / `critical` 为主。

### source — 洞察来源

| 值 | 含义 |
|---|---|
| `scheduled` | 定时巡检产出 |
| `manual` | 人工触发 |
| `api` | 接口写入 |

---

## 三、对接必看的坑（实测）

1. **DECIMAL 字段返回字符串**
   `metric_value` / `deviation` 形如 `"3.5000"`，前端须 `Number()` 转换再运算或比较。

2. **多个字段线上长期为 null**
   `agent_id` / `analysis` / `action` / `data_source_timestamp` / `source` 实测大量为空，必须做空值兜底，勿直接渲染。

3. **insight_data 结构不固定**
   JSON 内容随 `metric` 变化：分布型指标与数值型指标结构完全不同，需按 metric 分支解析并容错。

4. **domain ≠ insight_type**
   线上存在 `insight_type=ops` 但 `domain=policy` 的行，两者互相独立，不要互相推断。

5. **signature 为短码**
   线上实际为 `b09ooo` 这类短码，非 `类型:指标:结论` 拼接格式，仅作内部去重，不要展示或反解。

---

## 四、典型样本（id=12306）

```json
{
  "id": 12306,
  "session_id": "policy_inspection_20260616",
  "agent_id": null,
  "insight_type": "ops",
  "domain": "policy",
  "metric": "OCCUPANCY_RATE_BY_DISTRICT",
  "title": "海珠区入住率严重偏低",
  "notes": "海珠区入住率仅3.5%，291/8315套，远低于80%阈值",
  "analysis": null,
  "conclusion_type": "严重偏低",
  "severity": "critical",
  "metric_value": "3.5000",
  "normal_range": "≥80%",
  "deviation": "95.6300",
  "insight_data": { "total": 8315, "rented": 291, "district": "海珠区", "occupancyRate": 3.5 },
  "parent_id": null,
  "signature": "b09ooo",
  "created_at": "2026-06-16T14:33:25.000Z",
  "updated_at": "2026-06-16T14:33:25.000Z",
  "action": null,
  "data_source_timestamp": null,
  "source": null
}
```
