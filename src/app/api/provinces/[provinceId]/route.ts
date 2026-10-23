import { NextRequest, NextResponse } from 'next/server';
import { findProvinceById } from '@/data/thailand-provinces';
import { getAggregatedNationwideData } from '@/lib/aggregation/nationwide';
import { fetchOpenMeteoForecast } from '@/lib/providers/openmeteo';
import { fetchNavyTide } from '@/lib/providers/tide';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provinceId: string }> }
) {
  const { provinceId } = await params;
  const prov = findProvinceById(provinceId);

  if (!prov) {
    return NextResponse.json(
      { error: `Province '${provinceId}' not found` },
      { status: 404 }
    );
  }

  try {
    const [nationwide, weatherResult, tideResult] = await Promise.all([
      getAggregatedNationwideData(),
      fetchOpenMeteoForecast(prov.id),
      fetchNavyTide(prov.id),
    ]);

    const statusReport = nationwide.provinceStatuses.find((p) => p.provinceId === prov.id);
    const stations = nationwide.stations.filter((s) => s.province === prov.id);
    const dams = nationwide.dams.filter((d) => d.province === prov.id);
    const highways = nationwide.highwayAlerts.filter((h) => h.province === prov.id);
    const shelters = nationwide.shelters.filter((s) => s.province === prov.id);

    return NextResponse.json(
      {
        province: prov,
        status: statusReport,
        stations,
        dams,
        highwayAlerts: highways,
        shelters,
        weather: weatherResult.data,
        weatherStatus: weatherResult.status,
        highTide: tideResult.data,
        highTideStatus: tideResult.status,
        lastUpdated: statusReport?.observedAt || nationwide.lastUpdated,
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
      { error: error?.message || 'Failed to retrieve province data' },
      { status: 500 }
    );
  }
}
