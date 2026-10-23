export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationMm: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeedKmH: number;
  windDirectionDeg: number;
  windDirectionText: string;
  observedAt: string;
}

export interface HourlyForecastItem {
  time: string;          // ISO string
  displayTime: string;   // e.g. '14:00'
  temperature: number;
  precipitationProb: number; // %
  precipitationMm: number;
  weatherCode: number;
  weatherIcon: string;
}

export interface DailyForecastItem {
  date: string;          // YYYY-MM-DD
  displayDate: string;   // e.g. 'พ. 8 ต.ค.'
  dayName: string;       // e.g. 'พรุ่งนี้', 'วันพฤหัส'
  tempMax: number;
  tempMin: number;
  precipitationSumMm: number;
  precipitationProbMax: number; // %
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  riskLevel: 'normal' | 'moderate' | 'high' | 'severe';
}

export interface DistrictWeatherData {
  districtName: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface RadarFrameInfo {
  time: number;          // UNIX timestamp
  path: string;          // e.g. '/v2/radar/...'
  formattedTime: string; // e.g. '19:40 น.'
  isLatest: boolean;
}
