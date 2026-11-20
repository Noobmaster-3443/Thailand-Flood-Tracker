import { NextRequest, NextResponse } from 'next/server';
import { fetchNormalizedBkkRoadFloods } from '@/lib/providers/bkk-road-flood';
import { BkkRoadFloodApiResponse } from '@/types/bkk-road-flood';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5-minute ISR/caching

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const districtFilter = searchParams.get('district')?.toLowerCase();
    const typeFilter = searchParams.get('type')?.toLowerCase();
    const statusFilter = searchParams.get('status')?.toLowerCase();

    const { sensors, updatedAt, source } = await fetchNormalizedBkkRoadFloods(8000);

    let filtered = sensors;
    if (districtFilter && districtFilter !== 'all') {
      filtered = filtered.filter(
        (s) => s.district.toLowerCase() === districtFilter || s.district.includes(districtFilter)
      );
    }
    if (typeFilter && (typeFilter === 'road' || typeFilter === 'tunnel')) {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }
    if (statusFilter && ['normal', 'warning', 'critical', 'offline'].includes(statusFilter)) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Support flat array format if requested via ?format=array or ?format=flat
    if (format === 'array' || format === 'flat') {
      return NextResponse.json(filtered, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const payload: BkkRoadFloodApiResponse = {
      success: true,
      count: filtered.length,
      updatedAt,
      data: filtered,
      sensors: filtered,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': source,
      },
    });
  } catch (error: any) {
    console.error('[API /api/bkk-road-flood] Error processing road flood data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch Bangkok road flood telemetry',
        count: 0,
        data: [],
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
