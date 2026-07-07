import { useState, useEffect, useCallback } from 'react'
import { Layout, Typography, message } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { InsightRow } from '../types/insight'
import { fetchInsights, fetchInsightDetail, type InsightQuery } from '../services/api'
import StatsCards from '../components/StatsCards'
import FilterBar, { type FilterValues } from '../components/FilterBar'
import InsightTable from '../components/InsightTable'
import InsightDetailDrawer from '../components/InsightDetailDrawer'

const { Header, Content } = Layout
const { Title } = Typography

export default function InsightDashboard() {
  // 列表状态
  const [data, setData] = useState<InsightRow[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<FilterValues>({})

  // 详情抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<InsightRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 全量数据（用于统计卡片）
  const [allData, setAllData] = useState<InsightRow[]>([])

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
        message.error('加载洞察数据失败')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 加载全量数据用于统计（无分页）
  const loadAllData = useCallback(async (queryFilters: FilterValues) => {
    try {
      const result = await fetchInsights({ ...queryFilters, page: 1, pageSize: 10000 })
      setAllData(result.list)
    } catch {
      // 静默失败
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadData(filters, page, pageSize)
    loadAllData(filters)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 筛选
  const handleFilter = (values: FilterValues) => {
    setFilters(values)
    setPage(1)
    loadData(values, 1, pageSize)
    loadAllData(values)
  }

  // 重置
  const handleReset = () => {
    setFilters({})
    setPage(1)
    loadData({}, 1, pageSize)
    loadAllData({})
  }

  // 分页
  const handlePageChange = (p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
    loadData(filters, p, ps)
  }

  // 点击行查看详情
  const handleRowClick = async (record: InsightRow) => {
    setDrawerOpen(true)
    setDetailLoading(true)
    setSelectedInsight(null)
    try {
      const detail = await fetchInsightDetail(record.id)
      setSelectedInsight(detail)
    } catch {
      message.error('加载详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedInsight(null)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <EyeOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
        <Title level={4} style={{ margin: 0 }}>
          AI 洞察数据看板
        </Title>
      </Header>
      <Content style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* 统计卡片 */}
        <StatsCards data={allData} />

        {/* 筛选栏 */}
        <FilterBar onFilter={handleFilter} onReset={handleReset} loading={loading} />

        {/* 数据表格 */}
        <InsightTable
          data={data}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
        />
      </Content>

      {/* 详情抽屉 */}
      <InsightDetailDrawer
        insight={selectedInsight}
        open={drawerOpen}
        loading={detailLoading}
        onClose={handleCloseDrawer}
      />
    </Layout>
  )
}
