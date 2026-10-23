import { NextResponse } from 'next/server';
import { getAggregatedNationwideData } from '@/lib/aggregation/nationwide';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAggregatedNationwideData();
    return NextResponse.json(
      {
        coverage: data.coverage,
        provinceStatuses: data.provinceStatuses,
        lastUpdated: data.lastUpdated,
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
      { error: error?.message || 'Failed to retrieve nationwide status' },
      { status: 500 }
    );
  }
}
