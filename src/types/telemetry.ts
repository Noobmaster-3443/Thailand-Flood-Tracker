export type SeverityLevel = 'green' | 'yellow' | 'orange' | 'red';

export const SHOW_STATIC_FLASH_FLOOD_ALERTS = false;
export const SHOW_STATIC_HIGHWAY_ALERTS = false;
export const SHOW_STATIC_GISTDA_FLOOD = false;
export const SHOW_STATIC_TIDE_ALERT = false;
export const SHOW_STATIC_SHELTERS = false;

export type StationType = 'water_level' | 'rain_telemetry' | 'dam' | 'highway_flood';

export interface TelemetryStation {
  id: string;
  station_code: string;
  name_th: string;
  name_en?: string;
  basin_name?: string;
  river_name?: string;
  province?: string;
  district: string;
  subdistrict: string;
  latitude: number;
  longitude: number;
  station_type: StationType;
  
  // Water Level Metrics
  water_level_m_msl?: number;      // ระดับน้ำ ม.(รทก.)
  bank_level_m_msl?: number;       // ระดับตลิ่ง ม.(รทก.)
  ground_level_m_msl?: number;     // ระดับดินเดิม
  capacity_percentage?: number;    // % ความจุลำน้ำ
  diff_from_bank?: number;         // ต่ำกว่าหรือสูงกว่าตลิ่ง (เมตร)
  
  // Rain Metrics (mm)
  rain_24h_mm?: number;
  rain_today_mm?: number;

  // Road / Highway info (if station_type === 'highway_flood')
  route_number?: string;           // เช่น ทางหลวงหมายเลข 304, 33
  km_point?: string;               // กม.ที่ 124+200
  passable_for_vehicles?: boolean;
  water_depth_cm?: number;

  severity: SeverityLevel;
  severity_label: string;
  status_text: string;
  observed_at: string;
  fetched_at?: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
  source_agency: 'HII' | 'RID' | 'TMD' | 'DOH' | 'GISTDA' | 'DWR' | 'BMA' | string;
  source_name_th: string;
  source_url?: string;
  upstream_fetch_ok?: boolean;
}

export interface GistdaFloodZone {
  id: string;
  province: string;
  district: string;
  subdistrict?: string;
  area_sqkm: number;
  area_rai: number;
  observed_date: string;
  satellite_source: string;
  severity: SeverityLevel;
  source_name_th: string;
}

export interface HighwayDisasterAlert {
  id: string;
  province?: string;
  route_number: string;
  road_name: string;
  district: string;
  km_range: string;
  water_height_cm: number;
  passable: boolean;
  passable_status: 'passable' | 'truck_only' | 'impassable';
  detour_info?: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  source_name_th: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
}

export interface DistrictInfo {
  id: string;
  name_th: string;
  name_en: string;
  lat: number;
  lng: number;
  zoom: number;
  subdistricts: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  description: string;
  phone: string;
  province?: string;
  district?: string;
  category: 'rescue' | 'hospital' | 'government' | 'dam_water';
  is_24h: boolean;
  is_approved: boolean;
  is_official?: boolean;
  submitted_by?: string;
  created_at?: string;
}

export interface DamReservoirInfo {
  id: string;
  name_th: string;
  name_en: string;
  province?: string;
  district: string;
  subdistrict: string;
  latitude: number;
  longitude: number;
  capacity_storage_mcm: number;     // ความจุอ่าง (ล้าน ลบ.ม.)
  current_storage_mcm: number;      // ปริมาตรน้ำปัจจุบัน (ล้าน ลบ.ม.)
  capacity_percentage: number;      // % ความจุ
  inflow_mcm_day: number;           // น้ำไหลลงอ่าง (ล้าน ลบ.ม./วัน)
  outflow_mcm_day: number;          // การระบายน้ำ (ล้าน ลบ.ม./วัน)
  severity: SeverityLevel;
  status_label: string;
  description: string;
  observed_at: string;
  agency: string;
  source_url?: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
}

export interface HighTideAlert {
  date: string;
  station_name: string;
  location: string;
  morning_peak_time: string;
  morning_peak_m_msl: number;
  evening_peak_time: string;
  evening_peak_m_msl: number;
  current_status: 'high_tide' | 'normal' | 'low_tide';
  warning_title: string;
  warning_detail: string;
  affected_districts: string[];
  observed_at: string;
  agency: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
}

export interface FlashFloodAlert {
  id: string;
  province?: string;
  location_name: string;
  mountain_range: string;           // เทือกเขา เช่น อุทยานฯ ทับลาน, เขาใหญ่
  district: string;
  subdistrict: string;
  latitude: number;
  longitude: number;
  rain_mountain_24h_mm: number;     // ปริมาณฝนสะสมบนเขา
  severity: SeverityLevel;
  severity_label: string;
  time_to_flood_hours: string;       // เช่น 2 - 4 ชั่วโมง
  advisory: string;
  observed_at: string;
  agency: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
}

export interface EvacuationShelter {
  id: string;
  province?: string;
  name: string;
  shelter_type: 'school' | 'temple' | 'hall' | 'parking';
  district: string;
  subdistrict: string;
  latitude: number;
  longitude: number;
  capacity_persons: number;
  current_occupancy: number;
  status: 'open' | 'almost_full' | 'standby';
  has_medical: boolean;
  has_food_kitchen: boolean;
  has_car_parking: boolean;
  contact_name: string;
  contact_phone: string;
  address: string;
  notes?: string;
  data_status?: 'LIVE' | 'STALE' | 'STATIC' | 'UNAVAILABLE';
}

export interface DashboardFilterState {
  province?: string;
  district: string;
  stationType: 'all' | 'water_level' | 'rain_telemetry' | 'highway_flood' | 'dam' | 'shelter' | 'flash_flood';
  severity: SeverityLevel | 'all';
  searchQuery: string;
}
