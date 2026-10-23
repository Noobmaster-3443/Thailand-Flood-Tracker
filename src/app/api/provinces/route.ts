import { NextResponse } from 'next/server';
import { THAILAND_PROVINCES, REGIONS_LIST } from '@/data/thailand-provinces';
import { getAggregatedNationwideData } from '@/lib/aggregation/nationwide';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nationwide = await getAggregatedNationwideData();
    const statusMap = new Map(nationwide.provinceStatuses.map((p) => [p.provinceId, p]));

    const provincesWithStatus = THAILAND_PROVINCES.map((prov) => {
      const st = statusMap.get(prov.id);
      return {
        ...prov,
        floodStatus: st?.status || 'NORMAL',
        statusLabelTh: st?.statusLabelTh || 'สถานการณ์ปกติ',
        dataFreshness: st?.dataFreshness || 'UNAVAILABLE',
        stationCount: st?.metrics.stationCount || 0,
        overflowCount: st?.metrics.overflowCount || 0,
        warningCount: st?.metrics.warningCount || 0,
        maxRain24h: st?.metrics.maxRain24h || 0,
        evidence: st?.evidence || [],
      };
    });

    return NextResponse.json(
      {
        total: provincesWithStatus.length,
        regions: REGIONS_LIST,
        provinces: provincesWithStatus,
        coverage: nationwide.coverage,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        total: THAILAND_PROVINCES.length,
        regions: REGIONS_LIST,
        provinces: THAILAND_PROVINCES,
      },
      { status: 200 }
    );
  }
}
