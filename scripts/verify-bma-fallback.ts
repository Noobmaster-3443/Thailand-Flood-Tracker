/**
 * Automated Test Suite for BMA DDS Road Flood Sensor Fallback & Resiliency
 *
 * Scenarios covered:
 * 1. Verified static sensor profiles integrity (254 verified sensors)
 * 2. Pure fallback mode: stations marked STATIC, water_depth_cm undefined, observed_at empty, no false measurement time
 * 3. Merging live records with static profiles: valid measurements marked LIVE with exact ISO timestamps
 * 4. Severity calculations for live depths (0cm = green, 6.5cm = orange)
 * 5. End-to-end fetchBmaRoadFloods contract
 */

import {
  BMA_STATIC_PROFILES,
  buildBmaStations,
  fetchBmaRoadFloods,
  parseBmaTimestamp,
} from '../src/lib/providers/bma';

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

async function runBmaTests() {
  console.log('\n--- 1. Testing BMA Static Profiles Dataset Integrity ---');
  assert(Array.isArray(BMA_STATIC_PROFILES), 'BMA_STATIC_PROFILES is an array');
  assert(BMA_STATIC_PROFILES.length === 254, `BMA_STATIC_PROFILES count is exactly 254 (got ${BMA_STATIC_PROFILES.length})`);

  const ptw05 = BMA_STATIC_PROFILES.find((s) => s.code === 'FL.PTW.05');
  assert(ptw05 !== undefined, 'FL.PTW.05 (ถ.ราชดำริ หน้า รพ.ตำรวจ) is present in static profiles');
  if (ptw05) {
    assert(ptw05.id === 680, `FL.PTW.05 id is 680 (got ${ptw05.id})`);
    assert(ptw05.district === 'ปทุมวัน', `FL.PTW.05 district is ปทุมวัน (got ${ptw05.district})`);
    assert(ptw05.latitude > 13.7 && ptw05.latitude < 13.8, `FL.PTW.05 latitude is valid: ${ptw05.latitude}`);
    assert(ptw05.longitude > 100.5 && ptw05.longitude < 100.6, `FL.PTW.05 longitude is valid: ${ptw05.longitude}`);
  }

  // Ensure no duplicate IDs or Codes
  const ids = new Set<number>();
  const codes = new Set<string>();
  let hasDuplicates = false;
  for (const s of BMA_STATIC_PROFILES) {
    if (ids.has(s.id) || codes.has(s.code)) {
      hasDuplicates = true;
      break;
    }
    ids.add(s.id);
    codes.add(s.code);
  }
  assert(!hasDuplicates, 'All 254 static sensor profiles have unique ids and codes');

  console.log('\n--- 2. Testing Pure Fallback Mode (No Live Records Available) ---');
  const emptyRecordMap = new Map<string, any>();
  const fallbackTime = '2026-10-24T07:00:00.000Z';
  const fallbackResult = buildBmaStations(BMA_STATIC_PROFILES, emptyRecordMap, fallbackTime);

  assert(fallbackResult.stations.length === 254, `Fallback created all 254 stations (got ${fallbackResult.stations.length})`);
  assert(fallbackResult.hasLiveRecords === false, 'hasLiveRecords is false in pure fallback mode');
  assert(fallbackResult.latestObservedAt === null, 'latestObservedAt is null in fallback mode');

  const fallbackPtw05 = fallbackResult.stations.find((s) => s.station_code === 'FL.PTW.05');
  assert(fallbackPtw05 !== undefined, 'FL.PTW.05 station generated in fallback mode');
  if (fallbackPtw05) {
    assert(fallbackPtw05.data_status === 'STATIC', `Fallback status is STATIC (got ${fallbackPtw05.data_status})`);
    assert(fallbackPtw05.water_depth_cm === undefined, `Fallback water level is undefined, NOT zero (got ${fallbackPtw05.water_depth_cm})`);
    assert(fallbackPtw05.observed_at === '', `Fallback observed_at is empty string, NOT fallback time (got '${fallbackPtw05.observed_at}')`);
    assert(fallbackPtw05.severity_label === 'รอสัญญาณตรวจวัดสด', `Fallback severity label indicates waiting for signal: ${fallbackPtw05.severity_label}`);
    assert(fallbackPtw05.status_text.includes('รอสัญญาณตรวจวัดสด'), `Fallback status text informs user: ${fallbackPtw05.status_text}`);
  }

  console.log('\n--- 3. Testing Merging of Live Records with Static Profiles ---');
  const mockRecordMap = new Map<string, any>();
  const recordTimestampRaw = '2026-10-24T07:05:00'; // Emitted by upstream BMA API without offset
  const expectedIso = '2026-10-24T07:05:00.000Z';

  mockRecordMap.set('680', {
    id: 164,
    flood_now: '0.0',
    timestamp: recordTimestampRaw,
    sensor_profile: { id: 680, code: 'FL.PTW.05' },
  });
  mockRecordMap.set('FL.SPW.01', {
    id: 200,
    flood_now: '6.5',
    timestamp: recordTimestampRaw,
    sensor_profile: { id: 716, code: 'FL.SPW.01' },
  });

  const mergedResult = buildBmaStations(BMA_STATIC_PROFILES, mockRecordMap, fallbackTime);
  assert(mergedResult.stations.length === 254, `Merged station count remains exactly 254 without duplicates (got ${mergedResult.stations.length})`);
  assert(mergedResult.hasLiveRecords === true, 'Merged result indicates live records exist');

  const livePtw05 = mergedResult.stations.find((s) => s.station_code === 'FL.PTW.05');
  assert(livePtw05 !== undefined && livePtw05.data_status === 'LIVE', 'FL.PTW.05 marked LIVE when record is present');
  assert(livePtw05?.water_depth_cm === 0, `FL.PTW.05 real water depth is 0 cm (got ${livePtw05?.water_depth_cm})`);
  assert(livePtw05?.observed_at === expectedIso, `FL.PTW.05 real timestamp parsed correctly as UTC: ${livePtw05?.observed_at}`);

  const liveFlooded = mergedResult.stations.find((s) => s.station_code === 'FL.SPW.01');
  assert(liveFlooded !== undefined && liveFlooded.data_status === 'LIVE', 'FL.SPW.01 marked LIVE');
  assert(liveFlooded?.water_depth_cm === 6.5, `FL.SPW.01 flood depth is 6.5 cm (got ${liveFlooded?.water_depth_cm})`);
  assert(liveFlooded?.severity === 'orange', `FL.SPW.01 6.5 cm triggers orange severity (got ${liveFlooded?.severity})`);

  // An unmeasured sensor in the same batch should remain STATIC with no false timestamp
  const unmeasured = mergedResult.stations.find((s) => s.station_code === 'FL.BBN.01');
  assert(unmeasured?.data_status === 'STATIC', 'Unmeasured station remains STATIC');
  assert(unmeasured?.water_depth_cm === undefined, 'Unmeasured station water_depth_cm is undefined');
  assert(unmeasured?.observed_at === '', 'Unmeasured station observed_at is empty');

  console.log('\n--- 4. Testing End-to-End fetchBmaRoadFloods with Provider Contract ---');
  const providerResult = await fetchBmaRoadFloods(5000);
  assert(Array.isArray(providerResult.data), 'Provider returns an array in data');
  assert(providerResult.data?.length === 254, `Provider returns 254 stations (got ${providerResult.data?.length})`);
  assert(
    providerResult.status === 'LIVE' || providerResult.status === 'STATIC',
    `Provider status is valid DataStatus: ${providerResult.status}`
  );

  console.log('\n========================================');
  console.log(`BMA TESTS SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBmaTests().catch((err) => {
  console.error('Test threw unhandled error:', err);
  process.exit(1);
});
