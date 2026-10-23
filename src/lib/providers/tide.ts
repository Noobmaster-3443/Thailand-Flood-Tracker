import { HighTideAlert } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';
import { OFFICIAL_HIGH_TIDE, BANGKOK_HIGH_TIDE } from '@/data/open-data-telemetry';

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

  // Bangkok and Chao Phraya downstream provinces use Bangkok Navy Hydrographic station (Pak Khlong Talat)
  const isChaoPhraya = provinceId === 'bangkok' || provinceId === 'all' || provinceId === 'nonthaburi' || provinceId === 'samutprakan' || provinceId === 'pathumthani';
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
    observedAt: '2024-10-08T06:00:00Z',
  };
}
