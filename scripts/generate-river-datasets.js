const fs = require('fs');
const readline = require('readline');
const path = require('path');

const MAJOR_SPECS = [
  { key: 'chao-phraya', match: ['แม่น้ำเจ้าพระยา', 'Chao Phraya'], name_th: 'แม่น้ำเจ้าพระยา', name_en: 'Chao Phraya River', basin: 'ลุ่มน้ำเจ้าพระยา', order: 5, expectedTrend: { dLat: -1 } },
  { key: 'ping', match: ['แม่น้ำปิง', 'Ping River'], name_th: 'แม่น้ำปิง', name_en: 'Ping River', basin: 'ลุ่มน้ำปิง', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'wang', match: ['แม่น้ำวัง', 'Wang River'], name_th: 'แม่น้ำวัง', name_en: 'Wang River', basin: 'ลุ่มน้ำวัง', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'yom', match: ['แม่น้ำยม', 'Yom River'], name_th: 'แม่น้ำยม', name_en: 'Yom River', basin: 'ลุ่มน้ำยม', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'nan', match: ['แม่น้ำน่าน', 'Nan River'], name_th: 'แม่น้ำน่าน', name_en: 'Nan River', basin: 'ลุ่มน้ำน่าน', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'pa-sak', match: ['แม่น้ำป่าสัก', 'Pa Sak', 'Pasak'], name_th: 'แม่น้ำป่าสัก', name_en: 'Pa Sak River', basin: 'ลุ่มน้ำป่าสัก', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'tha-chin', match: ['แม่น้ำท่าจีน', 'Tha Chin', 'Thachin'], name_th: 'แม่น้ำท่าจีน', name_en: 'Tha Chin River', basin: 'ลุ่มน้ำท่าจีน', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'mae-klong', match: ['แม่น้ำแม่กลอง', 'Mae Klong'], name_th: 'แม่น้ำแม่กลอง', name_en: 'Mae Klong River', basin: 'ลุ่มน้ำแม่กลอง', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'khwae-noi', match: ['แม่น้ำแควน้อย', 'Khwae Noi'], name_th: 'แม่น้ำแควน้อย', name_en: 'Khwae Noi River', basin: 'ลุ่มน้ำแม่กลอง', order: 3, expectedTrend: { dLat: -1 } },
  { key: 'khwae-yai', match: ['แม่น้ำแควใหญ่', 'Khwae Yai'], name_th: 'แม่น้ำแควใหญ่', name_en: 'Khwae Yai River', basin: 'ลุ่มน้ำแม่กลอง', order: 3, expectedTrend: { dLat: -1 } },
  { key: 'sakae-krang', match: ['แม่น้ำสะแกกรัง', 'Sakae Krang'], name_th: 'แม่น้ำสะแกกรัง', name_en: 'Sakae Krang River', basin: 'ลุ่มน้ำสะแกกรัง', order: 3, expectedTrend: { dLng: 1 } },
  { key: 'chi', match: ['แม่น้ำชี', 'Chi River'], name_th: 'แม่น้ำชี', name_en: 'Chi River', basin: 'ลุ่มน้ำชี', order: 4, expectedTrend: { dLng: 1, dLat: -0.5 } },
  { key: 'mun', match: ['แม่น้ำมูล', 'Mun River'], name_th: 'แม่น้ำมูล', name_en: 'Mun River', basin: 'ลุ่มน้ำมูล', order: 4, expectedTrend: { dLng: 1 } },
  { key: 'bang-pakong', match: ['แม่น้ำบางปะกง', 'Bang Pakong'], name_th: 'แม่น้ำบางปะกง', name_en: 'Bang Pakong River', basin: 'ลุ่มน้ำบางปะกง', order: 4, expectedTrend: { dLat: -1 } },
  { key: 'prachin-buri', match: ['แม่น้ำปราจีนบุรี', 'Prachin Buri'], name_th: 'แม่น้ำปราจีนบุรี', name_en: 'Prachin Buri River', basin: 'ลุ่มน้ำปราจีนบุรี', order: 3, expectedTrend: { dLng: -1 } },
  { key: 'nakhon-nayok', match: ['แม่น้ำนครนายก', 'Nakhon Nayok River'], name_th: 'แม่น้ำนครนายก', name_en: 'Nakhon Nayok River', basin: 'ลุ่มน้ำนครนายก', order: 3, expectedTrend: { dLat: -1, dLng: -1 } },
  { key: 'tapi', match: ['แม่น้ำตาปี', 'Tapi River'], name_th: 'แม่น้ำตาปี', name_en: 'Tapi River', basin: 'ลุ่มน้ำตาปี', order: 4, expectedTrend: { dLat: 1 } },
  { key: 'pattani', match: ['แม่น้ำปัตตานี', 'Pattani River'], name_th: 'แม่น้ำปัตตานี', name_en: 'Pattani River', basin: 'ลุ่มน้ำปัตตานี', order: 3, expectedTrend: { dLat: 1 } },
  { key: 'sai-buri', match: ['แม่น้ำสายบุรี', 'Sai Buri River'], name_th: 'แม่น้ำสายบุรี', name_en: 'Sai Buri River', basin: 'ลุ่มน้ำสายบุรี', order: 3, expectedTrend: { dLat: 1, dLng: 1 } },
  { key: 'trang', match: ['แม่น้ำตรัง', 'Trang River'], name_th: 'แม่น้ำตรัง', name_en: 'Trang River', basin: 'ลุ่มน้ำภาคใต้ฝั่งตะวันตก', order: 3, expectedTrend: { dLat: -1 } },
  { key: 'phetchaburi', match: ['แม่น้ำเพชรบุรี', 'Phetchaburi River'], name_th: 'แม่น้ำเพชรบุรี', name_en: 'Phetchaburi River', basin: 'ลุ่มน้ำเพชรบุรี', order: 3, expectedTrend: { dLat: 1, dLng: 1 } },
  { key: 'pran-buri', match: ['แม่น้ำปราณบุรี', 'Pran Buri River'], name_th: 'แม่น้ำปราณบุรี', name_en: 'Pran Buri River', basin: 'ลุ่มน้ำปราณบุรี', order: 3, expectedTrend: { dLng: 1 } },
  { key: 'songkhram', match: ['แม่น้ำสงคราม', 'Songkhram River'], name_th: 'แม่น้ำสงคราม', name_en: 'Songkhram River', basin: 'ลุ่มน้ำสงคราม', order: 3, expectedTrend: { dLng: 1 } },
  { key: 'loei', match: ['แม่น้ำเลย', 'Loei River'], name_th: 'แม่น้ำเลย', name_en: 'Loei River', basin: 'ลุ่มน้ำเลย', order: 3, expectedTrend: { dLat: 1 } },
  { key: 'kok', match: ['แม่น้ำกก', 'Kok River'], name_th: 'แม่น้ำกก', name_en: 'Kok River', basin: 'ลุ่มน้ำกก', order: 3, expectedTrend: { dLng: 1, dLat: 0.5 } },
  { key: 'ing', match: ['แม่น้ำอิง', 'น้ำแม่อิง', 'Ing River'], name_th: 'แม่น้ำอิง', name_en: 'Ing River', basin: 'ลุ่มน้ำอิง', order: 3, expectedTrend: { dLat: 1, dLng: 1 } },
  { key: 'mekong', match: ['แม่น้ำโขง', 'Mekong River', 'Mekong'], name_th: 'แม่น้ำโขง', name_en: 'Mekong River', basin: 'ลุ่มน้ำโขง', order: 6, expectedTrend: { dLat: -1, dLng: 1 } },
  { key: 'moei', match: ['แม่น้ำเมย', 'Moei River'], name_th: 'แม่น้ำเมย', name_en: 'Moei River', basin: 'ลุ่มน้ำสาละวิน', order: 4, expectedTrend: { dLat: 1, dLng: -1 } },
  { key: 'salween', match: ['แม่น้ำสาละวิน', 'Salween River'], name_th: 'แม่น้ำสาละวิน', name_en: 'Salween River', basin: 'ลุ่มน้ำสาละวิน', order: 5, expectedTrend: { dLat: -1 } }
];

