/**
 * Common Data Contract & Status Definitions
 * Sourced from official nationwide architecture specifications.
 */

export type DataStatus = 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';

export interface DataResult<T> {
  data: T | null;
  source: string;
  sourceAgency?: string;
  status: DataStatus;
  fetchedAt: string | null;
  observedAt: string | null;
  error?: string;
}

export type ProvinceFloodStatus =
  | 'NORMAL'
  | 'WATCH'
  | 'WARNING'
  | 'FLOODING'
  | 'CRITICAL'
  | 'UNKNOWN'
  | 'UNAVAILABLE';

export interface ProvinceStatusReport {
  provinceId: string;
  provinceCode: string;
  provinceNameTh: string;
  provinceNameEn: string;
  region: string;
  regionTh: string;
  status: ProvinceFloodStatus;
  statusLabelTh: string;
  dataFreshness: DataStatus;
  evidence: string[];
  metrics: {
    stationCount: number;
    overflowCount: number;
    warningCount: number;
    maxRain24h: number;
    damStoragePercent?: number;
    impassableRoadCount: number;
    shelterCount: number;
  };
  sources: string[];
  observedAt: string | null;
  updatedAt: string;
}

export interface NationwideCoverageSummary {
  totalProvinces: number;
  liveProvinces: number;
  staleProvinces: number;
  staticProvinces: number;
  unavailableProvinces: number;
  criticalProvincesCount: number;
  floodingProvincesCount: number;
  warningProvincesCount: number;
  watchProvincesCount: number;
  normalProvincesCount: number;
  providers: {
    thaiwater: DataStatus;
    rid: DataStatus;
    gistda: DataStatus;
    tmd: DataStatus;
    openmeteo: DataStatus;
    rainviewer: DataStatus;
    doh: DataStatus;
    navyTide: DataStatus;
    shelters: DataStatus;
    bma: DataStatus;
  };
  lastCheckedAt: string;
}
