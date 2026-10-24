/**
 * Automated Mock Test Suite for BMA DDS Road Flood Sensor Fallback & Resiliency
 *
 * Scenarios tested with isolated mocked fetch:
 * 1. HTTP 403 Forbidden from sensor-profile endpoint (e.g. Cloudflare WAF block)
 * 2. HTTP 503 Service Unavailable from measurement record endpoint
 * 3. Network rejection and AbortController timeout
 * 4. Malformed JSON / unexpected response schema
 * 5. Complete upstream failure (both endpoints throwing or non-200 simultaneously)
 * 6. Successful live response merging with static profiles preserving values and timestamps
 * 7. Timestamp parsing regression: UTC strings, +07:00 strings, and untagged BMA strings
 * 8. Malformed flood_now values (null, NaN, empty string) strictly rejected from LIVE status
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

// Preserve original global fetch
const originalFetch = global.fetch;

async function runMockedTests() {
  console.log('\n======================================================');
  console.log('TARGETED ISOLATED FETCH TESTS FOR BMA DDS FALLBACK');
  console.log('======================================================');

  // -----------------------------------------------------------------
  // Case 1: HTTP 403 Forbidden on Sensor-Profile endpoint
  // -----------------------------------------------------------------
  console.log('\n--- Case 1: HTTP 403 Forbidden on Sensor Profile Endpoint ---');
  global.fetch = async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('sensor_profile')) {
      return new Response('Forbidden by Cloudflare WAF', {
        status: 403,
        statusText: 'Forbidden',
      });
    }
    // Record endpoint returns 1 record
    return new Response(
      JSON.stringify({
        data: [
          {
            id: 1,
            flood_now: '0.0',
            timestamp: '2026-10-24T07:15:00',
            sensor_profile: { id: 680, code: 'FL.PTW.05' },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const resCase1 = await fetchBmaRoadFloods(2000);
  assert(resCase1.data !== null && Array.isArray(resCase1.data), 'Returns valid array on profile 403');
  assert(resCase1.data?.length === 254, `Returns exactly 254 verified static profiles (got ${resCase1.data?.length})`);
  assert(resCase1.status === 'LIVE', 'Provider status is LIVE because live measurement was matched');
  const case1Ptw05 = resCase1.data?.find((s) => s.station_code === 'FL.PTW.05');
  assert(case1Ptw05?.data_status === 'LIVE' && case1Ptw05?.water_depth_cm === 0, 'FL.PTW.05 is LIVE with depth 0 cm');
  assert(case1Ptw05?.observed_at === '2026-10-24T07:15:00.000Z', 'FL.PTW.05 timestamp parsed as valid ISO UTC');
  const case1Unmeasured = resCase1.data?.find((s) => s.station_code === 'FL.BBN.01');
  assert(case1Unmeasured?.data_status === 'STATIC' && case1Unmeasured?.water_depth_cm === undefined, 'Unmeasured profile remains STATIC with undefined depth');
  assert(case1Unmeasured?.observed_at === '', 'Unmeasured profile observed_at is empty, NOT fake time');

  // -----------------------------------------------------------------
  // Case 2: HTTP 503 Service Unavailable on Measurement Record endpoint
  // -----------------------------------------------------------------
  console.log('\n--- Case 2: HTTP 503 Service Unavailable on Record Endpoint ---');
  global.fetch = async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('last-record')) {
      return new Response('Backend Database Overloaded', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
    // Profile endpoint returns 254 profiles
    return new Response(
      JSON.stringify({ data: BMA_STATIC_PROFILES.map((p) => ({ ...p, lat: p.latitude, long: p.longitude })) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const resCase2 = await fetchBmaRoadFloods(2000);
  assert(resCase2.data !== null && Array.isArray(resCase2.data), 'Returns valid array on record 503');
  assert(resCase2.data?.length === 254, `Returns 254 profiles (got ${resCase2.data?.length})`);
  assert(resCase2.status === 'STATIC', `Provider status is strictly STATIC (got ${resCase2.status})`);
  assert(resCase2.observedAt === null, `observedAt is null when live records fail`);
  const anyLiveCase2 = resCase2.data?.some((s) => s.data_status === 'LIVE');
  assert(!anyLiveCase2, 'No stations are labeled LIVE when record endpoint returns 503');
  const anyZeroCase2 = resCase2.data?.some((s) => s.water_depth_cm === 0);
  assert(!anyZeroCase2, 'Missing water levels are NOT replaced with zero on 503 failure');
  const anyFakeTimeCase2 = resCase2.data?.some((s) => s.observed_at !== '');
  assert(!anyFakeTimeCase2, 'Static stations have empty observed_at, never fake measurement time');

  // -----------------------------------------------------------------
  // Case 3: Network rejection / Socket Timeout
  // -----------------------------------------------------------------
  console.log('\n--- Case 3: Network Connection Rejection / Socket Timeout ---');
  global.fetch = async () => {
    throw new Error('connect ETIMEDOUT 104.18.25.169:443');
  };

  const resCase3 = await fetchBmaRoadFloods(2000);
  assert(resCase3.data !== null && Array.isArray(resCase3.data), 'Returns valid array on network timeout');
  assert(resCase3.data?.length === 254, `Returns 254 profiles (got ${resCase3.data?.length})`);
  assert(resCase3.status === 'STATIC', `Provider status is strictly STATIC (got ${resCase3.status})`);
  assert(resCase3.observedAt === null, `observedAt is null on network rejection`);
  const sampleCase3 = resCase3.data?.[0];
  assert(sampleCase3?.data_status === 'STATIC', 'Station status is STATIC');
  assert(sampleCase3?.water_depth_cm === undefined, 'water_depth_cm is undefined');
  assert(sampleCase3?.observed_at === '', 'observed_at is empty string on timeout');
  assert(Boolean(sampleCase3?.status_text?.includes('รอสัญญาณตรวจวัดสด')), 'status_text clearly explains fallback to user');

  // -----------------------------------------------------------------
  // Case 4: Malformed JSON or Unexpected Non-JSON Response (e.g. HTML 502 page)
  // -----------------------------------------------------------------
  console.log('\n--- Case 4: Malformed JSON / HTML Cloudflare Error Page ---');
  global.fetch = async () => {
    return new Response('<html><body>Bad Gateway 502 from origin</body></html>', {
      status: 200, // Misconfigured upstream proxy sending 200 with HTML error page
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const resCase4 = await fetchBmaRoadFloods(2000);
  assert(resCase4.data !== null && Array.isArray(resCase4.data), 'Returns valid array on malformed response');
  assert(resCase4.data?.length === 254, `Returns 254 profiles (got ${resCase4.data?.length})`);
  assert(resCase4.status === 'STATIC', `Provider status is STATIC (got ${resCase4.status})`);
  assert(resCase4.observedAt === null, `observedAt is null on malformed response`);
  const anyLiveCase4 = resCase4.data?.some((s) => s.data_status === 'LIVE');
  assert(!anyLiveCase4, 'No stations are labeled LIVE on malformed response');

  // -----------------------------------------------------------------
  // Case 5: Complete Upstream Failure (Both Endpoints 500 Simultaneously)
  // -----------------------------------------------------------------
  console.log('\n--- Case 5: Complete Upstream Failure (Both Endpoints Fail) ---');
  global.fetch = async () => {
    return new Response('Internal Server Error', { status: 500 });
  };

  const resCase5 = await fetchBmaRoadFloods(2000);
  assert(resCase5.data !== null && Array.isArray(resCase5.data), 'Returns valid array on complete 500 failure');
  assert(resCase5.data?.length === 254, `Returns 254 profiles (got ${resCase5.data?.length})`);
  assert(resCase5.status === 'STATIC', `Provider status is STATIC (got ${resCase5.status})`);
  assert(resCase5.observedAt === null, `observedAt is null on 500 failure`);

  // Verify uniqueness and no duplicate markers across the entire 254 set
  const case5Ids = new Set(resCase5.data?.map((s) => s.id));
  assert(case5Ids.size === 254, 'All 254 station IDs are strictly unique with zero duplicates');

  // -----------------------------------------------------------------
  // Case 6: Successful Live Response (Normal Happy Path with Measurement Merging)
  // -----------------------------------------------------------------
  console.log('\n--- Case 6: Successful Live Response with Exact Value Merging ---');
  const liveObsTime = '2026-10-24T07:10:00';
  const expectedObsIso = '2026-10-24T07:10:00.000Z';
  global.fetch = async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('sensor_profile')) {
      return new Response(
        JSON.stringify({
          data: BMA_STATIC_PROFILES.map((p) => ({ ...p, lat: p.latitude, long: p.longitude })),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        data: [
          {
            id: 100,
            flood_now: '0.0',
            timestamp: liveObsTime,
            sensor_profile: { id: 680, code: 'FL.PTW.05' },
          },
          {
            id: 101,
            flood_now: '12.4',
            timestamp: liveObsTime,
            sensor_profile: { id: 716, code: 'FL.SPW.01' },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const resCase6 = await fetchBmaRoadFloods(2000);
  assert(resCase6.status === 'LIVE', 'Provider status is LIVE');
  assert(resCase6.data?.length === 254, 'Exactly 254 stations returned');
  assert(resCase6.observedAt === expectedObsIso, `latestObservedAt matches real timestamp: ${resCase6.observedAt}`);

  const livePtw = resCase6.data?.find((s) => s.station_code === 'FL.PTW.05');
  assert(livePtw?.data_status === 'LIVE', 'FL.PTW.05 is LIVE');
  assert(livePtw?.water_depth_cm === 0, `FL.PTW.05 real water depth 0.0 cm preserved (got ${livePtw?.water_depth_cm})`);
  assert(livePtw?.observed_at === expectedObsIso, 'FL.PTW.05 observation time preserved as ISO UTC');
  assert(livePtw?.severity === 'green', `FL.PTW.05 severity is green (got ${livePtw?.severity})`);

  const liveSpw = resCase6.data?.find((s) => s.station_code === 'FL.SPW.01');
  assert(liveSpw?.data_status === 'LIVE', 'FL.SPW.01 is LIVE');
  assert(liveSpw?.water_depth_cm === 12.4, `FL.SPW.01 flood depth 12.4 cm preserved (got ${liveSpw?.water_depth_cm})`);
  assert(liveSpw?.severity === 'orange', `FL.SPW.01 12.4 cm triggers orange severity (got ${liveSpw?.severity})`);

  // -----------------------------------------------------------------
  // Case 7: Timestamp Parsing Variants (+07:00, Z, and raw)
  // -----------------------------------------------------------------
  console.log('\n--- Case 7: Timestamp Parsing Variants ---');
  assert(parseBmaTimestamp('2026-10-24T07:10:00') === '2026-10-24T07:10:00.000Z', 'Raw BMA UTC string converted to ISO Z');
  assert(parseBmaTimestamp('2026-10-24T07:10:00Z') === '2026-10-24T07:10:00.000Z', 'ISO Z preserved without shift');
  assert(parseBmaTimestamp('2026-10-24T14:10:00+07:00') === '2026-10-24T07:10:00.000Z', '+07:00 timestamp parsed correctly to same UTC instant');
  assert(parseBmaTimestamp(null) === null, 'null timestamp returns null');
  assert(parseBmaTimestamp('invalid-date') === null, 'invalid timestamp returns null');

  // -----------------------------------------------------------------
  // Case 8: Malformed flood_now values reject LIVE status
  // -----------------------------------------------------------------
  console.log('\n--- Case 8: Malformed flood_now values reject LIVE status ---');
  const malformedMap = new Map<string, any>();
  malformedMap.set('680', {
    id: 999,
    flood_now: 'invalid_number',
    timestamp: '2026-10-24T07:10:00',
    sensor_profile: { id: 680, code: 'FL.PTW.05' },
  });
  malformedMap.set('517', {
    id: 998,
    flood_now: null,
    timestamp: '2026-10-24T07:10:00',
    sensor_profile: { id: 517, code: 'FL.BBN.01' },
  });
  malformedMap.set('518', {
    id: 997,
    flood_now: '',
    timestamp: '2026-10-24T07:10:00',
    sensor_profile: { id: 518, code: 'FL.BBN.02' },
  });

  const malformedResult = buildBmaStations(BMA_STATIC_PROFILES, malformedMap, '2026-10-24T07:00:00Z');
  assert(malformedResult.hasLiveRecords === false, 'hasLiveRecords is false when all flood_now values are malformed');
  const malformedPtw = malformedResult.stations.find((s) => s.station_code === 'FL.PTW.05');
  assert(malformedPtw?.data_status === 'STATIC', 'Malformed NaN station strictly remains STATIC');
  assert(malformedPtw?.water_depth_cm === undefined, 'Malformed NaN station water_depth_cm is undefined');
  assert(malformedPtw?.observed_at === '', 'Malformed NaN station observed_at is empty');

  // Restore fetch
  global.fetch = originalFetch;

  console.log('\n======================================================');
  console.log(`MOCKED TESTS SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMockedTests().catch((err) => {
  global.fetch = originalFetch;
  console.error('Mocked test threw unhandled error:', err);
  process.exit(1);
});
