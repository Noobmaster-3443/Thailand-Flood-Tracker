/**
 * Open-Meteo Weather Forecast Provider (Secondary Provider)
 * Sourced from Open-Meteo API (https://open-meteo.com).
 * Clearly identified as a secondary provider, not Thai government observation.
 * Never invents mock dates if request fails.
 */

import { DistrictWeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem } from '@/types/weather';
import { DataResult, DataStatus } from './types';
import { findProvinceById, THAILAND_CENTER } from '@/data/thailand-provinces';
import { PRACHINBURI_DISTRICTS, PRACHINBURI_CENTER } from '@/data/prachinburi-locations';
import { interpretWeatherCode, degreesToDirectionThai } from '../weather-service';

export async function fetchOpenMeteoForecast(
  provinceId: string = 'prachinburi',
  districtName?: string,
  timeoutMs: number = 8000
): Promise<DataResult<DistrictWeatherData>> {
  const fetchedAt = new Date().toISOString();
  let lat = PRACHINBURI_CENTER.lat;
  let lng = PRACHINBURI_CENTER.lng;
  let displayName = 'ปราจีนบุรี (ภาพรวมทั้งจังหวัด)';

  if (provinceId && provinceId !== 'prachinburi' && provinceId !== 'all') {
    const prov = findProvinceById(provinceId);
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=7`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 PrachinburiFloodTracker/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 600 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        data: null,
        source: 'Open-Meteo Weather Forecast (Secondary)',
        sourceAgency: 'Open-Meteo',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const curr = data.current;
    if (!curr) {
      return {
        data: null,
        source: 'Open-Meteo Weather Forecast (Secondary)',
        sourceAgency: 'Open-Meteo',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: 'Missing current weather block',
      };
    }

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

    const weatherData: DistrictWeatherData = {
      districtName: displayName,
      latitude: lat,
      longitude: lng,
      current: currentWeather,
      hourly,
      daily,
    };

    return {
      data: weatherData,
      source: 'Open-Meteo Weather Model (แหล่งข้อมูลสำรองสากล)',
      sourceAgency: 'Open-Meteo (Secondary)',
      status: 'LIVE',
      fetchedAt,
      observedAt: curr.time,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      data: null,
      source: 'Open-Meteo Weather Forecast (Secondary)',
      sourceAgency: 'Open-Meteo',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: err?.message || 'Network exception connecting to Open-Meteo',
    };
  }
}
