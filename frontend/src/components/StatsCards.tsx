import { useMemo } from 'react'
import { Card, Col, Row, Statistic } from 'antd'
import {
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { InsightRow } from '../types/insight'
import { INSIGHT_TYPE_LABEL } from '../types/insight'

interface Props {
  data: InsightRow[]
}

export default function StatsCards({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length
    const critical = data.filter((i) => i.severity === 'critical').length
    const warning = data.filter((i) => i.severity === 'warning').length
    const normal = data.filter((i) => i.severity === 'normal').length

    // 按类型统计
    const typeStats: Record<string, number> = {}
    data.forEach((i) => {
      const label = INSIGHT_TYPE_LABEL[i.insight_type] || i.insight_type
      typeStats[label] = (typeStats[label] || 0) + 1
    })

    return { total, critical, warning, normal, typeStats }
  }, [data])

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="洞察总数" value={stats.total} prefix={<FileTextOutlined />} />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="严重"
            value={stats.critical}
            valueStyle={{ color: '#f5222d' }}
            prefix={<AlertOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="预警"
            value={stats.warning}
            valueStyle={{ color: '#fa8c16' }}
            prefix={<WarningOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="正常"
            value={stats.normal}
            valueStyle={{ color: '#8c8c8c' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  )
}
