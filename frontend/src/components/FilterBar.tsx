import { useState } from 'react'
import { Form, Select, Input, Button, Space, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons'
import type { InsightType, Severity } from '../types/insight'
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL, METRIC_LABEL } from '../types/insight'

export interface FilterValues {
  insight_type?: InsightType
  severity?: Severity
  keyword?: string
  metric?: string
  session_id?: string
  domain?: string
  conclusion_type?: string
  date_from?: string
  date_to?: string
}

interface Props {
  onFilter: (values: FilterValues) => void
  onReset: () => void
  loading?: boolean
}

const FilterBar: React.FC<Props> = ({ onFilter, onReset, loading }) => {
  const [form] = Form.useForm<FilterValues>()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleFinish = (values: FilterValues) => {
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== undefined && v !== '')
    ) as FilterValues
    onFilter(clean)
  }

  const handleReset = () => {
    form.resetFields()
    setAdvancedOpen(false)
    onReset()
  }

  const metricOptions = Object.entries(METRIC_LABEL).map(([value, label]) => ({ label, value }))

  return (
    <Form form={form} onFinish={handleFinish} layout="inline" style={{ marginBottom: 16 }}>
      <Row gutter={[8, 8]} style={{ width: '100%' }}>
        {/* 基础筛选 */}
        <Col>
          <Form.Item name="insight_type" style={{ marginBottom: 0 }}>
            <Select
              placeholder="洞察类型"
              allowClear
              style={{ width: 180 }}
              options={Object.entries(INSIGHT_TYPE_LABEL).map(([value, label]) => ({ label, value }))}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="severity" style={{ marginBottom: 0 }}>
            <Select
              placeholder="严重程度"
              allowClear
              style={{ width: 130 }}
              options={Object.entries(SEVERITY_LABEL).map(([value, label]) => ({ label, value }))}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="metric" style={{ marginBottom: 0 }}>
            <Select
              placeholder="指标类型"
              allowClear
              showSearch
              style={{ width: 180 }}
              options={metricOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="keyword" style={{ marginBottom: 0 }}>
            <Input prefix={<SearchOutlined />} placeholder="搜索标题/区域..." style={{ width: 200 }} allowClear />
          </Form.Item>
        </Col>
        <Col>
          <Space>
            <Button htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setAdvancedOpen(!advancedOpen)}
              type={advancedOpen ? 'primary' : 'default'}
              ghost={advancedOpen}
            >
              高级
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 高级筛选 */}
      {advancedOpen && (
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={6}>
            <Form.Item name="session_id" label="会话批次" style={{ marginBottom: 0 }}>
              <Input placeholder="如: policy_inspection_20260616" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="domain" label="业务域" style={{ marginBottom: 0 }}>
              <Input placeholder="如: ops / contract / policy" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="conclusion_type" label="结论类型" style={{ marginBottom: 0 }}>
              <Input placeholder="如: 严重偏低 / 正常" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="date_from" label="起始日期" style={{ marginBottom: 0 }}>
              <Input placeholder="如: 2026-06-01" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="date_to" label="截止日期" style={{ marginBottom: 0 }}>
              <Input placeholder="如: 2026-07-01" allowClear />
            </Form.Item>
          </Col>
        </Row>
      )}
    </Form>
  )
}

export default FilterBar
