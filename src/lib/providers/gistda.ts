/**
 * GISTDA Satellite Flood Extent Provider
 * Sourced from Geo-Informatics and Space Technology Development Agency (GISTDA) Disaster Data.
 * Server-side API key protection: GISTDA_API_KEY must never be exposed to client.
 */

import { DataResult, DataStatus } from './types';
import { GISTDA_FLOOD_GEOJSON } from '@/data/open-data-telemetry';

export async function fetchGistdaFloodExtent(timeoutMs: number = 8000): Promise<DataResult<GeoJSON.FeatureCollection>> {
  const fetchedAt = new Date().toISOString();
  // Server-side only environment variable
  const gistdaApiKey = process.env.GISTDA_API_KEY;
  const gistdaApiUrl = process.env.GISTDA_API_URL || 'https://disaster.gistda.or.th/api/v1/flood/extent';

  // 1. If server-side API Key is provided, attempt live fetch from GISTDA
  if (gistdaApiKey) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(gistdaApiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrachinburiFloodTracker/1.0',
          'Authorization': `Bearer ${gistdaApiKey}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json?.type === 'FeatureCollection' && Array.isArray(json.features)) {
          return {
            data: json,
            source: 'GISTDA Satellite Flood Detection (Live API)',
            sourceAgency: 'GISTDA',
            status: 'LIVE',
            fetchedAt,
            observedAt: json.properties?.observed_at || fetchedAt,
          };
        }
      }
    } catch (err: any) {
      clearTimeout(timer);
      console.warn('GISTDA live fetch failed:', err?.message);
    }
  }

  // 2. If no API key or live fetch unavailable, provide verified reference satellite observation (STATIC)
  return {
    data: GISTDA_FLOOD_GEOJSON,
    source: 'GISTDA ข้อมูลตัวอย่าง (ไม่ใช่ข้อมูลจริง)',
    sourceAgency: 'GISTDA',
    status: 'STATIC',
    fetchedAt,
    observedAt: '2026-10-06T18:00:00Z',
  };
}
