import { useEffect } from 'react'
import { Modal, Form, Input, Select, Row, Col, Divider } from 'antd'
import type { InsightRow } from '../types/insight'
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL, METRIC_LABEL } from '../types/insight'
import type { InsightFormData } from '../services/api'

const { TextArea } = Input

interface Props {
  open: boolean
  editingRecord: InsightRow | null
  loading?: boolean
  onSubmit: (data: InsightFormData) => void
  onCancel: () => void
}

const InsightFormModal: React.FC<Props> = ({ open, editingRecord, loading, onSubmit, onCancel }) => {
  const [form] = Form.useForm<InsightFormData>()
  const isEdit = !!editingRecord

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          title: editingRecord.title,
          insight_type: editingRecord.insight_type,
          severity: editingRecord.severity,
          metric: editingRecord.metric,
          domain: editingRecord.domain,
          conclusion_type: editingRecord.conclusion_type,
          session_id: editingRecord.session_id,
          notes: editingRecord.notes ?? '',
          analysis: editingRecord.analysis ?? '',
          metric_value: editingRecord.metric_value ?? '',
          normal_range: editingRecord.normal_range ?? '',
          deviation: editingRecord.deviation ?? '',
          action: editingRecord.action ?? '',
          source: editingRecord.source ?? '',
          insight_data: editingRecord.insight_data
            ? JSON.stringify(editingRecord.insight_data, null, 2)
            : '',
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, editingRecord, form])

  const handleFinish = (values: InsightFormData) => {
    onSubmit(values)
  }

  return (
    <Modal
      title={isEdit ? '编辑洞察' : '新增洞察'}
      open={open}
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={loading}
      width={720}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          insight_type: 'ops',
          severity: 'normal',
          source: 'manual',
        }}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="洞察标题" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="session_id"
              label="会话批次"
              rules={[{ required: true, message: '请输入会话批次号' }]}
            >
              <Input placeholder="如: ops_inspection_20260702" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="insight_type"
              label="洞察类型"
              rules={[{ required: true, message: '请选择' }]}
            >
              <Select
                options={Object.entries(INSIGHT_TYPE_LABEL).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="severity"
              label="严重程度"
              rules={[{ required: true, message: '请选择' }]}
            >
              <Select
                options={Object.entries(SEVERITY_LABEL).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="source"
              label="数据来源"
            >
              <Select
                allowClear
                placeholder="选择来源"
                options={[
                  { label: '定时任务', value: 'scheduled' },
                  { label: '手动录入', value: 'manual' },
                  { label: 'API 推送', value: 'api' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="metric"
              label="指标编码"
              rules={[{ required: true, message: '请选择' }]}
            >
              <Select
                options={Object.entries(METRIC_LABEL).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="domain"
              label="业务域"
              rules={[{ required: true, message: '请输入业务域' }]}
            >
              <Input placeholder="如: ops / contract / policy" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="conclusion_type"
              label="结论类型"
              rules={[{ required: true, message: '请输入结论类型' }]}
            >
              <Input placeholder="如: 严重偏低 / 正常" />
            </Form.Item>
          </Col>
        </Row>

        <Divider plain style={{ fontSize: 13 }}>指标数据</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="metric_value" label="指标值">
              <Input placeholder="如: 45.5" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="normal_range" label="正常范围">
              <Input placeholder="如: ≥80%" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="deviation" label="偏离度">
              <Input placeholder="如: 34.5" />
            </Form.Item>
          </Col>
        </Row>

        <Divider plain style={{ fontSize: 13 }}>内容</Divider>

        <Form.Item name="notes" label="结论备注">
          <TextArea rows={2} placeholder="描述分析结论..." />
        </Form.Item>

        <Form.Item name="analysis" label="分析过程">
          <TextArea rows={3} placeholder="描述分析过程..." />
        </Form.Item>

        <Form.Item name="action" label="可执行建议">
          <TextArea rows={2} placeholder="建议措施..." />
        </Form.Item>

        <Form.Item
          name="insight_data"
          label="结构化数据 (JSON)"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                try {
                  JSON.parse(value)
                  return Promise.resolve()
                } catch {
                  return Promise.reject(new Error('JSON 格式不正确'))
                }
              },
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder='{"district": "海珠区", "total": 1000, ...}'
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default InsightFormModal
