import React, { useState, useEffect, useRef } from 'react';
import GuangzhouMap from './GuangzhouMap';
import { INSIGHT_TYPE_LABEL, SEVERITY_LABEL } from '../../types/insight';
import './dashboard.css';

const BASE = '/api';

// Data layer config
const LAYER_CATEGORIES = [
  { cat: '房源标注', items: [
    { id: 'sale', label: '配售型保障住房', color: '#ff4444', active: true, count: '4处' },
    { id: 'rental', label: '公共租赁住房', color: '#3388ff', active: false, count: '13处' },
    { id: 'market', label: '市场化聚合房源', color: '#f59e0b', active: false, count: '7处' },
  ]},
  { cat: '显示控制', items: [
    { id: 'labels', label: '区域名称', color: '#ffffff', active: false, count: '' },
  ]},
];

const MOCK = {
  ehi: { score: 71, trend: '+2' },
  alerts: { critical: 23, high: 58 },
  tabs: ['总览', '经营', '风险'],
  // 8区多维度评分（入住率 + 收缴率 + 维修响应 + 安全评分）
  districts: [
    { name: '天河区', score: 78, properties: 35, occupancy: 78, collection: 85, maint: 82, safety: 90, trend: 'up', amount: '¥2,100万', spark: [7,7,8,8,7,8,8,8,8,8] },
    { name: '越秀区', score: 82, properties: 28, occupancy: 76, collection: 80, maint: 75, safety: 88, trend: 'flat', amount: '¥1,450万', spark: [8,8,7,8,8,8,8,7,8,8] },
    { name: '海珠区', score: 68, properties: 42, occupancy: 68, collection: 72, maint: 62, safety: 65, trend: 'down', amount: '¥3,100万', spark: [8,7,7,7,6,7,7,6,6,7], signals: [{ tag: 'ALERT', text: '琶洲项目入住率跌破40%' }] },
    { name: '荔湾区', score: 55, properties: 22, occupancy: 58, collection: 55, maint: 50, safety: 60, trend: 'down', amount: '¥860万', spark: [6,6,5,5,5,6,5,5,5,5], signals: [{ tag: 'ALERT', text: '收缴率连续3月跌破60%' }, { tag: 'WARNING', text: '3户欠款超90天' }] },
    { name: '白云区', score: 72, properties: 55, occupancy: 72, collection: 68, maint: 70, safety: 78, trend: 'flat', amount: '¥2,800万', spark: [7,7,7,7,8,7,7,7,7,7] },
    { name: '番禺区', score: 65, properties: 38, occupancy: 55, collection: 62, maint: 58, safety: 55, trend: 'down', amount: '¥1,900万', spark: [8,7,7,6,6,6,5,5,5,6], signals: [{ tag: 'WARNING', text: '2处管道老化渗漏' }, { tag: 'WARNING', text: '公寓二期合同逾期' }] },
    { name: '黄埔区', score: 75, properties: 31, occupancy: 75, collection: 78, maint: 80, safety: 85, trend: 'up', amount: '¥1,520万', spark: [7,7,7,8,8,8,7,8,8,8] },
    { name: '南沙区', score: 88, properties: 15, occupancy: 88, collection: 90, maint: 92, safety: 95, trend: 'up', amount: '¥780万', spark: [8,9,9,9,9,8,9,9,9,9] },
  ],
  // 风险雷达（15条详细风险记录）
  risks: [
    { type: '欠款', name: '荔湾区', detail: '3户欠款超90天，合计¥98万', level: 'CRITICAL', score: 55 },
    { type: '安全', name: '海珠区', detail: '消防设备过期，涉及256户', level: 'CRITICAL', score: 68 },
    { type: '合同', name: '番禺区', detail: '公寓二期合同逾期未签¥2,400万', level: 'HIGH', score: 65 },
    { type: '入住率', name: '海珠区', detail: '琶洲项目入住率跌破40%', level: 'CRITICAL', score: 68 },
    { type: '设备', name: '荔湾区', detail: '2部电梯年检到期超15天', level: 'HIGH', score: 55 },
    { type: '欠款', name: '番禺区', detail: '23户欠款¥126万，环比+12%', level: 'HIGH', score: 65 },
    { type: '维修', name: '番禺区', detail: '2处排水管道老化渗漏', level: 'WARNING', score: 65 },
    { type: '安全', name: '白云区', detail: '消防设备故障报警480户', level: 'HIGH', score: 72 },
    { type: '合同', name: '荔湾区', detail: '市场化租赁合同已逾期¥320万', level: 'CRITICAL', score: 55 },
    { type: '入住率', name: '从化区', detail: '某楼盘租户失联15天欠¥43万', level: 'HIGH', score: 45 },
    { type: '欠款', name: '白云区', detail: '12户欠款¥67万', level: 'WARNING', score: 72 },
    { type: '安全', name: '越秀区', detail: '老旧项目外墙脱落隐患', level: 'HIGH', score: 82 },
    { type: '设备', name: '黄埔区', detail: '门禁系统故障12处', level: 'WARNING', score: 75 },
    { type: '合同', name: '天河区', detail: '3户企业租户同时申请退租', level: 'WARNING', score: 78 },
    { type: '欠款', name: '越秀区', detail: '8户欠款¥45万，环比-8%', level: 'INFO', score: 82 },
  ],
  // 营收构成（8个片区 + 4种业态）
  revenueItems: [
    { name: '天河市场化租赁', pct: 92, amount: '¥1,680万', color: '#3388ff' },
    { name: '海珠公租房', pct: 85, amount: '¥2,340万', color: '#44ff88' },
    { name: '白云企业入住', pct: 72, amount: '¥1,860万', color: '#3388ff' },
    { name: '番禺市场化租赁', pct: 62, amount: '¥1,240万', color: '#ffaa00' },
    { name: '越秀公租房', pct: 88, amount: '¥980万', color: '#44ff88' },
    { name: '黄埔企业入住', pct: 78, amount: '¥1,120万', color: '#3388ff' },
    { name: '南沙市场化租赁', pct: 95, amount: '¥520万', color: '#44ff88' },
    { name: '荔湾公租房', pct: 55, amount: '¥620万', color: '#ff4444' },
    { name: '花都企业入住', pct: 65, amount: '¥380万', color: '#ffaa00' },
    { name: '增城市场化租赁', pct: 58, amount: '¥240万', color: '#ffaa00' },
    { name: '从化公租房', pct: 50, amount: '¥180万', color: '#ff4444' },
  ],
  // 房源流转漏斗（5阶段）
  pipeline: [
    { stage: '申请登记', count: 485, amount: '¥8,400万', pct: 100, signal: '+23%', color: '#3388ff' },
    { stage: '资格审核', count: 312, amount: '¥5,200万', pct: 64, signal: '', color: '#3388ff' },
    { stage: '选房配租', count: 178, amount: '¥3,100万', pct: 37, signal: '56排队', color: '#ffaa00' },
    { stage: '签约入住', count: 95, amount: '¥1,800万', pct: 20, signal: '12待签', color: '#ffaa00' },
    { stage: '按期缴费', count: 68, amount: '¥1,200万', pct: 14, signal: '8欠费', color: '#ff4444' },
  ],
  // 维修/改造项目（12个）
  projects: [
    { name: '琶洲公租房升级改造', phi: 91, remain: 62, status: 'healthy', bar: 90, type: '升级改造' },
    { name: '天河智慧城室内装修', phi: 88, remain: 45, status: 'healthy', bar: 85, type: '室内装修' },
    { name: '荔湾老旧小区外墙翻新', phi: 84, remain: 38, status: 'healthy', bar: 80, type: '外墙翻新' },
    { name: '越秀3栋电梯更换工程', phi: 72, remain: 28, status: 'normal', bar: 68, type: '设备更换', sig: '工期偏紧' },
    { name: '番禺排水管道全面维修', phi: 65, remain: 21, status: 'normal', bar: 58, type: '管道维修' },
    { name: '南沙新公寓精装修', phi: 95, remain: 78, status: 'healthy', bar: 92, type: '新项目' },
    { name: '白云消防系统全面更新', phi: 54, remain: 12, status: 'warn', bar: 45, type: '消防', sig: '材料待批' },
    { name: '海珠外墙脱落修复', phi: 38, remain: -3, status: 'danger', bar: 30, type: '外墙修复', sig: '多问题并发' },
    { name: '黄埔门禁智能化升级', phi: 78, remain: 52, status: 'normal', bar: 72, type: '智能化' },
    { name: '花都供水系统改造', phi: 60, remain: 15, status: 'normal', bar: 55, type: '供水' },
    { name: '增城电梯年检维修', phi: 45, remain: 8, status: 'warn', bar: 42, type: '设备更换', sig: '年检超期' },
    { name: '从化老旧线路更换', phi: 42, remain: 5, status: 'warn', bar: 38, type: '电力', sig: '安全隐患' },
  ],
  // 政策监控（8条）
  policies: [
    { source: '广州住建局', time: '今日', title: '保障性住房申请条件放宽新政', impact: '利好', linked: '公租房申请预计+2000户' },
    { source: '住建部', time: '昨日', title: '老旧小区改造十四五中期评估通知', impact: '利好', linked: '荔湾/越秀多个项目受益' },
    { source: '广东省住建厅', time: '3天前', title: '数字经济促进条例修订征求意见', impact: '中性', linked: '涉及智慧物业系统升级' },
    { source: '国务院', time: '近日', title: '加快推进保障性租赁住房发展指导意见', impact: '利好', linked: '安居集团作为广州试点单位' },
    { source: '广州市政府', time: '5天前', title: '2026年度公租房配租方案公布', impact: '利好', linked: '新增11区房源1,200套' },
    { source: '省发改委', time: '1周前', title: '物业服务收费管理办法修订', impact: '中性', linked: '可能影响市场化租赁定价' },
    { source: '市消防局', time: '3天前', title: '高层建筑消防安全专项整治通知', impact: '关注', linked: '需排查12栋高层项目' },
    { source: '央行广州分行', time: '近日', title: '保障性住房专项贷款政策解读', impact: '利好', linked: '融资成本有望降低0.5%' },
  ],
  // 供应商/合作方（8家）
  vendors: [
    { name: '广建集团', event: '材料报价上调15%', impact: '影响3个项目预算', level: 'HIGH', time: '昨天' },
    { name: '市消防工程公司', event: '新获一级消防资质', impact: '可承接更大规模项目', level: 'INFO', time: '3天前' },
    { name: '智慧物业SaaS', event: '系统V3.0发布', impact: '需评估升级兼容性', level: 'MEDIUM', time: '近日' },
    { name: '市建筑设计院', event: '老旧小区改造新标准发布', impact: '白云/荔湾项目需重评', level: 'MEDIUM', time: '5天前' },
    { name: '安防科技公司', event: '智能门禁系统涨价通知', impact: '黄埔项目成本+8%', level: 'HIGH', time: '2天前' },
    { name: '绿城物业', event: '退出广州市场', impact: '3个项目需更换物业', level: 'CRITICAL', time: '1周前' },
    { name: '市水电工程队', event: '新增管道检测资质', impact: '番禺项目可缩短工期', level: 'INFO', time: '4天前' },
    { name: '中建三局', event: '中标天河智慧城二期', impact: '预计Q3开工1,200套', level: 'INFO', time: '近日' },
  ],
  // 情报动态（8条）
  news: [
    { level: 'CRITICAL', time: '3h', source: 'INSPECTION', title: '海珠区琶洲项目入住率跌破40%，291/8315套', meta: '远低于80%阈值', action: 'AI: 建议启动专项排查' },
    { level: 'HIGH', time: '5h', source: 'FINANCE', title: '荔湾区3户欠款超90天，合计¥98万', meta: '催缴均无果，需启动法律程序', action: 'AI: 24h内启动催收' },
    { level: 'WARNING', time: '2h', source: 'SYSTEM', title: '番禺公寓二期合同逾期未签，涉及¥2,400万', meta: '客户失联5天', action: 'AI: 评估法律风险' },
    { level: 'HIGH', time: '8h', source: 'MAINT', title: '白云区消防设备故障报警，影响3栋楼480户', meta: '需紧急检修', action: 'AI: 建议48h内修复' },
    { level: 'INFO', time: '1d', source: 'POLICY', title: '广州住建局发布保障房申请新规', meta: '预计新增2000+潜在客户', action: 'AI: 利好公租房业务' },
    { level: 'WARNING', time: '12h', source: 'LEASE', title: '越秀区3份公租房合同15天内到期', meta: '续租意向不明，涉及128户', action: 'AI: 建议提前通知' },
    { level: 'INFO', time: '1d', source: 'MARKET', title: '南沙区新项目入市，1,200套市场化租赁房源', meta: 'AI评估消化周期约6个月', action: 'AI: 建议分3批入市' },
    { level: 'HIGH', time: '6h', source: 'SAFETY', title: '越秀区老旧项目外墙脱落安全隐患', meta: '已报12345投诉', action: 'AI: 24h内设置警戒' },
  ],
  contracts: [
    { district: '海珠区', type: '市场化租赁', expire: '08-15', amount: '¥280万', status: '即将到期', tenant: '某科技公司' },
    { district: '番禺区', type: '公租房', expire: '07-30', amount: '¥156万', status: '即将到期', tenant: '128户家庭' },
    { district: '荔湾区', type: '市场化租赁', expire: '06-15', amount: '¥320万', status: '已逾期', tenant: '某物流企业' },
    { district: '白云区', type: '企业入住', expire: '09-01', amount: '¥480万', status: '待续签', tenant: '某制造厂' },
    { district: '天河区', type: '公租房', expire: '08-20', amount: '¥210万', status: '即将到期', tenant: '86户家庭' },
    { district: '黄埔区', type: '市场租赁', expire: '07-15', amount: '¥165万', status: '即将到期', tenant: '某创业园' },
    { district: '越秀区', type: '公租房', expire: '06-30', amount: '¥95万', status: '已逾期', tenant: '42户家庭' },
    { district: '南沙区', type: '企业入住', expire: '10-01', amount: '¥380万', status: '正常', tenant: '某新能源公司' },
    { district: '花都区', type: '市场化租赁', expire: '09-15', amount: '¥120万', status: '正常', tenant: '某电商仓库' },
  ],
  arrears: [
    { district: '番禺区', amount: '¥126万', count: 23, trend: '+12%', detail: '市场化租赁为主' },
    { district: '荔湾区', amount: '¥98万', count: 18, trend: '+8%', detail: '3户超90天' },
    { district: '海珠区', amount: '¥85万', count: 15, trend: '+5%', detail: '企业退租影响' },
    { district: '白云区', amount: '¥67万', count: 12, trend: '-3%', detail: '环比改善' },
    { district: '越秀区', amount: '¥45万', count: 8, trend: '-8%', detail: '持续下降' },
    { district: '天河区', amount: '¥38万', count: 6, trend: '-2%', detail: '收缴率稳定' },
    { district: '黄埔区', amount: '¥32万', count: 9, trend: '+5%', detail: '2户新欠' },
    { district: '南沙区', amount: '¥15万', count: 3, trend: '-15%', detail: '收缴率最高' },
    { district: '从化区', amount: '¥43万', count: 5, trend: '+20%', detail: '租户失联' },
  ],
};

