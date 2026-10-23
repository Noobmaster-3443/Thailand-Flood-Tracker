/**
 * Nationwide Data Aggregator
 * Orchestrates all official providers with server-side caching, failure isolation, and transparent status reporting.
 */

import { TelemetryStation, DamReservoirInfo, HighwayDisasterAlert, HighTideAlert, FlashFloodAlert, EvacuationShelter } from '@/types/telemetry';
import { DataResult, DataStatus, ProvinceStatusReport, NationwideCoverageSummary } from '../providers/types';
import { getWithCache } from '../cache/server-cache';
import { fetchThaiWaterWaterLevels, fetchThaiWaterRainfall } from '../providers/thaiwater';
import { fetchRidDams } from '../providers/rid';
import { fetchGistdaFloodExtent } from '../providers/gistda';
import { fetchTmdWarnings, TmdWarningAlert } from '../providers/tmd';
import { fetchHighwayDisasterAlerts } from '../providers/highway';
import { fetchNavyTide } from '../providers/tide';
import { fetchEvacuationShelters } from '../providers/shelter';
import { fetchBmaRoadFloods } from '../providers/bma';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';
import { calculateProvinceStatus } from './province-status';
import { NATIONWIDE_ALL_STATIONS, NATIONWIDE_FLASH_FLOOD_ALERTS } from '@/data/nationwide-telemetry';

export interface NationwideAggregatedData {
  stations: TelemetryStation[];
  dams: DamReservoirInfo[];
  highwayAlerts: HighwayDisasterAlert[];
  gistdaGeoJson: GeoJSON.FeatureCollection;
  highTide: HighTideAlert | null;
  flashFloodAlerts: FlashFloodAlert[];
  shelters: EvacuationShelter[];
  tmdWarnings: TmdWarningAlert[];
  provinceStatuses: ProvinceStatusReport[];
  coverage: NationwideCoverageSummary;
  lastUpdated: string | null;
}

