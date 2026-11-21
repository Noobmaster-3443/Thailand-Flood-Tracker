import { HighTideAlert } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';
import { OFFICIAL_HIGH_TIDE, BANGKOK_HIGH_TIDE } from '@/data/open-data-telemetry';
import { fetchThaiWaterWaterLevels } from './thaiwater';

const COASTAL_PROVINCES = new Set([
  'all', 'bangkok', 'samutprakan', 'samutsakhon', 'samutsongkhram',
  'chachoengsao', 'prachinburi', 'nonthaburi', 'pathumthani', 'chonburi',
  'rayong', 'chanthaburi', 'trat', 'phetchaburi', 'prachuapkhirikhan',
  'chumphon', 'suratthani', 'nakhonsithammarat', 'songkhla', 'pattani',
  'narathiwat', 'ranong', 'phangnga', 'phuket', 'krabi', 'trang', 'satun'
]);

export async function fetchNavyTide(provinceId: string = 'bangkok'): Promise<DataResult<HighTideAlert>> {
  const fetchedAt = new Date().toISOString();

  // If inland province, water tide does not apply
  if (provinceId !== 'all' && !COASTAL_PROVINCES.has(provinceId)) {
    return {
      data: null,
      source: 'กรมอุทกศาสตร์ กองทัพเรือ (Hydrographic Department)',
      sourceAgency: 'Royal Thai Navy',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: 'จังหวัดนี้ไม่มีพื้นที่ติดชายฝั่งทะเลหรือปากแม่น้ำที่ได้รับผลกระทบจากน้ำทะเลหนุน',
    };
  }

  // Bangkok and Chao Phraya downstream provinces use Bangkok Navy Hydrographic station (Pak Khlong Talat / Fort Chula)
  const isChaoPhraya = provinceId === 'bangkok' || provinceId === 'all' || provinceId === 'nonthaburi' || provinceId === 'samutprakan' || provinceId === 'pathumthani';

  // Live Telemetry Integration: Fort Chula Naval Station (ป้อมพระจุลจอมเกล้า)
  try {
    const wlResult = await fetchThaiWaterWaterLevels(4000);
    const fortChula = wlResult.data?.find(
      (s) => (s.name_th && s.name_th.includes('ป้อมพระจุล')) || s.station_code === 'BKK013' || s.station_code === 'C.4'
    );

    if (fortChula && fortChula.water_level_m_msl !== undefined && fortChula.observed_at) {
      const tideData: HighTideAlert = {
        ...(isChaoPhraya ? BANGKOK_HIGH_TIDE : OFFICIAL_HIGH_TIDE),
        station_name: 'สถานีป้อมพระจุลจอมเกล้า กรมอุทกศาสตร์ กองทัพเรือ',
        morning_peak_m_msl: fortChula.water_level_m_msl,
        morning_peak_time: fortChula.observed_at.includes(' ') ? fortChula.observed_at.split(' ')[1] : '12:00',
        data_status: 'LIVE' as DataStatus,
      };

      return {
        data: tideData,
        source: 'กรมอุทกศาสตร์ กองทัพเรือ • สสน. (โทรมาตรระดับน้ำสด สถานีป้อมพระจุลจอมเกล้า ปากแม่น้ำเจ้าพระยา)',
        sourceAgency: 'Royal Thai Navy',
        status: 'LIVE',
        fetchedAt,
        observedAt: fortChula.observed_at,
      };
    }
  } catch (err: any) {
    // If live fetch fails, fall back to verified reference below
  }

  const tideData: HighTideAlert = {
    ...(isChaoPhraya ? BANGKOK_HIGH_TIDE : OFFICIAL_HIGH_TIDE),
    data_status: 'STATIC' as DataStatus,
  };

  return {
    data: tideData,
    source: isChaoPhraya
      ? 'กรมอุทกศาสตร์ กองทัพเรือ (ตารางน้ำทำนายแม่น้ำเจ้าพระยา ปากคลองตลาด-กองทัพเรือ)'
      : 'กรมอุทกศาสตร์ กองทัพเรือ (ตารางน้ำขึ้น-น้ำลง ประจำสถานีปากแม่น้ำ)',
    sourceAgency: 'Royal Thai Navy',
    status: 'STATIC',
    fetchedAt,
    observedAt: '2026-10-08T06:00:00Z',
  };
}
