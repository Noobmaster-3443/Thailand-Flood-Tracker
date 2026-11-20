'use client';

import React, { useState } from 'react';
import { Search, X, Check, Filter, RefreshCw, Radio, SlidersHorizontal, ChevronDown, Globe, Waves, AlertTriangle } from 'lucide-react';
import { DashboardFilterState, SeverityLevel } from '@/types/telemetry';
import { DataStatus } from '@/lib/providers/types';
import { PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

export interface RoadFloodMetricInfo {
  floodedCount: number;
  totalSensors: number;
  onClick: () => void;
}

export interface MaxRainMetricInfo {
  amountMm: number;
  stationName: string;
  district: string;
  onClick: () => void;
}

export interface ChaoPhrayaMetricInfo {
  stationName: string;
  waterLevelMsl?: number;
  bankLevelMsl?: number;
  severity: string;
  onClick: () => void;
}

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
  variant?: 'floating' | 'docked';
  tideAlert?: {
    morningPeak: number;
    time?: string;
    onClick: () => void;
  };
  flashFloodAlert?: {
    district: string;
    onClick: () => void;
  };
  roadFloodMetric?: RoadFloodMetricInfo;
  maxRainMetric?: MaxRainMetricInfo;
  chaoPhrayaMetric?: ChaoPhrayaMetricInfo;
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
  variant = 'floating',
  tideAlert,
  flashFloodAlert,
  roadFloodMetric,
  maxRainMetric,
  chaoPhrayaMetric,
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

  const isDocked = variant === 'docked';

  const containerClasses = isDocked
    ? 'w-full transition-all font-sans'
    : 'bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/90 p-1.5 sm:p-2 w-full max-w-[calc(100vw-2rem)] mx-auto transition-all font-sans';

  return (
    <div className={containerClasses}>
      {/* Sleek Toolbar Row */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        {/* Left Control Group: Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Province Selector */}
          <div className="flex-shrink-0">
            <select
              value={activeProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-xs font-bold border outline-none cursor-pointer transition-all ${
                activeProvince === 'bangkok'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs hover:bg-blue-700'
                  : activeProvince === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs hover:bg-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
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
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 outline-none cursor-pointer transition-colors max-w-[150px] xl:max-w-[180px] truncate"
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
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 outline-none cursor-pointer transition-colors max-w-[150px] xl:max-w-[180px] truncate"
              >
                <option value="all">ทุกอำเภอ ({currentProvinceObj?.name_th || 'จังหวัดนี้'})</option>
                {availableDistricts && availableDistricts.length > 0 ? (
                  availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d.startsWith('อ.') || d.startsWith('เขต') ? d : `อ.${d}`}
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
          <div className="relative flex-shrink-0 w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeProvince === 'all'
                  ? 'ค้นหาสถานี, เขื่อน...'
                  : `ค้นหาสถานี, คลอง...`
              }
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder-slate-400 border border-slate-200/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all font-normal"
            />
            {filter.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition-colors max-w-[125px] xl:max-w-[140px] truncate ${
                filter.severity !== 'all'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
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
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isExpanded || (filter.severity !== 'all' && !isExpanded)
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="ตัวกรองและทางลัดเพิ่มเติม"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-xs">ตัวกรอง</span>
            {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-white" />}
          </button>
        </div>

        {/* Middle Control Group: Interactive Live Telemetry Metric Badges (Fills the empty space) */}
        {isDocked && (
          <div className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0 px-2 overflow-x-auto no-scrollbar">
            {/* Subtle separator */}
            <div className="h-4 w-px bg-slate-200/80 mx-0.5 flex-shrink-0" />

            {/* Metric 1: Road Flood Status */}
            {roadFloodMetric && (
              <button
                type="button"
                onClick={roadFloodMetric.onClick}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0 ${
                  roadFloodMetric.floodedCount > 0
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 animate-pulse'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                }`}
                title="จุดตรวจวัดน้ำท่วมขังถนนและอุโมงค์ทางลอด กทม. (คลิกเพื่อดูหมุด)"
              >
                <span className="text-xs">🚗</span>
                <span>
                  ถนนท่วม{' '}
                  <strong className="font-bold">
                    {roadFloodMetric.floodedCount > 0 ? `${roadFloodMetric.floodedCount} จุด` : '0 จุด (ปกติ)'}
                  </strong>
                </span>
              </button>
            )}

            {/* Metric 2: Max Rain 24h */}
            {maxRainMetric && maxRainMetric.amountMm > 0 && (
              <button
                type="button"
                onClick={maxRainMetric.onClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100/80 transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0"
                title={`ฝน 24 ชม. สูงสุดที่ ${maxRainMetric.stationName} (${maxRainMetric.district}) คลิกเพื่อดูสถานี`}
              >
                <span className="text-xs">🌧️</span>
                <span>
                  ฝนสูงสุด <strong className="font-bold text-sky-900">{maxRainMetric.amountMm} มม.</strong>
                  <span className="text-[10px] text-sky-600 font-normal ml-0.5 hidden xl:inline">({maxRainMetric.district})</span>
                </span>
              </button>
            )}

            {/* Metric 3: Chao Phraya River Level */}
            {chaoPhrayaMetric && (
              <button
                type="button"
                onClick={chaoPhrayaMetric.onClick}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0 ${
                  chaoPhrayaMetric.severity === 'red'
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 animate-pulse'
                    : chaoPhrayaMetric.severity === 'orange'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
                title={`ระดับน้ำแม่น้ำเจ้าพระยา ${chaoPhrayaMetric.stationName} (คลิกเพื่อดูสถานี)`}
              >
                <span className="text-xs">🌊</span>
                <span>
                  เจ้าพระยา{' '}
                  <strong className="font-bold">
                    {chaoPhrayaMetric.waterLevelMsl ? `+${chaoPhrayaMetric.waterLevelMsl} ม.` : 'ปกติ'}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-normal ml-0.5 hidden 2xl:inline">({chaoPhrayaMetric.stationName})</span>
                </span>
              </button>
            )}

            {/* Metric 4: High Tide Peak */}
            {tideAlert && (
              <button
                type="button"
                onClick={tideAlert.onClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0"
                title="คาดการณ์น้ำทะเลหนุนสูงเจ้าพระยา ป้อมพระจุลฯ (คลิกเพื่อดูรายละเอียด)"
              >
                <span className="text-xs">⚓</span>
                <span>
                  หนุนสูง <strong className="font-bold text-indigo-900">+{tideAlert.morningPeak} ม.</strong>
                  {tideAlert.time && (
                    <span className="text-[10px] text-indigo-600 font-normal ml-0.5 hidden xl:inline">({tideAlert.time} น.)</span>
                  )}
                </span>
              </button>
            )}

            {/* Metric 5: Flash Flood Alert */}
            {flashFloodAlert && (
              <button
                type="button"
                onClick={flashFloodAlert.onClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer whitespace-nowrap animate-pulse active:scale-95 flex-shrink-0"
                title={`เตือนน้ำป่า (${flashFloodAlert.district})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>เตือนน้ำป่า ({flashFloodAlert.district})</span>
              </button>
            )}
          </div>
        )}

        {/* Right Control Group: Total Counter & Live Auto-Refresh */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Total Stations Counter */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>แสดง <strong className="font-bold text-slate-800">{totalStations}</strong> จุดตรวจ</span>
          </div>

          {/* Unified Live Sync & Refresh Pill */}
          <div className="flex items-center rounded-xl bg-white p-0.5 border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAutoRefresh
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isAutoRefresh ? 'อัปเดตอัตโนมัติทุก 60 วินาที (คลิกเพื่อปิด)' : 'ปิดอัปเดตอัตโนมัติ (คลิกเพื่อเปิด)'}
            >
              <Radio className={`w-3.5 h-3.5 ${isAutoRefresh ? 'text-white animate-pulse' : 'text-slate-400'}`} />
              <span className="text-[11px] leading-none whitespace-nowrap">
                {isAutoRefresh ? 'Auto 60s' : 'Manual'}
              </span>
            </button>

            <button
              type="button"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer ml-0.5"
              title="กดเพื่อดึงข้อมูลสดทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Detailed Filter Row */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1">
          {/* Header row in expanded view with Clear Filters */}
          <div className="flex items-center justify-between text-xs px-0.5 pb-0.5">
            <span className="text-[11px] font-bold text-slate-400">ตัวกรองละเอียด & ทางลัด</span>
            {isFiltered && (
              <button
                type="button"
                onClick={() => onFilterChange({
                  ...filter,
                  district: 'all',
                  severity: 'all',
                  searchQuery: '',
                })}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

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
                      {d.startsWith('อ.') || d.startsWith('เขต') ? d : `อ.${d}`}
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
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

            <div className="text-[11px] text-slate-500 font-medium w-full sm:w-auto text-right">
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
