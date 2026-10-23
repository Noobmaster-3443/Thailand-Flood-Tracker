/**
 * Production Verification Script for https://prachinburi-flood-tracker.vercel.app/
 */

const PROD_URL = 'https://prachinburi-flood-tracker.vercel.app';

async function main() {
  console.log(`================================================================`);
  console.log(`Production Verification: ${PROD_URL}`);
  console.log(`================================================================\n`);

  // 1. Verify /api/provinces
  console.log(`[1] Verifying /api/provinces ...`);
  let provincesPass = false;
  let testProvincesFound = 0;
  try {
    const res = await fetch(`${PROD_URL}/api/provinces`);
    console.log(`    HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log(`    Total count returned: ${data?.total}`);
    if (data?.total === 77 && Array.isArray(data?.provinces) && data.provinces.length === 77) {
      provincesPass = true;
      console.log(`    ✅ 77 provinces confirmed in list.`);
    } else {
      console.log(`    ❌ Expected 77 provinces, got: ${data?.total}`);
    }

    const targets = ['prachinburi', 'bangkok', 'chiangmai', 'khonkaen', 'suratthani'];
    for (const t of targets) {
      const match = data?.provinces?.find((p: any) => p.id === t);
      if (match) {
        testProvincesFound++;
        console.log(`    - ${t}: Found (${match.name_th} / ${match.name_en}, code: ${match.code}, region: ${match.region})`);
      } else {
        console.log(`    - ${t}: NOT FOUND!`);
      }
    }
  } catch (err: any) {
    console.error(`    Error calling /api/provinces:`, err.message);
  }

  // 2. Verify /api/nationwide
  console.log(`\n[2] Verifying /api/nationwide ...`);
  let nationwidePass = false;
  let nationwideData: any = null;
  try {
    const res = await fetch(`${PROD_URL}/api/nationwide`);
    console.log(`    HTTP Status: ${res.status}`);
    if (res.ok) {
      nationwidePass = true;
      nationwideData = await res.json();
      console.log(`    ✅ Nationwide API responded with status 200`);
      console.log(`    Stations (water & rain): ${nationwideData.stations?.length}`);
      console.log(`    Dams: ${nationwideData.dams?.length}`);
      console.log(`    Highway alerts: ${nationwideData.highwayAlerts?.length}`);
      console.log(`    GISTDA flood GeoJSON features: ${nationwideData.gistdaGeoJson?.features?.length}`);
      console.log(`    High tide alert: ${nationwideData.highTide ? 'Present (MSL +' + nationwideData.highTide.morning_peak_m_msl + 'm)' : 'None'}`);
      console.log(`    Flash flood alerts: ${nationwideData.flashFloodAlerts?.length}`);
      console.log(`    Evacuation shelters: ${nationwideData.shelters?.length}`);
      console.log(`    TMD warnings: ${nationwideData.tmdWarnings?.length}`);
      console.log(`    Province status reports: ${nationwideData.provinceStatuses?.length}`);
      console.log(`    Last updated timestamp: ${nationwideData.lastUpdated}`);
      console.log(`    Coverage summary:`, JSON.stringify(nationwideData.coverage?.providers, null, 2));
      console.log(`    Coverage provinces breakdown:`, {
        live: nationwideData.coverage?.liveProvinces,
        stale: nationwideData.coverage?.staleProvinces,
        static: nationwideData.coverage?.staticProvinces,
        unavailable: nationwideData.coverage?.unavailableProvinces,
      });
    } else {
      console.log(`    ❌ Nationwide API returned status: ${res.status}`);
    }
  } catch (err: any) {
    console.error(`    Error calling /api/nationwide:`, err.message);
  }

  // 3. Verify specific /api/provinces/:provinceId endpoints
  console.log(`\n[3] Verifying individual province endpoints ...`);
  const testProvs = ['prachinburi', 'bangkok', 'chiangmai', 'khonkaen', 'suratthani'];
  for (const pid of testProvs) {
    try {
      const res = await fetch(`${PROD_URL}/api/provinces/${pid}`);
      const json = await res.json();
      console.log(`    - ${pid}: HTTP ${res.status} | stations: ${json?.stations?.length} | dams: ${json?.dams?.length} | status: ${json?.status?.status} (${json?.status?.statusLabelTh}) | evidence: ${json?.status?.evidence?.slice(0, 1).join(', ')}`);
    } catch (err: any) {
      console.error(`    - ${pid} error:`, err.message);
    }
  }

  // 4. Verify External Provider Connectivity (Live Check from Vercel perspective)
  console.log(`\n[4] Provider Status Breakdown in Production:`);
  if (nationwideData?.coverage?.providers) {
    const provs = nationwideData.coverage.providers;
    console.log(`    ThaiWater: ${provs.thaiwater}`);
    console.log(`    RID: ${provs.rid}`);
    console.log(`    GISTDA: ${provs.gistda}`);
    console.log(`    TMD: ${provs.tmd}`);
    console.log(`    Open-Meteo: ${provs.openmeteo}`);
    console.log(`    RainViewer: ${provs.rainviewer}`);
    console.log(`    Highway: ${provs.doh}`);
    console.log(`    Tide: ${provs.navyTide}`);
    console.log(`    Shelter: ${provs.shelters}`);
  }

  // 5. Test Open-Meteo & RainViewer production fetch directly
  console.log(`\n[5] Verifying Open-Meteo & RainViewer live connectivity ...`);
  try {
    const omRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.05&longitude=101.37&current=temperature_2m,relative_humidity_2m');
    console.log(`    Open-Meteo live endpoint HTTP: ${omRes.status}`);
  } catch (e: any) {
    console.log(`    Open-Meteo live error:`, e.message);
  }

  try {
    const rvRes = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    console.log(`    RainViewer live endpoint HTTP: ${rvRes.status}`);
  } catch (e: any) {
    console.log(`    RainViewer live error:`, e.message);
  }

  console.log(`\n================================================================`);
  console.log(`Verification Complete`);
  console.log(`================================================================`);
}

main();