const sc = (s: number) => s >= 80 ? '#44ff88' : s >= 65 ? '#3388ff' : s >= 50 ? '#ffaa00' : '#ff8800';
const tr = (t: string) => t === 'up' ? '▲' : t === 'down' ? '▼' : '─';
const statusColor = (s: string) => s === 'healthy' ? '#44ff88' : s === 'normal' ? '#3388ff' : s === 'warn' ? '#ffaa00' : '#ff4444';
const Spark = ({ data }: { data: number[] }) => {
  const mx = Math.max(...data);
  return <span className="dash-sparkline">{data.map((v, i) => {
    const h = Math.max(2, (v / mx) * 12);
    const c = v >= mx * 0.7 ? '#44ff88' : v >= mx * 0.4 ? '#3388ff' : '#ff4444';
    return <span key={i} className="dash-spark-bar" style={{ height: h, background: c }} />;
  })}</span>;
};

interface Toast { id: number; type: string; tag: string; district: string | null; text: string; time: string; insight_type?: string; severity?: string; conclusion_type?: string; metric_value?: string; normal_range?: string; deviation?: string; notes?: string; analysis?: string; }

export default function EnterpriseDashboard() {
  const [clock, setClock] = useState('');
  const [activeTab, setActiveTab] = useState('总览');
  const [modalToast, setModalToast] = useState<any>(null);
  const [detailView, setDetailView] = useState<{ type: string; data: any } | null>(null);
  const [layerOpen, setLayerOpen] = useState(false);
  const [layers, setLayers] = useState(LAYER_CATEGORIES);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);

  const startResize = () => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainRef.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(30, Math.min(80, pct));
      mainRef.current.style.setProperty('--left-w', `${clamped}%`);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const leftRef = useRef<HTMLDivElement>(null);
  const startResizeH = () => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!leftRef.current) return;
      const rect = leftRef.current.getBoundingClientRect();
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.max(25, Math.min(75, pct));
      leftRef.current.style.setProperty('--map-h', `${clamped}%`);
      window.dispatchEvent(new Event('resize'));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('zh-CN', { hour12: false }) + ' BJT');
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const tidRef = useRef(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${BASE}/insights/latest-alerts?limit=20`);
        if (!res.ok) return;
        const alerts = await res.json();
        if (!Array.isArray(alerts) || alerts.length === 0) return;
        const count = Math.ceil(Math.random() * 3);
        const picked = alerts.slice(0, count);
        for (const a of picked) {
          const toast: Toast = {
            id: ++tidRef.current, type: a.type, tag: a.tag, district: a.district,
            text: (a.text || a.title || '').substring(0, 55),
            time: new Date(a.created_at).toLocaleTimeString('zh-CN', { hour12: false }),
            insight_type: a.insight_type, severity: a.severity, conclusion_type: a.conclusion_type,
            metric_value: a.metric_value, normal_range: a.normal_range, deviation: a.deviation,
            notes: a.notes || a.text, analysis: a.analysis,
          };
          setToasts(prev => [...prev.slice(-4), toast]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 5000);
        }
      } catch { /* silent */ }
    };
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 4000);
    return () => clearInterval(iv);
  }, []);

  const toggleLayer = (ci: number, ii: number) => setLayers(prev => {
    const next = [...prev];
    const items = [...next[ci].items];
    items[ii] = { ...items[ii], active: !items[ii].active };
    next[ci] = { ...next[ci], items };
    return next;
  });

  return (
    <div className="dashboard-container">

      {/* ===== MAIN GRID ===== */}
      <main className="dash-main" ref={mainRef}>
        {/* LEFT COLUMN */}
        <div className="dash-left" ref={leftRef}>
          {/* Map Section */}
          <div className="dash-map-section">
            <div className="dash-map-header">
              <span className="dash-map-title">广州物业热力图</span>
              <span className="dash-map-count">{MOCK.districts.reduce((s,d)=>s+d.properties,0)}楼盘</span>
              <span className="dash-map-count">{MOCK.districts.reduce((s,d)=>s+d.houses||0,0).toLocaleString()}套</span>
              <span style={{ flex: 1 }} />
              <button className="dash-hdr-btn" onClick={() => setLayerOpen(!layerOpen)}>LAYERS</button>
            </div>
            <div className="dash-map-body">
              {/* === LAYER PANEL === */}
              <div className={`dash-layer-panel ${layerOpen ? '' : 'collapsed'}`}>
                <div className="dash-layer-header">数据图层</div>
                <div className="dash-layer-body">
                  {layers.map((cat, ci) => (
                    <div key={cat.cat}>
                      <div className="dash-layer-cat">{cat.cat}</div>
                      {cat.items.map((item, ii) => (
                        <div key={item.id} className={`dash-layer-item ${item.active ? 'active' : ''}`}
                          onClick={() => toggleLayer(ci, ii)}>
                          <span className="dash-layer-dot" style={{ borderColor: item.color }} />
                          <span>{item.label}</span>
                          <span className="dash-layer-count">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {layerOpen
                ? <button className="dash-layer-toggle-btn" onClick={() => setLayerOpen(false)} style={{ top: 0, left: 222 }}>◁</button>
                : <button className="dash-layer-toggle-btn" onClick={() => setLayerOpen(true)} style={{ top: 0, left: 0 }}>▷</button>}

              {/* Map */}
              <GuangzhouMap
                layers={{
                  showSale: layers[0]?.items[0]?.active ?? true,
                  showRental: layers[0]?.items[1]?.active ?? true,
                  showMarket: layers[0]?.items[2]?.active ?? true,
                  showLabels: layers[1]?.items[0]?.active ?? true,
                  showMarkers: false,
                }}
              />

              {/* === TOAST POPUPS === */}
              <div className="dash-toast-container">
                {toasts.map(t => (
                  <div key={t.id} className={`dash-toast ${t.type}`} onClick={() => setModalToast(t)}>
                    <span className="dash-toast-tag" style={{
                      background: t.type === 'critical' ? 'rgba(255,68,68,.15)' : 'rgba(255,170,0,.15)',
                      color: t.type === 'critical' ? '#ff4444' : '#ffaa00',
                    }}>{t.tag}</span>
                    {t.district && <span style={{ color: '#666', fontSize: 8, marginLeft: 3 }}>{t.district}</span>}
                    <span className="dash-toast-time">{t.time}</span>
                    <div className="dash-toast-body">{t.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal resize */}
          <div className="dash-h-resize-handle" onMouseDown={startResizeH} />

          {/* Below Map */}
          <div className="dash-below-map">
            <div className="dash-below-row">
              {/* AI Brief */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <span className="dash-panel-title">AI 经营简报</span>
                  <span className="dash-panel-badge badge-ai">AI LIVE</span>
                </div>
                <div className="dash-panel-content">
                  <div className="dash-metric-row" style={{ marginBottom: 6 }}>
                    <div className="dash-metric-card"><div className="dash-mc-label">月度营收</div><div className="dash-mc-value" style={{ color: '#06b6d4' }}>¥2,400万</div><div className="dash-mc-sub" style={{ color: '#44ff88' }}>达成75%</div></div>
                    <div className="dash-metric-card"><div className="dash-mc-label">在管楼盘</div><div className="dash-mc-value" style={{ color: '#3388ff' }}>266</div><div className="dash-mc-sub" style={{ color: '#44ff88' }}>↑3% 新增</div></div>
                    <div className="dash-metric-card"><div className="dash-mc-label">AI 信号</div><div className="dash-mc-value" style={{ color: '#8b5cf6' }}>81</div><div className="dash-mc-sub"><span style={{ color: '#ff4444' }}>23</span> <span style={{ color: '#ff8800' }}>58</span></div></div>
                    <div className="dash-metric-card"><div className="dash-mc-label">出租率</div><div className="dash-mc-value" style={{ color: '#ffaa00' }}>72%</div><div className="dash-mc-sub" style={{ color: '#44ff88' }}>↑2%</div></div>
                  </div>
                  <div className="dash-item" style={{ borderLeft: '2px solid #44ff88', paddingLeft: 6 }}>
                    <div className="dash-item-source"><span className="dash-panel-badge badge-ok">POSITIVE</span></div>
                    <div className="dash-item-title">南沙入住率88%创新高，天河860套配租在即。南沙新项目入市1,200套。</div>
                  </div>
                  <div className="dash-item" style={{ borderLeft: '2px solid #ff4444', paddingLeft: 6 }}>
                    <div className="dash-item-source"><span className="dash-panel-badge badge-critical">CRITICAL</span></div>
                    <div className="dash-item-title">番禺公寓二期合同逾期（¥2,400万），荔湾收缴率55%垫底需紧急干预。</div>
                  </div>
                  <div className="dash-item" style={{ borderLeft: '2px solid #ffaa00', paddingLeft: 6 }}>
                    <div className="dash-item-source"><span className="dash-panel-badge badge-warn">WATCH</span></div>
                    <div className="dash-item-title">海珠琶洲3项目入住率低于60%，从化某盘租户失联15天欠¥43万。</div>
                  </div>
                  <div className="dash-item" style={{ borderLeft: '2px solid #44ff88', paddingLeft: 6 }}>
                    <div className="dash-item-source"><span className="dash-panel-badge badge-ok">OPPORTUNITY</span></div>
                    <div className="dash-item-title">广州住建局保障房新政利好，预计新增2,000+户公租房申请。</div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <span className="dash-panel-title">关键里程碑</span>
                  <span className="dash-panel-badge" style={{ background: 'rgba(6,182,212,.15)', color: '#06b6d4' }}>本月</span>
                </div>
                <div className="dash-panel-content">
                  {[
                    { d: '07/10', t: '海珠琶洲新项目交付验收（1,200套）', c: '#06b6d4' },
                    { d: '07/15', t: '天河智慧城配租摇号（860套）', c: '#44ff88' },
                    { d: '07/22', t: '番禺公寓二期合同签署（¥2,400万）', c: '#ffaa00' },
                    { d: '08/01', t: 'Q2经营复盘董事会汇报', c: '#8b5cf6' },
                    { d: '08/05', t: '白云消防设备更新完工验收', c: '#44ff88' },
                    { d: '08/12', t: '南沙新公寓开放申请（1,200套）', c: '#06b6d4' },
                    { d: '08/20', t: '增城/从化旧改方案报批截止', c: '#ffaa00' },
                  ].map((m, i) => (
                    <div key={i} className="dash-item" style={{ borderLeft: `2px solid ${m.c}`, paddingLeft: 6, cursor: 'pointer' }} onClick={() => setDetailView({ type: 'milestone', data: m })}>
                      <div className="dash-item-time">{m.d}</div>
                      <div className="dash-item-title">{m.t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* News + Arrears */}
            <div className="dash-below-row">
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <span className="dash-panel-title">情报动态</span>
                  <span className="dash-panel-count">3 未读</span>
                </div>
                <div className="dash-panel-content">
                  {MOCK.news.map((n, i) => (
                    <div key={i} className={`dash-alert-item ${n.level === 'CRITICAL' ? 'alert' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'news', data: n })}>
                      <div className="dash-alert-source">
                        <span className={`dash-panel-badge ${n.level === 'CRITICAL' ? 'badge-critical' : n.level === 'HIGH' ? 'badge-high' : 'badge-warn'}`}>{n.level}</span>
                        <span>{n.source}</span>
                        <span style={{ marginLeft: 'auto', color: '#666' }}>{n.time}</span>
                      </div>
                      <div className="dash-alert-title">{n.title}</div>
                      <div className="dash-item-meta">→ {n.meta}</div>
                      <div className="dash-item-meta" style={{ color: '#8b5cf6' }}>→ {n.action}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-panel">
                <div className="dash-panel-header">
                  <span className="dash-panel-title">欠款风险</span>
                  <span className="dash-panel-badge badge-high">¥421万</span>
                </div>
                <div className="dash-panel-content">
                  {MOCK.arrears.map((a, i) => (
                    <div key={i} className="dash-data-row" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'arrears', data: a })}>
                      <span style={{ flex: 1, fontSize: 10 }}>{a.district}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#ffaa00', width: 52, textAlign: 'right' }}>{a.amount}</span>
                      <span style={{ fontSize: 9, color: '#666', width: 22, textAlign: 'right' }}>{a.count}户</span>
                      <span style={{ fontSize: 9, color: a.trend.startsWith('+') ? '#ff4444' : '#44ff88', width: 30, textAlign: 'right' }}>{a.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div className="dash-resize-handle" onMouseDown={startResize} />

        {/* RIGHT COLUMN */}
        <div className="dash-right">
          <div className="dash-panels-grid">
            {/* Panel 1: EHI + District Health */}
            <div className="dash-panel" onClick={() => {}}>
              <div className="dash-panel-header">
                <span className="dash-panel-title">区域健康指数 EHI</span><span className="dash-panel-count">{MOCK.districts.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <div className="dash-gauge-wrap">
                  <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3" /><circle cx="40" cy="40" r="32" fill="none" stroke={sc(MOCK.ehi.score)} strokeWidth="3" strokeLinecap="round" strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-MOCK.ehi.score/100)} transform="rotate(-90 40 40)" /></svg>
                  <div className="dash-gauge-center"><div style={{ fontSize: 20, fontWeight: 700, color: sc(MOCK.ehi.score) }}>{MOCK.ehi.score}</div><div style={{ fontSize: 7, color: '#888', textTransform: 'uppercase' }}>EHI</div></div>
                </div>
                <div style={{ flex: 1, fontSize: 9, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#44ff88' }}>● 健康2区</span><span style={{ color: '#3388ff' }}>● 正常3区</span><span style={{ color: '#ffaa00' }}>● 关注2区</span><span style={{ color: '#ff8800' }}>● 预警1区</span>
                </div>
              </div>
              <div className="dash-panel-content">
                {MOCK.districts.map(d => (
                  <div key={d.name}>
                    <div className="dash-data-row" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'district', data: d })}>
                      <span className="dash-dot" style={{ background: sc(d.score) }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: sc(d.score), width: 20, textAlign: 'right', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{d.score}</span>
                      <span style={{ width: 60, display: 'flex', gap: 2 }}>{[d.occupancy, d.collection, d.maint, d.safety].map((v, j) => {
                        const c = v >= 80 ? '#44ff88' : v >= 60 ? '#3388ff' : v >= 40 ? '#ffaa00' : '#ff4444';
                        return <span key={j} style={{ fontSize: 7, background: `${c}22`, color: c, padding: '1px 3px', fontFamily: 'var(--font-mono)' }}>{v}</span>;
                      })}</span>
                      <Spark data={d.spark} />
                      <span style={{ width: 52, textAlign: 'right', fontSize: 9, fontFamily: 'var(--font-mono)', color: '#888' }}>{d.amount}</span>
                      <span style={{ width: 10, textAlign: 'center', color: d.trend === 'up' ? '#44ff88' : d.trend === 'down' ? '#ff4444' : '#666', fontSize: 9 }}>{tr(d.trend)}</span>
                    </div>
                    {(d as any).signals?.map((s: any, si: number) => (
                      <div key={si} style={{ padding: '1px 0 1px 16px', fontSize: 8, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className={`dash-panel-badge ${s.tag === 'ALERT' ? 'badge-critical' : 'badge-warn'}`} style={{ fontSize: 7 }}>{s.tag}</span>{s.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="dash-panel-footer"><span style={{ color: '#8b5cf6', marginRight: 3 }}>AI</span> 降幅：荔湾(-3) 番禺(-2) | 上升：南沙(+5) 天河(+2)</div>
            </div>

            {/* Panel 2: Risk Radar (15 items) */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">风险雷达</span><span className="dash-panel-badge badge-critical">{MOCK.alerts.critical} CRITICAL</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.risks.map((r, i) => {
                  const lvlCls = r.level === 'CRITICAL' ? 'badge-critical' : r.level === 'HIGH' ? 'badge-high' : r.level === 'WARNING' ? 'badge-warn' : 'badge-info';
                  const lvlCol = r.level === 'CRITICAL' ? '#ff4444' : r.level === 'HIGH' ? '#ff8800' : '#ffaa00';
                  return (
                    <div key={i} className="dash-alert-item" style={{ cursor: 'pointer', borderLeft: `2px solid ${lvlCol}`, paddingLeft: 6 }} onClick={() => setDetailView({ type: 'risk', data: r })}>
                      <div className="dash-alert-source">
                        <span className={`dash-panel-badge ${lvlCls}`}>{r.level}</span><span>{r.type} · {r.name}</span>
                        <span style={{ marginLeft: 'auto', color: '#666', fontSize: 8 }}>{r.score}分</span>
                      </div>
                      <div className="dash-alert-title" style={{ fontSize: 10 }}>{r.detail}</div>
                    </div>
                  );
                })}
              </div>
              <div className="dash-panel-footer"><span style={{ color: '#8b5cf6' }}>AI</span> 优先：荔湾收缴+欠款双重风险 | 海珠消防+入住率</div>
            </div>

            {/* Panel 3: Revenue Pulse (11 items) */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">营收构成</span><span className="dash-panel-count">11项</span>
              </div>
              <div className="dash-panel-content">
                <div className="dash-metric-row" style={{ marginBottom: 6 }}>
                  <div className="dash-metric-card"><div className="dash-mc-label">已确认</div><div className="dash-mc-value" style={{ color: '#06b6d4' }}>¥1,840万</div><div className="dash-mc-sub" style={{ color: '#44ff88' }}>57.5%</div></div>
                  <div className="dash-metric-card"><div className="dash-mc-label">预计到账</div><div className="dash-mc-value" style={{ color: '#3388ff' }}>¥680万</div><div className="dash-mc-sub">21.3%</div></div>
                  <div className="dash-metric-card"><div className="dash-mc-label">逾期未收</div><div className="dash-mc-value" style={{ color: '#ff4444' }}>¥421万</div><div className="dash-mc-sub">13.2%</div></div>
                </div>
                {MOCK.revenueItems.map(r => (
                  <div key={r.name} className="dash-data-row" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'revenue', data: r })}>
                    <span style={{ flex: 1, fontSize: 9, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${r.pct}%`, background: r.color }} /></div>
                    <span style={{ width: 52, textAlign: 'right', fontSize: 9, fontFamily: 'var(--font-mono)', color: '#888' }}>{r.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4: Occupancy Details */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">入住率明细</span><span className="dash-panel-count">8区</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.districts.map(d => (
                  <div key={d.name} className="dash-data-row">
                    <span style={{ width: 34, fontSize: 9, color: '#888' }}>{d.name}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${d.occupancy}%`, background: d.occupancy >= 75 ? '#44ff88' : d.occupancy >= 60 ? '#3388ff' : '#ffaa00' }} /></div>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: d.occupancy >= 75 ? '#44ff88' : d.occupancy >= 60 ? '#3388ff' : '#ffaa00', width: 28, textAlign: 'right' }}>{d.occupancy}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 5: Projects (12 items) */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">维修/改造项目</span><span className="dash-panel-count">{MOCK.projects.length}个</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.projects.map(p => (
                  <div key={p.name} className="dash-data-row" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'project', data: p })}>
                    <span className="dash-dot" style={{ background: statusColor(p.status), width: 4, height: 4 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9 }}>{p.name}</span>
                    <span style={{ fontWeight: 700, color: sc(p.phi), width: 20, textAlign: 'right', fontSize: 9, fontFamily: 'var(--font-mono)' }}>{p.phi}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${p.bar}%`, background: statusColor(p.status) }} /></div>
                    <span style={{ width: 28, textAlign: 'right', fontSize: 8, fontFamily: 'var(--font-mono)', color: p.remain < 0 ? '#ff4444' : p.remain < 15 ? '#ffaa00' : '#888' }}>{p.remain}d</span>
                    {p.sig && <span className="dash-panel-badge" style={{ fontSize: 7, background: 'rgba(255,68,68,.15)', color: '#ff4444' }}>{p.sig}</span>}
                  </div>
                ))}
              </div>
              <div className="dash-panel-footer"><span style={{ color: '#8b5cf6' }}>AI</span> 海珠外墙修复已逾期3天，建议紧急干预</div>
            </div>

            {/* Panel 6: Policy Monitor */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">政策监控</span><span className="dash-panel-count">{MOCK.policies.length}</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.policies.map(p => (
                  <div key={p.title} className="dash-alert-item" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'policy', data: p })}>
                    <div className="dash-alert-source">
                      <span className={`dash-panel-badge ${p.impact === '利好' ? 'badge-ok' : 'badge-info'}`}>{p.impact}</span>
                      <span>{p.source}</span><span style={{ marginLeft: 'auto', color: '#666' }}>{p.time}</span>
                    </div>
                    <div className="dash-alert-title" style={{ fontSize: 10 }}>{p.title}</div>
                    <div className="dash-item-meta" style={{ color: '#6b5cf6' }}>→ {p.linked}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 7: Vendor Ecosystem */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">供应商动态</span><span className="dash-panel-count">{MOCK.vendors.length}</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.vendors.map(v => (
                  <div key={v.name} className="dash-data-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, cursor: 'pointer' }} onClick={() => setDetailView({ type: 'vendor', data: v })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 9 }}>{v.name}</span>
                      <span className={`dash-panel-badge ${v.level === 'HIGH' ? 'badge-critical' : v.level === 'MEDIUM' ? 'badge-warn' : 'badge-info'}`} style={{ fontSize: 7 }}>{v.level}</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#ccc' }}>{v.event}</div>
                    <div style={{ fontSize: 8, color: '#666' }}>→ {v.impact} · {v.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 8: Contract Risk */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">合同风险</span><span className="dash-panel-badge badge-critical">{MOCK.contracts.length}项</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.contracts.map(c => (
                  <div key={c.district} className="dash-data-row" style={{ cursor: 'pointer', borderLeft: `2px solid ${c.status === '已逾期' ? '#ff4444' : '#ffaa00'}`, paddingLeft: 6, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} onClick={() => setDetailView({ type: 'contract', data: c })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 9 }}>
                      <span>{c.district} · {c.type}</span>
                      <span style={{ color: c.status === '已逾期' ? '#ff4444' : '#ffaa00', fontWeight: 600 }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{c.amount}</div>
                    <div style={{ fontSize: 8, color: '#666' }}>{c.tenant}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 9: Service Orders */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">客户服务工单</span><span className="dash-panel-badge badge-warn">32</span>
              </div>
              <div className="dash-panel-content">
                {[
                  { n: '报修申请', v: 14, s: '3未处理', c: '#ffaa00' },
                  { n: '投诉建议', v: 8, s: '1升级', c: '#ff4444' },
                  { n: '咨询查询', v: 6, s: '已回复', c: '#44ff88' },
                  { n: '退租申请', v: 3, s: '2待审核', c: '#ffaa00' },
                  { n: '续租办理', v: 5, s: '处理中', c: '#3388ff' },
                  { n: '缴费咨询', v: 7, s: '已回复', c: '#44ff88' },
                ].map(x => (
                  <div key={x.n} className="dash-data-row" style={{ cursor: 'pointer' }} onClick={() => setDetailView({ type: 'service', data: x })}>
                    <span style={{ flex: 1, fontSize: 9 }}>{x.n}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: x.c, width: 20, textAlign: 'right' }}>{x.v}</span>
                    <span style={{ fontSize: 8, color: x.c, width: 50, textAlign: 'right' }}>{x.s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 10: Property Pipeline (funnel) */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <span className="dash-panel-title">房源流转漏斗</span><span className="dash-panel-count">{'¥8,400万'}</span>
              </div>
              <div className="dash-panel-content">
                {MOCK.pipeline.map(p => (
                  <div key={p.stage} className="dash-data-row" style={{ padding: '2px 0', cursor: 'pointer' }} onClick={() => setDetailView({ type: 'pipeline', data: p })}>
                    <span style={{ width: 48, fontSize: 9, color: '#ccc', flexShrink: 0 }}>{p.stage}</span>
                    <span style={{ width: 24, textAlign: 'right', fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ccc', flexShrink: 0 }}>{p.count}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${p.pct}%`, background: p.color }} /></div>
                    <span style={{ width: 48, textAlign: 'right', fontSize: 8, color: '#888', fontFamily: 'var(--font-mono)' }}>{p.amount}</span>
                    {p.signal && <span style={{ fontSize: 8, color: '#ffaa00', flexShrink: 0 }}>{p.signal}</span>}
                  </div>
                ))}
              </div>
              <div className="dash-panel-footer"><span style={{ color: '#8b5cf6' }}>AI</span> 资格审核阶段56户排队，建议增派人手</div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="dash-footer">
        <span className="dash-footer-brand">广州安居集团</span>
        <span style={{ fontSize: 8, color: '#555' }}>AI 资产管理平台 v1.0 · 数据源: omnidemo.insights (12,306条)</span>
        <span style={{ fontSize: 8, color: '#666' }}>© 2026 Anju Group</span>
      </footer>

      {/* ===== DETAIL MODAL ===== */}
      {detailView && (() => {
        const { type, data } = detailView;
        const title = type === 'district' ? `${data.name} · 区域详情` :
                      type === 'risk' ? `${data.name} · 风险详情` :
                      type === 'project' ? `${data.name} · 项目详情` :
                      type === 'contract' ? `${data.district} · 合同详情` :
                      type === 'vendor' ? `${data.name} · 供应商详情` :
                      type === 'policy' ? `政策详情` : '详情';
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)' }}
            onClick={() => setDetailView(null)}>
            <div style={{ background: '#141414', border: '1px solid #2a2a2a', width: 'min(560px,92vw)', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #2a2a2a', background: '#111' }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, flex: 1, color: '#ccc' }}>{title}</span>
                <button onClick={() => setDetailView(null)} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', fontSize: 14, cursor: 'pointer', padding: '0 6px', lineHeight: '20px' }}>×</button>
              </div>
              <div style={{ padding: 14, color: '#ccc', fontSize: 11, lineHeight: 1.7 }}>
                {type === 'district' && (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {[{ l: '健康分', v: data.score, c: sc(data.score) }, { l: '入住率', v: data.occupancy + '%', c: sc(data.occupancy) }, { l: '收缴率', v: data.collection + '%', c: sc(data.collection) }, { l: '维修分', v: data.maint, c: sc(data.maint) }, { l: '安全分', v: data.safety, c: sc(data.safety) }].map(k => (
                        <div key={k.l} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', padding: 8, textAlign: 'center', borderRadius: 4 }}>
                          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>{k.l}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: k.c }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.name} · {data.properties}个楼盘 · {data.amount}</div>
                    <div style={{ color: '#888' }}>趋势: {data.trend === 'up' ? '上升 ▲' : data.trend === 'down' ? '下降 ▼' : '持平 ─'}</div>
                    {data.signals && <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,68,68,.06)', borderLeft: '2px solid #ff4444', borderRadius: 4 }}>{data.signals.map((s: any, i: number) => <div key={i} style={{ fontSize: 10, marginBottom: 2 }}><span style={{ color: s.tag === 'ALERT' ? '#ff4444' : '#ffaa00', fontWeight: 600 }}>{s.tag}</span> {s.text}</div>)}</div>}
                  </>
                )}
                {type === 'risk' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.detail}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>级别</div><div style={{ fontSize: 16, fontWeight: 700, color: data.level === 'CRITICAL' ? '#ff4444' : '#ffaa00' }}>{data.level}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>区域</div><div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8' }}>{data.name}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>类型</div><div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8' }}>{data.type}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>健康分</div><div style={{ fontSize: 16, fontWeight: 700, color: sc(data.score) }}>{data.score}</div></div>
                    </div>
                  </>
                )}
                {type === 'project' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.name} · {data.type}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      {[{ l: 'PHI', v: data.phi, c: sc(data.phi) }, { l: '剩余天数', v: data.remain + 'd', c: data.remain > 0 ? '#44ff88' : '#ff4444' }, { l: '状态', v: data.status, c: statusColor(data.status) }, { l: '进度', v: data.bar + '%', c: '#3388ff' }].map(k => (
                        <div key={k.l} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', padding: 8, textAlign: 'center', borderRadius: 4 }}>
                          <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>{k.l}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: k.c }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    {data.sig && <div style={{ padding: 8, background: 'rgba(255,68,68,.06)', borderLeft: '2px solid #ff4444', borderRadius: 4, fontSize: 10 }}>
                      <span style={{ color: '#ff4444', fontWeight: 600 }}>WARNING</span> {data.sig}
                    </div>}
                  </>
                )}

                {type === 'policy' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4 }}><div style={{ fontSize: 9, color: '#888' }}>来源</div><div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{data.source}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4 }}><div style={{ fontSize: 9, color: '#888' }}>影响</div><div style={{ fontSize: 14, fontWeight: 600, color: data.impact === '利好' ? '#44ff88' : '#3388ff' }}>{data.impact}</div></div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8b5cf6' }}>→ {data.linked}</div>
                  </>
                )}
                {type === 'contract' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.district} · {data.type} · {data.amount}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>到期日</div><div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8e8' }}>{data.expire}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>状态</div><div style={{ fontSize: 16, fontWeight: 700, color: data.status === '已逾期' ? '#ff4444' : '#ffaa00' }}>{data.status}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>租户</div><div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{data.tenant}</div></div>
                    </div>
                  </>
                )}
                {type === 'vendor' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.name}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>事件等级</div><div style={{ fontSize: 16, fontWeight: 700, color: data.level === 'HIGH' || data.level === 'CRITICAL' ? '#ff4444' : data.level === 'MEDIUM' ? '#ffaa00' : '#3388ff' }}>{data.level}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>时间</div><div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{data.time}</div></div>
                    </div>
                    <div style={{ background: '#111', padding: 10, borderRadius: 4, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>最新事件</div>
                      <div style={{ fontSize: 11, color: '#ccc' }}>{data.event}</div>
                    </div>
                    <div style={{ background: '#111', padding: 10, borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>影响评估</div>
                      <div style={{ fontSize: 11, color: '#ffaa00' }}>{data.impact}</div>
                    </div>
                  </>
                )}
                {type === 'news' && (
                  <>
                    <div style={{ fontSize: 12, color: '#e8e8e8', marginBottom: 8 }}>{data.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>级别</div><div style={{ fontSize: 16, fontWeight: 700, color: data.level === 'CRITICAL' ? '#ff4444' : data.level === 'HIGH' ? '#ff8800' : '#ffaa00' }}>{data.level}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>来源</div><div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{data.source}</div></div>
                      <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>时间</div><div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{data.time}</div></div>
                    </div>
                    <div style={{ background: '#111', padding: 10, borderRadius: 4, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>详细信息</div>
                      <div style={{ fontSize: 11, color: '#ccc' }}>{data.meta}</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(139,92,246,.06)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: '#8b5cf6' }}>{data.action}</div>
                    </div>
                  </>
                )}
                {type === 'revenue' && (<>
                  <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 8, fontWeight: 600 }}>{data.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>收缴率</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: data.pct >= 75 ? '#44ff88' : '#ffaa00' }}>{data.pct}%</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>金额</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#e8e8e8' }}>{data.amount}</div></div>
                  </div>
                </>)}
                {type === 'pipeline' && (<>
                  <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 8, fontWeight: 600 }}>{data.stage}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>数量</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#3388ff' }}>{data.count}</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>金额</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#e8e8e8' }}>{data.amount}</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>占比</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: data.color }}>{data.pct}%</div></div>
                  </div>
                  {data.signal && <div style={{ fontSize: 11, color: '#ffaa00', padding: 6, background: 'rgba(255,170,0,.06)', borderRadius: 4 }}>Status: {data.signal}</div>}
                </>)}
                {type === 'service' && (<>
                  <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 8, fontWeight: 600 }}>{data.n}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>Count</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: data.c }}>{data.v}</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>Status</div><div style={{ fontSize: 16, fontWeight: 600, color: data.c }}>{data.s}</div></div>
                  </div>
                </>)}
                {type === 'arrears' && (<>
                  <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 8, fontWeight: 600 }}>{data.district}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>Amount</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#ffaa00' }}>{data.amount}</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>Units</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#e8e8e8' }}>{data.count}</div></div>
                    <div style={{ flex: 1, background: '#111', padding: 8, borderRadius: 4, textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>Trend</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: data.trend.startsWith('+') ? '#ff4444' : '#44ff88' }}>{data.trend}</div></div>
                  </div>
                  <div style={{ fontSize: 10, color: '#888' }}>{data.detail}</div>
                </>)}
                {type === 'milestone' && (<>
                  <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 8, fontWeight: 600 }}>{data.t}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: data.c, marginBottom: 8 }}>{data.d}</div>
                </>)}
                <div style={{ borderTop: '1px solid #2a2a2a', marginTop: 10, paddingTop: 10, fontSize: 10, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>AI</span> 已记录此条目，系统将持续监控更新。
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== MODAL ===== */}
      {modalToast && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)' }}
          onClick={() => setModalToast(null)}>
          <div style={{ background: '#141414', border: '1px solid #2a2a2a', width: 'min(480px,92vw)', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #2a2a2a', background: '#111' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>洞察详情</span>
              <span style={{ fontSize: 10, color: '#3388ff', cursor: 'pointer' }} onClick={() => (window as any).__switchPage('data')}>更多 →</span>
<button onClick={() => setModalToast(null)} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', fontSize: 14, cursor: 'pointer', padding: '0 6px', lineHeight: '20px' }}>×</button>
            </div>
            <div style={{ padding: 14, maxHeight: '70vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: modalToast.type === 'critical' ? 'rgba(255,68,68,.15)' : 'rgba(255,170,0,.15)', color: modalToast.type === 'critical' ? '#ff4444' : '#ffaa00' }}>{modalToast.tag}</span>
                {modalToast.district && <span style={{ color: '#888', fontSize: 11 }}>{modalToast.district}</span>}
                <span style={{ marginLeft: 'auto', color: '#666', fontSize: 9 }}>{modalToast.time}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, borderLeft: `3px solid ${modalToast.type === 'critical' ? '#ff4444' : '#ffaa00'}`, paddingLeft: 10, marginBottom: 12 }}>{modalToast.text}</div>
              {/* Detail fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, marginBottom: 12 }}>
                <div><span style={{ color: '#666' }}>洞察类型：</span><span style={{ color: '#ccc' }}>{INSIGHT_TYPE_LABEL[modalToast.insight_type as keyof typeof INSIGHT_TYPE_LABEL] || modalToast.insight_type || '—'}</span></div>
                <div><span style={{ color: '#666' }}>风险等级：</span><span style={{ color: modalToast.severity === 'critical' ? '#ff4444' : '#ffaa00' }}>{SEVERITY_LABEL[modalToast.severity as keyof typeof SEVERITY_LABEL] || modalToast.severity || '—'}</span></div>
                <div><span style={{ color: '#666' }}>结论类型：</span><span style={{ color: '#ccc' }}>{modalToast.conclusion_type || '—'}</span></div>
                <div><span style={{ color: '#666' }}>指标值：</span><span style={{ color: '#ccc' }}>{modalToast.metric_value ?? '—'}</span></div>
                <div><span style={{ color: '#666' }}>正常范围：</span><span style={{ color: '#ccc' }}>{modalToast.normal_range || '—'}</span></div>
                <div><span style={{ color: '#666' }}>偏离度：</span><span style={{ color: modalToast.deviation && Number(modalToast.deviation) > 50 ? '#ff4444' : '#ffaa00' }}>{modalToast.deviation ? Number(modalToast.deviation).toFixed(2) + '%' : '—'}</span></div>
              </div>
              {modalToast.notes && <><div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>备注</div><div style={{ fontSize: 11, color: '#ccc', marginBottom: 10, lineHeight: 1.5 }}>{modalToast.notes}</div></>}
              {modalToast.analysis && <><div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>分析过程</div><div style={{ fontSize: 11, color: '#ccc', marginBottom: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{modalToast.analysis}</div></>}
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>AI 建议</div>
              <div style={{ fontSize: 11, color: '#8b5cf6', lineHeight: 1.5 }}>
                {modalToast.type === 'critical' ? '紧急事项，建议24h内启动处理流程。' : '高优先级，建议48h内跟进处理。'}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #2a2a2a', padding: '8px 14px', fontSize: 9, color: '#888' }}>
              <span style={{ color: '#8b5cf6' }}>AI</span> 系统已自动通知相关负责人
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
