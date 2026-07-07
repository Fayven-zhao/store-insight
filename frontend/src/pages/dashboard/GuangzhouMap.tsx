import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { saleProperties, rentalProperties, marketProperties } from './propertyData';
import boundaryData from './gz_boundary.json';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

const DISTRICTS = [
  { name: '天河区', lng: 113.3616, lat: 23.1247, properties: 35, score: 78 },
  { name: '越秀区', lng: 113.2670, lat: 23.1285, properties: 28, score: 82 },
  { name: '海珠区', lng: 113.3172, lat: 23.0833, properties: 42, score: 68 },
  { name: '荔湾区', lng: 113.2440, lat: 23.1259, properties: 22, score: 55 },
  { name: '白云区', lng: 113.2732, lat: 23.1572, properties: 55, score: 72, labelOffset: [-0.03, 0.04] },
  { name: '番禺区', lng: 113.3841, lat: 22.9379, properties: 38, score: 65 },
  { name: '黄埔区', lng: 113.4806, lat: 23.1064, properties: 31, score: 75 },
  { name: '南沙区', lng: 113.5252, lat: 22.8015, properties: 15, score: 88 },
  { name: '花都区', lng: 113.2203, lat: 23.4042, properties: 18, score: 60 },
  { name: '增城区', lng: 113.8109, lat: 23.2615, properties: 12, score: 52 },
  { name: '从化区', lng: 113.5864, lat: 23.5484, properties: 8, score: 45 },
];

const sc = (s: number) => s >= 80 ? '#22d3a0' : s >= 65 ? '#38bdf8' : s >= 50 ? '#fbbf24' : '#f87171';

interface DistrictData { center: { lng: number; lat: number }; properties: number; score: number; name: string; labelOffset?: [number, number]; }
export interface MapLayers { showSale: boolean; showRental: boolean; showMarket: boolean; showLabels: boolean; showMarkers: boolean; }
interface Props { layers?: MapLayers }

