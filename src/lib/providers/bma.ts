/**
 * Bangkok Metropolitan Administration (BMA) Department of Drainage and Sewerage (DDS) Provider
 * สำนักการระบายน้ำ กรุงเทพมหานคร
 * Real-time and verified baseline road flood telemetry from 254 sensors across Bangkok: https://floodbangkok.bangkok.go.th
 */

import { TelemetryStation, SeverityLevel } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';
import bmaProfilesDataset from '@/data/bma-sensor-profiles.json';

const BMA_PROFILE_URL = 'https://floodbangkok.bangkok.go.th/bkk/dds/services/api/floods/v1/items/sensor_profile?limit=350';
const BMA_RECORD_URL = 'https://floodbangkok.bangkok.go.th/api/flood/dashboard/last-record?limit=350';

export interface BmaStaticProfile {
  id: number;
  code: string;
  name: string;
  road: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  main_road: boolean;
}

export const BMA_STATIC_PROFILES: BmaStaticProfile[] = (bmaProfilesDataset as any).sensors || [];

const MAX_STALENESS_MS = 3 * 60 * 60 * 1000; // 3 hours staleness threshold
const MAX_FUTURE_TOLERANCE_MS = 15 * 60 * 1000; // 15 minutes future clock tolerance

function determineFloodSeverity(floodNowCm: number | null | undefined): { severity: SeverityLevel; label: string } {
  if (floodNowCm === null || floodNowCm === undefined) {
    return { severity: 'yellow', label: 'รอสัญญาณตรวจวัดสด' };
  }
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

/**
 * Parses timestamp from BMA DDS upstream API.
 * Confirmed by live comparison with upstream server Date header:
 * The BMA DDS timestamp string (e.g. '2026-10-24T07:10:00' emitted at 07:15 GMT) is in UTC without timezone offset.
 * Converts to canonical ISO-8601 with explicit Z timezone.
 */
export function parseBmaTimestamp(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const str = String(ts).trim();
  if (!str) return null;

  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    d = new Date(str + 'Z');
  } else {
    d = new Date(str);
  }

  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Normalizes BMA sensors from verified static profiles merged with optional live records.
 * Ensures all verified BMA sensor locations remain visible even when upstream API is blocked or offline.
 */
export function buildBmaStations(
  profiles: Array<{ id: number; code?: string; name?: string; road?: string | null; district?: string | null; latitude?: number; lat?: number; longitude?: number; long?: number; main_road?: boolean }>,
  recordMap: Map<string, any>,
  fallbackTime: string
): { stations: TelemetryStation[]; latestObservedAt: string | null; hasLiveRecords: boolean } {
  let latestObservedAt: string | null = null;
  let hasLiveRecords = false;

  const stations: TelemetryStation[] = profiles
    .filter((p) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.long);
      return !isNaN(lat) && !isNaN(lng) && lat > 13.4 && lat < 14.1 && lng > 100.2 && lng < 100.9;
    })
    .map((p) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.long);
      const sensorId = p.id;
      const sensorCode = p.code || `FL.BKK.${sensorId}`;
      const record = recordMap.get(String(sensorId)) || recordMap.get(sensorCode);

      // Validate flood_now value strictly
      const rawFloodNow = record?.flood_now;
      const parsedFloodNow = rawFloodNow !== null && rawFloodNow !== undefined && rawFloodNow !== ''
        ? Number(rawFloodNow)
        : NaN;
      const hasValidMeasurement = !isNaN(parsedFloodNow);

      // Validate observation timestamp strictly
      const parsedTimestamp = parseBmaTimestamp(record?.timestamp);

      // Check device status and timestamp freshness (reject malfunction, stale > 3h, or far future)
      const rawDeviceStatus = record?.sensor_profile?.device_status;
      const isDeviceMalfunctioning = rawDeviceStatus === 'malfunction' || rawDeviceStatus === 'temporary_malfunction';

      const recordTime = parsedTimestamp ? new Date(parsedTimestamp).getTime() : NaN;
      const nowTime = fallbackTime ? new Date(fallbackTime).getTime() : Date.now();
      const isStale = !isNaN(recordTime) && !isNaN(nowTime) && (nowTime - recordTime > MAX_STALENESS_MS);
      const isFuture = !isNaN(recordTime) && !isNaN(nowTime) && (recordTime - nowTime > MAX_FUTURE_TOLERANCE_MS);

      let floodNowCm: number | undefined = undefined;
      let dataStatus: DataStatus = 'STATIC';
      let observedAt = '';

      if (hasValidMeasurement && parsedTimestamp && !isDeviceMalfunctioning && !isStale && !isFuture) {
        hasLiveRecords = true;
        dataStatus = 'LIVE';
        floodNowCm = Math.max(0, parsedFloodNow);
        observedAt = parsedTimestamp;
        if (!latestObservedAt || observedAt > latestObservedAt) {
          latestObservedAt = observedAt;
        }
      }

      const { severity, label } = determineFloodSeverity(floodNowCm);
      const districtName = p.district ? `เขต${p.district.replace(/^เขต/, '')}` : 'กรุงเทพมหานคร';
      const roadName = p.road || p.name || 'ถนน กทม.';

      let statusText: string;
      if (dataStatus === 'LIVE') {
        const isFlooded = (floodNowCm ?? 0) > 0;
        statusText = isFlooded
          ? `ระดับน้ำท่วมผิวจราจร ${floodNowCm!.toFixed(1)} ซม. (${label})`
          : 'ระดับผิวจราจรปกติ ไม่มีน้ำท่วมขัง (ตรวจวัดจากเซนเซอร์)';
      } else {
        statusText = 'จุดติดตั้งเซ็นเซอร์ตรวจวัดน้ำท่วม กทม. (รอสัญญาณตรวจวัดสดจากระบบ BMA DDS)';
      }

      return {
        id: `bma-road-${sensorId}`,
        station_code: sensorCode,
        name_th: `${p.name || 'จุดตรวจวัดน้ำท่วมถนน'} (${districtName})`,
        name_en: p.road || p.name || undefined,
        basin_name: 'ลุ่มน้ำเจ้าพระยาตอนล่าง (พื้นที่ กทม.)',
        river_name: roadName,
        province: 'bangkok',
        district: districtName,
        subdistrict: p.road || '',
        latitude: lat,
        longitude: lng,
        station_type: 'highway_flood',
        water_depth_cm: floodNowCm,
        passable_for_vehicles: floodNowCm !== undefined ? floodNowCm < 15 : true,
        route_number: roadName,
        km_point: p.main_road ? 'ถนนสายหลัก' : 'ถนนสายรอง/ซอย',
        severity,
        severity_label: label,
        status_text: statusText,
        observed_at: observedAt,
        fetched_at: fallbackTime,
        data_status: dataStatus,
        source_agency: 'BMA DDS',
        source_name_th: 'สำนักการระบายน้ำ กรุงเทพมหานคร (ระบบ Flood BMA)',
        source_url: 'https://floodbangkok.bangkok.go.th',
      };
    });

  return { stations, latestObservedAt, hasLiveRecords };
}

