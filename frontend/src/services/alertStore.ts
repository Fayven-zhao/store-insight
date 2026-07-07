/** Global alert store — session-based read status */

const readIds = new Set<number>()

export interface AlertItem {
  id: number; title: string; insight_type: string; domain: string
  conclusion_type: string; severity: string; metric_value: string | null
  deviation: string | null; session_id: string; created_at: string
  notes?: string | null; analysis?: string | null; normal_range?: string | null
  metric?: string; action?: string | null; insight_data?: any
  agent_id?: string | null; parent_id?: number | null; source?: string | null
  data_source_timestamp?: string | null; updated_at?: string
  type?: string; tag?: string; district?: string | null; text?: string; received_at?: string
  read?: boolean
}

let allAlerts: AlertItem[] = []
const listeners: Array<() => void> = []

function refresh() { listeners.forEach(fn => fn()) }

export function addAlerts(newAlerts: AlertItem[]) {
  const existing = new Set(allAlerts.map(a => a.id))
  const fresh = newAlerts.filter(a => !existing.has(a.id))
  if (fresh.length > 0) {
    fresh.forEach(a => { a.read = readIds.has(a.id) })
    allAlerts = [...fresh, ...allAlerts].slice(0, 500)
    refresh()
  }
}

export function markRead(id: number) {
  readIds.add(id)
  const alert = allAlerts.find(a => a.id === id)
  if (alert) alert.read = true
  refresh()
}

export function markAllRead() {
  allAlerts.forEach(a => { a.read = true; readIds.add(a.id) })
  refresh()
}

export function getUnreadCount(): number {
  return allAlerts.filter(a => !a.read).length
}

export function getAllAlerts(): AlertItem[] {
  return allAlerts
}

export function getAlertCount(): number {
  return allAlerts.length
}

export function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => { const idx = listeners.indexOf(fn); if (idx >= 0) listeners.splice(idx, 1) }
}
