'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  Clock,
  Compass,
  AlertTriangle,
  RefreshCw,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DistrictWeatherData } from '@/types/weather';
import { fetchDistrictWeather } from '@/lib/weather-service';
import { PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

interface WeatherForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistrict?: string;
  initialProvince?: string;
}

export const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({
  isOpen,
  onClose,
  initialDistrict = 'กรุงเทพมหานคร (เมืองหลวง)',
  initialProvince = 'bangkok',
}) => {
  const getInitialTarget = React.useCallback(() => {
    if (initialProvince && initialProvince !== 'prachinburi') {
      return initialProvince === 'all' ? 'all' : `prov:${initialProvince}`;
    }
    return initialDistrict;
  }, [initialProvince, initialDistrict]);

  const [selectedTarget, setSelectedTarget] = useState<string>(getInitialTarget);
  const [weatherData, setWeatherData] = useState<DistrictWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  // Synchronize when opening or when initial props change
  useEffect(() => {
    if (isOpen) {
      const target = getInitialTarget();
      setSelectedTarget(target);
      loadWeather(target);
    }
  }, [isOpen, getInitialTarget]);

  const loadWeather = async (target: string) => {
    setLoading(true);
    try {
      if (target === 'all') {
        const data = await fetchDistrictWeather(undefined, 'all');
        setWeatherData(data);
      } else if (target.startsWith('prov:')) {
        const provId = target.replace('prov:', '');
        const data = await fetchDistrictWeather(undefined, provId);
        setWeatherData(data);
      } else if (target === 'prachinburi' || target === 'ปราจีนบุรี (ภาพรวมทั้งจังหวัด)') {
        const data = await fetchDistrictWeather(undefined, 'prachinburi');
        setWeatherData(data);
      } else {
        const data = await fetchDistrictWeather(target, 'prachinburi');
        setWeatherData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 font-sans">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between border-b border-blue-600/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <CloudRain className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight">พยากรณ์อากาศและฝนฟ้าคะนอง</h2>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">ECMWF / Open-Meteo</span>
              </div>
              <p className="text-xs text-sky-100 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sky-300" />
                <span>{weatherData?.districtName || 'ทั่วประเทศ'} • อัปเดตรายชั่วโมง</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadWeather(selectedTarget)}
              disabled={loading}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="รีเฟรชข้อมูลสภาพอากาศ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* District & Province Selector Filter */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1">
            📍 เลือกพื้นที่:
          </span>
          <select
            value={selectedTarget}
            onChange={(e) => {
              setSelectedTarget(e.target.value);
              loadWeather(e.target.value);
            }}
            className="flex-1 max-w-xs px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">🇹🇭 ภาพรวมประเทศไทย (Open-Meteo)</option>
            <optgroup label="📍 อำเภอในปราจีนบุรี">
              <option value="ปราจีนบุรี (ภาพรวมทั้งจังหวัด)">จ.ปราจีนบุรี (ภาพรวมทั้งจังหวัด)</option>
              {PRACHINBURI_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name_th}>
                  {d.name_th}
                </option>
              ))}
            </optgroup>
            <optgroup label="📍 จังหวัดอื่นๆ ทั่วประเทศ">
              {THAILAND_PROVINCES.filter((p) => p.id !== 'prachinburi').map((p) => (
                <option key={p.id} value={`prov:${p.id}`}>
                  จ.{p.name_th} ({p.region_th})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading && !weatherData ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">กำลังเชื่อมต่อข้อมูลดาวเทียมและเรดาร์พยากรณ์อากาศ...</p>
            </div>
          ) : weatherData ? (
            <>
              {/* Hero Current Weather Card */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  {/* Left: Temp and Icon */}
                  <div className="flex items-center gap-4">
                    <span className="text-5xl sm:text-6xl drop-shadow-md select-none">
                      {weatherData.current.weatherIcon}
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black tracking-tight">
                          {weatherData.current.temperature}°
                        </span>
                        <span className="text-lg font-medium text-sky-200">C</span>
                      </div>
                      <div className="font-bold text-sm sm:text-base text-white mt-0.5">
                        {weatherData.current.weatherDescription}
                      </div>
                      <div className="text-xs text-sky-200 mt-0.5">
                        รู้สึกเหมือน {weatherData.current.apparentTemperature}°C • {weatherData.districtName}
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Weather Metrics Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:gap-1.5 bg-black/20 backdrop-blur-md rounded-2xl p-2.5 sm:px-3.5 border border-white/10 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-200 block sm:inline">ความชื้น: </span>
                        <span className="font-bold">{weatherData.current.humidity}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-200 block sm:inline">แรงลม: </span>
                        <span className="font-bold">{weatherData.current.windSpeedKmH} กม./ชม.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-200 block sm:inline">ทิศลม: </span>
                        <span className="font-bold truncate max-w-[80px]">{weatherData.current.windDirectionText.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flood / Rain Advisory Banner if high rain */}
                {weatherData.daily[0]?.precipitationProbMax >= 70 && (
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs font-semibold text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 animate-bounce" />
                    <span>
                      วันนี้มีโอกาสฝนตกสูงสุดถึง {weatherData.daily[0].precipitationProbMax}% (คาดการณ์ {weatherData.daily[0].precipitationSumMm} มม.) เฝ้าระวังพื้นที่ลุ่มต่ำริมตลิ่ง
                    </span>
                  </div>
                )}
              </div>

              {/* Forecast Tabs (Hourly vs 7-Day) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('hourly')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'hourly'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>รายชั่วโมง (24 ชม.)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('daily')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'daily'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>พยากรณ์ล่วงหน้า 7 วัน</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  แบบจำลอง ECMWF/DWD
                </span>
              </div>

              {/* Tab 1: 24-Hour Hourly Scrollable Cards */}
              {activeTab === 'hourly' && (
                <div className="space-y-2">
                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar select-none">
                    {weatherData.hourly.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-shrink-0 w-20 p-2.5 rounded-2xl flex flex-col items-center justify-between gap-1.5 text-center border transition-all ${
                          i === 0
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-600">
                          {i === 0 ? 'ตอนนี้' : h.displayTime}
                        </span>
                        <span className="text-2xl my-0.5">{h.weatherIcon}</span>
                        <span className="font-extrabold text-sm text-slate-900">{h.temperature}°</span>

                        {/* Rain prob pill */}
                        <div
                          className={`w-full py-0.5 px-1 rounded-full text-[10px] font-bold mt-1 ${
                            h.precipitationProb >= 70
                              ? 'bg-blue-600 text-white'
                              : h.precipitationProb >= 40
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          💧 {h.precipitationProb}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    💡 เปอร์เซ็นต์ (%) ด้านล่างระบุโอกาสที่ฝนจะตกในชั่วโมงนั้นๆ
                  </p>
                </div>
              )}

              {/* Tab 2: 7-Day Daily Forecast List */}
              {activeTab === 'daily' && (
                <div className="space-y-2">
                  {weatherData.daily.map((d, i) => (
                    <div
                      key={d.date}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        d.riskLevel === 'severe'
                          ? 'bg-rose-50/70 border-rose-300'
                          : d.riskLevel === 'high'
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Day and Date */}
                      <div className="w-24 flex-shrink-0">
                        <div className="font-bold text-slate-900 text-sm">{d.dayName}</div>
                        <div className="text-[11px] text-slate-500">{d.displayDate}</div>
                      </div>

                      {/* Icon and Description */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{d.weatherIcon}</span>
                        <span className="font-medium text-slate-700 truncate">{d.weatherDescription}</span>
                      </div>

                      {/* Rain Probability & Sum */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                          className={`px-2 py-1 rounded-xl text-center font-bold text-xs ${
                            d.precipitationProbMax >= 70
                              ? 'bg-blue-600 text-white'
                              : d.precipitationProbMax >= 40
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <div>💧 {d.precipitationProbMax}%</div>
                          {d.precipitationSumMm > 0 && (
                            <div className="text-[10px] font-normal opacity-90">{d.precipitationSumMm} มม.</div>
                          )}
                        </div>

                        {/* Temperature Bar */}
                        <div className="w-16 text-right font-mono text-xs">
                          <span className="font-bold text-slate-900">{d.tempMax}°</span>
                          <span className="text-slate-400 mx-0.5">/</span>
                          <span className="text-slate-500">{d.tempMin}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>แหล่งข้อมูลพยากรณ์: Open-Meteo & TMD กรมอุตุนิยมวิทยา</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
