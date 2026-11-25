import { NextResponse } from 'next/server';
import {
  FLAGGED_PROVINCE_TOXINS,
  TOXIN_DATASET_META,
  TOXIN_HEALTH_GUIDANCE,
  TOXIN_HOTLINES,
  TOXIN_STATUS_META,
  TOXIN_STATUS_ORDER,
  TOXIN_TYPES,
} from '@/data/water-toxins';

export const dynamic = 'force-dynamic';

interface ExternalOpenDataCheck {
  provider: string;
  endpoint: string;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number;
  datasetsFound: number | null;
  sampleTitles: string[];
  checkedAt: string;
  error?: string;
}

async function checkThailandOpenDataApi(): Promise<ExternalOpenDataCheck> {
  const startedAt = Date.now();
  const endpoint =
    'https://data.go.th/api/3/action/package_search?q=%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%99%E0%B9%89%E0%B8%B3&rows=3';

  try {
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(4500),
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const latencyMs = Date.now() - startedAt;
    if (!res.ok) {
      return {
        provider: 'Open Government Data Thailand (data.go.th)',
        endpoint: 'https://data.go.th/api/3/action/package_search',
        ok: false,
        httpStatus: res.status,
        latencyMs,
        datasetsFound: null,
        sampleTitles: [],
        checkedAt: new Date().toISOString(),
        error: `HTTP ${res.status}`,
      };
    }

    const json = await res.json();
    const count =
      typeof json?.result?.count === 'number' ? json.result.count : null;
    const sampleTitles: string[] = Array.isArray(json?.result?.results)
      ? json.result.results
          .map((item: { title?: string }) => item?.title)
          .filter((t: unknown): t is string => typeof t === 'string')
          .slice(0, 3)
      : [];

    return {
      provider: 'Open Government Data Thailand (data.go.th)',
      endpoint: 'https://data.go.th/api/3/action/package_search',
      ok: Boolean(json?.success),
      httpStatus: res.status,
      latencyMs,
      datasetsFound: count,
      sampleTitles,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      provider: 'Open Government Data Thailand (data.go.th)',
      endpoint: 'https://data.go.th/api/3/action/package_search',
      ok: false,
      httpStatus: null,
      latencyMs: Date.now() - startedAt,
      datasetsFound: null,
      sampleTitles: [],
      checkedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Network timeout',
    };
  }
}

export async function GET() {
  const startedAt = Date.now();
  const externalCheck = await checkThailandOpenDataApi();

  const flaggedList = Object.values(FLAGGED_PROVINCE_TOXINS);
  const totalLatencyMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      ok: true,
      apiStatus: externalCheck.ok ? 'LIVE' : 'DEGRADED',
      fetchedAt: new Date().toISOString(),
      latencyMs: totalLatencyMs,
      datasetMeta: TOXIN_DATASET_META,
      statusOrder: TOXIN_STATUS_ORDER,
      statusMeta: TOXIN_STATUS_META,
      toxinTypes: TOXIN_TYPES,
      flaggedProvinces: FLAGGED_PROVINCE_TOXINS,
      flaggedCount: flaggedList.length,
      totalProvinces: 77,
      healthGuidance: TOXIN_HEALTH_GUIDANCE,
      hotlines: TOXIN_HOTLINES,
      externalCheck,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
