import { 
  TelemetryStation, 
  HighwayDisasterAlert,
  DamReservoirInfo,
  HighTideAlert,
  FlashFloodAlert,
  EvacuationShelter,
} from '@/types/telemetry';
import { ProvinceStatusReport, NationwideCoverageSummary } from './providers/types';
import {
  GISTDA_FLOOD_GEOJSON,
  OFFICIAL_HIGH_TIDE,
} from '@/data/open-data-telemetry';
import { 
  NATIONWIDE_ALL_STATIONS, 
  NATIONWIDE_MAJOR_DAMS,
  NATIONWIDE_HIGHWAY_ALERTS,
  NATIONWIDE_FLASH_FLOOD_ALERTS,
  NATIONWIDE_SHELTERS,
} from '@/data/nationwide-telemetry';

export interface TelemetryDashboardData {
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  gistdaGeoJson: GeoJSON.FeatureCollection;
  dams: DamReservoirInfo[];
  highTide: HighTideAlert | null;
  flashFloodAlerts: FlashFloodAlert[];
  shelters: EvacuationShelter[];
  provinceStatuses?: ProvinceStatusReport[];
  coverage?: NationwideCoverageSummary;
  lastUpdated: string | null;
  sourceAttribution: string;
}

/**
 * Fetch automated telemetry and multi-hazard data across all 77 provinces of Thailand.
 * Consumes the normalized server aggregation API (/api/nationwide) with server-side caching,
 * failure isolation, and verified official government datasets.
 */
export async function getAutomatedTelemetryData(): Promise<TelemetryDashboardData> {
  // 1. In browser runtime: fetch normalized server endpoint /api/nationwide with timeout
  if (typeof window !== 'undefined') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch('/api/nationwide', {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json();
        return {
          stations: json.stations || [],
          highwayAlerts: json.highwayAlerts || [],
          gistdaGeoJson: json.gistdaGeoJson || { type: 'FeatureCollection', features: [] },
          dams: json.dams || [],
          highTide: json.highTide || null,
          flashFloodAlerts: json.flashFloodAlerts || [],
          shelters: json.shelters || [],
          provinceStatuses: json.provinceStatuses || [],
          coverage: json.coverage,
          lastUpdated: json.lastUpdated ?? null,
          sourceAttribution: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน.) • กรมชลประทาน (RID) • กรมอุทกศาสตร์ กองทัพเรือ • กรมทางหลวง • GISTDA • ปภ.',
        };
      }
    } catch (e) {
      console.warn('Browser fetch /api/nationwide failed or timed out, using verified static reference dataset:', e);
    } finally {
      clearTimeout(timeoutId);
    }

    // Browser fallback: return verified static reference dataset to avoid bundling server aggregation
    return {
      stations: NATIONWIDE_ALL_STATIONS.map((s) => ({ ...s, data_status: 'STATIC' })),
      highwayAlerts: NATIONWIDE_HIGHWAY_ALERTS.map((h) => ({ ...h, data_status: 'STATIC' })),
      gistdaGeoJson: GISTDA_FLOOD_GEOJSON,
      dams: NATIONWIDE_MAJOR_DAMS.map((d) => ({ ...d, data_status: 'STATIC' })),
      highTide: { ...OFFICIAL_HIGH_TIDE, data_status: 'STATIC' },
      flashFloodAlerts: NATIONWIDE_FLASH_FLOOD_ALERTS.map((f) => ({ ...f, data_status: 'STATIC' })),
      shelters: NATIONWIDE_SHELTERS.map((s) => ({ ...s, data_status: 'STATIC' })),
      lastUpdated: '2026-10-08T00:00:00Z', // Verified reference publication date, never fake realtime
      sourceAttribution: 'ข้อมูลอ้างอิงทางการ (STATIC REFERENCE) สสน. • RID • ทร. • ทางหลวง • ปภ.',
    };
  }

  // 2. Server runtime: call server aggregator directly
  try {
    const { getAggregatedNationwideData } = await import('@/lib/aggregation/nationwide');
    const agg = await getAggregatedNationwideData();
    return {
      stations: agg.stations,
      highwayAlerts: agg.highwayAlerts,
      gistdaGeoJson: agg.gistdaGeoJson,
      dams: agg.dams,
      highTide: agg.highTide,
      flashFloodAlerts: agg.flashFloodAlerts,
      shelters: agg.shelters,
      provinceStatuses: agg.provinceStatuses,
      coverage: agg.coverage,
      lastUpdated: agg.lastUpdated,
      sourceAttribution: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน.) • กรมชลประทาน (RID) • กรมอุทกศาสตร์ กองทัพเรือ • กรมทางหลวง • GISTDA • ปภ.',
    };
  } catch (err) {
    console.error('Nationwide aggregation failed, using verified reference dataset:', err);
    return {
      stations: NATIONWIDE_ALL_STATIONS.map((s) => ({ ...s, data_status: 'STATIC' })),
      highwayAlerts: NATIONWIDE_HIGHWAY_ALERTS.map((h) => ({ ...h, data_status: 'STATIC' })),
      gistdaGeoJson: GISTDA_FLOOD_GEOJSON,
      dams: NATIONWIDE_MAJOR_DAMS.map((d) => ({ ...d, data_status: 'STATIC' })),
      highTide: { ...OFFICIAL_HIGH_TIDE, data_status: 'STATIC' },
      flashFloodAlerts: NATIONWIDE_FLASH_FLOOD_ALERTS.map((f) => ({ ...f, data_status: 'STATIC' })),
      shelters: NATIONWIDE_SHELTERS.map((s) => ({ ...s, data_status: 'STATIC' })),
      lastUpdated: '2026-10-08T00:00:00Z', // Verified reference publication date, never fake realtime
      sourceAttribution: 'ข้อมูลอ้างอิงทางการ (STATIC REFERENCE) สสน. • RID • ทร. • ทางหลวง • ปภ.',
    };
  }
}
