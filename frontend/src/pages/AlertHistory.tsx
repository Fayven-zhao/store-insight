import { useState, useEffect, useMemo } from 'react'
import { Table, Drawer, Descriptions, Divider, Space, Typography, Input, Select, Button, Row, Col, ConfigProvider } from 'antd'
import { AlertOutlined, SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons'
import { getAllAlerts, subscribe, markRead, markAllRead, type AlertItem } from '../services/alertStore'
import { navigateTo } from '../services/navigation'
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL, SEVERITY_COLOR, METRIC_LABEL } from '../types/insight'
import dayjs from 'dayjs'

const { Text, Paragraph, Title } = Typography
const metricOptions = Object.entries(METRIC_LABEL).map(([v, l]) => ({ label: l, value: v }))

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
    fontFamily: 'inherit',
    fontSize: 12,
    borderRadius: 4,
    colorFillAlter: '#111',
  },
}

function sevStyle(s: string) {
  const c = SEVERITY_COLOR[s as keyof typeof SEVERITY_COLOR] || '#8c8c8c'
  return { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 3, background: `${c}22`, color: c, fontFamily: 'monospace' }
}

function chipStyle() { return { fontSize: 10, color: '#ccc', background: 'rgba(255,255,255,.06)', padding: '2px 8px', borderRadius: 3, fontFamily: 'monospace' } }

