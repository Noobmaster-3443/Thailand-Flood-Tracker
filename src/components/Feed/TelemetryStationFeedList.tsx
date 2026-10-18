'use client';

import React from 'react';
import {
  MapPin,
  Clock,
  Car,
  ChevronRight,
  Inbox,
  AlertTriangle,
  Waves,
  CloudRain,
  ShieldCheck,
  Activity,
  Mountain,
  Gauge,
  Home,
  PhoneCall,
} from 'lucide-react';
import { 
  TelemetryStation, 
  HighwayDisasterAlert, 
  SeverityLevel,
  DamReservoirInfo,
  FlashFloodAlert,
  EvacuationShelter,
  HighTideAlert,
  SHOW_STATIC_FLASH_FLOOD_ALERTS,
  SHOW_STATIC_HIGHWAY_ALERTS,
  SHOW_STATIC_TIDE_ALERT,
  SHOW_STATIC_SHELTERS,
} from '@/types/telemetry';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

interface TelemetryStationFeedListProps {
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  dams?: DamReservoirInfo[];
  flashFloodAlerts?: FlashFloodAlert[];
  shelters?: EvacuationShelter[];
  highTide?: HighTideAlert;
  selectedProvince?: string;
  onSelectStation: (station: TelemetryStation) => void;
  onSelectHighwayAlert: (alert: HighwayDisasterAlert) => void;
  onSelectDam?: (dam: DamReservoirInfo) => void;
  onSelectFlashFlood?: (flashFlood: FlashFloodAlert) => void;
  onSelectShelter?: (shelter: EvacuationShelter) => void;
  onSelectHighTide?: (tide: HighTideAlert) => void;
  onResetFilter?: () => void;
}

const severityConfig: Record<
  SeverityLevel,
  { label: string; badgeBg: string; text: string; dot: string }