/**
 * Builds the fallback dataset when upstream BMA DDS API is blocked, timing out, or returning non-200.
 */
function getStaticFallbackResult(fetchedAt: string, reason: string): DataResult<TelemetryStation[]> {
  const emptyRecordMap = new Map<string, any>();
  const { stations } = buildBmaStations(BMA_STATIC_PROFILES, emptyRecordMap, fetchedAt);

  return {
    data: stations,
    source: 'สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS 254 เซนเซอร์น้ำท่วมถนน - ข้อมูลอ้างอิงตำแหน่งจุดตรวจวัด)',
    sourceAgency: 'BMA',
    status: 'STATIC',
    fetchedAt,
    observedAt: null,
    error: reason,
  };
}

interface FetchAttemptDetail {
  attempt: number;
  status: number | null;
  ok: boolean;
  statusText?: string;
  error?: string;
  durationMs: number;
}

interface FetchResultDetail {
  response: Response | null;
  attempts: FetchAttemptDetail[];
  finalStatus: number | null;
  finalOk: boolean;
  finalError?: string;
  totalDurationMs: number;
}

/**
 * Robust fetcher with single retry on transient 5xx or network errors.
 * Ensures fast failure isolation within provided timeout budget.
 * Collects detailed execution diagnostics for troubleshooting.
 */
