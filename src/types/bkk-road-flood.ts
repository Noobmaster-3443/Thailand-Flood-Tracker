export type BkkSensorType = 'road' | 'tunnel';
export type BkkSensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface BkkRoadFloodSensor {
  id: string;
  name: string;
  district: string;
  type: BkkSensorType;
  lat: number;
  lng: number;
  waterLevelCm: number | null;
  status: BkkSensorStatus;
  updatedAt: string | null;
}

export interface BkkRoadFloodApiResponse {
  success: boolean;
  count: number;
  updatedAt: string | null;
  data: BkkRoadFloodSensor[];
  sensors?: BkkRoadFloodSensor[];
}
