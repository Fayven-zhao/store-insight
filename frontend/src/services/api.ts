import type { InsightRow, InsightType, Severity } from '../types/insight'

const BASE = '/api'

/** 列表查询参数 */
export interface InsightQuery {
  insight_type?: InsightType
  severity?: Severity
  keyword?: string
  metric?: string
  session_id?: string
  domain?: string
  conclusion_type?: string
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}

/** 分页结果 */
export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 查询洞察列表
 */
export async function fetchInsights(query: InsightQuery): Promise<PaginatedResult<InsightRow>> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })
  const res = await fetch(`${BASE}/insights?${params}`)
  if (!res.ok) throw new Error('查询失败')
  return res.json()
}

/**
 * 获取洞察详情
 */
export async function fetchInsightDetail(id: number): Promise<InsightRow | null> {
  const res = await fetch(`${BASE}/insights/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('查询失败')
  return res.json()
}

/**
 * 获取会话批次列表
 */
export async function fetchSessions(): Promise<string[]> {
  const res = await fetch(`${BASE}/sessions`)
  if (!res.ok) throw new Error('查询失败')
  return res.json()
}

// ==================== 数据管理 CRUD ====================

export interface InsightFormData {
  title: string
  insight_type: string
  severity: string
  metric: string
  domain: string
  conclusion_type: string
  session_id: string
  notes?: string
  analysis?: string
  metric_value?: string
  normal_range?: string
  deviation?: string
  action?: string
  source?: string
  insight_data?: string
}

/**
 * 创建洞察
 */
export async function createInsight(data: InsightFormData): Promise<InsightRow> {
  const body: Record<string, unknown> = { ...data }
  // insight_data 从 JSON 字符串转为对象传给后端
  if (data.insight_data) {
    body.insight_data = JSON.parse(data.insight_data)
  }
  const res = await fetch(`${BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('创建失败')
  return res.json()
}

/**
 * 更新洞察
 */
export async function updateInsight(id: number, data: InsightFormData): Promise<InsightRow> {
  const body: Record<string, unknown> = { ...data }
  if (data.insight_data) {
    body.insight_data = JSON.parse(data.insight_data)
  }
  const res = await fetch(`${BASE}/insights/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('更新失败')
  return res.json()
}

/**
 * 删除洞察
 */
export async function deleteInsight(id: number): Promise<void> {
  const res = await fetch(`${BASE}/insights/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除失败')
}

/**
 * 批量删除
 */
export async function batchDeleteInsights(ids: number[]): Promise<void> {
  const res = await fetch(`${BASE}/insights/batch-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('批量删除失败')
}