> = {
  red: {
    label: 'วิกฤต/ล้นตลิ่ง',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  orange: {
    label: 'เตือนภัย/จ่อล้น',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  yellow: {
    label: 'เฝ้าระวัง',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-400',
  },
  green: {
    label: 'ระดับน้ำปกติ',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

export const TelemetryStationFeedList: React.FC<TelemetryStationFeedListProps> = ({
  stations,
  highwayAlerts,
  dams = [],
  flashFloodAlerts = [],
  shelters = [],
  highTide,
  selectedProvince = 'all',
  onSelectStation,
  onSelectHighwayAlert,
  onSelectDam,
  onSelectFlashFlood,
  onSelectShelter,
  onSelectHighTide,
  onResetFilter,
}) => {
  const provObj = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
  const activeProvName = selectedProvince === 'bangkok' ? 'กรุงเทพมหานคร (เมืองหลวง)' : selectedProvince === 'all' ? 'ทั่วประเทศ' : provObj ? `จ.${provObj.name_th}` : 'กรุงเทพมหานคร';

  const formatTimeThai = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4 font-sans pt-1">
      {/* 1. High Tide Alert Card */}
      {SHOW_STATIC_TIDE_ALERT && highTide && (
        <div 
          onClick={() => onSelectHighTide && onSelectHighTide(highTide)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 text-white border border-cyan-400/30 cursor-pointer shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-cyan-950 flex items-center gap-1">
                  <Waves className="w-3 h-3" />
                  <span>เกณฑ์น้ำทะเลหนุนสูง</span>
                </span>
                <span className="text-xs text-cyan-200">กรมอุทกศาสตร์ กองทัพเรือ</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {highTide.warning_title}
              </h4>
              <p className="text-xs text-cyan-100 line-clamp-2">
                {highTide.warning_detail}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-cyan-300 pt-1">
                <span>🌅 เช้า: +{highTide.morning_peak_m_msl} ม. ({highTide.morning_peak_time})</span>
                <span>🌙 ค่ำ: +{highTide.evening_peak_m_msl} ม. ({highTide.evening_peak_time})</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-cyan-300 flex-shrink-0 self-center" />
          </div>
        </div>
      )}

      {/* 2. Flash Flood Early Warning Section */}
      {SHOW_STATIC_FLASH_FLOOD_ALERTS && flashFloodAlerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mountain className="w-4 h-4 text-rose-600" />
              <span>เตือนภัยน้ำป่าไหลหลาก & ดินโคลนถล่ม {selectedProvince === 'prachinburi' ? '(ยอดเขาใหญ่-ทับลาน)' : `(${activeProvName})`}</span>
            </span>
            <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              พบ {flashFloodAlerts.length} จุดเสี่ยง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {flashFloodAlerts.map((flash) => (
              <div
                key={flash.id}
                onClick={() => onSelectFlashFlood && onSelectFlashFlood(flash)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  flash.severity === 'red'
                    ? 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
                    : 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        flash.severity === 'red' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {flash.severity_label}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        อ.{flash.district}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {flash.location_name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      ฝนสะสมยอดเขา <b>{flash.rain_mountain_24h_mm} มม.</b> • เสี่ยงหลากใน {flash.time_to_flood_hours}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Dams & Reservoirs Section */}
      {dams.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-600" />
              <span>เขื่อนและอ่างเก็บน้ำหลัก (กรมชลประทาน SWOC)</span>
            </span>
            <span className="text-[11px] text-cyan-800 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              {dams.length} อ่างเก็บน้ำ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {dams.map((dam) => (
              <div
                key={dam.id}
                onClick={() => onSelectDam && onSelectDam(dam)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {dam.name_th.includes('นฤบดินทร') ? 'เขื่อนห้วยโสมง' : dam.name_th}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        dam.capacity_percentage >= 90 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {dam.capacity_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${dam.capacity_percentage >= 90 ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(dam.capacity_percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      กักเก็บ {dam.current_storage_mcm} / {dam.capacity_storage_mcm} ล้าน ลบ.ม.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Highway Flood Alerts Section */}
      {SHOW_STATIC_HIGHWAY_ALERTS && highwayAlerts.length > 0 && (
        <div id="highway-flood-alerts" className="space-y-2.5 scroll-mt-20">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-600" />
              <span>แจ้งเตือนเส้นทางน้ำท่วมขัง (กรมทางหลวง DOH)</span>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              พบ {highwayAlerts.length} จุดเฝ้าระวัง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {highwayAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectHighwayAlert(alert)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  !alert.passable
                    ? 'bg-red-50/70 border-red-200 hover:border-red-400'
                    : 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                        {alert.route_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        !alert.passable ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {!alert.passable ? '⛔ รถเล็กผ่านไม่ได้' : '⚠️ ระวังน้ำท่วมทาง'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {alert.road_name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      อ.{alert.district} • {alert.km_range} (ระดับน้ำ {alert.water_height_cm} ซม.)
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Telemetry Stations Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-blue-600" />
            <span>สถานีวัดระดับน้ำ & จุดวัดอัตโนมัติ {selectedProvince === 'prachinburi' ? 'ลุ่มน้ำปราจีนบุรี' : `(${activeProvName})`} (สสน./กรมชลฯ)</span>
          </span>
          <span className="text-xs text-slate-500">พบ {stations.length} สถานี</span>
        </div>

        {stations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-600 text-xs font-medium space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">ไม่พบสถานีตรวจวัดระดับน้ำในพื้นที่หรือตามเงื่อนไขที่เลือก</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ลองเปลี่ยนตัวกรอง หรือค้นหาพื้นที่ใกล้เคียง</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              {onResetFilter && (
                <button
                  type="button"
                  onClick={onResetFilter}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              กรณีต้องการความช่วยเหลือเร่งด่วนในพื้นที่น้ำท่วม โทรสายด่วน ปภ.{' '}
              <a href="tel:1784" className="font-bold text-red-600 hover:text-red-700 underline">
                1784 (โทรฟรี 24 ชม.)
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {stations.map((sta) => {
            const cfg = severityConfig[sta.severity] || severityConfig.yellow;
            const isWater = sta.station_type === 'water_level';

            return (
              <div
                key={sta.id}
                onClick={() => onSelectStation(sta)}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        {sta.station_code}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span>{sta.severity_label}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        อ.{sta.district}{sta.province ? ` จ.${THAILAND_PROVINCES.find((p) => p.id === sta.province)?.name_th || sta.province}` : ''}
                      </span>
                      {sta.basin_name && (
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-100 hidden sm:inline">
                          ลุ่มน้ำ{sta.basin_name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {sta.name_th}
                    </h3>

                    {/* Metrics Glance */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600">
                      {isWater ? (
                        <>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[11px] text-slate-400 block">ระดับน้ำ</span>
                            <span className="font-black text-slate-800 text-sm">
                              {sta.water_level_m_msl ?? '-'} <span className="text-[10px] font-normal" title="เมตรเหนือระดับน้ำทะเลปานกลาง">ม.รทก.</span>
                            </span>
                            <span className="text-[9px] text-slate-400 block -mt-0.5">ม.ระดับน้ำทะเล</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[11px] text-slate-400 block">ระดับตลิ่ง</span>
                            <span className="font-black text-slate-800 text-sm">
                              {sta.bank_level_m_msl ?? '-'} <span className="text-[10px] font-normal">ม.</span>
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 hidden sm:block">
                            <span className="text-[11px] text-slate-400 block">ความจุลำน้ำ</span>
                            <span className={`font-black text-sm ${
                              (sta.capacity_percentage || 0) >= 100 ? 'text-red-600' : 'text-blue-700'
                            }`}>
                              {sta.capacity_percentage ?? '-'}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[11px] text-slate-400 block">ฝน 24 ชม.</span>
                            <span className="font-black text-blue-700 text-sm">
                              {sta.rain_24h_mm ?? 0} <span className="text-[10px] font-normal">มม.</span>
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[11px] text-slate-400 block">ฝนวันนี้</span>
                            <span className="font-black text-slate-800 text-sm">
                              {sta.rain_today_mm ?? 0} <span className="text-[10px] font-normal">มม.</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 self-center flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* 6. Evacuation Shelters Section */}
      {SHOW_STATIC_SHELTERS && shelters.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>ศูนย์พักพิง & จุดอพยพชั่วคราว (ปภ. {selectedProvince === 'prachinburi' ? 'ปราจีนบุรี' : activeProvName})</span>
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {shelters.length} ศูนย์
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {shelters.map((shelter) => (
              <div
                key={shelter.id}
                onClick={() => onSelectShelter && onSelectShelter(shelter)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {shelter.status === 'open' ? '✓ เปิดรองรับ' : 'ใกล้เต็ม'}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        อ.{shelter.district}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {shelter.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      รองรับ {shelter.current_occupancy}/{shelter.capacity_persons} คน • โทร {shelter.contact_phone}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
