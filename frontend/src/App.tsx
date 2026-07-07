import { useState } from 'react'
import DataManagement from './pages/DataManagement'
import EnterpriseDashboard from './pages/dashboard/EnterpriseDashboard'

type Page = 'dashboard' | 'data';

(window as any).__switchPage = (p: Page) => {
  window.dispatchEvent(new CustomEvent('switchPage', { detail: p }))
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  window.addEventListener('switchPage', ((e: CustomEvent) => setPage(e.detail)) as any)

  const btnStyle = (active: boolean) => ({
    background: active ? 'rgba(255,255,255,.15)' : 'none',
    border: '1px solid #444',
    color: active ? '#fff' : '#666',
    padding: '4px 10px', cursor: 'pointer',
    fontSize: 10, fontFamily: 'monospace',
    transition: 'all .15s',
  })

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a0a' }}>
      {/* Shared Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', background: '#111', borderBottom: '1px solid #2a2a2a', height: 40, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#fff', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            安居集团
            <span style={{ fontSize: 8, color: '#888', letterSpacing: 1, marginLeft: 4, textTransform: 'none', fontWeight: 400 }}>
              AI 资产管理平台
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnStyle(page === 'dashboard')} onClick={() => setPage('dashboard')}>AI 智能驾驶舱</button>
          <button style={btnStyle(page === 'data')} onClick={() => setPage('data')}>AI 洞察数据</button>
        </div>
        <div style={{ width: 100 }} />
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {page === 'dashboard' ? <EnterpriseDashboard /> : <DataManagement />}
      </div>
    </div>
  )
}
