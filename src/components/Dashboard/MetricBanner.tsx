'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Car, 
  CloudRain, 
  Waves, 
  Mountain,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { 
  TelemetryStation, 
  HighwayDisasterAlert, 
  HighTideAlert, 
  FlashFloodAlert, 
  DamReservoirInfo,
  SHOW_STATIC_FLASH_FLOOD_ALERTS,
  SHOW_STATIC_TIDE_ALERT,
} from '@/types/telemetry';

interface MetricBannerProps {
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  highTide?: HighTideAlert;
  flashFloodAlerts?: FlashFloodAlert[];
  dams?: DamReservoirInfo[];
  selectedProvince?: string;
  onFilterSeverity?: (severity: string) => void;
  onFilterRoad?: () => void;
  onOpenHighTide?: () => void;
  onOpenFlashFlood?: (flash: FlashFloodAlert) => void;
  onOpenDam?: (dam: DamReservoirInfo) => void;
}

export const MetricBanner: React.FC<MetricBannerProps> = ({
  stations,
  highwayAlerts,
  highTide,
  flashFloodAlerts = [],
  dams = [],
  selectedProvince = 'all',
  onFilterSeverity,
  onFilterRoad,
  onOpenHighTide,
  onOpenFlashFlood,
  onOpenDam,
}) => {
  const activeStations = stations.filter((s) => s.data_status !== 'STATIC');
  const overflowStations = activeStations.filter((s) => s.severity === 'red');
  const warningStations = activeStations.filter((s) => s.severity === 'orange');
  const impassableRoads = highwayAlerts.filter((h) => !h.passable);
  
  // Find station with highest 24h rainfall
  const highestRainStation = [...stations].sort(
    (a, b) => (b.rain_24h_mm || 0) - (a.rain_24h_mm || 0)
  )[0];

  const criticalFlash = SHOW_STATIC_FLASH_FLOOD_ALERTS ? flashFloodAlerts.find((f) => f.severity === 'red') : undefined;
  
  // Dynamically select dam based on province or highest % nationwide
  // If Bangkok is selected, show Chao Phraya Barrage Dam (which regulates upstream flow entering Bangkok)
  const activeDam = 
    selectedProvince === 'bangkok'
      ? dams.find((d) => d.id === 'dam-chaophraya') || dams.find((d) => d.province === 'chainat') || dams[0]
      : selectedProvince && selectedProvince !== 'all'
      ? dams.find((d) => d.province === selectedProvince)
      : [...dams].sort((a, b) => b.capacity_percentage - a.capacity_percentage)[0];

  const coastalProvinces = [
    'all', 'bangkok', 'samutprakan', 'samutsakhon', 'samutsongkhram', 
    'chachoengsao', 'prachinburi', 'nonthaburi', 'pathumthani', 'chonburi', 
    'rayong', 'chanthaburi', 'trat', 'phetchaburi', 'prachuapkhirikhan', 
    'chumphon', 'suratthani', 'nakhonsithammarat', 'songkhla', 'pattani', 'narathiwat'
  ];
  const shouldShowTide = SHOW_STATIC_TIDE_ALERT && highTide && coastalProvinces.includes(selectedProvince);

  return (
    <div className="space-y-1.5 font-sans select-none">
      {/* High-Priority Active Alert Ribbon (High Tide & Flash Flood) */}
      {shouldShowTide && (
        <div 
          onClick={onOpenHighTide}
          className="bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 text-white rounded-xl sm:rounded-2xl px-3 py-1.5 sm:py-2 shadow-md flex items-center justify-between gap-2 border border-cyan-500/30 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1.5 truncate">
              <Waves className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
              <span className="truncate">
                {selectedProvince === 'bangkok' ? 'น้ำหนุนเจ้าพระยา (ปากคลองตลาด กทม.)' : 'น้ำทะเลหนุนสูง'}: +{highTide.morning_peak_m_msl} ม.รทก. ({highTide.morning_peak_time}) <span className="text-[10px] font-normal text-cyan-200 hidden sm:inline">(เมตรเหนือระดับน้ำทะเลปานกลาง)</span> {selectedProvince === 'bangkok' ? 'เฝ้าระวังชุมชนนอกคันกั้นน้ำแม่น้ำเจ้าพระยา' : 'เฝ้าระวังน้ำดันย้อนตลิ่งริมน้ำ'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-cyan-300 hover:text-white flex-shrink-0">
            <span>ตารางน้ำหนุน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Flash flood warning banner if critical */}
      {criticalFlash && (
        <div 
          onClick={() => onOpenFlashFlood && onOpenFlashFlood(criticalFlash)}
          className="bg-gradient-to-r from-rose-900 via-red-900 to-orange-950 text-white rounded-xl sm:rounded-2xl px-3 py-1.5 shadow-md flex items-center justify-between gap-2 border border-rose-400/30 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1.5 truncate text-rose-100">
              <Mountain className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
              <span className="truncate">
                เตือนภัยน้ำป่า: {criticalFlash.location_name} ฝนสะสมยอดเขา {criticalFlash.rain_mountain_24h_mm} มม. (เสี่ยงหลากใน {criticalFlash.time_to_flood_hours})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-rose-300 flex-shrink-0">
            <span>ดูคำเตือน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 4 Core Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
        {/* 1. จุดล้นตลิ่ง (Critical) */}
        <div 
          onClick={() => onFilterSeverity && onFilterSeverity('red')}
          className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md bg-white ${
            overflowStations.length > 0 
              ? 'border-red-300 hover:border-red-400' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1 sm:gap-1.5 text-red-700 truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
              <span className="truncate">น้ำล้นตลิ่งวิกฤต</span>
            </span>
            <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
          </div>
          <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {overflowStations.length}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 ml-1">สถานี</span>
            </span>
            {overflowStations[0] && (
              <span className="text-[9px] sm:text-[10px] font-bold text-red-700 truncate max-w-[70px] sm:max-w-[110px] bg-red-50 border border-red-200 px-1 sm:px-1.5 py-0.5 rounded">
                {overflowStations[0].station_code}
              </span>
            )}
          </div>
        </div>

        {/* 2. จุดจ่อล้น / เตือนภัย */}
        <div 
          onClick={() => onFilterSeverity && onFilterSeverity('orange')}
          className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-300 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="font-semibold text-orange-700 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
              <span className="truncate">จ่อล้น / เตือนภัย</span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
          </div>
          <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {warningStations.length}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 ml-1">จุด</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 truncate max-w-[70px] sm:max-w-none">
              {warningStations[0] ? `อ.${warningStations[0].district}` : 'เฝ้าระวัง'}
            </span>
          </div>
        </div>

        {/* 3. ถนนถูกตัดขาด / รถเล็กผ่านไม่ได้ */}
        <div 
          onClick={() => onFilterRoad && onFilterRoad()}
          className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md bg-white ${
            impassableRoads.length > 0 
              ? 'border-amber-400 hover:border-amber-500' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="font-semibold text-amber-900 flex items-center gap-1 sm:gap-1.5 truncate">
              <Car className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">ทางหลวงน้ำท่วม</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded flex-shrink-0">
              DOH
            </span>
          </div>
          <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {impassableRoads.length}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 ml-1">จุดทางขาด</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-600 truncate max-w-[70px]">
              {impassableRoads[0] ? impassableRoads[0].route_number : (highwayAlerts[0] ? highwayAlerts[0].route_number : 'ปกติ')}
            </span>
          </div>
        </div>

        {/* 4. เขื่อน / อ่างเก็บน้ำหลัก */}
        <div 
          onClick={() => activeDam && onOpenDam && onOpenDam(activeDam)}
          className={`p-2 sm:p-2.5 rounded-xl bg-white border transition-all shadow-xs ${
            activeDam ? 'border-slate-200 hover:border-cyan-300 cursor-pointer hover:shadow-md' : 'border-slate-100 opacity-80 cursor-default'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="font-semibold text-cyan-800 flex items-center gap-1 sm:gap-1.5 truncate">
              <Gauge className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
              <span className="truncate">{activeDam ? activeDam.name_th : 'เขื่อนในพื้นที่'}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-cyan-700 bg-cyan-50 px-1 py-0.2 rounded font-bold flex-shrink-0">
              {activeDam ? `${activeDam.capacity_percentage}%` : 'RID'}
            </span>
          </div>
          <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-cyan-950 leading-tight">
              {activeDam ? activeDam.current_storage_mcm : '-'}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 ml-1">
                {activeDam ? 'ล้าน ลบ.ม.' : 'ไม่มีเขื่อนใหญ่'}
              </span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 truncate max-w-[70px]">
              {activeDam ? `ระบาย ${activeDam.outflow_mcm_day} ลบ.ม./วัน` : 'ปกติ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
