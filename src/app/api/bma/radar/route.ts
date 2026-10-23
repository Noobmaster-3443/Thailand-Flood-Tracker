import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BMA / Bangkok Radar Image Proxy
 * Tries multiple radar sources in priority order:
 * 1. BMA DDS Nong Chok High-Res radar
 * 2. BMA DDS Nong Chok Standard radar
 * 3. TMD Bangkok Nong Chok radar (public JPEG - most reliable)
 */
const RADAR_SOURCES = [
  {
    url: 'https://weather.bangkok.go.th/radar/ImageHandlerNongchokHigh.ashx',
    referer: 'https://weather.bangkok.go.th/RadarHighResolution.aspx',
    label: 'BMA DDS Nong Chok High-Res',
  },
  {
    url: 'https://weather.bangkok.go.th/radar/ImageHandlerNongchok.ashx',
    referer: 'https://weather.bangkok.go.th/RadarNongchok.aspx',
    label: 'BMA DDS Nong Chok Standard',
  },
  {
    url: 'https://weather.tmd.go.th/pic_bmanck.jpg',
    referer: 'https://weather.tmd.go.th/',
    label: 'TMD Bangkok Nong Chok',
  },
];

export async function GET(req: NextRequest) {
  const timestamp = Date.now();

  for (const source of RADAR_SOURCES) {
    try {
      const url = source.url.includes('?') ? `${source.url}&t=${timestamp}` : `${source.url}?t=${timestamp}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': source.referer,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      // Verify it's actually an image
      if (!contentType.startsWith('image/')) continue;

      const buffer = await res.arrayBuffer();
      // Skip tiny responses (likely error pages)
      if (buffer.byteLength < 5000) continue;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
          'X-Radar-Source': source.label,
        },
      });
    } catch {
      // Try next source
      continue;
    }
  }

  // All sources failed - return a descriptive error
  return NextResponse.json(
    {
      error: 'ไม่สามารถโหลดภาพเรดาร์ได้ในขณะนี้',
      message: 'กรุณาดูภาพเรดาร์จากเว็บไซต์ทางการ: weather.bangkok.go.th/radar',
      fallbackUrl: 'https://weather.bangkok.go.th/radar',
    },
    { status: 503 },
  );
}
