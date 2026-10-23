/**
 * Bangkok Metropolitan Administration (BMA) Department of Drainage and Sewerage (DDS) Provider
 * สำนักการระบายน้ำ กรุงเทพมหานคร
 * Real-time road flood telemetry from 254 sensors across Bangkok: https://floodbangkok.bangkok.go.th
 */

import { TelemetryStation, SeverityLevel } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';

const BMA_PROFILE_URL = 'https://floodbangkok.bangkok.go.th/bkk/dds/services/api/floods/v1/items/sensor_profile?limit=350';
const BMA_RECORD_URL = 'https://floodbangkok.bangkok.go.th/api/flood/dashboard/last-record?limit=350';

function determineFloodSeverity(floodNowCm: number): { severity: SeverityLevel; label: string } {
  if (floodNowCm >= 15) {
    return { severity: 'red', label: 'วิกฤต (น้ำท่วมสูง รถเล็กไม่ควรผ่าน)' };
  }
  if (floodNowCm >= 5) {
    return { severity: 'orange', label: 'เตือนภัย (น้ำท่วมผิวจราจร 5-15 ซม.)' };
  }
  if (floodNowCm > 0) {
    return { severity: 'yellow', label: 'เฝ้าระวัง (น้ำรอการระบาย 1-5 ซม.)' };
  }
  return { severity: 'green', label: 'ปกติ (ผิวจราจรแห้ง ไม่มีน้ำท่วมขัง)' };
}

export async function fetchBmaRoadFloods(timeoutMs: number = 8000): Promise<DataResult<TelemetryStation[]>> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThailandFloodTracker/2.0',
      'Referer': 'https://floodbangkok.bangkok.go.th/',
      'Accept': 'application/json',
    };

    const [profileRes, recordRes] = await Promise.all([
      fetch(BMA_PROFILE_URL, { signal: controller.signal, headers, next: { revalidate: 180 } }),
      fetch(BMA_RECORD_URL, { signal: controller.signal, headers, next: { revalidate: 60 } }),
    ]);

    clearTimeout(timer);

    if (!profileRes.ok || !recordRes.ok) {
      return {
        data: null,
        source: 'สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS Flood)',
        sourceAgency: 'BMA',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: `HTTP Profile: ${profileRes.status}, Record: ${recordRes.status}`,
      };
    }

    const profileJson = await profileRes.json();
    const recordJson = await recordRes.json();

    const rawProfiles: any[] = profileJson?.data || [];
    const rawRecords: any[] = recordJson?.data || [];

    if (!Array.isArray(rawProfiles) || rawProfiles.length === 0) {
      return {
        data: null,
        source: 'สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS Flood)',
        sourceAgency: 'BMA',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: 'Empty sensor profile array from BMA DDS',
      };
    }

    // Map records by sensor_profile id and code
    const recordMap = new Map<string, any>();
    rawRecords.forEach((r) => {
      if (r?.sensor_profile?.id) recordMap.set(String(r.sensor_profile.id), r);
      if (r?.sensor_profile?.code) recordMap.set(String(r.sensor_profile.code), r);
    });

    let latestObservedAt: string | null = null;

    const normalizedStations: TelemetryStation[] = rawProfiles
      .filter((p) => {
        const lat = Number(p?.lat);
        const lng = Number(p?.long);
        return !isNaN(lat) && !isNaN(lng) && lat > 13.4 && lat < 14.1 && lng > 100.2 && lng < 100.9;
      })
      .map((p) => {
        const lat = Number(p.lat);
        const lng = Number(p.long);
        const record = recordMap.get(String(p.id)) || recordMap.get(String(p.code));

        const floodNowCm = record?.flood_now !== null && record?.flood_now !== undefined 
          ? Math.max(0, Number(record.flood_now)) 
          : 0;

        const { severity, label } = determineFloodSeverity(floodNowCm);
        const observedAt = record?.timestamp ? new Date(record.timestamp).toISOString() : fetchedAt;
        if (!latestObservedAt || observedAt > latestObservedAt) {
          latestObservedAt = observedAt;
        }

        const districtName = p.district ? `เขต${p.district.replace(/^เขต/, '')}` : 'กรุงเทพมหานคร';
        const isFlooded = floodNowCm > 0;
        const statusText = isFlooded
          ? `ระดับน้ำท่วมผิวจราจร ${floodNowCm.toFixed(1)} ซม. (${label})`
          : 'ระดับผิวจราจรปกติ ไม่มีน้ำท่วมขัง (ตรวจวัดจากเซนเซอร์)';

        return {
          id: `bma-road-${p.id}`,
          station_code: p.code || `FL.BKK.${p.id}`,
          name_th: `${p.name || 'จุดตรวจวัดน้ำท่วมถนน'} (${districtName})`,
          name_en: p.road || p.name,
          basin_name: 'ลุ่มน้ำเจ้าพระยาตอนล่าง (พื้นที่ กทม.)',
          river_name: p.road || 'ถนนสายหลัก กทม.',
          province: 'bangkok',
          district: districtName,
          subdistrict: p.road || '',
          latitude: lat,
          longitude: lng,
          station_type: 'highway_flood',
          water_depth_cm: floodNowCm,
          passable_for_vehicles: floodNowCm < 15,
          route_number: p.road || 'ถนน กทม.',
          km_point: p.main_road ? 'ถนนสายหลัก' : 'ถนนสายรอง/ซอย',
          severity,
          severity_label: label,
          status_text: statusText,
          observed_at: observedAt,
          fetched_at: fetchedAt,
          data_status: 'LIVE' as DataStatus,
          source_agency: 'BMA DDS',
          source_name_th: 'สำนักการระบายน้ำ กรุงเทพมหานคร (ระบบ Flood BMA)',
          source_url: 'https://floodbangkok.bangkok.go.th',
        };
      });

    return {
      data: normalizedStations,
      source: 'สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS 254 เซนเซอร์น้ำท่วมถนน)',
      sourceAgency: 'BMA',
      status: 'LIVE',
      fetchedAt,
      observedAt: latestObservedAt || fetchedAt,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      data: null,
      source: 'สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS Flood)',
      sourceAgency: 'BMA',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: err?.message || 'Network exception connecting to BMA DDS API',
    };
  }
}
