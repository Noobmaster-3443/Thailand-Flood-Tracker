import { DistrictWeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem, RadarFrameInfo } from '@/types/weather';
import { PRACHINBURI_DISTRICTS, PRACHINBURI_CENTER } from '@/data/prachinburi-locations';
import { THAILAND_PROVINCES, THAILAND_CENTER } from '@/data/thailand-provinces';

export function interpretWeatherCode(code: number): { text: string; icon: string } {
  switch (code) {
    case 0:
      return { text: 'ท้องฟ้าแจ่มใส', icon: '☀️' };
    case 1:
      return { text: 'ท้องฟ้าโปร่งเกือบหมด', icon: '🌤️' };
    case 2:
      return { text: 'มีเมฆบางส่วน', icon: '⛅' };
    case 3:
      return { text: 'มีเมฆเป็นส่วนมาก', icon: '☁️' };
    case 45:
    case 48:
      return { text: 'หมอกหนา', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { text: 'ฝนปรอยๆ เล็กน้อย', icon: '🌦️' };
    case 61:
      return { text: 'ฝนตกเล็กน้อย', icon: '🌧️' };
    case 63:
      return { text: 'ฝนตกปานกลาง', icon: '🌧️' };
    case 65:
      return { text: 'ฝนตกหนัก', icon: '⛈️' };
    case 80:
      return { text: 'ฝนซู่กระจายเล็กน้อย', icon: '🌦️' };
    case 81:
      return { text: 'ฝนซู่กระจายปานกลาง', icon: '🌧️' };
    case 82:
      return { text: 'ฝนซู่ตกหนักมาก', icon: '⛈️' };
    case 95:
      return { text: 'พายุฝนฟ้าคะนอง', icon: '⛈️' };
    case 96:
    case 99:
      return { text: 'พายุฝนฟ้าคะนองรุนแรง', icon: '⚡' };
    default:
      return { text: 'มีเมฆกระจาย', icon: '⛅' };
  }
}

export function degreesToDirectionThai(deg: number): string {
  const directions = [
    { text: 'เหนือ (N)', min: 337.5, max: 360 },
    { text: 'เหนือ (N)', min: 0, max: 22.5 },
    { text: 'ตะวันออกเฉียงเหนือ (NE)', min: 22.5, max: 67.5 },
    { text: 'ตะวันออก (E)', min: 67.5, max: 112.5 },
    { text: 'ตะวันออกเฉียงใต้ (SE)', min: 112.5, max: 157.5 },
    { text: 'ใต้ (S)', min: 157.5, max: 202.5 },
    { text: 'ตะวันตกเฉียงใต้ (SW)', min: 202.5, max: 247.5 },
    { text: 'ตะวันตก (W)', min: 247.5, max: 292.5 },
    { text: 'ตะวันตกเฉียงเหนือ (NW)', min: 292.5, max: 337.5 },
  ];
  for (const d of directions) {
    if (deg >= d.min && deg < d.max) return d.text;
  }
  return 'ตะวันตกเฉียงใต้ (SW)';
}

export async function fetchDistrictWeather(
  districtName?: string,
  provinceId?: string
): Promise<DistrictWeatherData | null> {
  let lat = PRACHINBURI_CENTER.lat;
  let lng = PRACHINBURI_CENTER.lng;
  let displayName = 'ปราจีนบุรี (ภาพรวมทั้งจังหวัด)';

  if (provinceId && provinceId !== 'prachinburi' && provinceId !== 'all') {
    const prov = THAILAND_PROVINCES.find((p) => p.id === provinceId);
    if (prov) {
      lat = prov.lat;
      lng = prov.lng;
      displayName = `จ.${prov.name_th}`;
    }
  } else if (provinceId === 'all') {
    lat = THAILAND_CENTER.lat;
    lng = THAILAND_CENTER.lng;
    displayName = 'ประเทศไทย (ภาพรวมทั่วประเทศ)';
  } else {
    const targetDistrict = PRACHINBURI_DISTRICTS.find(
      (d) => d.name_th.includes(districtName || '') || d.id === districtName
    );
    if (targetDistrict) {
      lat = targetDistrict.lat;
      lng = targetDistrict.lng;
      displayName = targetDistrict.name_th;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=7`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

    const data = await res.json();
    const curr = data.current;
    const { text: currDesc, icon: currIcon } = interpretWeatherCode(curr.weather_code);

    const currentWeather: CurrentWeather = {
      temperature: Math.round(curr.temperature_2m * 10) / 10,
      apparentTemperature: Math.round(curr.apparent_temperature * 10) / 10,
      humidity: Math.round(curr.relative_humidity_2m),
      precipitationMm: curr.precipitation || 0,
      weatherCode: curr.weather_code,
      weatherDescription: currDesc,
      weatherIcon: currIcon,
      windSpeedKmH: Math.round(curr.wind_speed_10m * 10) / 10,
      windDirectionDeg: curr.wind_direction_10m,
      windDirectionText: degreesToDirectionThai(curr.wind_direction_10m),
      observedAt: curr.time,
    };

    // Format hourly next 24 hours
    const currentHourIndex = Math.max(
      0,
      data.hourly.time.findIndex((t: string) => t >= curr.time.slice(0, 13))
    );
    const next24HoursTimes = data.hourly.time.slice(currentHourIndex, currentHourIndex + 24);

    const hourly: HourlyForecastItem[] = next24HoursTimes.map((t: string, idx: number) => {
      const realIdx = currentHourIndex + idx;
      const code = data.hourly.weather_code[realIdx] || 0;
      const { icon } = interpretWeatherCode(code);
      const hourStr = t.split('T')[1]?.slice(0, 5) || t;

      return {
        time: t,
        displayTime: `${hourStr} น.`,
        temperature: Math.round(data.hourly.temperature_2m[realIdx]),
        precipitationProb: Math.round(data.hourly.precipitation_probability[realIdx] || 0),
        precipitationMm: Math.round((data.hourly.precipitation[realIdx] || 0) * 10) / 10,
        weatherCode: code,
        weatherIcon: icon,
      };
    });

    // Format daily 7 days
    const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
    const thaiMonthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    const daily: DailyForecastItem[] = data.daily.time.map((dStr: string, idx: number) => {
      const dateObj = new Date(dStr);
      const dayOfWeek = thaiDayNames[dateObj.getDay()];
      const dayOfMonth = dateObj.getDate();
      const monthStr = thaiMonthNames[dateObj.getMonth()];
      const code = data.daily.weather_code[idx] || 0;
      const { text, icon } = interpretWeatherCode(code);
      const rainSum = Math.round((data.daily.precipitation_sum[idx] || 0) * 10) / 10;
      const rainProb = Math.round(data.daily.precipitation_probability_max[idx] || 0);

      let riskLevel: 'normal' | 'moderate' | 'high' | 'severe' = 'normal';
      if (rainSum >= 90 || rainProb >= 85) riskLevel = 'severe';
      else if (rainSum >= 40 || rainProb >= 70) riskLevel = 'high';
      else if (rainSum >= 15 || rainProb >= 40) riskLevel = 'moderate';

      const dayLabel = idx === 0 ? 'วันนี้' : idx === 1 ? 'พรุ่งนี้' : `วัน${dayOfWeek}`;

      return {
        date: dStr,
        displayDate: `${dayOfMonth} ${monthStr}`,
        dayName: dayLabel,
        tempMax: Math.round(data.daily.temperature_2m_max[idx]),
        tempMin: Math.round(data.daily.temperature_2m_min[idx]),
        precipitationSumMm: rainSum,
        precipitationProbMax: rainProb,
        weatherCode: code,
        weatherDescription: text,
        weatherIcon: icon,
        riskLevel,
      };
    });

    return {
      districtName: displayName,
      latitude: lat,
      longitude: lng,
      current: currentWeather,
      hourly,
      daily,
    };
  } catch (error) {
    console.warn('Failed to fetch Open-Meteo weather for location:', displayName, error);
    return null;
  }
}

export async function fetchRainRadarFrames(): Promise<{ host: string; frames: RadarFrameInfo[] }> {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('RainViewer API error');
    const data = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = data.radar?.past || [];

    const frames: RadarFrameInfo[] = past.map((p: { time: number; path: string }, idx: number) => {
      const date = new Date(p.time * 1000);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return {
        time: p.time,
        path: p.path,
        formattedTime: `${hours}:${minutes} น.`,
        isLatest: idx === past.length - 1,
      };
    });

    return { host, frames };
  } catch (err) {
    console.warn('Could not load radar frames list:', err);
    return { host: 'https://tilecache.rainviewer.com', frames: [] };
  }
}
