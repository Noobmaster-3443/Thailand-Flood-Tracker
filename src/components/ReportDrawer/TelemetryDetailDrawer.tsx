'use client';

import React from 'react';
import { formatBangkokDateTime } from '@/lib/format/bangkok-time';
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Car,
  Waves,
  CloudRain,
  ExternalLink,
  PhoneCall,
  Activity,
  Compass,
  ArrowUpRight,
  Mountain,
  Home,
  Utensils,
  Stethoscope,
  Gauge,
  Droplets,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { 
  TelemetryStation, 
  HighwayDisasterAlert, 
  SeverityLevel,
  DamReservoirInfo,
  HighTideAlert,
  FlashFloodAlert,
  EvacuationShelter,
  SHOW_STATIC_FLASH_FLOOD_ALERTS,
  SHOW_STATIC_HIGHWAY_ALERTS,
  SHOW_STATIC_TIDE_ALERT,
  SHOW_STATIC_SHELTERS,
} from '@/types/telemetry';

interface TelemetryDetailDrawerProps {
  station: TelemetryStation | null;
  highwayAlert: HighwayDisasterAlert | null;
  dam?: DamReservoirInfo | null;
  flashFlood?: FlashFloodAlert | null;
  shelter?: EvacuationShelter | null;
  highTide?: HighTideAlert | null;
  onClose: () => void;
  onOpenEmergency: () => void;
}

const severityConfig: Record<
  SeverityLevel,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  red: {
    label: 'วิกฤต / น้ำล้นตลิ่ง',
    bg: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '🚨',
  },
  orange: {
    label: 'เตือนภัย / จ่อล้นตลิ่ง',
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: '🌊',
  },
  yellow: {
    label: 'เฝ้าระวังระดับน้ำ',
    bg: 'bg-amber-400',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: '⚠️',
  },
  green: {
    label: 'ระดับน้ำปกติ',
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '✅',
  },
};