const GuangzhouMap: React.FC<Props> = ({ layers = { showSale: true, showRental: false, showMarket: false, showLabels: false, showMarkers: false } }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const districtDataRef = useRef<DistrictData[]>([]);
  const dmRef = useRef<L.Layer[]>([]);
  const pmRef = useRef<{ sale: Array<{ dot: L.CircleMarker; label: L.Marker }>; rental: Array<{ dot: L.CircleMarker; label: L.Marker }>; market: Array<{ dot: L.CircleMarker; label: L.Marker }> }>({ sale: [], rental: [], market: [] });
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const clearMarkers = () => { dmRef.current.forEach(m => m.remove()); dmRef.current = []; };
  const renderMarkers = (map: L.Map) => {
    clearMarkers();
    const zoom = map.getZoom();
    console.log('renderMarkers: zoom=', zoom, 'showLabels=', layers.showLabels, 'districts=', districtDataRef.current.length);
    districtDataRef.current.forEach(d => {
      const color = sc(d.score);
      const off = d.labelOffset || [0, 0];
      const la = d.center.lat + off[1], lo = d.center.lng + off[0];
      let r: number, fs: number, sn: boolean, sd: boolean;
      const curL = layersRef.current.showLabels;
      if (zoom < 9) { r = curL ? 4 : 3; fs = curL ? 11 : 0; sn = curL; sd = false; }
      else if (zoom < 11) { r = Math.max(4, Math.sqrt(d.properties) * 1.2); fs = 11; sn = true; sd = false; }
      else { r = Math.max(6, Math.sqrt(d.properties) * 1.5); fs = 13; sn = true; sd = true; }
      const cur = layersRef.current;
      if (!cur.showMarkers) { r = 0; sd = false; }
      if (!cur.showLabels) { sn = false; sd = false; }
      if (r > 0) {
        const dot = L.circleMarker([la, lo], { radius: r, fillColor: color, fillOpacity: 0.9, color: '#e0e8e4', weight: 1.5 });
        dot.addTo(map); dmRef.current.push(dot);
        L.circleMarker([la, lo], { radius: r + 3, fillColor: color, fillOpacity: 0.15, color: 'transparent', weight: 0 }).addTo(map);
      }
      if (sn) {
        const lb = L.marker([la, lo], { icon: L.divIcon({ className: '', html: `<div style="color:#e0e8e4;font-size:${fs}px;font-weight:600;font-family:'PingFang SC','Microsoft YaHei',sans-serif;text-align:center;pointer-events:none;white-space:nowrap;text-shadow:0 0 8px rgba(0,0,0,.8)">${d.name}</div>`, iconSize: [80,20], iconAnchor: [40, r+(fs>11?14:10)] }) });
        lb.addTo(map); dmRef.current.push(lb);
      }
      if (sd) {
        const dl = L.marker([la, lo], { icon: L.divIcon({ className: '', html: `<div style="color:#5a6e68;font-size:9px;font-family:'SF Mono',monospace;text-align:center;pointer-events:none;white-space:nowrap">${d.properties}盘</div>`, iconSize: [60,14], iconAnchor: [30,-r-6] }) });
        dl.addTo(map); dmRef.current.push(dl);
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const map = L.map(mapRef.current, { center: [23.1247, 113.3616], zoom: 10, minZoom: 8, maxZoom: 14, zoomControl: false, attributionControl: false });
    mapInst.current = map;
    L.tileLayer('/tiles/{z}/{x}/{y}.png', { maxZoom: 18, maxNativeZoom: 14, minZoom: 7 }).addTo(map);

    // --- Property markers ---
    const popupHTML = (p: any, type: string, color: string) =>
      `<div style="font-family:sans-serif;font-size:13px;line-height:1.8"><span style="color:#888">房源类型：</span><span style="color:${color};font-weight:600">${type}</span><br/><span style="color:#888">房源名称：</span><b>${p.name}</b><br/><span style="color:#888">所属区域：</span>${p.area}<br/><span style="color:#888">其他信息：</span>${p.detail}</div>`;

    const addOne = (p: any, color: string, type: string, visible: boolean, labelVisible: boolean) => {
      const dot = L.circleMarker([p.lat, p.lng], {
        radius: 7,
        fillColor: color, fillOpacity: visible ? 0.88 : 0,
        color: visible ? '#fff' : 'transparent', weight: visible ? 2 : 0,
        interactive: true,
      }).addTo(map);
      dot.bindTooltip(`${type}: <b>${p.name}</b><br/>${p.detail}`, { direction: 'top', offset: [0, -10] });
      dot.bindPopup(popupHTML(p, type, color), { maxWidth: 320 });

      const lbl = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '',
        html: `<div class="prop-label" style="color:#e8e8e8;font-size:11px;font-weight:600;font-family:'PingFang SC','Microsoft YaHei',sans-serif;pointer-events:none;text-align:center;white-space:nowrap;text-shadow:0 0 6px rgba(0,0,0,.9)">${p.name}</div>`,
        iconSize: [120, 16], iconAnchor: [60, -12], }), interactive: false }).addTo(map);

      return { dot, label: lbl };
    };

    saleProperties.forEach(p => pmRef.current.sale.push(addOne(p, '#ff4444', '配售型保障住房', true, true)));
    rentalProperties.forEach(p => pmRef.current.rental.push(addOne(p, '#3388ff', '公共租赁住房', false, false)));
    marketProperties.forEach(p => pmRef.current.market.push(addOne(p, '#f59e0b', '市场化聚合房源', false, false)));

    // Rental/market labels only at zoom >= 12
    const updatePropLabels = () => {
      const z = map.getZoom();
      const cur = layersRef.current;
      const show = z >= 12;
      const update = (arr: Array<{ dot: L.CircleMarker; label: L.Marker }>, layerOn: boolean) => {
        if (!layerOn) return;
        arr.forEach(x => { const el = x.label.getElement(); if (el) el.style.display = show ? 'block' : 'none'; });
      };
      update(pmRef.current.rental, cur.showRental);
      update(pmRef.current.market, cur.showMarket);
    };
    map.on('zoomend', updatePropLabels);
    updatePropLabels();


    // --- Boundaries ---
    const data = boundaryData as any;
    if (data.city) {
      data.city.forEach((ring: number[][]) => {
        L.polygon(ring.map(([lng, lat]) => [lat, lng]), { color: '#ffffff', weight: 2, fill: false, opacity: 0.6, dashArray: '8,4', interactive: false }).addTo(map);
      });
    }
    if (data.districts) {
      data.districts.forEach((d: any) => {
        const gz = DISTRICTS.find(x => x.name === d.name);
        if (!gz) return;
        (d.boundaries || []).forEach((ring: number[][]) => {
          L.polygon(ring.map(([lng, lat]) => [lat, lng]), { color: '#2dd4bf', weight: 1.5, fill: true, fillColor: sc(gz.score), fillOpacity: 0.15, opacity: 0.6, interactive: false }).addTo(map);
        });
        if (d.center) districtDataRef.current.push({ center: { lng: d.center[0], lat: d.center[1] }, properties: gz.properties, score: gz.score, name: gz.name, labelOffset: (gz as any).labelOffset });
      });
    }
    renderMarkers(map);
    setLoaded(true);
    map.on('zoomend', () => renderMarkers(map));
    return () => { destroyed = true; mapInst.current?.remove(); mapInst.current = null; };
  }, []);

  // --- Layer toggle ---
  const toggle = (arr: Array<{ dot: L.CircleMarker; label: L.Marker }>, v: boolean) => {
    arr.forEach(x => {
      x.dot.setStyle({ fillOpacity: v ? 0.88 : 0, opacity: v ? 1 : 0, color: v ? '#fff' : 'transparent', weight: v ? 2 : 0 });
      const dotEl = (x.dot as any)._path;
      if (dotEl) {
        dotEl.style.pointerEvents = v ? 'auto' : 'none';
        dotEl.classList.toggle('marker-hidden', !v);
      }
      const el = x.label.getElement();
      if (el) el.style.display = v ? 'block' : 'none';
    });
  };
  useEffect(() => { toggle(pmRef.current.sale, layers.showSale); }, [layers.showSale]);
  useEffect(() => { toggle(pmRef.current.rental, layers.showRental); }, [layers.showRental]);
  useEffect(() => { toggle(pmRef.current.market, layers.showMarket); }, [layers.showMarket]);
  useEffect(() => { if (mapInst.current) renderMarkers(mapInst.current); }, [layers.showLabels, layers.showMarkers]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0d1a14' }}>
      {!loaded && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, color: '#5a6e68', fontSize: 11, fontFamily: 'monospace' }}>loading map...</div>}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {loaded && (<div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 14, fontSize: 10, fontFamily: 'sans-serif', zIndex: 50, background: 'rgba(6,18,14,.9)', padding: '4px 14px', border: '1px solid #1a3a2e' }}>
        <span style={{ color: '#ff4444' }}>● 配售型</span>
        <span style={{ color: '#3388ff' }}>● 公租房</span>
        <span style={{ color: '#f59e0b' }}>● 市场公寓</span>
      </div>)}
    </div>
  );
};

export default GuangzhouMap;
