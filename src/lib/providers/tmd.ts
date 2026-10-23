/**
 * Thai Meteorological Department (TMD / กรมอุตุนิยมวิทยา) Provider
 * Evaluates official endpoints: https://data.tmd.go.th and https://tmd.go.th/CAP
 * Uses TMD_API_UID and TMD_API_KEY when configured.
 * If credentials are not supplied or endpoint returns unavailable, reports UNAVAILABLE.
 */

import { DataResult, DataStatus } from './types';

export interface TmdWarningAlert {
  id: string;
  title: string;
  description: string;
  issueDate: string;
  severity: 'moderate' | 'severe' | 'extreme';
  affectedAreas: string[];
  sourceUrl: string;
}

export async function fetchTmdWarnings(timeoutMs: number = 6000): Promise<DataResult<TmdWarningAlert[]>> {
  const fetchedAt = new Date().toISOString();
  const uid = process.env.TMD_API_UID;
  const ukey = process.env.TMD_API_KEY;

  if (!uid || !ukey) {
    return {
      data: null,
      source: 'กรมอุตุนิยมวิทยา (TMD)',
      sourceAgency: 'TMD',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: 'TMD API credentials (TMD_API_UID / TMD_API_KEY) not configured',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://data.tmd.go.th/api/WeatherWarningNews/v1/?uid=${encodeURIComponent(uid)}&ukey=${encodeURIComponent(ukey)}&format=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PrachinburiFloodTracker/1.0' },
      next: { revalidate: 1800 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        data: null,
        source: 'กรมอุตุนิยมวิทยา (TMD)',
        sourceAgency: 'TMD',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const json = await res.json();
    const warnings: any[] = json?.WarningNews?.WarningNewsItem || [];

    if (!Array.isArray(warnings) || warnings.length === 0) {
      return {
        data: [],
        source: 'กรมอุตุนิยมวิทยา (TMD)',
        sourceAgency: 'TMD',
        status: 'LIVE',
        fetchedAt,
        observedAt: fetchedAt,
      };
    }

    const normalized: TmdWarningAlert[] = warnings.map((item, idx) => ({
      id: `tmd-${item.WarningNewsId || idx}`,
      title: item.TitleThai || item.TitleEnglish || 'ประกาศเตือนภัยสภาพอากาศ',
      description: item.DescriptionThai || '',
      issueDate: item.IssueDate || fetchedAt,
      severity: item.Severity === 'High' ? 'severe' : 'moderate',
      affectedAreas: item.AffectedProvinces ? item.AffectedProvinces.split(',') : [],
      sourceUrl: 'https://www.tmd.go.th/warning-and-events',
    }));

    return {
      data: normalized,
      source: 'กรมอุตุนิยมวิทยา (TMD ประกาศเตือนภัยสภาพอากาศ)',
      sourceAgency: 'TMD',
      status: 'LIVE',
      fetchedAt,
      observedAt: normalized[0]?.issueDate || fetchedAt,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      data: null,
      source: 'กรมอุตุนิยมวิทยา (TMD)',
      sourceAgency: 'TMD',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: err?.message || 'Failed to fetch TMD warnings',
    };
  }
}