async function fetchWithRetry(url: string, options: RequestInit, timeoutMs: number = 4000): Promise<FetchResultDetail> {
  const maxAttempts = 2;
  const attempts: FetchAttemptDetail[] = [];
  const tStart = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const durationMs = Date.now() - attemptStart;

      attempts.push({
        attempt,
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        durationMs,
      });

      // Return immediately on 2xx or client errors (e.g. 403, 404 which retries won't fix)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return {
          response: res,
          attempts,
          finalStatus: res.status,
          finalOk: res.ok,
          totalDurationMs: Date.now() - tStart,
        };
      }

      // If transient 5xx (500, 502, 503, 504), retry once if attempts remain
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      return {
        response: res,
        attempts,
        finalStatus: res.status,
        finalOk: res.ok,
        finalError: `Upstream HTTP ${res.status} (${res.statusText})`,
        totalDurationMs: Date.now() - tStart,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const durationMs = Date.now() - attemptStart;
      const isAbort = err?.name === 'AbortError' || err?.message?.toLowerCase().includes('abort');
      const errType = isAbort ? `Timeout (exceeded ${timeoutMs}ms)` : (err?.message || 'Network error');

      attempts.push({
        attempt,
        status: null,
        ok: false,
        error: errType,
        durationMs,
      });

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      return {
        response: null,
        attempts,
        finalStatus: null,
        finalOk: false,
        finalError: errType,
        totalDurationMs: Date.now() - tStart,
      };
    }
  }

  return {
    response: null,
    attempts,
    finalStatus: null,
    finalOk: false,
    finalError: 'Exhausted retry attempts',
    totalDurationMs: Date.now() - tStart,
  };
}

