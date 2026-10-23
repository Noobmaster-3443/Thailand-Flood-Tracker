/**
 * RainViewer Supplementary Radar Provider
 * Sourced from RainViewer API (https://www.rainviewer.com/api.html).
 * Supplementary radar source, clearly labeled as not an official Thai government observation.
 */

import { RadarFrameInfo } from '@/types/weather';
import { DataResult, DataStatus } from './types';

export interface RainViewerRadarResult {
  host: string;
  frames: RadarFrameInfo[];
}

export async function fetchRainViewerRadar(timeoutMs: number = 6000): Promise<DataResult<RainViewerRadarResult>> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal: controller.signal,
      headers: { 'User-Agent': 'PrachinburiFloodTracker/1.0' },
      next: { revalidate: 300 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        data: null,
        source: 'RainViewer Radar (Supplementary)',
        sourceAgency: 'RainViewer (Supplementary)',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = data.radar?.past || [];

    if (!Array.isArray(past) || past.length === 0) {
      return {
        data: null,
        source: 'RainViewer Radar (Supplementary)',
        sourceAgency: 'RainViewer (Supplementary)',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: 'No radar frames available in response',
      };
    }

    const frames: RadarFrameInfo[] = past.map((p: { time: number; path: string }, idx: number) => {
      const date = new Date(p.time * 1000);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return {
        time: p.time,
        path: p.path,
        formattedTime: `${hours}:${minutes} น.`,
        isLatest: idx === past.length - 1,
      };
    });

    const latestTimestamp = past[past.length - 1]?.time
      ? new Date(past[past.length - 1].time * 1000).toISOString()
      : fetchedAt;

    return {
      data: { host, frames },
      source: 'RainViewer Global Weather Radar (ภาพสะท้อนเรดาร์ตรวจอากาศสากล - ข้อมูลเสริม)',
      sourceAgency: 'RainViewer (Supplementary)',
      status: 'LIVE',
      fetchedAt,
      observedAt: latestTimestamp,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      data: null,
      source: 'RainViewer Radar (Supplementary)',
      sourceAgency: 'RainViewer (Supplementary)',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: err?.message || 'Failed to fetch RainViewer radar frames',
    };
  }
}
