import { BkkRoadFloodSensor, BkkSensorStatus, BkkSensorType } from '@/types/bkk-road-flood';
import bmaProfilesDataset from '@/data/bma-sensor-profiles.json';

const POP_ROADS_URL = 'https://flood.pop.in.th/api_roads.php';

export interface RawPopRoadRecord {
  code: string;
  kind?: number;
  grp?: number;
  name: string;
  road?: string | null;
  district?: string | null;
  dir?: string | null;
  lat: number | string;
  lng: number | string;
  msg_fail?: string | null;
  depth?: number | null;
  measured_at?: string | null;
  flood_max?: number | null;
  level?: string | null;
  delta?: number | null;
  since?: string | null;
}

/**
 * Classifies flood status based on water level in cm:
 * - normal (<= 5 cm)
 * - warning (5–10 cm)
 * - critical (> 10 cm)
 * - offline (null/sensor error)
 */
export function classifyBkkFloodStatus(
  waterLevelCm: number | null | undefined,
  isOfflineCondition: boolean
): { status: BkkSensorStatus; normalizedWaterLevelCm: number | null } {
  if (
    isOfflineCondition ||
    waterLevelCm === null ||
    waterLevelCm === undefined ||
    isNaN(waterLevelCm)
  ) {
    return { status: 'offline', normalizedWaterLevelCm: null };
  }

  const depth = Math.max(0, waterLevelCm);
  if (depth > 10) {
    return { status: 'critical', normalizedWaterLevelCm: depth };
  }
  if (depth > 5) {
    return { status: 'warning', normalizedWaterLevelCm: depth };
  }
  return { status: 'normal', normalizedWaterLevelCm: depth };
}

/**
 * Normalizes a raw road/tunnel sensor record into the clean BKK Road Flood schema.
 */
export function normalizeBkkRoadSensor(raw: RawPopRoadRecord): BkkRoadFloodSensor {
  const isOffline =
    raw.level === 'off' ||
    Boolean(raw.msg_fail && raw.msg_fail.trim() !== '') ||
    raw.depth === null ||
    raw.depth === undefined ||
    isNaN(Number(raw.depth));

  const parsedDepth = isOffline ? null : Number(raw.depth);
  const { status, normalizedWaterLevelCm } = classifyBkkFloodStatus(parsedDepth, isOffline);

  const isTunnel =
    raw.kind === 2 ||
    (typeof raw.code === 'string' && raw.code.startsWith('TN.')) ||
    (typeof raw.name === 'string' && raw.name.includes('อุโมงค์'));

  const type: BkkSensorType = isTunnel ? 'tunnel' : 'road';

  return {
    id: String(raw.code || '').trim(),
    name: String(raw.name || '').trim(),
    district: String(raw.district || '').replace(/^เขต/, '').trim(),
    type,
    lat: Number(raw.lat),
    lng: Number(raw.lng),
    waterLevelCm: normalizedWaterLevelCm,
    status,
    updatedAt: raw.measured_at || null,
  };
}

/**
 * Fallback sensors from verified static BMA dataset if upstream network is completely unreachable.
 */
export function getStaticFallbackBkkSensors(): BkkRoadFloodSensor[] {
  const staticSensors: any[] = (bmaProfilesDataset as any).sensors || [];
  return staticSensors.map((p) => {
    const isTunnel =
      (typeof p.code === 'string' && p.code.startsWith('TN.')) ||
      (typeof p.name === 'string' && p.name.includes('อุโมงค์'));

    return {
      id: String(p.code || `FL.BKK.${p.id}`),
      name: String(p.name || 'จุดตรวจวัดน้ำท่วมถนน'),
      district: String(p.district || '').replace(/^เขต/, '').trim(),
      type: isTunnel ? 'tunnel' : 'road',
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      waterLevelCm: null,
      status: 'offline' as BkkSensorStatus,
      updatedAt: null,
    };
  });
}

/**
 * Fetches and normalizes Bangkok road & underpass flood sensor data.
 */
export async function fetchNormalizedBkkRoadFloods(timeoutMs: number = 8000): Promise<{
  sensors: BkkRoadFloodSensor[];
  updatedAt: string | null;
  source: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(POP_ROADS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThailandFloodTracker/2.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Upstream HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const rawList: RawPopRoadRecord[] = Array.isArray(json?.roads) ? json.roads : [];

    if (rawList.length === 0) {
      throw new Error('Upstream returned empty roads array');
    }

    const sensors = rawList.map(normalizeBkkRoadSensor);
    const updatedAt = json?.summary?.latest || sensors.find((s) => s.updatedAt)?.updatedAt || new Date().toISOString();

    return {
      sensors,
      updatedAt,
      source: 'POPNIX Flood & BMA DDS',
    };
  } catch (err: any) {
    console.warn(`[bkk-road-flood] Live fetch failed (${err?.message}), using static fallback profiles`);
    const fallbackSensors = getStaticFallbackBkkSensors();
    return {
      sensors: fallbackSensors,
      updatedAt: null,
      source: 'BMA DDS (Static Verified Profiles)',
    };
  }
}
