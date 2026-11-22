'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { NationwideCoverageSummary } from '@/lib/providers/types';
import { ApiStatusMenu } from './ApiStatusMenu';

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
  filterSlot?: React.ReactNode;
  coverage?: NationwideCoverageSummary | null;
  lastUpdated?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  filterSlot,
  coverage,
  lastUpdated,
  onRefresh,
  isRefreshing,
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
      ? 'ศูนย์ติดตามสถานการณ์น้ำ กรุงเทพมหานคร'
      : selectedProvince === 'all'
      ? 'ระบบติดตามสถานการณ์น้ำและอุทกภัย ประเทศไทย'
      : `ศูนย์ติดตามสถานการณ์น้ำ จ.${currentProvinceObj?.name_th || 'กรุงเทพมหานคร'}`;

  const mobileShortTitle =
    selectedProvince === 'bangkok'
      ? 'กรุงเทพฯ'
      : selectedProvince === 'all'
      ? 'ทั่วประเทศ'
      : (currentProvinceObj?.name_th || 'กรุงเทพฯ');

  return (
    <>
      {/* 1. Mobile Floating Header Bar (Modern Map-First Island, strictly responsive, Prompt typography) */}
      <div className="lg:hidden fixed top-[calc(env(safe-area-inset-top,0px)+0.625rem)] inset-x-3 z-[950] pointer-events-none font-sans">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 px-2.5 py-1.5 flex items-center justify-between gap-1.5 w-full">
          {/* Brand & Province Name */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <Link
              href="/"
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-white border border-slate-200/90 shadow-xs hover:scale-105 transition-transform"
              title="ระบบติดตามสถานการณ์น้ำและอุทกภัย"
            >
              <Image
                src="/logo.png"
                alt="โลโก้ระบบติดตามสถานการณ์น้ำ"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </Link>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight text-slate-900 truncate">
                  {mobileShortTitle}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full font-bold border border-emerald-200 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  สด
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate">
                {selectedProvince === 'bangkok' ? 'สำนักการระบายน้ำ กทม.' : 'คลังข้อมูลน้ำแห่งชาติ'}
              </span>
            </div>
          </div>

          {/* Action Controls on Mobile */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Weather Quick Widget */}
            {onOpenWeatherModal && (
              <WeatherQuickWidget 
                onOpenModal={onOpenWeatherModal} 
                selectedProvince={selectedProvince}
                className="text-[11px] px-2 py-1"
              />
            )}

            {/* API Health Status Quick Trigger (Mobile) */}
            <ApiStatusMenu
              coverage={coverage}
              lastUpdated={lastUpdated}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              isMobileTrigger
            />

            {/* View Toggle (Map / List) */}
            <button
              onClick={() => onViewChange(currentView === 'map' ? 'list' : 'map')}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title={currentView === 'map' ? 'สลับไปมุมมองรายการ' : 'สลับไปมุมมองแผนที่'}
              aria-label={currentView === 'map' ? 'มุมมองรายการ' : 'มุมมองแผนที่'}
            >
              {currentView === 'map' ? (
                <LayoutList className="w-4 h-4 text-slate-700" />
              ) : (
                <MapIcon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {/* Emergency Hotline 1784 */}
            <button
              onClick={onOpenEmergencyModal}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title="สายด่วน ปภ. 1784 (โทรฟรี 24 ชม.)"
              aria-label="สายด่วน ปภ. 1784 (โทรฟรี 24 ชม.)"
            >
              <PhoneCall className="w-4 h-4 text-white flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Desktop Unified Command Center Bar (Docked 2-Tier Header) */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all font-sans">
        {/* Tier 1: Operations & Agency Header (Height ~54px) */}
        <div className="w-full px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand & Thai Public Service Title + Agency Attribution Badges */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            <Link
              href="/"
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-white border border-slate-200/90 shadow-xs hover:scale-105 transition-transform"
              title="ระบบติดตามสถานการณ์น้ำและอุทกภัย"
            >
              <Image
                src="/logo.png"
                alt="โลโก้ระบบติดตามสถานการณ์น้ำ"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </Link>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm lg:text-[15px] tracking-tight text-slate-900 leading-tight truncate">
                  {titleText}
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Open Data สด</span>
                </span>
              </div>
              
              {/* Agency Badges for High Public Trust */}
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate mt-0.5">
                <span className="text-slate-400">บูรณาการข้อมูลร่วม:</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                  <span>🏛️ กทม. (DDS)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                  <span>🌊 สสน. (ThaiWater)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                  <span>🚜 กรมชลประทาน</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                  <span>🛡️ ปภ. 1784</span>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Status Ticker / Summary */}
          <div className="hidden xl:flex items-center gap-2 text-xs flex-shrink-0">
            {stations.length === 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>กำลังโหลดข้อมูลโทรมาตร...</span>
              </div>
            ) : isAllStatic ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>โหมดข้อมูลอ้างอิง</span>
              </div>
            ) : !hasLive ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>ข้อมูลโทรมาตรล่าช้า</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {criticalCount > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    <span>ล้นตลิ่ง {criticalCount} จุด</span>
                  </div>
                ) : null}
                {warningCount > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>เฝ้าระวัง {warningCount} จุด</span>
                  </div>
                ) : null}
                {SHOW_STATIC_HIGHWAY_ALERTS && impassableRoads > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-xs">
                    <span>⛔ ทางท่วม {impassableRoads} จุด</span>
                  </div>
                ) : null}
                {criticalCount === 0 && warningCount === 0 && impassableRoads === 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>ระดับน้ำปกติทุกสถานีเฝ้าระวัง</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* View Toggle (Map / List) */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => onViewChange('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'map'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองแผนที่สด"
              >
                <MapIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>แผนที่</span>
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'list'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองรายการสถานี"
              >
                <LayoutList className="w-3.5 h-3.5 text-slate-600" />
                <span>รายการ</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200 transition-all cursor-pointer active:scale-95"
                title="เรดาร์ตรวจฝน กทม. สด (สำนักการระบายน้ำ หนองจอก)"
              >
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse flex-shrink-0" />
                <span>เรดาร์ กทม.</span>
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
                <span>7 อำเภอ</span>
              </Link>
            )}

            {/* API Health Status Popover (Desktop) */}
            <ApiStatusMenu
              coverage={coverage}
              lastUpdated={lastUpdated}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />

            {/* Emergency Hotline Button */}
            <button
              onClick={onOpenEmergencyModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title="สายด่วน ปภ. 1784 (โทรฟรี 24 ชม.)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
              <span>สายด่วน ปภ. 1784</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Docked Integrated Filter Toolbar (Height ~46px) */}
        {filterSlot && (
          <div className="w-full px-4 lg:px-6 py-1.5 border-t border-slate-200/70 bg-slate-50/80 backdrop-blur-md">
            {filterSlot}
          </div>
        )}
      </header>
    </>
  );
};
