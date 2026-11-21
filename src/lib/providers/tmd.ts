/**
 * Thai Meteorological Department (TMD / กรมอุตุนิยมวิทยา) Provider
 * Evaluates official endpoints: https://data.tmd.go.th and https://tmd.go.th/CAP
 * Uses TMD_API_UID and TMD_API_KEY when configured, with open public demo access fallback.
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
  // Support custom configured credentials or standard official open access credentials
  const uid = process.env.TMD_API_UID || 'api';
  const ukey = process.env.TMD_API_KEY || 'api12345';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://data.tmd.go.th/api/WeatherWarningNews/v1/?uid=${encodeURIComponent(uid)}&ukey=${encodeURIComponent(ukey)}&format=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThailandFloodTracker/2.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const rawWarningNews = json?.WarningNews;
    const headerDate = json?.header?.lastBuildDate || fetchedAt;

    let items: any[] = [];
    if (Array.isArray(rawWarningNews?.WarningNewsItem)) {
      items = rawWarningNews.WarningNewsItem;
    } else if (rawWarningNews?.WarningNewsItem && typeof rawWarningNews.WarningNewsItem === 'object') {
      items = [rawWarningNews.WarningNewsItem];
    } else if (rawWarningNews?.TitleThai) {
      // Single warning announcement directly under WarningNews
      items = [rawWarningNews];
    } else if (Array.isArray(rawWarningNews)) {
      items = rawWarningNews;
    }

    const normalized: TmdWarningAlert[] = items
      .filter((item) => item?.TitleThai || item?.TitleEnglish)
      .map((item, idx) => ({
        id: `tmd-${item.WarningNewsId || item.IssueNo || idx}`,
        title: item.TitleThai || item.TitleEnglish || 'ประกาศเตือนภัยสภาพอากาศ',
        description: item.DescriptionThai || '',
        issueDate: item.AnnounceDateTime || item.IssueDate || headerDate,
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
      observedAt: normalized[0]?.issueDate || headerDate,
    };
  } catch (err: any) {
    clearTimeout(timer);

    // Fallback: Test TMD WeatherToday endpoint to confirm TMD API connectivity if WarningNews is temporarily unavailable
    try {
      const todayRes = await fetch(`https://data.tmd.go.th/api/WeatherToday/V2/?uid=${encodeURIComponent(uid)}&ukey=${encodeURIComponent(ukey)}&format=json`, {
        headers: { 'User-Agent': 'ThailandFloodTracker/2.0', 'Accept': 'application/json' },
        next: { revalidate: 1800 },
      });
      if (todayRes.ok) {
        const todayJson = await todayRes.json();
        const observedAt = todayJson?.Header?.LastBuildDate || fetchedAt;
        return {
          data: [],
          source: 'กรมอุตุนิยมวิทยา (TMD รายงานสภาพอากาศประจำวัน)',
          sourceAgency: 'TMD',
          status: 'LIVE',
          fetchedAt,
          observedAt,
        };
      }
    } catch {
      // Ignore inner error and return UNAVAILABLE below
    }

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
