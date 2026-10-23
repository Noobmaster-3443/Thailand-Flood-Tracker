import { NextResponse } from 'next/server';
import { getAggregatedNationwideData } from '@/lib/aggregation/nationwide';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getAggregatedNationwideData();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Failed to aggregate nationwide data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to aggregate nationwide data' },
      { status: 500 }
    );
  }
}
