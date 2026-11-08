'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { 
  TelemetryStation, 
  HighwayDisasterAlert,
  DamReservoirInfo,
  FlashFloodAlert,
  EvacuationShelter,
} from '@/types/telemetry';

export interface DynamicTelemetryMapProps {
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  gistdaGeoJson: GeoJSON.FeatureCollection | null;
  dams?: DamReservoirInfo[];
  flashFloodAlerts?: FlashFloodAlert[];
  shelters?: EvacuationShelter[];
  selectedStation: TelemetryStation | null;
  selectedHighwayAlert: HighwayDisasterAlert | null;
  selectedDam?: DamReservoirInfo | null;
  selectedFlashFlood?: FlashFloodAlert | null;
  selectedShelter?: EvacuationShelter | null;
  onSelectStation: (station: TelemetryStation | null) => void;
  onSelectHighwayAlert: (alert: HighwayDisasterAlert | null) => void;
  onSelectDam?: (dam: DamReservoirInfo | null) => void;
  onSelectFlashFlood?: (flashFlood: FlashFloodAlert | null) => void;
  onSelectShelter?: (shelter: EvacuationShelter | null) => void;
  selectedDistrict: string;
  selectedProvince?: string;
  onOpenWeatherModal?: () => void;
  isBottomSheetExpanded?: boolean;
}

const TelemetryMap = dynamic(
  () => import('./TelemetryMap').then((mod) => mod.TelemetryMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">กำลังโหลดแผนที่โทรมาตรและข้อมูลดาวเทียม Open Data...</p>
      </div>
    ),
  }
);

export const DynamicTelemetryMap: React.FC<DynamicTelemetryMapProps> = (props) => {
  return <TelemetryMap {...props} />;
};

