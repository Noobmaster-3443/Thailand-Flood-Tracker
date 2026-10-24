'use client';

import React, { useState } from 'react';
import { Search, X, Check, Filter, RefreshCw, Radio, SlidersHorizontal, ChevronDown, Globe } from 'lucide-react';
import { DashboardFilterState, SeverityLevel } from '@/types/telemetry';
import { DataStatus } from '@/lib/providers/types';
import { PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

interface TelemetryFilterBarProps {
  filter: DashboardFilterState;
  onFilterChange: (newFilter: DashboardFilterState) => void;
  totalStations: number;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
  thaiWaterStatus?: DataStatus;
  availableDistricts?: string[];
}

export const TelemetryFilterBar: React.FC<TelemetryFilterBarProps> = ({
  filter,
  onFilterChange,
  totalStations,
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isRefreshing,
  lastUpdated,
  thaiWaterStatus,
  availableDistricts = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeProvince = filter.province || 'all';
  const currentProvinceObj = THAILAND_PROVINCES.find((p) => p.id === activeProvince);

  const severityOptions: { value: SeverityLevel | 'all'; label: string; dotColor: string }[] = [
    { value: 'all', label: 'ทั้งหมด', dotColor: 'bg-slate-400' },
    { value: 'red', label: 'วิกฤต/ล้นตลิ่ง', dotColor: 'bg-red-500' },
    { value: 'orange', label: 'เตือนภัย/จ่อล้น', dotColor: 'bg-orange-500' },
    { value: 'yellow', label: 'เฝ้าระวัง', dotColor: 'bg-amber-400' },
    { value: 'green', label: 'ปกติ', dotColor: 'bg-emerald-500' },
  ];

  const isFiltered = 
    (filter.province && filter.province !== 'all') ||
    filter.district !== 'all' || 
    filter.severity !== 'all' || 
    filter.searchQuery.trim() !== '';

  const handleProvinceChange = (newProvince: string) => {
    onFilterChange({
      ...filter,
      province: newProvince,
      district: 'all', // reset district on province change
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/90 p-1.5 sm:p-2 w-fit max-w-[calc(100vw-2rem)] mx-auto transition-all font-sans">
      {/* Sleek Single Row Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        {/* Province Selector */}
        <div className="flex-shrink-0">
          <select
            value={activeProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none cursor-pointer transition-all ${
              activeProvince === 'bangkok'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : activeProvince === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
            }`}
          >
            <option value="bangkok" className="bg-white text-slate-900 font-medium">
              📍 กรุงเทพมหานคร
            </option>
            <option value="all" className="bg-white text-slate-900 font-medium">
              🇹🇭 ทั่วประเทศ (77 จังหวัด)
            </option>
            <optgroup label="ภาคกลาง" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'central').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="ภาคตะวันออก" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'east').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="ภาคเหนือ" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'north').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="ภาคตะวันออกเฉียงเหนือ (อีสาน)" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'northeast').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="ภาคใต้" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'south').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="ภาคตะวันตก" className="text-slate-800 font-semibold bg-white">
              {THAILAND_PROVINCES.filter((p) => p.region === 'west').map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.name_th}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* District or Region Selector */}
        {activeProvince === 'all' ? (
          <div className="hidden md:block flex-shrink-0">
            <select
              value={filter.district}
              onChange={(e) => onFilterChange({ ...filter, district: e.target.value })}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
            >
              <option value="all">ทุกภูมิภาค</option>
              <option value="central">ภาคกลาง</option>
              <option value="north">ภาคเหนือ</option>
              <option value="northeast">ภาคตะวันออกเฉียงเหนือ</option>
              <option value="east">ภาคตะวันออก</option>
              <option value="south">ภาคใต้</option>
              <option value="west">ภาคตะวันตก</option>
            </select>
          </div>
        ) : (
          <div className="hidden md:block flex-shrink-0">
            <select
              value={filter.district}
              onChange={(e) => onFilterChange({ ...filter, district: e.target.value })}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium text-slate-700 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
            >
              <option value="all">ทุกอำเภอ ({currentProvinceObj?.name_th || 'จังหวัดนี้'})</option>
              {availableDistricts && availableDistricts.length > 0 ? (
                availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d.startsWith('อ.') ? d : `อ.${d}`}
                  </option>
                ))
              ) : activeProvince === 'prachinburi' ? (
                PRACHINBURI_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.name_th}>
                    {d.name_th}
                  </option>
                ))
              ) : null}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeProvince === 'all'
                ? 'ค้นหาจังหวัด, สถานี, เขื่อน, ลุ่มน้ำ...'
                : `ค้นหาสถานี, คลอง, จุดวัดน้ำ...`
            }
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all font-normal"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Selector */}
        <div className="hidden lg:block flex-shrink-0">
          <select
            value={filter.severity}
            onChange={(e) => onFilterChange({ ...filter, severity: e.target.value as any })}
            className={`px-2.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border outline-none cursor-pointer transition-colors ${
              filter.severity !== 'all'
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <option value="all">ทุกระดับน้ำ</option>
            <option value="red">🚨 ล้นตลิ่ง / วิกฤต</option>
            <option value="orange">🌊 จ่อล้น / เตือนภัย</option>
            <option value="yellow">⚠️ เฝ้าระวัง</option>
            <option value="green">✅ ปกติ</option>
          </select>
        </div>

        {/* Filter Details Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex-shrink-0 p-1.5 sm:p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-all ${
            isExpanded || (filter.severity !== 'all' && !isExpanded)
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title="ตัวกรองและทางลัด"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden xl:inline text-xs">ตัวกรอง</span>
          {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </button>

        {/* Auto Refresh Toggle */}
        <button
          onClick={onToggleAutoRefresh}
          className={`flex-shrink-0 hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium border transition-all ${
            isAutoRefresh
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title="เปิด/ปิด การดึงข้อมูลอัตโนมัติทุก 60 วินาที"
        >
          <Radio className={`w-3.5 h-3.5 ${isAutoRefresh ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden xl:inline">{isAutoRefresh ? 'Auto 60s' : 'Manual'}</span>
        </button>

        {/* Manual Refresh Button */}
        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="flex-shrink-0 p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          title="รีเฟรชข้อมูล Open Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Collapsible Detailed Filter Row (Shown when toggled or expanded) (M-5) */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1">
          {/* Mobile District or Region Selector */}
          <div className="md:hidden">
            {activeProvince === 'all' ? (
              <select
                value={filter.district}
                onChange={(e) => onFilterChange({ ...filter, district: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 outline-none"
              >
                <option value="all">🌐 ทุกภูมิภาค (ทั่วประเทศ)</option>
                <option value="central">ภาคกลาง</option>
                <option value="north">ภาคเหนือ</option>
                <option value="northeast">ภาคตะวันออกเฉียงเหนือ (อีสาน)</option>
                <option value="east">ภาคตะวันออก</option>
                <option value="south">ภาคใต้</option>
                <option value="west">ภาคตะวันตก</option>
              </select>
            ) : (
              <select
                value={filter.district}
                onChange={(e) => onFilterChange({ ...filter, district: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 outline-none"
              >
                <option value="all">📍 ทุกอำเภอ ({currentProvinceObj?.name_th || 'จังหวัดนี้'})</option>
                {availableDistricts && availableDistricts.length > 0 ? (
                  availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d.startsWith('อ.') ? d : `อ.${d}`}
                    </option>
                  ))
                ) : activeProvince === 'prachinburi' ? (
                  PRACHINBURI_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name_th}>
                      {d.name_th}
                    </option>
                  ))
                ) : null}
              </select>
            )}
          </div>

          {/* Quick Region Switcher Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-0.5 whitespace-nowrap">ทางลัดภูมิภาค:</span>
            <button
              onClick={() => handleProvinceChange('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🇹🇭 ทั่วประเทศ
            </button>
            <button
              onClick={() => handleProvinceChange('prachinburi')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'prachinburi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 ปราจีนบุรี
            </button>
            <button
              onClick={() => handleProvinceChange('bangkok')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'bangkok'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 กทม.
            </button>
            <button
              onClick={() => handleProvinceChange('ayutthaya')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'ayutthaya'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 อยุธยา
            </button>
            <button
              onClick={() => handleProvinceChange('nakhonsawan')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'nakhonsawan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 นครสวรรค์
            </button>
            <button
              onClick={() => handleProvinceChange('chiangmai')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'chiangmai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 เชียงใหม่
            </button>
            <button
              onClick={() => handleProvinceChange('ubonratchathani')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeProvince === 'ubonratchathani'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              📍 อุบลราชธานี
            </button>
          </div>

          {/* Severity Filter Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400 mr-0.5 whitespace-nowrap">เกณฑ์ระดับน้ำ:</span>
              {severityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ ...filter, severity: opt.value })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    filter.severity === opt.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 w-full sm:w-auto text-right">
              {thaiWaterStatus === 'LIVE'
                ? 'ข้อมูลสด สสน.'
                : thaiWaterStatus === 'STALE'
                ? 'ข้อมูลล่าช้า สสน. (แสดงค่าล่าสุด)'
                : 'ข้อมูลอ้างอิง สสน.'}{' '}
              • {lastUpdated ? `อัปเดต ${new Date(lastUpdated).toLocaleTimeString('th-TH')} น.` : 'ไม่พบเวลาตรวจวัด'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
