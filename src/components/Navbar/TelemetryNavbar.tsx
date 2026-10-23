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
import { TelemetryStation, HighwayDisasterAlert, SHOW_STATIC_HIGHWAY_ALERTS } from '@/types/telemetry';
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
  const liveStations = stations.filter((s) => s.data_status === 'LIVE');
  const staticStations = stations.filter((s) => s.data_status === 'STATIC');
  const isAllStatic = stations.length > 0 && staticStations.length === stations.length;
  const hasLive = liveStations.length > 0;

  const criticalCount = liveStations.filter((s) => s.severity === 'red').length;
  const warningCount = liveStations.filter((s) => s.severity === 'orange').length;
  const impassableRoads = highwayAlerts.filter((h) => !h.passable).length;

  const currentProvinceObj = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
  const titleText =
    selectedProvince === 'bangkok'
      ? 'ข้อมูลน้ำและอุทกภัย กรุงเทพมหานคร'
      : selectedProvince === 'all'
      ? 'ข้อมูลน้ำและอุทกภัย ประเทศไทย'
      : `ข้อมูลน้ำและอุทกภัย จ.${currentProvinceObj?.name_th || 'กรุงเทพมหานคร'}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-15 flex items-center justify-between gap-3">
        {/* Brand & Thai Public Service Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Waves className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 leading-tight truncate">
                {titleText}
              </span>
              <span className="hidden xl:inline-flex bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Open Data</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">
              ระบบติดตามสถานการณ์น้ำและอุทกภัย
            </p>
          </div>
        </div>

        {/* Status Indicators / Reference Badge */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          {stations.length === 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>ไม่มีข้อมูลสด</span>
            </div>
          ) : isAllStatic ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>ข้อมูลอ้างอิง</span>
            </div>
          ) : !hasLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span>ข้อมูลล่าช้า</span>
            </div>
          ) : (
            <>
              {/* Mobile: simple live-data badge */}
              <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>ข้อมูลสด</span>
              </div>
              {/* Desktop: detailed critical/warning counts */}
              <div className="hidden lg:flex items-center gap-2">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>ล้นตลิ่ง {criticalCount} จุด</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>เฝ้าระวัง {warningCount} จุด</span>
                  </div>
                )}
                {SHOW_STATIC_HIGHWAY_ALERTS && impassableRoads > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                    <span>ทางท่วม/ปิด {impassableRoads} จุด</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Toggle (Map / List) */}
          <div className="bg-slate-100 p-0.5 sm:p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => onViewChange('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'map'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="มุมมองแผนที่"
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">แผนที่</span>
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'list'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="มุมมองรายการสถานี"
            >
              <LayoutList className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">รายการ</span>
            </button>
          </div>

          {/* Weather Quick Widget */}
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200 transition-all cursor-pointer"
              title="เรดาร์ตรวจฝน กทม. สด (สำนักการระบายน้ำ หนองจอก)"
            >
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">เรดาร์ กทม.</span>
              <span className="sm:hidden">เรดาร์</span>
            </button>
          )}

          {/* Area Overview Page - Only for Prachinburi */}
          {selectedProvince === 'prachinburi' && (
            <Link
              href="/area"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all"
              title="พื้นที่ของฉัน (7 อำเภอ ปราจีนบุรี)"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="hidden sm:inline">7 อำเภอ</span>
            </Link>
          )}

          {/* Emergency Hotline Button - Clean, visible and accessible */}
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all cursor-pointer flex-shrink-0"
            title="สายด่วน ปภ. 1784"
          >
            <PhoneCall className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span className="hidden sm:inline">สายด่วน ปภ. 1784</span>
            <span className="sm:hidden font-bold">1784</span>
          </button>
        </div>
      </div>
    </header>
  );
};