export async function fetchBmaRoadFloods(timeoutMs: number = 8000): Promise<DataResult<TelemetryStation[]>> {
  const fetchedAt = new Date().toISOString();

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThailandFloodTracker/2.0',
      'Referer': 'https://floodbangkok.bangkok.go.th/',
      'Accept': 'application/json',
    };

    const perReqTimeout = Math.max(2000, Math.floor(timeoutMs / 2) - 500);

    const [profileDetail, recordDetail] = await Promise.all([
      fetchWithRetry(BMA_PROFILE_URL, { headers, next: { revalidate: 180 } }, perReqTimeout),
      fetchWithRetry(BMA_RECORD_URL, { headers, next: { revalidate: 60 } }, perReqTimeout),
    ]);

    const profileRes = profileDetail.response;
    const recordRes = recordDetail.response;

    let profileParseError: string | undefined;
    let rawProfiles: any[] = [];
    if (profileRes && profileRes.ok) {
      try {
        const profileJson = await profileRes.json();
        rawProfiles = profileJson?.data || [];
      } catch (err: any) {
        profileParseError = `JSON parse failed: ${err?.message || 'invalid JSON'}`;
        rawProfiles = [];
      }
    }

    // If upstream profiles could not be loaded, safely fall back to verified static profiles
    const profilesToUse = Array.isArray(rawProfiles) && rawProfiles.length > 0 ? rawProfiles : BMA_STATIC_PROFILES;

    let recordParseError: string | undefined;
    let rawRecords: any[] = [];
    if (recordRes && recordRes.ok) {
      try {
        const recordJson = await recordRes.json();
        rawRecords = recordJson?.data || [];
      } catch (err: any) {
        recordParseError = `JSON parse failed: ${err?.message || 'invalid JSON'}`;
        rawRecords = [];
      }
    }

    // Map records by sensor_profile id and code
    const recordMap = new Map<string, any>();
    if (Array.isArray(rawRecords)) {
      rawRecords.forEach((r) => {
        if (r?.sensor_profile?.id) recordMap.set(String(r.sensor_profile.id), r);
        if (r?.sensor_profile?.code) recordMap.set(String(r.sensor_profile.code), r);
      });
    }

    const { stations, latestObservedAt, hasLiveRecords } = buildBmaStations(profilesToUse, recordMap, fetchedAt);

    // Optional Diagnostic Logging: Active only when BMA_DEBUG=true or DEBUG_BMA=1
    // Does not log payload bodies, tokens, or sensitive user/network data.
    if (process.env.BMA_DEBUG === 'true' || process.env.DEBUG_BMA === '1') {
      const bbn01Sample = recordMap.get('517') || recordMap.get('FL.BBN.01');
      const bbn01Status = bbn01Sample?.sensor_profile?.device_status;
      const bbn01Ts = bbn01Sample?.timestamp;
      const bbn01Flood = bbn01Sample?.flood_now;
      const bbn01Station = stations.find((s) => s.station_code === 'FL.BBN.01');

      console.info('[BMA_DDS_DIAGNOSTIC]', JSON.stringify({
        timestamp: fetchedAt,
        profile: {
          status: profileDetail.finalStatus,
          ok: profileDetail.finalOk,
          durationMs: profileDetail.totalDurationMs,
          attempts: profileDetail.attempts.length,
          error: profileDetail.finalError || profileParseError,
          recordsReturned: rawProfiles.length,
          usedFallbackProfiles: rawProfiles.length === 0,
        },
        record: {
          status: recordDetail.finalStatus,
          ok: recordDetail.finalOk,
          durationMs: recordDetail.totalDurationMs,
          attempts: recordDetail.attempts.length,
          error: recordDetail.finalError || recordParseError,
          recordsReturned: rawRecords.length,
        },
        evaluation: {
          totalStations: stations.length,
          liveStations: stations.filter((s) => s.data_status === 'LIVE').length,
          staticStations: stations.filter((s) => s.data_status === 'STATIC').length,
          hasLiveRecords,
          latestObservedAt,
        },
        sample_FL_BBN_01: {
          recordFound: Boolean(bbn01Sample),
          device_status: bbn01Status,
          flood_now: bbn01Flood,
          raw_timestamp: bbn01Ts,
          station_data_status: bbn01Station?.data_status,
          water_depth_cm: bbn01Station?.water_depth_cm,
          observed_at: bbn01Station?.observed_at,
        },
      }));
    }

    if (stations.length === 0) {
      return getStaticFallbackResult(fetchedAt, 'Empty sensor profile array from BMA DDS and fallback');
    }

    const overallStatus: DataStatus = hasLiveRecords ? 'LIVE' : 'STATIC';

    // Construct specific, safe failure summary if upstream measurements failed
    let failureReason: string | undefined;
    if (!hasLiveRecords) {
      if (!recordDetail.finalOk) {
        failureReason = `Upstream record endpoint unavailable (HTTP ${recordDetail.finalStatus ?? 'Network/Timeout'}${recordDetail.finalError ? ': ' + recordDetail.finalError : ''})`;
      } else if (recordParseError) {
        failureReason = `Upstream record parsing error (${recordParseError})`;
      } else {
        failureReason = 'Upstream live measurements unavailable; displaying verified sensor positions';
      }
    }

    return {
      data: stations,
      source: `สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS ${stations.length} เซนเซอร์น้ำท่วมถนน)`,
      sourceAgency: 'BMA',
      status: overallStatus,
      fetchedAt,
      observedAt: latestObservedAt,
      error: failureReason,
    };
  } catch (err: any) {
    return getStaticFallbackResult(fetchedAt, err?.message || 'Network exception connecting to BMA DDS API');
  }
}
