import type React from 'react'
import { Drawer, Descriptions, Tag, Space, Divider, Typography, Empty, Spin } from 'antd'
import type { InsightRow } from '../types/insight'
import {
  INSIGHT_TYPE_LABEL,
  SEVERITY_LABEL,
  SEVERITY_COLOR,
  METRIC_LABEL,
} from '../types/insight'
import dayjs from 'dayjs'

const { Text, Paragraph, Title } = Typography

interface Props {
  insight: InsightRow | null
  open: boolean
  loading?: boolean
  onClose: () => void
}

const InsightDetailDrawer: React.FC<Props> = ({ insight, open, loading, onClose }) => {
  if (!insight && !loading) {
    return (
      <Drawer title="洞察详情" open={open} onClose={onClose} width={640}>
        <Empty description="未找到数据" />
      </Drawer>
    )
  }

  if (loading) {
    return (
      <Drawer title="洞察详情" open={open} onClose={onClose} width={640}>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </Drawer>
    )
  }

  if (!insight) return null

  const severityLabel = SEVERITY_LABEL[insight.severity]
  const severityColor = SEVERITY_COLOR[insight.severity]
  const typeLabel = INSIGHT_TYPE_LABEL[insight.insight_type]
  const metricLabel = METRIC_LABEL[insight.metric] || insight.metric

  return (
    <Drawer
      title={
        <Space>
          <span>洞察详情</span>
          <Tag color="blue">#{insight.id}</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={680}
    >
      {/* 核心信息 */}
      <Title level={4} style={{ marginTop: 0 }}>
        {insight.title}
      </Title>

      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="洞察类型">
          <Tag color="blue">{typeLabel}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="业务域">
          <Tag>{insight.domain}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="严重程度">
          <Tag color={severityColor}>{severityLabel}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="结论类型">
          <Tag>{insight.conclusion_type}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="指标编码">
          <Text code>{insight.metric}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="指标中文名">{metricLabel}</Descriptions.Item>
        <Descriptions.Item label="指标值">
          {insight.metric_value !== null ? (
            <Text strong>{Number(insight.metric_value).toLocaleString()}</Text>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="正常范围">
          {insight.normal_range ?? <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="偏离度">
          {insight.deviation !== null ? (
            <Text
              strong
              style={{ color: Number(insight.deviation) > 50 ? '#f5222d' : '#fa8c16' }}
            >
              {Number(insight.deviation).toFixed(2)}%
            </Text>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="数据来源">
          {insight.source ?? <Text type="secondary">—</Text>}
        </Descriptions.Item>
      </Descriptions>

      {/* 备注 */}
      {insight.notes && (
        <>
          <Divider plain>结论备注</Divider>
          <Paragraph>{insight.notes}</Paragraph>
        </>
      )}

      {/* 分析过程 */}
      {insight.analysis && (
        <>
          <Divider plain>分析过程</Divider>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{insight.analysis}</Paragraph>
        </>
      )}

      {/* 结构化明细 */}
      {insight.insight_data && (
        <>
          <Divider plain>结构化明细</Divider>
          <pre
            style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 6,
              fontSize: 13,
              overflow: 'auto',
              maxHeight: 200,
            }}
          >
            {JSON.stringify(insight.insight_data, null, 2)}
          </pre>
        </>
      )}

      {/* 可执行建议 */}
      {insight.action && (
        <>
          <Divider plain>建议</Divider>
          <Paragraph
            style={{
              background: '#fff7e6',
              padding: 12,
              borderRadius: 6,
              borderLeft: '4px solid #fa8c16',
            }}
          >
            {insight.action}
          </Paragraph>
        </>
      )}

      <Divider />

      {/* 元数据 */}
      <Descriptions column={2} size="small">
        <Descriptions.Item label="会话批次">
          <Text code style={{ fontSize: 12 }}>
            {insight.session_id}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Agent ID">
          {insight.agent_id ?? <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="父洞察 ID">
          {insight.parent_id ?? <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(insight.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {dayjs(insight.updated_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="数据源时点">
          {insight.data_source_timestamp
            ? dayjs(insight.data_source_timestamp).format('YYYY-MM-DD HH:mm:ss')
            : <Text type="secondary">—</Text>}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}

export default InsightDetailDrawer
