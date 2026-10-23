/**
 * Department of Highways (DOH / กรมทางหลวง) & Rural Roads (DRR / กรมทางหลวงชนบท) Provider
 * Follows Rule #5: If no live open API exists, clearly marks as STATIC verified data or UNAVAILABLE.
 * Preserves actual observation dates without fabricating realtime status.
 */

import { HighwayDisasterAlert } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';
import { NATIONWIDE_HIGHWAY_ALERTS } from '@/data/nationwide-telemetry';

export async function fetchHighwayDisasterAlerts(provinceId?: string): Promise<DataResult<HighwayDisasterAlert[]>> {
  const fetchedAt = new Date().toISOString();

  // If a live DOH API key or machine-readable feed is configured in future
  const dohApiUrl = process.env.DOH_API_URL;
  if (dohApiUrl) {
    try {
      const res = await fetch(dohApiUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 600 },
      });
      if (res.ok) {
        const liveAlerts = await res.json();
        if (Array.isArray(liveAlerts)) {
          return {
            data: liveAlerts,
            source: 'กรมทางหลวง (DOH สายด่วน 1586 - Live API)',
            sourceAgency: 'DOH',
            status: 'LIVE',
            fetchedAt,
            observedAt: liveAlerts[0]?.updated_at || fetchedAt,
          };
        }
      }
    } catch (err: any) {
      console.warn('Live DOH fetch failed:', err?.message);
    }
  }

  // Official verified reference reports (STATIC)
  const allAlerts: HighwayDisasterAlert[] = NATIONWIDE_HIGHWAY_ALERTS.map((alert) => ({
    ...alert,
    data_status: 'STATIC' as DataStatus,
  }));

  const filtered = provinceId && provinceId !== 'all'
    ? allAlerts.filter((a) => (a.province || 'prachinburi') === provinceId)
    : allAlerts;

  return {
    data: filtered,
    source: 'กรมทางหลวง (DOH สายด่วน 1586 - ข้อมูลรายงานอุทกภัยอ้างอิง)',
    sourceAgency: 'DOH',
    status: 'STATIC',
    fetchedAt,
    observedAt: '2026-10-06T12:00:00Z', // Actual publication date
  };
}
