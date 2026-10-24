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
const dynamicFreshTime = new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 19);
const dynamicFreshIso = new Date(dynamicFreshTime + 'Z').toISOString();

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
            timestamp: dynamicFreshTime,
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
  assert(case1Ptw05?.observed_at === dynamicFreshIso, 'FL.PTW.05 timestamp parsed as valid ISO UTC');
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
  assert(Boolean(sampleCase3?.status_text?.includes('ดึงข้อมูลจาก BMA DDS ไม่สำเร็จ')), 'status_text clearly explains fallback to user');

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
  const liveObsTime = dynamicFreshTime;
  const expectedObsIso = dynamicFreshIso;
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

  // -----------------------------------------------------------------
  // Case 9: Stale measurements (> 3 hours), future timestamps, and malfunction status rejection
  // -----------------------------------------------------------------
  console.log('\n--- Case 9: Stale Measurements, Future Timestamps, and Malfunction Device Status ---');
  const staleMap = new Map<string, any>();

  // Stale measurement (> 3 hours old, e.g. 5 hours ago)
  staleMap.set('680', {
    id: 991,
    flood_now: '8.5',
    timestamp: '2026-10-24T02:00:00', // ~5 hours ago from 07:15
    sensor_profile: { id: 680, code: 'FL.PTW.05', device_status: 'normal' },
  });

  // Device status malfunction with fresh timestamp and flood depth
  staleMap.set('716', {
    id: 992,
    flood_now: '6.3',
    timestamp: '2026-10-24T07:10:00', // fresh timestamp
    sensor_profile: { id: 716, code: 'FL.SPW.01', device_status: 'malfunction' },
  });

  // Temporary malfunction
  staleMap.set('517', {
    id: 993,
    flood_now: '3.0',
    timestamp: '2026-10-24T07:10:00',
    sensor_profile: { id: 517, code: 'FL.BBN.01', device_status: 'temporary_malfunction' },
  });

  // Far future timestamp (> 15 minutes in future, e.g. tomorrow)
  staleMap.set('518', {
    id: 994,
    flood_now: '4.0',
    timestamp: '2026-10-25T12:00:00',
    sensor_profile: { id: 518, code: 'FL.BBN.02', device_status: 'normal' },
  });

  // Valid live station alongside stale/malfunction stations
  staleMap.set('519', {
    id: 995,
    flood_now: '0.0',
    timestamp: '2026-10-24T07:10:00',
    sensor_profile: { id: 519, code: 'FL.BBN.03', device_status: 'normal' },
  });

  const testCurrentTime = '2026-10-24T07:15:00.000Z';
  const filterResult = buildBmaStations(BMA_STATIC_PROFILES, staleMap, testCurrentTime);

  assert(filterResult.hasLiveRecords === true, 'hasLiveRecords is true because FL.BBN.03 is valid and live');

  const stalePtw05 = filterResult.stations.find((s) => s.station_code === 'FL.PTW.05');
  assert(stalePtw05?.data_status === 'STATIC', 'Stale > 3h station is strictly STATIC');
  assert(stalePtw05?.water_depth_cm === undefined, 'Stale > 3h station does not show old flood depth (got undefined)');
  assert(stalePtw05?.observed_at === '', 'Stale > 3h station has empty observed_at');

  const malfSpw01 = filterResult.stations.find((s) => s.station_code === 'FL.SPW.01');
  assert(malfSpw01?.data_status === 'STATIC', 'Malfunction station is strictly STATIC');
  assert(malfSpw01?.water_depth_cm === undefined, 'Malfunction station does not show old 6.3 cm depth (got undefined)');

  const tempMalfBbn01 = filterResult.stations.find((s) => s.station_code === 'FL.BBN.01');
  assert(tempMalfBbn01?.data_status === 'STATIC', 'temporary_malfunction station is strictly STATIC');
  assert(tempMalfBbn01?.water_depth_cm === undefined, 'temporary_malfunction station depth is undefined');

  const futureBbn02 = filterResult.stations.find((s) => s.station_code === 'FL.BBN.02');
  assert(futureBbn02?.data_status === 'STATIC', 'Far future timestamp station is strictly STATIC');
  assert(futureBbn02?.water_depth_cm === undefined, 'Far future timestamp depth is undefined');

  const validBbn03 = filterResult.stations.find((s) => s.station_code === 'FL.BBN.03');
  assert(validBbn03?.data_status === 'LIVE', 'Fresh normal station remains LIVE');
  assert(validBbn03?.water_depth_cm === 0, 'Fresh normal station preserves depth 0 cm');
  assert(validBbn03?.observed_at === '2026-10-24T07:10:00.000Z', 'Fresh normal station preserves observed_at');

  // -----------------------------------------------------------------
  // Case 10: Flaky 502/500 Recovered by Retry
  // -----------------------------------------------------------------
  console.log('\n--- Case 10: Flaky Upstream 502 Recovered by Single Retry ---');
  let attemptCount = 0;
  global.fetch = async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('last-record')) {
      attemptCount++;
      if (attemptCount === 1) {
        return new Response('502 Bad Gateway from Cloudflare', { status: 502 });
      }
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 1,
              flood_now: '0.0',
              timestamp: dynamicFreshTime,
              sensor_profile: { id: 680, code: 'FL.PTW.05', device_status: 'normal' },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ data: BMA_STATIC_PROFILES.map((p) => ({ ...p, lat: p.latitude, long: p.longitude })) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const resCase10 = await fetchBmaRoadFloods(4000);
  assert(attemptCount === 2, `Retry was triggered exactly once (attempt count = ${attemptCount})`);
  assert(resCase10.status === 'LIVE', 'Provider recovered to LIVE after successful retry');
  const case10Ptw05 = resCase10.data?.find((s) => s.station_code === 'FL.PTW.05');
  assert(case10Ptw05?.data_status === 'LIVE' && case10Ptw05?.water_depth_cm === 0, 'Recovered station is LIVE with depth 0 cm');

  // -----------------------------------------------------------------
  // Case 11: Diagnostic logging enabled via BMA_DEBUG=true
  // -----------------------------------------------------------------
  console.log('\n--- Case 11: Diagnostic Logging Verification (No Secret Leaks) ---');
  process.env.BMA_DEBUG = 'true';
  const logsCaptured: string[] = [];
  const originalConsoleInfo = console.info;
  console.info = (prefix: any, message: any) => {
    if (prefix === '[BMA_DDS_DIAGNOSTIC]') {
      logsCaptured.push(String(message));
    }
  };

  await fetchBmaRoadFloods(2000);
  console.info = originalConsoleInfo;
  delete process.env.BMA_DEBUG;

  assert(logsCaptured.length > 0, 'Diagnostic log was emitted when BMA_DEBUG=true');
  const parsedLog = JSON.parse(logsCaptured[0] || '{}');
  assert(parsedLog.profile !== undefined && parsedLog.record !== undefined, 'Log contains structured profile and record diagnostics');
  assert(parsedLog.evaluation !== undefined, 'Log contains evaluation summary');
  assert(parsedLog.sample_FL_BBN_01 !== undefined, 'Log contains sample station evaluation');
  assert(!JSON.stringify(parsedLog).includes('Bearer') && !JSON.stringify(parsedLog).includes('secret'), 'Log contains zero secrets or credentials');

  // -----------------------------------------------------------------
  // Case 12: Diagnostic Metadata on 403 Response with HTML body & Server Header
  // -----------------------------------------------------------------
  console.log('\n--- Case 12: Diagnostic Metadata on 403 with HTML body & Headers ---');
  process.env.BMA_DEBUG = 'true';
  process.env.VERCEL_REGION = 'iad1';
  const htmlBody = '<html><head><title>403 Forbidden</title></head><body>Cloudflare Block Ray ID: 888</body></html>';
  global.fetch = async () => {
    return new Response(htmlBody, {
      status: 403,
      statusText: 'Forbidden',
      headers: {
        'Server': 'cloudflare',
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': String(htmlBody.length),
        'CF-RAY': '1234567890abcdef',
        'CF-Mitigated': 'challenge',
        'X-Cache': 'Error from cloudfront',
        'Via': '1.1 vegur',
        'Set-Cookie': 'secret_cookie=do_not_log_this_sensitive_token',
      },
    });
  };

  const logsCase12: string[] = [];
  console.info = (prefix: any, message: any) => {
    if (prefix === '[BMA_DDS_DIAGNOSTIC]') {
      logsCase12.push(String(message));
    }
  };

  await fetchBmaRoadFloods(2000);
  console.info = originalConsoleInfo;
  delete process.env.BMA_DEBUG;
  delete process.env.VERCEL_REGION;

  assert(logsCase12.length > 0, 'Diagnostic log was emitted for 403 response');
  const parsedCase12 = JSON.parse(logsCase12[0] || '{}');
  const profileMeta = parsedCase12.profile?.responseMetadata;
  const recordMeta = parsedCase12.record?.responseMetadata;

  assert(profileMeta !== undefined && recordMeta !== undefined, 'responseMetadata is present on non-2xx profile and record responses');
  assert(profileMeta?.bodyKind === 'html', `bodyKind is correctly detected as html (got ${profileMeta?.bodyKind})`);
  assert(profileMeta?.bodyLength === htmlBody.length, `bodyLength matches actual length (got ${profileMeta?.bodyLength})`);
  assert(profileMeta?.vercelRegion === 'iad1', `vercelRegion is logged (got ${profileMeta?.vercelRegion})`);
  assert(profileMeta?.headers?.server === 'cloudflare', `server header captured (got ${profileMeta?.headers?.server})`);
  assert(profileMeta?.headers?.['cf-ray'] === true, 'cf-ray is boolean true, not leaking ray ID string');
  assert(profileMeta?.headers?.['cf-mitigated'] === 'challenge', 'cf-mitigated captured');
  assert(profileMeta?.headers?.['x-cache'] === 'Error from cloudfront', 'x-cache captured');
  assert(profileMeta?.headers?.via === '1.1 vegur', 'via captured');

  const rawJsonLog = logsCase12[0] || '';
  assert(!rawJsonLog.includes('secret_cookie'), 'Set-Cookie and cookies are never logged');
  assert(!rawJsonLog.includes('Cloudflare Block Ray ID'), 'Raw HTML body content is never leaked in log');
  assert(!rawJsonLog.includes('1234567890abcdef'), 'CF-RAY raw token string is not leaked');

  // -----------------------------------------------------------------
  // Case 13: Debug Off Emits No Diagnostic Output
  // -----------------------------------------------------------------
  console.log('\n--- Case 13: Debug Flag Off Produces No Diagnostic Output ---');
  delete process.env.BMA_DEBUG;
  delete process.env.DEBUG_BMA;
  const logsCase13: string[] = [];
  console.info = (prefix: any, message: any) => {
    if (prefix === '[BMA_DDS_DIAGNOSTIC]') {
      logsCase13.push(String(message));
    }
  };

  await fetchBmaRoadFloods(2000);
  console.info = originalConsoleInfo;
  assert(logsCase13.length === 0, 'Zero diagnostic log lines emitted when debug flag is off');

  // -----------------------------------------------------------------
  // Case 14: HTTP 200 Path Unchanged (Metadata Omitted, Data Cleanly Parsed)
  // -----------------------------------------------------------------
  console.log('\n--- Case 14: HTTP 200 Path Unchanged ---');
  process.env.BMA_DEBUG = 'true';
  global.fetch = async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('sensor_profile')) {
      return new Response(
        JSON.stringify({ data: BMA_STATIC_PROFILES.map((p) => ({ ...p, lat: p.latitude, long: p.longitude })) }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Server': 'nginx' } }
      );
    }
    return new Response(
      JSON.stringify({
        data: [
          {
            id: 1,
            flood_now: '0.0',
            timestamp: dynamicFreshTime,
            sensor_profile: { id: 680, code: 'FL.PTW.05', device_status: 'normal' },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Server': 'nginx' } }
    );
  };

  const logsCase14: string[] = [];
  console.info = (prefix: any, message: any) => {
    if (prefix === '[BMA_DDS_DIAGNOSTIC]') {
      logsCase14.push(String(message));
    }
  };

  const resCase14 = await fetchBmaRoadFloods(2000);
  console.info = originalConsoleInfo;
  delete process.env.BMA_DEBUG;

  assert(resCase14.status === 'LIVE', '200 path produces LIVE status');
  const ptw05Case14 = resCase14.data?.find((s) => s.station_code === 'FL.PTW.05');
  assert(ptw05Case14?.data_status === 'LIVE' && ptw05Case14?.water_depth_cm === 0, 'FL.PTW.05 is LIVE on 200 path');
  assert(logsCase14.length > 0, 'Diagnostic log emitted when debug flag is on');
  const parsedCase14 = JSON.parse(logsCase14[0] || '{}');
  assert(parsedCase14.profile?.responseMetadata === undefined, 'responseMetadata is omitted for 200 OK profile response');
  assert(parsedCase14.record?.responseMetadata === undefined, 'responseMetadata is omitted for 200 OK record response');

  // -----------------------------------------------------------------
  // Case 15: Timezone-safe Asia/Bangkok Formatter Tests
  // -----------------------------------------------------------------
  console.log('\n--- Case 15: Asia/Bangkok Time & DateTime Formatter Verification ---');
  const { formatBangkokTime, formatBangkokDateTime } = await import('../src/lib/providers/bma');
  const testUtc = '2026-10-24T10:17:22Z';
  const formattedTime = formatBangkokTime(testUtc);
  const formattedDateTime = formatBangkokDateTime(testUtc);

  assert(formattedTime === '17:17', `formatBangkokTime converts UTC 10:17:22Z to 17:17 in Asia/Bangkok (got ${formattedTime})`);
  assert(Boolean(formattedDateTime?.includes('17:17')), `formatBangkokDateTime contains 17:17 in Asia/Bangkok (got ${formattedDateTime})`);
  assert(formatBangkokTime(null) === null, 'formatBangkokTime returns null for null input');
  assert(formatBangkokTime(undefined) === null, 'formatBangkokTime returns null for undefined input');
  assert(formatBangkokTime('invalid-date') === null, 'formatBangkokTime returns null for invalid string without throwing');
  assert(formatBangkokDateTime(null) === null, 'formatBangkokDateTime returns null for null input');
  assert(formatBangkokDateTime(undefined) === null, 'formatBangkokDateTime returns null for undefined input');
  assert(formatBangkokDateTime('invalid-date') === null, 'formatBangkokDateTime returns null for invalid string without throwing');

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
