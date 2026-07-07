import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Drawer, Descriptions, Divider, Space, Typography, ConfigProvider } from 'antd'
import type { InsightRow } from '../types/insight'
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL, SEVERITY_COLOR, METRIC_LABEL } from '../types/insight'
import { fetchInsights, fetchInsightDetail, type InsightQuery } from '../services/api'
import FilterBar, { type FilterValues } from '../components/FilterBar'
import './dashboard/dashboard.css'
import dayjs from 'dayjs'

const { Text, Paragraph, Title } = Typography

const darkTokens = {
  token: {
    colorBgContainer: '#0d0d0d',
    colorBgElevated: '#141414',
    colorBorder: '#2a2a2a',
    colorText: '#e8e8e8',
    colorTextSecondary: '#ccc',
    colorTextTertiary: '#888',
    colorTextPlaceholder: '#555',
    colorPrimary: '#1890ff',
    colorBgLayout: '#0a0a0a',
    fontFamily: '"SF Mono","Monaco","Cascadia Code","Fira Code",monospace',
    fontSize: 12,
    borderRadius: 4,
    colorFillAlter: '#111',
  },
}

export default function DataManagement() {
  const [data, setData] = useState<InsightRow[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<FilterValues>({})

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<InsightRow | null>(null)

  const loadData = useCallback(
    async (queryFilters: FilterValues, p: number, ps: number) => {
      setLoading(true)
      try {
        const query: InsightQuery = { ...queryFilters, page: p, pageSize: ps }
        const result = await fetchInsights(query)
        setData(result.list)
        setTotal(result.total)
        setPage(result.page)
        setPageSize(result.pageSize)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => { loadData(filters, page, pageSize) }, [])

  const handleFilter = (values: FilterValues) => { setFilters(values); setPage(1); loadData(values, 1, pageSize) }
  const handleReset = () => { setFilters({}); setPage(1); loadData({}, 1, pageSize) }
  const handlePageChange = (p: number, ps: number) => { setPage(p); setPageSize(ps); loadData(filters, p, ps) }

  const handleRowClick = async (record: InsightRow) => {
    setDrawerOpen(true); setSelectedInsight(null)
    try {
      const detail = await fetchInsightDetail(record.id)
      setSelectedInsight(detail)
    } catch { /* silent */ }
  }

  return (
    <ConfigProvider theme={darkTokens}>
      <div style={{ height: '100%', background: '#0a0a0a', color: '#e8e8e8', fontFamily: '"SF Mono","Monaco","Cascadia Code","Fira Code",monospace', fontSize: 12, display: 'flex', flexDirection: 'column' }}>
        {/* Content */}
        <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          <FilterBar onFilter={handleFilter} onReset={handleReset} loading={loading} />
          <Table
            dataSource={data} rowKey="id" size="small" loading={loading}
            scroll={{ x: 1600 }}
            onRow={r => ({ onClick: () => handleRowClick(r), style: { cursor: 'pointer' } })}
            pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t: number) => `共 ${t}`, onChange: handlePageChange }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 70, sorter: (a: InsightRow, b: InsightRow) => a.id - b.id },
              {
                title: '标题', dataIndex: 'title', width: 260, ellipsis: true,
                render: (text: string, r: InsightRow) => <a onClick={e => { e.stopPropagation(); handleRowClick(r) }} style={{ fontWeight: 500, color: '#e8e8e8' }}>{text}</a>,
              },
              { title: '洞察类型', dataIndex: 'insight_type', width: 150, render: (t: string) => <span style={{ fontSize: 10, color: '#ccc' }}>{INSIGHT_TYPE_LABEL[t as keyof typeof INSIGHT_TYPE_LABEL] || t}</span> },
              { title: '业务域', dataIndex: 'domain', width: 90, render: (d: string) => <span style={{ color: '#ccc' }}>{d}</span> },
              { title: '结论类型', dataIndex: 'conclusion_type', width: 100, render: (t: string) => <span style={{ fontSize: 10, color: t ? '#ccc' : '#555' }}>{t || '—'}</span> },
              {
                title: '风险等级', dataIndex: 'severity', width: 100,
                sorter: (a: InsightRow, b: InsightRow) => { const o: Record<string, number> = { critical: 0, warning: 1, normal: 2 }; return (o[a.severity] ?? 3) - (o[b.severity] ?? 3) },
                render: (s: string) => { const c = SEVERITY_COLOR[s as keyof typeof SEVERITY_COLOR] || '#8c8c8c'; return <span style={{ fontSize: 10, color: c, fontFamily: 'monospace' }}>{SEVERITY_LABEL[s as keyof typeof SEVERITY_LABEL] || s}</span> },
              },
              { title: '指标值', dataIndex: 'metric_value', width: 100, render: (v: string | null) => v !== null ? <span style={{ fontFamily: 'monospace', color: '#ccc' }}>{Number(v).toLocaleString()}</span> : <span style={{ color: '#555' }}>—</span> },
              {
                title: '偏离度', dataIndex: 'deviation', width: 100,
                render: (v: string | null) => v !== null ? <span style={{ fontFamily: 'monospace', color: Number(v) > 50 ? '#ff4444' : '#ffaa00', fontWeight: 600 }}>{Number(v).toFixed(2)}%</span> : <span style={{ color: '#555' }}>—</span>,
              },
              { title: '会话批次', dataIndex: 'session_id', width: 200, ellipsis: true, render: (s: string) => <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#666' }}>{s}</span> },
              { title: '创建时间', dataIndex: 'created_at', width: 170, sorter: (a: InsightRow, b: InsightRow) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), defaultSortOrder: 'descend' as const, render: (t: string) => <span style={{ color: '#888' }}>{dayjs(t).format('YYYY-MM-DD HH:mm:ss')}</span> },
            ]}
          />
        </div>

        {/* Detail Drawer */}
        <Drawer
          title={<Space><span>洞察详情</span><Tag color="blue">#{selectedInsight?.id}</Tag></Space>}
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedInsight(null) }}
          width={680}
          styles={{ header: { background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }, body: { background: '#0d0d0d', color: '#e8e8e8' } }}
        >
          {selectedInsight ? (<>
            {(() => { const i = selectedInsight; return (<>
              <Title level={4} style={{ marginTop: 0, color: '#e8e8e8' }}>{i.title}</Title>
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }} styles={{ label: { background: '#141414', color: '#888' }, content: { background: '#111', color: '#e8e8e8' } }}>
                <Descriptions.Item label="洞察类型"><span style={{ color: '#ccc' }}>{INSIGHT_TYPE_LABEL[i.insight_type] || i.insight_type}</span></Descriptions.Item>
                <Descriptions.Item label="业务域"><span style={{ color: '#ccc' }}>{i.domain || '—'}</span></Descriptions.Item>
                <Descriptions.Item label="风险等级"><span style={{ color: SEVERITY_COLOR[i.severity as keyof typeof SEVERITY_COLOR] || '#8c8c8c' }}>{SEVERITY_LABEL[i.severity as keyof typeof SEVERITY_LABEL] || i.severity}</span></Descriptions.Item>
                <Descriptions.Item label="结论类型"><span style={{ color: '#ccc' }}>{i.conclusion_type || '—'}</span></Descriptions.Item>
                <Descriptions.Item label="指标编码"><Text code style={{ color: '#ccc' }}>{i.metric || '—'}</Text></Descriptions.Item>
                <Descriptions.Item label="指标名称"><span style={{ color: '#ccc' }}>{METRIC_LABEL[i.metric] || i.metric || '—'}</span></Descriptions.Item>
                <Descriptions.Item label="AI 建议" span={2}>{i.action ? <span style={{ color: '#ffaa00' }}>{i.action}</span> : <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="指标值">{i.metric_value !== null ? <Text strong style={{ color: '#ccc' }}>{Number(i.metric_value).toLocaleString()}</Text> : <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="正常范围">{i.normal_range ?? <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="偏离度">{i.deviation !== null ? <Text strong style={{ color: Number(i.deviation) > 50 ? '#ff4444' : '#ffaa00' }}>{Number(i.deviation).toFixed(2)}%</Text> : <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="数据来源">{i.source ?? <Text type="secondary">—</Text>}</Descriptions.Item>
              </Descriptions>
              {i.notes && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>备注</Divider><Paragraph style={{ color: '#ccc' }}>{i.notes}</Paragraph></>}
              {i.analysis && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>分析过程</Divider><Paragraph style={{ color: '#ccc', whiteSpace: 'pre-wrap' }}>{i.analysis}</Paragraph></>}
              {i.insight_data && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>结构化数据</Divider><pre style={{ background: '#111', color: '#ccc', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>{typeof i.insight_data === 'string' ? i.insight_data : JSON.stringify(i.insight_data, null, 2)}</pre></>}
              <Divider style={{ borderColor: '#2a2a2a' }} />
              <Descriptions column={2} size="small" styles={{ label: { background: '#141414', color: '#888' }, content: { background: '#111', color: '#ccc' } }}>
                <Descriptions.Item label="会话批次"><Text code style={{ color: '#ccc', fontSize: 11 }}>{i.session_id || '—'}</Text></Descriptions.Item>
                <Descriptions.Item label="Agent标识">{i.agent_id ?? <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="父洞察ID">{i.parent_id ?? <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="创建时间"><span style={{ color: '#ccc' }}>{dayjs(i.created_at).format('YYYY-MM-DD HH:mm:ss')}</span></Descriptions.Item>
                <Descriptions.Item label="更新时间">{i.updated_at ? <span style={{ color: '#ccc' }}>{dayjs(i.updated_at).format('YYYY-MM-DD HH:mm:ss')}</span> : <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="数据源时点">{i.data_source_timestamp ? <span style={{ color: '#ccc' }}>{dayjs(i.data_source_timestamp).format('YYYY-MM-DD HH:mm:ss')}</span> : <Text type="secondary">—</Text>}</Descriptions.Item>
              </Descriptions>
            </>)})()}
          </>) : <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>无数据</div>}
        </Drawer>
      </div>
    </ConfigProvider>
  )
}
