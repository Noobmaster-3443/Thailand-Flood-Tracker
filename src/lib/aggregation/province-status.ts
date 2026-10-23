/**
 * Province-level Flood Status Calculation Engine
 * Follows Rule #9: Status is strictly computed from verified observations and clear rules,
 * storing underlying evidence for full transparency.
 */

import { TelemetryStation, DamReservoirInfo, HighwayDisasterAlert, SHOW_STATIC_HIGHWAY_ALERTS } from '@/types/telemetry';
import { ThailandProvince } from '@/data/thailand-provinces';
import { ProvinceFloodStatus, ProvinceStatusReport, DataStatus } from '../providers/types';

interface StatusInput {
  province: ThailandProvince;
  stations: TelemetryStation[];
  dams: DamReservoirInfo[];
  highways: HighwayDisasterAlert[];
  rainfallStations?: TelemetryStation[];
}

export function calculateProvinceStatus(input: StatusInput): ProvinceStatusReport {
  const { province, stations, dams, highways, rainfallStations = [] } = input;
  const effectiveHighways = SHOW_STATIC_HIGHWAY_ALERTS ? highways : [];
  const evidence: string[] = [];
  const sourcesSet = new Set<string>();

  // Filter stations for this province (exclude STATIC fallback records from active status calculations)
  const provStations = stations.filter((s) => s.province === province.id);
  const provRainStations = rainfallStations.filter((s) => s.province === province.id);
  const provDams = dams.filter((d) => d.province === province.id);
  const provHighways = effectiveHighways.filter((h) => h.province === province.id);

  // Active verified observations (exclude STATIC data from triggering active flood status)
  const activeProvStations = provStations.filter((s) => s.data_status !== 'STATIC');
  const activeProvRainStations = provRainStations.filter((s) => s.data_status !== 'STATIC');
  const activeProvDams = provDams.filter((d) => d.data_status !== 'STATIC');

  // 1. Water level metrics
  // Genuine overflow requires: severity is 'red' OR diff_from_bank is strictly positive (> 0)
  const overflowStations = activeProvStations.filter(
    (s) => s.severity === 'red' || (s.diff_from_bank !== undefined && s.diff_from_bank > 0)
  );
  const warningStations = activeProvStations.filter(
    (s) => s.severity === 'orange' || (s.capacity_percentage !== undefined && s.capacity_percentage >= 85)
  );
  const watchStations = activeProvStations.filter((s) => s.severity === 'yellow');

  if (overflowStations.length > 0) {
    evidence.push(
      `ระดับน้ำล้นตลิ่งวิกฤต ${overflowStations.length} สถานี (${overflowStations.map((s) => s.station_code).slice(0, 3).join(', ')})`
    );
  } else if (warningStations.length > 0) {
    evidence.push(
      `ระดับน้ำจ่อล้นตลิ่ง/เฝ้าระวังสูง ${warningStations.length} จุด (${warningStations.map((s) => s.station_code).slice(0, 3).join(', ')})`
    );
  }

  // 2. Rainfall metrics
  const allRainValues = [
    ...activeProvStations.map((s) => s.rain_24h_mm || 0),
    ...activeProvRainStations.map((s) => s.rain_24h_mm || 0),
  ];
  const maxRain24h = allRainValues.length > 0 ? Math.max(...allRainValues) : 0;

  if (maxRain24h >= 90) {
    evidence.push(`ฝนตกหนักมากใน 24 ชม. สูงสุด ${maxRain24h.toFixed(1)} มม.`);
  } else if (maxRain24h >= 35) {
    evidence.push(`ฝนตกหนักใน 24 ชม. สูงสุด ${maxRain24h.toFixed(1)} มม.`);
  } else if (maxRain24h >= 10) {
    evidence.push(`ฝนปานกลางใน 24 ชม. สูงสุด ${maxRain24h.toFixed(1)} มม.`);
  }

  // 3. Dam reservoir metrics
  let maxDamPercent = 0;
  activeProvDams.forEach((d) => {
    if (d.capacity_percentage > maxDamPercent) maxDamPercent = d.capacity_percentage;
    if (d.capacity_percentage >= 100) {
      evidence.push(`อ่างเก็บน้ำ ${d.name_th} น้ำเกินความจุ ${d.capacity_percentage}%`);
    } else if (d.capacity_percentage >= 90) {
      evidence.push(`อ่างเก็บน้ำ ${d.name_th} น้ำมาก ${d.capacity_percentage}%`);
    }
  });

  // 4. Highway flood cuts
  const impassableHighways = provHighways.filter((h) => !h.passable || h.passable_status === 'impassable');
  if (impassableHighways.length > 0) {
    evidence.push(
      `เส้นทางสัญจรถูกตัดขาด ${impassableHighways.length} จุด (${impassableHighways.map((h) => h.route_number).slice(0, 2).join(', ')})`
    );
  }

  // Collect source attributions and data freshness
  let hasLive = false;
  let hasStale = false;
  let latestObserved: string | null = null;

  [...provStations, ...provRainStations].forEach((s) => {
    if (s.data_status === 'LIVE') hasLive = true;
    if (s.data_status === 'STALE') hasStale = true;
    if (s.source_name_th) sourcesSet.add(s.source_name_th);
    if (!latestObserved || (s.observed_at && s.observed_at > latestObserved)) {
      latestObserved = s.observed_at;
    }
  });

  provDams.forEach((d) => {
    if (d.data_status === 'LIVE') hasLive = true;
    if (d.source_url) sourcesSet.add(d.agency);
    if (!latestObserved || (d.observed_at && d.observed_at > latestObserved)) {
      latestObserved = d.observed_at;
    }
  });

  const dataFreshness: DataStatus = hasLive ? 'LIVE' : hasStale ? 'STALE' : provStations.length > 0 ? 'STATIC' : 'UNAVAILABLE';

  // 5. Evaluate final status rule
  let status: ProvinceFloodStatus = 'NORMAL';
  let statusLabelTh = 'สถานการณ์ปกติ';

  if (activeProvStations.length === 0 && activeProvRainStations.length === 0 && activeProvDams.length === 0) {
    status = 'UNAVAILABLE';
    statusLabelTh = 'ไม่มีข้อมูลสด';
    evidence.push('ระบบไม่ได้รับข้อมูลโทรมาตรตรวจวัดสดจากหน่วยงานในพื้นที่ ณ ขณะนี้');
  } else if (overflowStations.length > 0 || impassableHighways.length > 0) {
    status = 'CRITICAL';
    statusLabelTh = 'วิกฤต / ล้นตลิ่ง';
  } else if (warningStations.length > 0 || maxDamPercent >= 95) {
    status = 'FLOODING';
    statusLabelTh = 'เสี่ยงภัยน้ำท่วมสูง';
  } else if (watchStations.length > 0 || maxDamPercent >= 85) {
    status = 'WARNING';
    statusLabelTh = 'เตือนภัย / จ่อล้น';
  } else if (maxRain24h >= 35 || provHighways.length > 0) {
    status = 'WATCH';
    statusLabelTh = 'เฝ้าระวัง';
  } else if (provStations.length === 0 && provRainStations.length === 0 && provDams.length === 0) {
    status = 'UNKNOWN';
    statusLabelTh = 'ไม่มีจุดตรวจวัดในพื้นที่';
    evidence.push('ยังไม่มีข้อมูลโทรมาตรตรวจวัดสดในจังหวัดนี้');
  }

  if (evidence.length === 0) {
    evidence.push('ระดับน้ำและปริมาณฝนสะสมทุกจุดอยู่ในเกณฑ์ปกติ');
  }

  return {
    provinceId: province.id,
    provinceCode: province.code,
    provinceNameTh: province.name_th,
    provinceNameEn: province.name_en,
    region: province.region,
    regionTh: province.region_th,
    status,
    statusLabelTh,
    dataFreshness,
    evidence,
    metrics: {
      stationCount: provStations.length + provRainStations.length,
      overflowCount: overflowStations.length,
      warningCount: warningStations.length,
      maxRain24h,
      damStoragePercent: maxDamPercent > 0 ? maxDamPercent : undefined,
      impassableRoadCount: impassableHighways.length,
      shelterCount: 0,
    },
    sources: Array.from(sourcesSet),
    observedAt: latestObserved,
    updatedAt: new Date().toISOString(),
  };
}