export default function AlertHistory() {
  const [data, setData] = useState<AlertItem[]>([])
  const [filters, setFilters] = useState({ keyword: '', severity: '', insight_type: '', metric: '', session_id: '', read: '' })
  const [advOpen, setAdvOpen] = useState(false)
  const [detail, setDetail] = useState<AlertItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setData(getAllAlerts())
    return subscribe(() => setData([...getAllAlerts()]))
  }, [])

  const filtered = useMemo(() => {
    let result = data
    if (filters.insight_type) result = result.filter(a => a.insight_type === filters.insight_type)
    if (filters.severity) result = result.filter(a => a.severity === filters.severity)
    if (filters.metric) result = result.filter(a => a.metric === filters.metric)
    if (filters.session_id) result = result.filter(a => a.session_id?.includes(filters.session_id))
    if (filters.read === 'unread') result = result.filter(a => !a.read)
    if (filters.read === 'read') result = result.filter(a => a.read)
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(a =>
        a.title?.toLowerCase().includes(kw) ||
        (a.district && a.district.toLowerCase().includes(kw)) ||
        (a.domain && a.domain.toLowerCase().includes(kw))
      )
    }
    return result
  }, [data, filters])

  return (
    <ConfigProvider theme={darkTokens}>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: '"SF Mono","Monaco","Cascadia Code","Fira Code",monospace', fontSize: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#111', borderBottom: '1px solid #2a2a2a', height: 40, flexShrink: 0 }}>
          <AlertOutlined style={{ fontSize: 18, color: '#ff4444', marginRight: 10 }} />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#fff', textTransform: 'uppercase' }}>实时预警历史记录</span>
          <span style={{ marginLeft: 16, color: '#888', fontSize: 11 }}>
            累计 {data.length} 条
            <span style={{ color: '#ff4444', marginLeft: 8 }}>{data.filter(a => !a.read).length} 未读</span>
            {' · '}实时更新
          </span>
          <span onClick={() => navigateTo('dashboard')} style={{ marginLeft: 'auto', fontSize: 11, color: '#44ff88', cursor: 'pointer' }}>← 返回驾驶舱</span>
        </div>

        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' }}>
          <Row gutter={[8, 8]} style={{ width: '100%' }}>
            <Col><Select placeholder="洞察类型" allowClear style={{ width: 160 }} value={filters.insight_type || undefined} onChange={v => setFilters(f => ({ ...f, insight_type: v || '' }))} options={Object.entries(INSIGHT_TYPE_LABEL).map(([v, l]) => ({ label: l, value: v }))} /></Col>
            <Col><Select placeholder="严重程度" allowClear style={{ width: 130 }} value={filters.severity || undefined} onChange={v => setFilters(f => ({ ...f, severity: v || '' }))} options={Object.entries(SEVERITY_LABEL).map(([v, l]) => ({ label: l, value: v }))} /></Col>
            <Col><Select placeholder="已读状态" allowClear style={{ width: 110 }} value={filters.read || undefined} onChange={v => setFilters(f => ({ ...f, read: v || '' }))} options={[{ label: '未读', value: 'unread' }, { label: '已读', value: 'read' }]} /></Col>
            <Col><Input prefix={<SearchOutlined />} placeholder="搜索标题/区域..." allowClear style={{ width: 200 }} value={filters.keyword} onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))} /></Col>
            <Col>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ keyword: '', severity: '', insight_type: '', metric: '', session_id: '', read: '' }); setAdvOpen(false) }}>重置</Button>
                <Button onClick={() => { markAllRead(); setData([...getAllAlerts()]) }} style={{ color: '#44ff88' }}>标记全部已读</Button>
                <Button icon={<FilterOutlined />} onClick={() => setAdvOpen(!advOpen)} type={advOpen ? 'primary' : 'default'} ghost={advOpen}>高级</Button>
              </Space>
            </Col>
          </Row>
          {advOpen && (
            <Row gutter={[12, 8]} style={{ marginTop: 10 }}>
              <Col span={6}><Select placeholder="指标类型" allowClear showSearch style={{ width: '100%' }} value={filters.metric || undefined} onChange={v => setFilters(f => ({ ...f, metric: v || '' }))} options={metricOptions} filterOption={(input, option) => (option?.label ?? '').includes(input)} /></Col>
              <Col span={6}><Input placeholder="会话批次" allowClear style={{ width: '100%' }} value={filters.session_id} onChange={e => setFilters(f => ({ ...f, session_id: e.target.value }))} /></Col>
            </Row>
          )}
        </div>

        <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
          <Table dataSource={filtered} rowKey="id" size="small" scroll={{ x: 1500 }}
            onRow={r => ({ onClick: () => { markRead(r.id); setDetail(r); setDrawerOpen(true); setData([...getAllAlerts()]) }, style: { cursor: 'pointer', opacity: r.read ? 0.6 : 1 } })}
            pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t: number) => `共 ${t} 条预警` }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 70, sorter: (a: AlertItem, b: AlertItem) => a.id - b.id },
              { title: '标题', dataIndex: 'title', width: 240, ellipsis: true, render: (text: string, r: AlertItem) => (<a onClick={e => { e.stopPropagation(); setDetail(r); setDrawerOpen(true) }} style={{ fontWeight: 500, color: '#e8e8e8' }}>{text}</a>) },
              { title: '洞察类型', dataIndex: 'insight_type', width: 150, render: (t: string) => <span style={chipStyle()}>{INSIGHT_TYPE_LABEL[t as keyof typeof INSIGHT_TYPE_LABEL] || t}</span> },
              { title: '业务域', dataIndex: 'domain', width: 90, render: (d: string) => <span style={{ color: '#ccc' }}>{d}</span> },
              { title: '结论类型', dataIndex: 'conclusion_type', width: 100, render: (t: string) => t ? <span style={chipStyle()}>{t}</span> : <span style={{ color: '#555' }}>—</span> },
              { title: '严重程度', dataIndex: 'severity', width: 100, sorter: (a: AlertItem, b: AlertItem) => { const o: Record<string, number> = { critical: 0, warning: 1, normal: 2 }; return (o[a.severity] ?? 3) - (o[b.severity] ?? 3) }, render: (s: string) => <span style={sevStyle(s)}>{SEVERITY_LABEL[s as keyof typeof SEVERITY_LABEL] || s}</span> },
              { title: '指标值', dataIndex: 'metric_value', width: 100, render: (v: string | null) => v !== null ? <span style={{ fontFamily: 'monospace', color: '#ccc' }}>{Number(v).toLocaleString()}</span> : <span style={{ color: '#555' }}>—</span> },
              { title: '偏离度', dataIndex: 'deviation', width: 100, render: (v: string | null) => v !== null ? (<span style={{ fontFamily: 'monospace', color: Number(v) > 50 ? '#ff4444' : '#ffaa00', fontWeight: 600 }}>{Number(v).toFixed(2)}%</span>) : <span style={{ color: '#555' }}>—</span> },
              { title: '批次', dataIndex: 'session_id', width: 200, ellipsis: true, render: (s: string) => s ? <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#666' }}>{s}</span> : <span style={{ color: '#555' }}>—</span> },
              { title: '创建时间', dataIndex: 'created_at', width: 170, sorter: (a: AlertItem, b: AlertItem) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), defaultSortOrder: 'descend' as const, render: (t: string) => <span style={{ color: '#888' }}>{dayjs(t).format('YYYY-MM-DD HH:mm:ss')}</span> },
              { title: '状态', dataIndex: 'read', width: 60, render: (_: any, r: AlertItem) => <span style={{ color: r.read ? '#888' : '#ff4444', fontSize: 10 }}>{r.read ? '已读' : '未读'}</span> },
            ]} />
        </div>

        <Drawer title={<Space><span>洞察详情</span><span style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>#{detail?.id}</span></Space>}
          open={drawerOpen} onClose={() => { setDrawerOpen(false); setDetail(null) }} width={680}
          styles={{ header: { background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }, body: { background: '#0d0d0d', color: '#e8e8e8' } }}>
          {detail ? (<>
            <Title level={4} style={{ marginTop: 0, color: '#e8e8e8' }}>{detail.title}</Title>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }} styles={{ label: { background: '#141414', color: '#888' }, content: { background: '#111', color: '#e8e8e8' } }}>
              <Descriptions.Item label="洞察类型"><span style={chipStyle()}>{INSIGHT_TYPE_LABEL[detail.insight_type as keyof typeof INSIGHT_TYPE_LABEL] || detail.insight_type}</span></Descriptions.Item>
              <Descriptions.Item label="业务域"><span style={{ color: '#ccc' }}>{detail.domain || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="严重程度"><span style={sevStyle(detail.severity)}>{SEVERITY_LABEL[detail.severity as keyof typeof SEVERITY_LABEL] || detail.severity}</span></Descriptions.Item>
              <Descriptions.Item label="结论类型"><span style={{ color: '#ccc' }}>{detail.conclusion_type || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="指标编码"><Text code style={{ color: '#ccc' }}>{detail.metric || '—'}</Text></Descriptions.Item>
              <Descriptions.Item label="指标中文名"><span style={{ color: '#ccc' }}>{METRIC_LABEL[detail.metric || ''] || detail.metric || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="指标值">{detail.metric_value !== null ? <Text strong style={{ color: '#e8e8e8' }}>{Number(detail.metric_value).toLocaleString()}</Text> : <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="正常范围">{detail.normal_range ?? <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="偏离度">{detail.deviation !== null ? <Text strong style={{ color: Number(detail.deviation) > 50 ? '#ff4444' : '#ffaa00' }}>{Number(detail.deviation).toFixed(2)}%</Text> : <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="数据来源">{detail.source ?? <Text type="secondary">—</Text>}</Descriptions.Item>
            </Descriptions>
            {detail.notes && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>结论备注</Divider><Paragraph style={{ color: '#ccc' }}>{detail.notes}</Paragraph></>}
            {detail.analysis && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>分析过程</Divider><Paragraph style={{ color: '#ccc', whiteSpace: 'pre-wrap' }}>{detail.analysis}</Paragraph></>}
            {detail.insight_data && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>结构化明细</Divider><pre style={{ background: '#111', color: '#ccc', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>{typeof detail.insight_data === 'string' ? detail.insight_data : JSON.stringify(detail.insight_data, null, 2)}</pre></>}
            {detail.action && <><Divider plain style={{ color: '#888', borderColor: '#2a2a2a' }}>建议</Divider><Paragraph style={{ background: 'rgba(250,140,22,.1)', color: '#ffaa00', padding: 12, borderRadius: 6, borderLeft: '4px solid #fa8c16' }}>{detail.action}</Paragraph></>}
            <Divider style={{ borderColor: '#2a2a2a' }} />
            <Descriptions column={2} size="small" styles={{ label: { background: '#141414', color: '#888' }, content: { background: '#111', color: '#ccc' } }}>
              <Descriptions.Item label="会话批次"><Text code style={{ color: '#ccc', fontSize: 11 }}>{detail.session_id || '—'}</Text></Descriptions.Item>
              <Descriptions.Item label="Agent ID">{detail.agent_id ?? <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="父洞察 ID">{detail.parent_id ?? <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="创建时间"><span style={{ color: '#ccc' }}>{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</span></Descriptions.Item>
              <Descriptions.Item label="更新时间">{detail.updated_at ? <span style={{ color: '#ccc' }}>{dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm:ss')}</span> : <Text type="secondary">—</Text>}</Descriptions.Item>
              <Descriptions.Item label="数据源时点">{detail.data_source_timestamp ? <span style={{ color: '#ccc' }}>{dayjs(detail.data_source_timestamp).format('YYYY-MM-DD HH:mm:ss')}</span> : <Text type="secondary">—</Text>}</Descriptions.Item>
            </Descriptions>
          </>) : <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>无数据</div>}
        </Drawer>
      </div>
    </ConfigProvider>
  )
}