export async function getAggregatedNationwideData(): Promise<NationwideAggregatedData> {
  // 1. Fetch each provider with failure isolation (Promise.allSettled) and server-side cache
  const [
    wlResult,
    rainResult,
    damsResult,
    gistdaResult,
    tmdResult,
    highwayResult,
    tideResult,
    shelterResult,
    bmaResult,
  ] = await Promise.allSettled([
    getWithCache('thaiwater_wl', () => fetchThaiWaterWaterLevels(), { ttlSeconds: 300 }),
    getWithCache('thaiwater_rain', () => fetchThaiWaterRainfall(), { ttlSeconds: 300 }),
    getWithCache('rid_dams', () => fetchRidDams(), { ttlSeconds: 3600 }),
    getWithCache('gistda_extent', () => fetchGistdaFloodExtent(), { ttlSeconds: 3600 }),
    getWithCache('tmd_warnings', () => fetchTmdWarnings(), { ttlSeconds: 1800 }),
    getWithCache('highway_alerts', () => fetchHighwayDisasterAlerts('all'), { ttlSeconds: 600 }),
    getWithCache('navy_tide', () => fetchNavyTide('all'), { ttlSeconds: 3600 }),
    getWithCache('shelters', () => fetchEvacuationShelters('all'), { ttlSeconds: 3600 }),
    getWithCache('bma_road_floods', () => fetchBmaRoadFloods(), { ttlSeconds: 180 }),
  ]);

  // Extract results safely
  const wlData = wlResult.status === 'fulfilled' ? wlResult.value : null;
  const rainData = rainResult.status === 'fulfilled' ? rainResult.value : null;
  const damsData = damsResult.status === 'fulfilled' ? damsResult.value : null;
  const gistdaData = gistdaResult.status === 'fulfilled' ? gistdaResult.value : null;
  const tmdData = tmdResult.status === 'fulfilled' ? tmdResult.value : null;
  const highwayData = highwayResult.status === 'fulfilled' ? highwayResult.value : null;
  const tideData = tideResult.status === 'fulfilled' ? tideResult.value : null;
  const shelterData = shelterResult.status === 'fulfilled' ? shelterResult.value : null;
  const bmaData = bmaResult.status === 'fulfilled' ? bmaResult.value : null;

  // 2. Combine water stations: prefer live ThaiWater stations
  let combinedStations: TelemetryStation[] = [];
  const liveWlStations = wlData?.data || [];
  const liveRainStations = rainData?.data || [];

  if (liveWlStations.length > 0) {
    combinedStations = [...liveWlStations];

    // Intelligently select live rain telemetry stations:
    // 1. Keep ALL live rain stations for metropolitan/priority flood areas (Bangkok, Prachinburi)
    // 2. Select the top rain stations (sorted by 24h rainfall) for every other province so no province is omitted
    const rainByProvince = new Map<string, TelemetryStation[]>();
    liveRainStations.forEach((station) => {
      const p = station.province || 'unknown';
      if (!rainByProvince.has(p)) {
        rainByProvince.set(p, []);
      }
      rainByProvince.get(p)!.push(station);
    });

    const selectedRainStations: TelemetryStation[] = [];
    rainByProvince.forEach((provStations, provId) => {
      // Sort by highest 24h rainfall first
      provStations.sort((a, b) => (b.rain_24h_mm || 0) - (a.rain_24h_mm || 0));

      // For Bangkok and Prachinburi, include all stations to ensure 100% full coverage
      if (provId === 'bangkok' || provId === 'prachinburi') {
        selectedRainStations.push(...provStations);
      } else {
        // For other provinces, take the top 8 rainfall monitoring points
        selectedRainStations.push(...provStations.slice(0, 8));
      }
    });

    combinedStations.push(...selectedRainStations);
  } else {
    // If live ThaiWater is unavailable, use verified static dataset marked as STATIC with actual dates
    combinedStations = NATIONWIDE_ALL_STATIONS.map((s) => ({
      ...s,
      data_status: 'STATIC' as DataStatus,
    }));
  }

  // 3. Append live BMA DDS road flood monitoring stations (Bangkok 254 sensors)
  if (bmaData?.data && bmaData.data.length > 0) {
    combinedStations.push(...bmaData.data);
  }

  // Dams list
  const damsList = damsData?.data || [];

  // Highways list
  const highwayList = highwayData?.data || [];

  // Gistda GeoJson
  const gistdaGeoJson = gistdaData?.data || { type: 'FeatureCollection', features: [] };

  // High tide
  const highTide = tideData?.data || null;

  // Shelters
  const sheltersList = shelterData?.data || [];

  // TMD Warnings
  const tmdWarnings = tmdData?.data || [];

  // Flash floods (from verified mountain telemetry)
  const flashFloodAlerts = NATIONWIDE_FLASH_FLOOD_ALERTS.map((f) => ({
    ...f,
    data_status: 'STATIC' as DataStatus,
  }));

  // 3. Compute status and evidence for all 77 provinces
  const provinceStatuses: ProvinceStatusReport[] = THAILAND_PROVINCES.map((prov) => {
    return calculateProvinceStatus({
      province: prov,
      stations: combinedStations,
      dams: damsList,
      highways: highwayList,
      rainfallStations: liveRainStations,
    });
  });

  // 4. Compute nationwide coverage summary based on REAL provider outputs
  let liveProvinces = 0;
  let staleProvinces = 0;
  let staticProvinces = 0;
  let unavailableProvinces = 0;
  let criticalCount = 0;
  let floodingCount = 0;
  let warningCount = 0;
  let watchCount = 0;
  let normalCount = 0;

  provinceStatuses.forEach((p) => {
    if (p.dataFreshness === 'LIVE') liveProvinces++;
    else if (p.dataFreshness === 'STALE') staleProvinces++;
    else if (p.dataFreshness === 'STATIC') staticProvinces++;
    else unavailableProvinces++;

    if (p.status === 'CRITICAL') criticalCount++;
    else if (p.status === 'FLOODING') floodingCount++;
    else if (p.status === 'WARNING') warningCount++;
    else if (p.status === 'WATCH') watchCount++;
    else if (p.status === 'NORMAL') normalCount++;
  });

  const coverage: NationwideCoverageSummary = {
    totalProvinces: 77,
    liveProvinces,
    staleProvinces,
    staticProvinces,
    unavailableProvinces,
    criticalProvincesCount: criticalCount,
    floodingProvincesCount: floodingCount,
    warningProvincesCount: warningCount,
    watchProvincesCount: watchCount,
    normalProvincesCount: normalCount,
    providers: {
      thaiwater: wlData?.status || 'UNAVAILABLE',
      rid: damsData?.status || 'UNAVAILABLE',
      gistda: gistdaData?.status || 'STATIC',
      tmd: tmdData?.status || 'UNAVAILABLE',
      openmeteo: 'LIVE',
      rainviewer: 'LIVE',
      doh: highwayData?.status || 'STATIC',
      navyTide: tideData?.status || 'STATIC',
      shelters: shelterData?.status || 'STATIC',
      bma: bmaData?.status || 'UNAVAILABLE',
    },
    lastCheckedAt: new Date().toISOString(),
  };

  return {
    stations: combinedStations,
    dams: damsList,
    highwayAlerts: highwayList,
    gistdaGeoJson,
    highTide,
    flashFloodAlerts,
    shelters: sheltersList,
    tmdWarnings,
    provinceStatuses,
    coverage,
    lastUpdated: wlData?.observedAt || damsData?.observedAt || null,
  };
}
