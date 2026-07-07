/**
 * insights 表（线上 omnidemo.insights）前端类型定义
 *
 * 以 store-insight skill 落库结构为准；server/ 旧版字段（metric_name/summary/content/confidence）已作废。
 * 注意：MySQL DECIMAL 经 JSON 序列化后为 string，需自行 Number() 转换。
 */

export type InsightType = 'ops' | 'contract' | 'policy'
export type Severity = 'normal' | 'warning' | 'critical'
export type InsightSource = 'scheduled' | 'manual' | 'api'

/** insight_data 结构随 metric 变化，仅给出常见键，其余按需取 */
export interface InsightData {
  total?: number
  rented?: number
  district?: string
  occupancyRate?: number
  [key: string]: unknown
}

export interface InsightRow {
  /** 主键，自增 */
  id: number
  /** 巡检/会话批次号，如 policy_inspection_20260616 */
  session_id: string
  /** 产出 Agent，线上常为 null */
  agent_id: string | null
  /** 洞察类型 */
  insight_type: InsightType
  /** 业务域，可能与 insight_type 不一致 */
  domain: string
  /** 指标编码，如 OCCUPANCY_RATE_BY_DISTRICT */
  metric: string
  /** 洞察标题 */
  title: string
  /** 结论备注/摘要，可空 */
  notes: string | null
  /** 分析过程，线上常为 null */
  analysis: string | null
  /** 结论类型（中文），如 严重偏低 */
  conclusion_type: string
  /** 严重程度 */
  severity: Severity
  /** 指标值，DECIMAL → string，需 Number() 转换；可空 */
  metric_value: string | null
  /** 正常范围文本，如 ≥80%；可空 */
  normal_range: string | null
  /** 偏离度，DECIMAL → string，需 Number() 转换；可空 */
  deviation: string | null
  /** 结构化明细，结构随 metric 变化；可空 */
  insight_data: InsightData | null
  /** 父洞察 id，非空表示追问链子节点 */
  parent_id: number | null
  /** 去重签名（短码），内部用，不展示 */
  signature: string
  /** 创建时间 ISO 字符串 */
  created_at: string
  /** 更新时间 ISO 字符串 */
  updated_at: string
  /** 可执行建议，线上常为 null */
  action: string | null
  /** 数据源时点，线上常为 null */
  data_source_timestamp: string | null
  /** 洞察来源，线上常为 null */
  source: InsightSource | null
}

/** insight_type 展示文案 */
export const INSIGHT_TYPE_LABEL: Record<InsightType, string> = {
  ops: '租售房源经营洞察',
  contract: '合同回款风险预警',
  policy: '政策与区域分布',
}

/** severity 展示文案 */
export const SEVERITY_LABEL: Record<Severity, string> = {
  normal: '正常',
  warning: '预警',
  critical: '严重',
}

/** severity 建议配色 */
export const SEVERITY_COLOR: Record<Severity, string> = {
  normal: '#8c8c8c',
  warning: '#fa8c16',
  critical: '#f5222d',
}

/** metric 编码 → 中文名映射 */
export const METRIC_LABEL: Record<string, string> = {
  OCCUPANCY_RATE_BY_DISTRICT: '各区域入住率',
  RENT_COLLECTION_RATE: '租金收缴率',
  CONTRACT_EXPIRY_RISK: '合同到期风险',
  ARREARS_AMOUNT: '欠款金额',
  NEW_LISTING_TREND: '新增房源趋势',
  VACANCY_RATE: '空置率',
  RENT_PRICE_DEVIATION: '租金价格偏离度',
  TENANT_CHURN_RATE: '租户流失率',
}
