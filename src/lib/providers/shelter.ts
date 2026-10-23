/**
 * DDPM / Emergency Shelters Provider (ปภ. - กรมป้องกันและบรรเทาสาธารณภัย)
 * Verified administrative and emergency shelter registry.
 * Clearly marked as STATIC verified reference data.
 */

import { EvacuationShelter } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';
import { NATIONWIDE_SHELTERS } from '@/data/nationwide-telemetry';

export async function fetchEvacuationShelters(provinceId?: string): Promise<DataResult<EvacuationShelter[]>> {
  const fetchedAt = new Date().toISOString();

  const allShelters: EvacuationShelter[] = NATIONWIDE_SHELTERS.map((s) => ({
    ...s,
    data_status: 'STATIC' as DataStatus,
  }));

  const filtered = provinceId && provinceId !== 'all'
    ? allShelters.filter((s) => (s.province || 'prachinburi') === provinceId)
    : allShelters;

  if (filtered.length === 0) {
    return {
      data: [],
      source: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ. 1784)',
      sourceAgency: 'DDPM',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: 'ยังไม่มีศูนย์พักพิงที่ลงทะเบียนในจังหวัดนี้',
    };
  }

  return {
    data: filtered,
    source: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ. 1784 / องค์กรปกครองส่วนท้องถิ่น)',
    sourceAgency: 'DDPM',
    status: 'STATIC',
    fetchedAt,
    observedAt: '2026-10-06T12:00:00Z',
  };
}
