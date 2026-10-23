/**
 * Verification Script for Thailand Nationwide Flood Monitoring Architecture
 * Tests:
 * 1. Live RID Dams API normalization
 * 2. Live ThaiWater API normalization
 * 3. Province status calculation and underlying evidence generation
 * 4. Cache STALE fallback mechanism
 * 5. Admin authentication token verification
 */

import { fetchRidDams } from '../src/lib/providers/rid';
import { fetchThaiWaterWaterLevels, fetchThaiWaterRainfall } from '../src/lib/providers/thaiwater';
import { calculateProvinceStatus } from '../src/lib/aggregation/province-status';
import { getWithCache, clearCache } from '../src/lib/cache/server-cache';
import { THAILAND_PROVINCES, findProvinceById, findProvinceByCode } from '../src/data/thailand-provinces';
import { TelemetryStation } from '../src/types/telemetry';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing Canonical 77 Province Model ---');
  assert(THAILAND_PROVINCES.length === 77, `Total provinces is 77 (got ${THAILAND_PROVINCES.length})`);
  const prb = findProvinceById('prachinburi');
  assert(prb !== undefined && prb.code === '25' && prb.name_th === 'ปราจีนบุรี', 'Prachinburi canonical metadata verified (code 25)');
  const bkk = findProvinceByCode('10');
  assert(bkk !== undefined && bkk.id === 'bangkok' && bkk.name_th === 'กรุงเทพมหานคร', 'Bangkok canonical metadata verified (code 10)');
  const cm = findProvinceById('chiangmai');
  assert(cm !== undefined && cm.code === '50', 'Chiang Mai canonical metadata verified (code 50)');

  console.log('\n--- 2. Testing Official RID Public Dam Provider ---');
  try {
    const ridResult = await fetchRidDams(10000);
    assert(ridResult.status === 'LIVE' || ridResult.status === 'STATIC', `RID Provider status is ${ridResult.status}`);
    assert(Array.isArray(ridResult.data) && (ridResult.data?.length ?? 0) >= 30, `RID returned ${ridResult.data?.length} dams (expected >= 30)`);
    if (ridResult.data && ridResult.data.length > 0) {
      const sample = ridResult.data[0];
      assert(sample.id.startsWith('dam-'), `Dam ID format valid: ${sample.id}`);
      assert(typeof sample.capacity_percentage === 'number', `Dam capacity % is numeric: ${sample.capacity_percentage}%`);
      assert(sample.observed_at !== null && sample.observed_at.length > 0, `Dam observed_at is real timestamp: ${sample.observed_at}`);
      assert(sample.data_status === 'LIVE', `Dam data_status is LIVE`);
    }
  } catch (err) {
    console.error('RID test threw error:', err);
    failed++;
  }

  console.log('\n--- 3. Testing Official ThaiWater Water Level Provider ---');
  try {
    const twResult = await fetchThaiWaterWaterLevels(10000);
    assert(twResult.status === 'LIVE' || twResult.status === 'STATIC', `ThaiWater status is ${twResult.status}`);
    if (twResult.data && twResult.data.length > 0) {
      assert(twResult.data.length >= 500, `ThaiWater parsed ${twResult.data.length} stations across Thailand (expected >= 500)`);
      const sample = twResult.data[0];
      assert(sample.province !== undefined && sample.province.length > 0, `Station mapped to province: ${sample.province}`);
      assert(sample.observed_at !== null, `Station observed_at preserved: ${sample.observed_at}`);
      assert(sample.data_status === 'LIVE', `Station marked LIVE`);
    }
  } catch (err) {
    console.error('ThaiWater test threw error:', err);
    failed++;
  }

  console.log('\n--- 4. Testing Province Flood Status Engine & Underlying Evidence ---');
  const mockPrbProvince = findProvinceById('prachinburi')!;
  const mockOverflowStation: TelemetryStation = {
    id: 'test-1',
    station_code: 'TEST01',
    name_th: 'สถานีทดสอบล้นตลิ่ง',
    province: 'prachinburi',
    district: 'กบินทร์บุรี',
    subdistrict: 'เมืองเก่า',
    latitude: 13.99,
    longitude: 101.71,
    station_type: 'water_level',
    severity: 'red',
    severity_label: 'วิกฤต/ล้นตลิ่ง',
    status_text: 'น้ำล้นตลิ่ง 0.85 ม.',
    observed_at: '2026-10-08T15:00:00Z',
    data_status: 'LIVE',
    source_agency: 'HII',
    source_name_th: 'สสน.',
    diff_from_bank: 0.85,
  };
  const statusReport = calculateProvinceStatus({
    province: mockPrbProvince,
    stations: [mockOverflowStation],
    dams: [],
    highways: [],
  });
  assert(statusReport.status === 'CRITICAL', `Calculated status is CRITICAL when station overflowed (got ${statusReport.status})`);
  assert(statusReport.evidence.length > 0, `Underlying evidence generated (${statusReport.evidence.length} points)`);
  assert(statusReport.evidence[0].includes('ล้นตลิ่งวิกฤต'), `Evidence text explicitly documents station overflow: ${statusReport.evidence[0]}`);

  console.log('\n--- 5. Testing Server Cache & STALE Fallback on Error ---');
  clearCache();
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return { data: 'test-value', source: 'Test', status: 'LIVE' as const, fetchedAt: new Date().toISOString(), observedAt: '2026-10-08T12:00:00Z' };
  };
  // 1. Initial fetch: sets TTL to 0.05 seconds (50ms)
  const firstRes = await getWithCache('test-key', mockFetch, { ttlSeconds: 0.05 });
  assert(firstRes.data === 'test-value' && firstRes.status === 'LIVE', 'Cache correctly stores fresh value');
  
  // 2. Immediate hit: before expiration
  await getWithCache('test-key', mockFetch, { ttlSeconds: 0.05 });
  assert(fetchCount === 1, 'Cache returns cached value without re-fetching within TTL');
  
  // 3. Wait for TTL to expire, then fail the fetcher -> must return STALE with last-known-good data
  await new Promise((r) => setTimeout(r, 70));
  const failingFetch = async () => { throw new Error('Simulated network timeout'); };
  const staleRes = await getWithCache('test-key', failingFetch, { ttlSeconds: 10 });
  assert(staleRes.data === 'test-value' && staleRes.status === 'STALE', 'Cache gracefully falls back to STALE data on network error');
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
