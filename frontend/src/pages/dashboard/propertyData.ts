// 安居集团房源位置数据
export interface Property {
  name: string; district: string; area: string; detail: string; lat: number; lng: number;
}

// 1. 配售型保障性住房
export const saleProperties: Property[] = [
  { name: '城隽玥府', district: '番禺区', area: '广州南站板块', detail: '75-90㎡ · ¥10,800/㎡', lat: 22.990, lng: 113.280 },
  { name: '望庐花园', district: '白云区', area: '望庐花园片区', detail: '65-79㎡ · ¥22,800/㎡', lat: 23.180, lng: 113.265 },
  { name: '黄埔萝岗和苑', district: '黄埔区', area: '长岭街道水西路以西', detail: '76-93㎡ · ¥15,800/㎡', lat: 23.185, lng: 113.480 },
  { name: '白云嘉翠苑', district: '白云区', area: '嘉禾联边地段', detail: '71-89㎡ · ¥17,300/㎡', lat: 23.220, lng: 113.280 },
];

// 2. 公共租赁住房
export const rentalProperties: Property[] = [
  { name: '榕悦花园', district: '黄埔区', area: '南岗广深大道沿线', detail: '2,835套', lat: 23.095, lng: 113.540 },
  { name: '棠悦花园', district: '天河区', area: '棠德南路34号', detail: '3,506套', lat: 23.132, lng: 113.370 },
  { name: '安厦花园', district: '天河区', area: '珠吉路38号', detail: '1,552套', lat: 23.128, lng: 113.410 },
  { name: '棠德花苑', district: '天河区', area: '棠德西路56号', detail: '7,763套', lat: 23.135, lng: 113.365 },
  { name: '广氮花园', district: '天河区', area: '车陂街道片区', detail: '1,790套', lat: 23.118, lng: 113.395 },
  { name: '大田花园', district: '黄埔区', area: '镇东路50号', detail: '98套', lat: 23.102, lng: 113.470 },
  { name: '亨元花园', district: '黄埔区', area: '亨元环街3号周边', detail: '990套', lat: 23.100, lng: 113.475 },
  { name: '瑞东花园', district: '黄埔区', area: '大沙东护林路沿线', detail: '3,072套', lat: 23.108, lng: 113.460 },
  { name: '苗和苑', district: '黄埔区', area: '黄埔东路216号周边', detail: '464套', lat: 23.095, lng: 113.485 },
  { name: '泰安花园', district: '天河区', area: '车陂路471号', detail: '225套', lat: 23.120, lng: 113.400 },
  { name: '萝岗和苑', district: '黄埔区', area: '水西路', detail: '7,947套', lat: 23.180, lng: 113.475 },
  { name: '保利瀚林花园', district: '黄埔区', area: '中山大道与黄埔大道交汇处', detail: '120套', lat: 23.105, lng: 113.455 },
  { name: '佳兆业盛世广场', district: '黄埔区', area: '开创大道沿线', detail: '3,162套', lat: 23.112, lng: 113.500 },
];

// 3. 市场化聚合房源
export const marketProperties: Property[] = [
  { name: '安居公寓·三元里店', district: '白云区', area: '地铁2号线三元里站周边', detail: '单间、一居室阳光房 · 近地铁', lat: 23.160, lng: 113.255 },
  { name: '安居公寓·小石集店', district: '白云区', area: '城中村改造租赁房源', detail: '平价轻奢单间 · ¥1,300起', lat: 23.170, lng: 113.270 },
  { name: '安居公寓·白云花园店', district: '白云区', area: '白云花园成熟片区', detail: '单间/一居/两居 · 配套齐全', lat: 23.175, lng: 113.280 },
  { name: '安居公寓·城品云荟', district: '白云区', area: '钟落潭镇长腰岭村', detail: '27-68㎡ · 518套 · ¥750起', lat: 23.380, lng: 113.400 },
  { name: '安居公寓·公园前店', district: '越秀区', area: '北京路商圈·公园前站', detail: 'LOFT复式/精装单间 · 市中心', lat: 23.128, lng: 113.265 },
  { name: '海珠片区门店', district: '海珠区', area: '沿线地铁站点全覆盖', detail: '一至两居整租', lat: 23.085, lng: 113.320 },
  { name: '黄埔片区门店', district: '黄埔区', area: '科学城/大沙东产业园区', detail: '企业人才整租公寓', lat: 23.160, lng: 113.455 },
];
