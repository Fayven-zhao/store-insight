import type React from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InsightRow } from '../types/insight'
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL, SEVERITY_COLOR, METRIC_LABEL } from '../types/insight'
import dayjs from 'dayjs'

interface Props {
  data: InsightRow[]
  loading?: boolean
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
  onRowClick: (record: InsightRow) => void
}

const InsightTable: React.FC<Props> = ({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onRowClick,
}) => {
  const columns: ColumnsType<InsightRow> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a: InsightRow, b: InsightRow) => a.id - b.id,
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      ellipsis: true,
      render: (text: string, record) => (
        <a onClick={() => onRowClick(record)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '洞察类型',
      dataIndex: 'insight_type',
      width: 150,
      render: (t: string) => (
        <Tag color="blue">{INSIGHT_TYPE_LABEL[t as keyof typeof INSIGHT_TYPE_LABEL] || t}</Tag>
      ),
    },
    {
      title: '业务域',
      dataIndex: 'domain',
      width: 100,
      render: (d: string) => <Tag>{d}</Tag>,
    },
    {
      title: '指标',
      dataIndex: 'metric',
      width: 160,
      render: (m: string) => (
        <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {METRIC_LABEL[m] || m}
        </span>
      ),
    },
    {
      title: '结论类型',
      dataIndex: 'conclusion_type',
      width: 100,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      sorter: (a: InsightRow, b: InsightRow) => {
        const order: Record<string, number> = { critical: 0, warning: 1, normal: 2 }
        return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
      },
      render: (s: string) => (
        <Tag color={SEVERITY_COLOR[s as keyof typeof SEVERITY_COLOR]}>
          {SEVERITY_LABEL[s as keyof typeof SEVERITY_LABEL] || s}
        </Tag>
      ),
    },
    {
      title: '指标值',
      dataIndex: 'metric_value',
      width: 100,
      render: (v: string | null) =>
        v !== null ? Number(v).toLocaleString() : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '偏离度',
      dataIndex: 'deviation',
      width: 100,
      render: (v: string | null) =>
        v !== null ? (
          <span style={{ color: Number(v) > 50 ? '#f5222d' : '#fa8c16' }}>
            {Number(v).toFixed(2)}%
          </span>
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
    {
      title: '批次',
      dataIndex: 'session_id',
      width: 200,
      ellipsis: true,
      render: (s: string) => (
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8c8c8c' }}>{s}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      sorter: (a: InsightRow, b: InsightRow) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <Table<InsightRow>
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      size="middle"
      scroll={{ x: 1450 }}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (t) => `共 ${t.toLocaleString()} 条洞察`,
        onChange: onPageChange,
      }}
    />
  )
}

export default InsightTable
