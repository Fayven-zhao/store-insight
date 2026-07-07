import type { InsightRow, InsightType, Severity, InsightSource } from '../types/insight'

/** 模拟区域列表 */
const DISTRICTS = ['海珠区', '天河区', '越秀区', '番禺区', '白云区', '黄埔区', '南沙区', '荔湾区']

/** 模拟指标配置 */
const METRICS = [
  { code: 'OCCUPANCY_RATE_BY_DISTRICT', conclusionTypes: ['严重偏低', '偏低', '正常', '偏高'] },
  { code: 'RENT_COLLECTION_RATE', conclusionTypes: ['严重偏低', '偏低', '正常'] },
  { code: 'CONTRACT_EXPIRY_RISK', conclusionTypes: ['高风险', '中风险', '低风险'] },
  { code: 'ARREARS_AMOUNT', conclusionTypes: ['严重超标', '偏高', '正常'] },
  { code: 'VACANCY_RATE', conclusionTypes: ['严重偏高', '偏高', '正常'] },
]

/** 模拟洞察标题模板 */
const TITLE_TEMPLATES: Record<string, (district: string) => string> = {
  OCCUPANCY_RATE_BY_DISTRICT: (d) => `${d}入住率严重偏低`,
  RENT_COLLECTION_RATE: (d) => `${d}租金收缴率下滑`,
  CONTRACT_EXPIRY_RISK: (d) => `${d}多份合同临近到期`,
  ARREARS_AMOUNT: (d) => `${d}应收账款超警戒线`,
  VACANCY_RATE: (d) => `${d}空置率持续上升`,
}

/** 随机整数 */
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

/** 随机数组元素 */
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]

/** 生成单条模拟洞察数据 */
function generateInsight(id: number): InsightRow {
  const metricCfg = pick(METRICS)
  const district = pick(DISTRICTS)
  const insightType: InsightType = pick(['ops', 'contract', 'policy'])
  const severity: Severity = pick(['warning', 'critical', 'warning', 'critical', 'normal']) // 偏向 warning/critical
  const conclusionType = pick(metricCfg.conclusionTypes)

  const total = rand(1000, 15000)
  const rented = rand(50, total)
  const occupancyRate = Math.round((rented / total) * 1000) / 10

  const hasParent = Math.random() < 0.15
  const parentId = hasParent ? rand(1, id - 1) : null

  // 生成时间
  const baseDate = new Date('2026-06-10')
  baseDate.setHours(baseDate.getHours() + rand(0, 500))
  const createdAt = baseDate.toISOString().replace('T', ' ').slice(0, 19)
  const updatedAt = createdAt

  return {
    id,
    session_id: `${insightType}_inspection_${createdAt.slice(0, 10).replace(/-/g, '')}`,
    agent_id: Math.random() < 0.3 ? `agent_${rand(1, 5)}` : null,
    insight_type: insightType,
    domain: Math.random() < 0.8 ? insightType : pick(['ops', 'contract', 'policy']),
    metric: metricCfg.code,
    title: (TITLE_TEMPLATES[metricCfg.code] || (() => `${district}指标异常`))(district),
    notes: `${district}${metricCfg.code === 'OCCUPANCY_RATE_BY_DISTRICT' ? `入住率仅${occupancyRate}%，${rented}/${total}套，远低于正常阈值` : `当前指标偏离正常范围，需关注`}`,
    analysis: Math.random() < 0.3 ? `经分析，${district}近期${conclusionType}，主要原因为...` : null,
    conclusion_type: conclusionType,
    severity,
    metric_value: String(Math.round(rand(10, 9500) / 100 * 100) / 100),
    normal_range: '≥80%',
    deviation: String(Math.round(rand(100, 9800) / 100 * 100) / 100),
    insight_data: {
      total,
      rented,
      district,
      occupancyRate,
    },
    parent_id: parentId,
    signature: Math.random().toString(36).slice(2, 8),
    created_at: createdAt,
    updated_at: updatedAt,
    action: Math.random() < 0.3 ? `建议立即联系${district}负责人，排查${conclusionType}原因并制定整改方案` : null,
    data_source_timestamp: Math.random() < 0.3 ? createdAt : null,
    source: pick(['scheduled', 'manual', 'api', null as unknown as InsightSource]) as InsightSource | null,
  }
}

/** 生成模拟数据列表 */
export function generateMockData(count: number = 50): InsightRow[] {
  return Array.from({ length: count }, (_, i) => generateInsight(i + 1))
}

/** 预生成的模拟数据 */
export const mockInsights: InsightRow[] = generateMockData(50)