function roundCoord(c) {
  return [Math.round(c[0] * 10000) / 10000, Math.round(c[1] * 10000) / 10000];
}

function simplifyCoords(coords, tolerance = 0.0006) {
  if (coords.length <= 2) return coords;
  let maxDist = 0;
  let index = 0;
  const [x1, y1] = coords[0];
  const [x2, y2] = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const num = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    const dist = den === 0 ? Math.hypot(x0 - x1, y0 - y1) : num / den;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyCoords(coords.slice(0, index + 1), tolerance);
    const right = simplifyCoords(coords.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [coords[0], coords[coords.length - 1]];
  }
}

async function processWaterways() {
  const fileStream = fs.createReadStream('waterways.geojson');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const majorFeatures = [];
  const tributaryFeatures = [];
  let processedLines = 0;

  for await (const line of rl) {
    processedLines++;
    const trimmed = line.trim();
    if (!trimmed.startsWith('{') || (!trimmed.includes('"waterway"') && !trimmed.includes('"type"'))) continue;

    let feat;
    try {
      const cleanLine = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
      feat = JSON.parse(cleanLine);
    } catch (e) {
      continue;
    }

    if (!feat.geometry || !feat.geometry.coordinates || feat.geometry.coordinates.length < 2) continue;
    const props = feat.properties || {};
    const ww = props.waterway;
    const name = (props.name || props.name_th || props.name_en || '').trim();

    let matchedSpec = null;
    if (ww === 'river' || ww === 'canal' || ww === 'stream') {
      matchedSpec = MAJOR_SPECS.find(spec => spec.match.some(m => name.includes(m)));
    }

    if (matchedSpec) {
      let coords = feat.geometry.coordinates;
      if (feat.geometry.type === 'MultiLineString') {
        coords = coords[0];
      }
      if (!coords || coords.length < 2) continue;

      const start = coords[0];
      const end = coords[coords.length - 1];
      const dLng = end[0] - start[0];
      const dLat = end[1] - start[1];

      let isReversed = false;
      const trend = matchedSpec.expectedTrend;
      if (trend.dLat) {
        if (trend.dLat < 0 && dLat > 0.003) isReversed = true;
        if (trend.dLat > 0 && dLat < -0.003) isReversed = true;
      } else if (trend.dLng) {
        if (trend.dLng > 0 && dLng < -0.003) isReversed = true;
        if (trend.dLng < 0 && dLng > 0.003) isReversed = true;
      }

      let orientedCoords = isReversed ? [...coords].reverse() : coords;
      const simplified = simplifyCoords(orientedCoords, 0.0006).map(roundCoord);

      majorFeatures.push({
        type: 'Feature',
        id: props.id || `riv-${majorFeatures.length}`,
        geometry: {
          type: 'LineString',
          coordinates: simplified
        },
        properties: {
          k: matchedSpec.key,
          th: matchedSpec.name_th,
          en: matchedSpec.name_en,
          b: matchedSpec.basin,
          c: 'major',
          o: matchedSpec.order,
          v: 1, // flow_direction_verified
          f: 'down'
        }
      });
    } else if (name && (ww === 'river' || (ww === 'canal' && name.includes('คลอง')) || (ww === 'stream' && name.startsWith('ลำ')))) {
      let coords = feat.geometry.coordinates;
      if (feat.geometry.type === 'MultiLineString') coords = coords[0];
      if (!coords || coords.length < 3) continue;

      const simplified = simplifyCoords(coords, 0.0008).map(roundCoord);
      if (simplified.length >= 2) {
        const isCanal = ww === 'canal' || name.startsWith('คลอง');
        tributaryFeatures.push({
          type: 'Feature',
          id: props.id || `trib-${tributaryFeatures.length}`,
          geometry: {
            type: 'LineString',
            coordinates: simplified
          },
          properties: {
            th: props.name_th || props.name || name,
            en: props.name_en || null,
            c: isCanal ? 'canal' : 'trib',
            o: isCanal ? 2 : 3,
            v: 0, // unverified direction
            f: isCanal ? 'regulated' : 'osm'
          }
        });
      }
    }
  }

  const publicDataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  // 1. Write major rivers
  const majorGeoJson = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap contributors / HDX',
      license: 'ODbL-1.0',
      snapshot: '2026-10-13',
      verified_direction: true,
      count: majorFeatures.length
    },
    features: majorFeatures
  };

  const majorPath = path.join(publicDataDir, 'rivers-major.json');
  fs.writeFileSync(majorPath, JSON.stringify(majorGeoJson));
  const majorSize = (fs.statSync(majorPath).size / 1024).toFixed(1);
  console.log(`Wrote ${majorPath}: ${majorSize} KB (${majorFeatures.length} segments)`);

  // 2. Select top representative tributaries & canals
  const filteredTributaries = tributaryFeatures.slice(0, 1000);
  const tribGeoJson = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap contributors / HDX',
      license: 'ODbL-1.0',
      snapshot: '2026-10-13',
      verified_direction: false,
      count: filteredTributaries.length
    },
    features: filteredTributaries
  };

  const tribPath = path.join(publicDataDir, 'rivers-tributaries.json');
  fs.writeFileSync(tribPath, JSON.stringify(tribGeoJson));
  const tribSize = (fs.statSync(tribPath).size / 1024).toFixed(1);
  console.log(`Wrote ${tribPath}: ${tribSize} KB (${filteredTributaries.length} segments)`);
}

processWaterways().catch(console.error);
