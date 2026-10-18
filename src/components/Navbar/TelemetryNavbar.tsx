'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Waves, 
  PhoneCall, 
  MapPin, 
  LayoutList, 
  Map as MapIcon, 
  AlertTriangle,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import { TelemetryStation, HighwayDisasterAlert } from '@/types/telemetry';
import { WeatherQuickWidget } from '@/components/Weather/WeatherQuickWidget';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

interface TelemetryNavbarProps {
  currentView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
  onOpenEmergencyModal: () => void;
  onOpenWeatherModal?: () => void;
  onOpenBmaRadarModal?: () => void;
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  isAutoRefresh: boolean;
  selectedProvince?: string;
}

export const TelemetryNavbar: React.FC<TelemetryNavbarProps> = ({
  currentView,
  onViewChange,
  onOpenEmergencyModal,
  onOpenWeatherModal,
  onOpenBmaRadarModal,
  stations,
  highwayAlerts,
  isAutoRefresh,
  selectedProvince = 'all',
}) => {
  const criticalCount = stations.filter((s) => s.severity === 'red').length;
  const warningCount = stations.filter((s) => s.severity === 'orange').length;
  const impassableRoads = highwayAlerts.filter((h) => !h.passable).length;

  const currentProvinceObj = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
  const titleText =
    selectedProvince === 'bangkok'
      ? 'ข้อมูลน้ำและอุทกภัย กรุงเทพมหานคร (เมืองหลวง)'
      : selectedProvince === 'all'
      ? 'ข้อมูลน้ำและอุทกภัยทั่วประเทศ'
      : `ข้อมูลน้ำและอุทกภัย จ.${currentProvinceObj?.name_th || 'กรุงเทพมหานคร'}`;
  const subtitleText =
    selectedProvince === 'bangkok'
      ? 'ศูนย์ควบคุมระบบระบายน้ำ กทม. (DDS) • สสน. ThaiWater • กรมอุทกศาสตร์ กองทัพเรือ'
      : selectedProvince === 'all'
      ? 'ครอบคลุม 77 จังหวัด • สสน. ThaiWater • กรมชลประทาน • กรมทางหลวง'
      : `${currentProvinceObj?.region_th || 'ลุ่มน้ำ'} • สสน. ThaiWater • กรมชลประทาน • TMD`;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all font-sans">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 flex-shrink-0">
            <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                {titleText}
              </h1>
              <span className="hidden xl:inline-flex bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>ข้อมูลเปิดภาครัฐ</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block whitespace-nowrap">
              {subtitleText}
            </p>
          </div>
        </div>

        {/* Live Status Summary Badges (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center gap-2 text-xs flex-shrink-0">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>ล้นตลิ่ง {criticalCount} สถานี</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>จ่อล้น {warningCount} จุด</span>
            </div>
          )}
          {impassableRoads > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-2xs">
              <span>🚧 ทางท่วม/ขาด {impassableRoads} จุด</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Toggle (Map / List) */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-300/80 shadow-xs">
            <button
              onClick={() => onViewChange('map')}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                currentView === 'map'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="มุมมองแผนที่"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แผนที่</span>
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="มุมมองรายการสถานี"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">รายการ</span>
            </button>
          </div>

          {/* Weather Quick Widget - Passes selectedProvince (H-1) */}
          {onOpenWeatherModal && (
            <WeatherQuickWidget 
              onOpenModal={onOpenWeatherModal} 
              selectedProvince={selectedProvince}
            />
          )}

          {/* Bangkok DDS Live Radar Quick Viewer */}
          {selectedProvince === 'bangkok' && (
            <button
              onClick={onOpenBmaRadarModal ? onOpenBmaRadarModal : () => window.open('https://weather.bangkok.go.th/radar', '_blank')}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-300 hover:border-indigo-400 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="เรดาร์ตรวจฝน กทม. สด (สำนักการระบายน้ำ หนองจอก)"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">เรดาร์ กทม. (DDS)</span>
              <span className="sm:hidden font-black">เรดาร์</span>
            </button>
          )}

          {/* Area Overview Page - Only for Prachinburi (M-3) */}
          {selectedProvince === 'prachinburi' && (
            <Link
              href="/area"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-400/80 hover:border-blue-500 shadow-xs hover:shadow-sm transition-all active:scale-95"
              title="พื้นที่ของฉัน (เจาะลึก 7 อำเภอ ปราจีนบุรี)"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="hidden sm:inline">7 อำเภอ</span>
            </Link>
          )}

          {/* Emergency Hotline Button - Compact on mobile (M-2) */}
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md hover:shadow-lg transition-all active:scale-95 border border-red-500 cursor-pointer flex-shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
            <span className="hidden sm:inline">สายด่วน ปภ. 1784</span>
            <span className="sm:hidden font-black">1784</span>
          </button>
        </div>
      </div>
    </header>
  );
};