export const TelemetryDetailDrawer: React.FC<TelemetryDetailDrawerProps> = ({
  station,
  highwayAlert,
  dam,
  flashFlood,
  shelter,
  highTide,
  onClose,
  onOpenEmergency,
}) => {
  const activeFlashFlood = SHOW_STATIC_FLASH_FLOOD_ALERTS ? flashFlood : null;
  const activeHighwayAlert = SHOW_STATIC_HIGHWAY_ALERTS ? highwayAlert : null;
  const activeHighTide = SHOW_STATIC_TIDE_ALERT ? highTide : null;
  const activeShelter = SHOW_STATIC_SHELTERS ? shelter : null;
  if (!station && !activeHighwayAlert && !dam && !activeFlashFlood && !activeShelter && !activeHighTide) return null;

  // 1. Render Telemetry Station details
  if (station) {
    const cfg = severityConfig[station.severity] || severityConfig.yellow;
    const isWater = station.station_type === 'water_level';

    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                รหัสสถานี: {station.station_code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${cfg.bg}`}>
                {station.severity_label}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {station.name_th}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>ต.{station.subdistrict} อ.{station.district} • {station.basin_name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs px-1 text-center">
                {station.source_agency || 'สสน.'}
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>ข้อมูลเปิดทางการ (Official Telemetry)</span>
                </div>
                <div className="text-[11px] text-blue-700">{station.source_name_th}</div>
              </div>
            </div>
            {station.source_url && (
              <a
                href={station.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-100 transition-colors"
                title="เปิดเว็บแหล่งข้อมูลหลัก"
              >
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Key Hydrological or Road Metrics */}
          {station.station_type === 'highway_flood' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">ระดับน้ำท่วมผิวจราจร</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                  {station.water_depth_cm !== undefined ? (
                    <>
                      {station.water_depth_cm} <span className="text-xs font-normal text-slate-600">ซม.</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-amber-700">ไม่มีข้อมูลสด</span>
                      {(() => {
                        const dtStr = formatBangkokDateTime(station.fetched_at);
                        if (!dtStr) return null;
                        const actionLabel = station.upstream_fetch_ok === false ? 'ลองดึงล่าสุด' : 'ตรวจสอบล่าสุด';
                        return <span className="text-[10px] font-normal text-slate-500 mt-0.5">{actionLabel} {dtStr} น.</span>;
                      })()}
                    </div>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {station.water_depth_cm !== undefined ? (
                    station.water_depth_cm > 0 ? (
                      <b className="text-red-600">มีน้ำท่วมขังบนผิวถนน</b>
                    ) : (
                      <b className="text-emerald-700">ผิวจราจรแห้งปกติ</b>
                    )
                  ) : (
                    <b className="text-slate-500">
                      {station.upstream_fetch_ok === false ? 'ดึงข้อมูลจาก BMA DDS ไม่สำเร็จ' : 'ยังไม่มีสัญญาณตรวจวัดสด'}
                    </b>
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">สถานะการสัญจร</span>
                <span className={`text-2xl font-black mt-0.5 block ${
                  station.passable_for_vehicles ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  {station.passable_for_vehicles ? 'สัญจรได้' : 'ห้ามรถเล็ก'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block truncate">
                  {station.route_number || 'ถนนสายหลัก'}
                </span>
              </div>
            </div>
          ) : isWater ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">ระดับน้ำปัจจุบัน</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                  {station.water_level_m_msl ?? '-'} <span className="text-xs font-normal text-slate-600" title="เมตรเหนือระดับน้ำทะเลปานกลาง">ม.รทก.</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">เมตรเหนือระดับน้ำทะเลปานกลาง</span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ระดับตลิ่ง: <b>{station.bank_level_m_msl ?? '-'} ม.</b>
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">ความจุลำน้ำ</span>
                <span className={`text-2xl font-black mt-0.5 block ${
                  (station.capacity_percentage || 0) >= 100 ? 'text-red-600' : 'text-blue-700'
                }`}>
                  {station.capacity_percentage ?? '-'}%
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {station.diff_from_bank !== undefined && station.diff_from_bank > 0 ? (
                    <b className="text-red-600">สูงกว่าตลิ่ง +{station.diff_from_bank.toFixed(2)} ม.</b>
                  ) : station.diff_from_bank !== undefined && station.diff_from_bank < 0 ? (
                    <b className="text-emerald-700">ต่ำกว่าตลิ่ง {Math.abs(station.diff_from_bank).toFixed(2)} ม.</b>
                  ) : (
                    <b className="text-slate-600">ระดับเสมอริมตลิ่ง</b>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">ปริมาณฝน 24 ชม. สะสม</span>
                <span className="text-2xl font-black text-blue-700 mt-0.5 block">
                  {station.rain_24h_mm ?? 0} <span className="text-xs font-normal text-slate-600">มม.</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {station.rain_24h_mm && station.rain_24h_mm >= 90 ? '⚠️ เกณฑ์ฝนหนักมาก' : 'เกณฑ์ฝนปานกลาง'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">ฝนวันนี้ (ตั้งแต่เที่ยงคืน)</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                  {station.rain_today_mm ?? 0} <span className="text-xs font-normal text-slate-600">มม.</span>
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {station.province === 'bangkok' ? 'สถานีวัดน้ำฝน กทม.' : 'สถานีโทรมาตรวัดน้ำฝน'}
                </span>
              </div>
            </div>
          )}

          {/* Situation Assessment */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>การวิเคราะห์สถานการณ์น้ำหน้าสถานี</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {station.status_text}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {station.data_status === 'LIVE' && station.observed_at ? (
                  <span>เวลาตรวจวัดจริง: <b>{new Date(station.observed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })} น.</b></span>
                ) : (
                  <span>สถานะข้อมูล: <b>ตำแหน่งอ้างอิง (ยังไม่มีข้อมูลสด)</b></span>
                )}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                สถานะ: {station.data_status || 'LIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEmergency}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm border border-red-200 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-red-500" />
            <span>สายด่วน 1784/1669</span>
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>นำทางไปพิกัด</span>
          </a>
        </div>
      </div>
    );
  }

  // 2. Render Highway Flood Alert details
  if (activeHighwayAlert) {
    const hw = activeHighwayAlert;
    const isImpassable = !hw.passable;

    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {hw.route_number}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${
                isImpassable ? 'bg-red-600' : 'bg-amber-500'
              }`}>
                {isImpassable ? '⛔ รถเล็กผ่านไม่ได้' : '⚠️ ระวังน้ำท่วมผิวทาง'}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {hw.road_name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>อ.{hw.district} • {hw.km_range}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ทล.
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>รายงานเตือนภัยกรมทางหลวง (HDMS Open Data)</span>
                </div>
                <div className="text-[11px] text-amber-800">{hw.source_name_th}</div>
              </div>
            </div>
            <a
              href="https://hdms.doh.go.th/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-slate-500 block">ระดับน้ำท่วมผิวจราจร</span>
            <span className={`text-3xl font-black mt-1 block ${
              isImpassable ? 'text-red-600' : 'text-amber-600'
            }`}>
              {hw.water_height_cm} <span className="text-sm font-normal text-slate-600">ซม.</span>
            </span>
            <span className={`text-xs font-bold mt-1 inline-block px-2.5 py-0.5 rounded-full ${
              isImpassable ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isImpassable ? 'ช่องทางจราจรถูกตัดขาด / รถเตี้ยห้ามผ่าน' : 'รถทุกประเภทสัญจรได้ด้วยความระมัดระวัง'}
            </span>
          </div>

          <div className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-600" />
              <span>คำแนะนำเส้นทางเลี่ยง & ข้อมูลหน้างาน</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {hw.detour_info || 'ชะลอความเร็วและปฏิบัติตามป้ายเตือนของเจ้าหน้าที่แขวงทางหลวง'}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>อัปเดตแจ้งเตือนเมื่อ: {new Date(hw.updated_at).toLocaleTimeString('th-TH')} น.</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <a
            href="tel:1586"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs sm:text-sm border border-amber-200 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-amber-600" />
            <span>สายด่วนทางหลวง 1586</span>
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${hw.latitude},${hw.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>นำทางตรวจสอบ</span>
          </a>
        </div>
      </div>
    );
  }

  // 3. Render Dam & Major Reservoir details
  if (dam) {
    const isCriticalDam = dam.capacity_percentage >= 95;
    const isWarningDam = dam.capacity_percentage >= 85;

    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                เขื่อน & อ่างเก็บน้ำ
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${
                isCriticalDam ? 'bg-red-600' : isWarningDam ? 'bg-orange-500' : 'bg-emerald-600'
              }`}>
                {dam.status_label}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {dam.name_th}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>ต.{dam.subdistrict} {dam.district}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-cyan-50/80 border border-cyan-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ชล.
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>ศูนย์ปฏิบัติการน้ำอัจฉริยะ SWOC</span>
                </div>
                <div className="text-[11px] text-cyan-800">{dam.agency}</div>
              </div>
            </div>
            {dam.source_url && (
              <a
                href={dam.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-700 hover:text-cyan-900 p-1 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Dam Storage Level Progress Gauge */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">ปริมาณน้ำกักเก็บปัจจุบัน</span>
              <span className="text-xl font-black text-blue-900">
                {dam.capacity_percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isCriticalDam ? 'bg-red-500' : isWarningDam ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(dam.capacity_percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>ปัจจุบัน: <b>{dam.current_storage_mcm}</b> ล้าน ลบ.ม.</span>
              <span>ความจุอ่าง: <b>{dam.capacity_storage_mcm}</b> ล้าน ลบ.ม.</span>
            </div>
          </div>

          {/* Inflow vs Outflow Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 block font-medium">น้ำไหลลงอ่าง (Inflow)</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                {dam.inflow_mcm_day} <span className="text-xs font-normal text-emerald-700">ล้าน ลบ.ม./วัน</span>
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">มวลน้ำจากเทือกเขา</span>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-center">
              <span className="text-xs text-blue-800 block font-medium">การระบายน้ำ (Outflow)</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">
                {dam.outflow_mcm_day} <span className="text-xs font-normal text-blue-700">ล้าน ลบ.ม./วัน</span>
              </span>
              <span className="text-[10px] text-blue-600 mt-0.5 block">ระบายสู่ลำน้ำสาขา</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>การบริหารจัดการน้ำของอ่างเก็บน้ำ</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {dam.description}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>ตรวจวัดเมื่อ: {new Date(dam.observed_at).toLocaleTimeString('th-TH')} น.</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEmergency}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm border border-blue-200 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span>สายด่วนน้ำชลประทาน 1460</span>
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${dam.latitude},${dam.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>ดูพิกัดเขื่อน</span>
          </a>
        </div>
      </div>
    );
  }

  // 4. Render Flash Flood & Mountain Runoff details
  if (activeFlashFlood) {
    const isCriticalFlash = activeFlashFlood.severity === 'red';

    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                <Mountain className="w-3 h-3" />
                <span>เตือนภัยน้ำป่าไหลหลาก</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${
                isCriticalFlash ? 'bg-red-600' : 'bg-amber-500'
              }`}>
                {activeFlashFlood.severity_label}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {activeFlashFlood.location_name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>ต.{activeFlashFlood.subdistrict} อ.{activeFlashFlood.district} • {activeFlashFlood.mountain_range}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-center">
            <span className="text-xs text-rose-800 block font-semibold">ปริมาณฝนสะสมบนยอดเขา (24 ชม.)</span>
            <span className="text-3xl font-black text-rose-950 mt-1 block">
              {activeFlashFlood.rain_mountain_24h_mm} <span className="text-sm font-normal text-slate-600">มม.</span>
            </span>
            <span className="text-xs font-bold text-rose-700 mt-1 inline-block bg-white px-2.5 py-0.5 rounded-full border border-rose-200">
              ⏱️ คาดการณ์มวลน้ำหลากลงสู่ชุมชนล่างใน {activeFlashFlood.time_to_flood_hours}
            </span>
          </div>

          <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>คำแนะนำการเฝ้าระวัง & อพยพฉุกเฉิน</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeFlashFlood.advisory}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>รายงานโดย: {activeFlashFlood.agency}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEmergency}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>ขอความช่วยเหลือฉุกเฉิน</span>
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeFlashFlood.latitude},${activeFlashFlood.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>ตรวจสอบพิกัดเสี่ยง</span>
          </a>
        </div>
      </div>
    );
  }

  // 5. Render Evacuation Shelter details
  if (activeShelter) {
    const occupancyPercent = Math.round((activeShelter.current_occupancy / activeShelter.capacity_persons) * 100);

    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                <Home className="w-3 h-3" />
                <span>จุดพักพิง & ศูนย์อพยพ ปภ.</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                {activeShelter.status === 'open' ? '✓ เปิดรองรับ' : 'ใกล้เต็ม'}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {activeShelter.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeShelter.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Capacity Progress Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">จำนวนผู้อพยพปัจจุบัน</span>
              <span className="text-sm font-bold text-slate-900">
                {activeShelter.current_occupancy} / {activeShelter.capacity_persons} คน ({occupancyPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Amenities & Facility Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border ${
              activeShelter.has_medical ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-400'
            }`}>
              <Stethoscope className="w-4 h-4 mx-auto mb-1" />
              <span className="font-semibold block text-[11px]">หน่วยพยาบาล</span>
              <span className="text-[10px]">{activeShelter.has_medical ? '✓ พร้อม' : '-'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              activeShelter.has_food_kitchen ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-400'
            }`}>
              <Utensils className="w-4 h-4 mx-auto mb-1" />
              <span className="font-semibold block text-[11px]">โรงครัว/อาหาร</span>
              <span className="text-[10px]">{activeShelter.has_food_kitchen ? '✓ พร้อม' : '-'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              activeShelter.has_car_parking ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-400'
            }`}>
              <Car className="w-4 h-4 mx-auto mb-1" />
              <span className="font-semibold block text-[11px]">ที่จอดรถหนีน้ำ</span>
              <span className="text-[10px]">{activeShelter.has_car_parking ? '✓ มีพื้นที่' : '-'}</span>
            </div>
          </div>

          {/* Notes & Contact */}
          <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800">ข้อมูลและสิ่งอำนวยความสะดวก:</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeShelter.notes || 'เปิดบริการตลอด 24 ชม. มีเจ้าหน้าที่ ปภ. และ อสม. คอยอำนวยความสะดวก'}
            </p>
            <div className="pt-2 text-xs text-blue-800 font-semibold">
              ผู้ประสานงาน: {activeShelter.contact_name} ({activeShelter.contact_phone})
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <a
            href={`tel:${activeShelter.contact_phone.replace(/-/g, '')}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>โทรติดต่อศูนย์</span>
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeShelter.latitude},${activeShelter.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>นำทางไปศูนย์พักพิง</span>
          </a>
        </div>
      </div>
    );
  }

  // 6. Render High Tide Alert details
  if (activeHighTide) {
    return (
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-[460px] bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200 flex items-center gap-1">
                <Waves className="w-3 h-3" />
                <span>เกณฑ์น้ำทะเลหนุนสูง</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-600 text-white">
                กรมอุทกศาสตร์ กองทัพเรือ
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {activeHighTide.warning_title}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeHighTide.location}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 bg-cyan-50/80 rounded-2xl border border-cyan-200 text-center">
              <span className="text-xs text-cyan-800 font-semibold block">น้ำหนุนสูงสุดรอบเช้า</span>
              <span className="text-2xl font-black text-cyan-950 mt-1 block">
                +{activeHighTide.morning_peak_m_msl} <span className="text-xs font-normal text-slate-600" title="เมตรเหนือระดับน้ำทะเลปานกลาง">ม.รทก.</span>
              </span>
              <span className="text-[10px] text-cyan-700 block">เมตรเหนือระดับน้ำทะเล</span>
              <span className="text-xs text-cyan-700 font-bold mt-1 block">
                เวลา: {activeHighTide.morning_peak_time}
              </span>
            </div>

            <div className="p-3.5 bg-cyan-50/80 rounded-2xl border border-cyan-200 text-center">
              <span className="text-xs text-cyan-800 font-semibold block">น้ำหนุนสูงสุดรอบค่ำ</span>
              <span className="text-2xl font-black text-cyan-950 mt-1 block">
                +{activeHighTide.evening_peak_m_msl} <span className="text-xs font-normal text-slate-600" title="เมตรเหนือระดับน้ำทะเลปานกลาง">ม.รทก.</span>
              </span>
              <span className="text-[10px] text-cyan-700 block">เมตรเหนือระดับน้ำทะเล</span>
              <span className="text-xs text-cyan-700 font-bold mt-1 block">
                เวลา: {activeHighTide.evening_peak_time}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>ผลกระทบต่อระดับน้ำและการระบายน้ำในพื้นที่</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeHighTide.warning_detail}
            </p>
            <div className="pt-2 text-xs font-semibold text-slate-600">
              พื้นที่ได้รับผลกระทบหลัก: {activeHighTide.affected_districts.join(', ')}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEmergency}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm border border-red-200 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-red-500" />
            <span>สายด่วน 1784</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
          >
            <span>รับทราบข้อมูล</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
