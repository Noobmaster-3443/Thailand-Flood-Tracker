'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  RefreshCw, 
  AlertTriangle, 
  Waves, 
  Car, 
  Clock, 
  Compass,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { TelemetryStation, HighwayDisasterAlert, SeverityLevel } from '@/types/telemetry';
import { getAutomatedTelemetryData } from '@/lib/telemetry-service';
import { DynamicTelemetryMap } from '@/components/Map/DynamicTelemetryMap';
import { TelemetryDetailDrawer } from '@/components/ReportDrawer/TelemetryDetailDrawer';
import { EmergencyDrawer } from '@/components/Emergency/EmergencyDrawer';

export default function AreaPage() {
  const [stations, setStations] = useState<TelemetryStation[]>([]);
  const [highwayAlerts, setHighwayAlerts] = useState<HighwayDisasterAlert[]>([]);
  const [gistdaGeoJson, setGistdaGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [locating, setLocating] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<TelemetryStation | null>(null);
  const [selectedHighwayAlert, setSelectedHighwayAlert] = useState<HighwayDisasterAlert | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch telemetry
  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const data = await getAutomatedTelemetryData();
      setStations(data.stations);
      setHighwayAlerts(data.highwayAlerts);
      setGistdaGeoJson(data.gistdaGeoJson);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Selected district info
  const selectedDistrict = useMemo(() => {
    if (selectedDistrictId === 'all') return null;
    return PRACHINBURI_DISTRICTS.find((d) => d.id === selectedDistrictId) || null;
  }, [selectedDistrictId]);

  // Prachinburi-scoped stations & highway alerts (H-2: prevent nationwide leak on /area)
  const prachinburiStations = useMemo(() => {
    return stations.filter((s) => s.province === 'prachinburi');
  }, [stations]);

  const prachinburiHighwayAlerts = useMemo(() => {
    return highwayAlerts.filter((h) => h.province === 'prachinburi');
  }, [highwayAlerts]);

  // District stations & highway alerts
  const districtStations = useMemo(() => {
    if (!selectedDistrict) return prachinburiStations;
    return prachinburiStations.filter((s) => s.district === selectedDistrict.name_th);
  }, [prachinburiStations, selectedDistrict]);

  const districtHighwayAlerts = useMemo(() => {
    if (!selectedDistrict) return prachinburiHighwayAlerts;
    return prachinburiHighwayAlerts.filter((h) => h.district === selectedDistrict.name_th);
  }, [prachinburiHighwayAlerts, selectedDistrict]);

  // Severity stats
  const stats = useMemo(() => {
    const total = districtStations.length;
    const red = districtStations.filter((s) => s.severity === 'red').length;
    const orange = districtStations.filter((s) => s.severity === 'orange').length;
    const yellow = districtStations.filter((s) => s.severity === 'yellow').length;
    const green = districtStations.filter((s) => s.severity === 'green').length;
    const impassable = districtHighwayAlerts.filter((h) => !h.passable).length;

    let overallSeverity: SeverityLevel = 'green';
    if (red > 0) overallSeverity = 'red';
    else if (orange > 0) overallSeverity = 'orange';
    else if (yellow > 0) overallSeverity = 'yellow';

    return { total, red, orange, yellow, green, impassable, overallSeverity };
  }, [districtStations, districtHighwayAlerts]);

  // GPS Locate Nearest District
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let closestDistrict = PRACHINBURI_DISTRICTS[0];
        let minDist = Infinity;

        PRACHINBURI_DISTRICTS.forEach((d) => {
          const dist = Math.hypot(d.lat - latitude, d.lng - longitude);
          if (dist < minDist) {
            minDist = dist;
            closestDistrict = d;
          }
        });

        setSelectedDistrictId(closestDistrict.id);
        setLocating(false);
        setToastMessage(`พบตำแหน่ง: ใกล้เคียง ${closestDistrict.name_th}`);
        setTimeout(() => setToastMessage(null), 3000);
      },
      (err) => {
        setLocating(false);
        alert('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS');
      },
      { timeout: 8000 }
    );
  };

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'red':
        return { label: 'ระดับน้ำวิกฤต (ล้นตลิ่ง)', bg: 'bg-red-500 text-white', border: 'border-red-600' };
      case 'orange':
        return { label: 'ระดับน้ำเตือนภัย (จ่อล้นตลิ่ง)', bg: 'bg-orange-500 text-white', border: 'border-orange-600' };
      case 'yellow':
        return { label: 'เฝ้าระวังระดับน้ำท่า', bg: 'bg-amber-400 text-slate-900', border: 'border-amber-500' };
      default:
        return { label: 'ระดับน้ำปกติ', bg: 'bg-emerald-500 text-white', border: 'border-emerald-600' };
    }
  };

  const badge = getSeverityBadge(stats.overallSeverity);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Waves className="w-5 h-5 text-blue-600" />
              <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                สถานการณ์น้ำรายอำเภอ (Open Data)
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsEmergencyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-bold border border-red-200 transition-all shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-red-500 animate-bounce" />
            <span>สายด่วน 1784</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-4">
        {/* District Selector & GPS Button */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-600">
              เลือกอำเภอเพื่อตรวจสอบสถานีโทรมาตรน้ำท่า สสน. และจุดเตือนน้ำท่วมทางหลวง
            </p>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Official Data
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition-all outline-none appearance-none"
              >
                <option value="all">📍 ทุกอำเภอ (7 อำเภอในปราจีนบุรี)</option>
                {PRACHINBURI_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_th} ({d.subdistricts.length} ตำบล)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ▼
              </div>
            </div>

            <button
              onClick={handleLocateMe}
              disabled={locating}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex-shrink-0"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{locating ? 'กำลังค้นหา...' : 'ใกล้ฉัน'}</span>
            </button>
          </div>
        </section>

        {/* Status Card */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-slate-500">ภาพรวมลุ่มน้ำ</span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {selectedDistrict ? selectedDistrict.name_th : 'ทั้งจังหวัดปราจีนบุรี'}
              </h2>
            </div>

            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Severity Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${badge.bg} ${badge.border}`}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold leading-tight">{badge.label}</div>
                <div className="text-xs opacity-90">
                  ครอบคลุม {stats.total} สถานีโทรมาตรหลักในพื้นที่
                </div>
              </div>
            </div>
            {stats.impassable > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-sm">
                ⛔ ทางหลวงท่วมขัง {stats.impassable} จุด
              </span>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="bg-red-50/70 border border-red-100 p-2.5 rounded-xl text-center">
              <span className="text-xs font-semibold text-red-600 block">🔴 ล้นตลิ่ง</span>
              <span className="text-lg font-bold text-red-700">{stats.red}</span>
            </div>
            <div className="bg-orange-50/70 border border-orange-100 p-2.5 rounded-xl text-center">
              <span className="text-xs font-semibold text-orange-600 block">🟠 จ่อล้น</span>
              <span className="text-lg font-bold text-orange-700">{stats.orange}</span>
            </div>
            <div className="bg-yellow-50/70 border border-yellow-100 p-2.5 rounded-xl text-center">
              <span className="text-xs font-semibold text-yellow-700 block">🟡 เฝ้าระวัง</span>
              <span className="text-lg font-bold text-yellow-800">{stats.yellow}</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl text-center">
              <span className="text-xs font-semibold text-emerald-600 block">🟢 ปกติ</span>
              <span className="text-lg font-bold text-emerald-700">{stats.green}</span>
            </div>
          </div>
        </section>

        {/* Map Preview for Selected District */}
        <section className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              แผนที่สถานีโทรมาตร & จุดเตือนทางหลวง ({districtStations.length} สถานี)
            </span>
            <span className="text-[11px] text-slate-500">แตะที่สถานีเพื่ออ่านข้อมูลแบบละเอียด</span>
          </div>

          <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-200 relative">
            <DynamicTelemetryMap
              stations={districtStations}
              highwayAlerts={districtHighwayAlerts}
              gistdaGeoJson={gistdaGeoJson}
              selectedStation={selectedStation}
              selectedHighwayAlert={selectedHighwayAlert}
              onSelectStation={setSelectedStation}
              onSelectHighwayAlert={setSelectedHighwayAlert}
              selectedDistrict={selectedDistrict ? selectedDistrict.name_th : 'all'}
              selectedProvince="prachinburi"
            />
          </div>
        </section>

        {/* Station List in Selected District */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              รายการสถานีโทรมาตรและจุดเตือนทางหลวงในพื้นที่ ({districtStations.length + districtHighwayAlerts.length})
            </h3>
            <span className="text-xs text-blue-700 font-semibold">ThaiWater / DOH</span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Highway alerts first */}
            {districtHighwayAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedHighwayAlert(alert)}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {alert.route_number}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {alert.road_name}
                    </h4>
                  </div>
                  <div className="text-xs text-slate-500">
                    อ.{alert.district} • {alert.km_range} • ระดับน้ำท่วมผิวทาง <b>{alert.water_height_cm} ซม.</b>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  !alert.passable ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {!alert.passable ? 'รถเล็กผ่านไม่ได้' : 'ระวังน้ำท่วมทาง'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            ))}

            {/* Stations */}
            {districtStations.map((sta) => (
              <div
                key={sta.id}
                onClick={() => setSelectedStation(sta)}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                      {sta.station_code}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {sta.name_th}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500">
                    ต.{sta.subdistrict} อ.{sta.district} • {sta.river_name || sta.basin_name}
                    {sta.water_level_m_msl && ` • ระดับน้ำ ${sta.water_level_m_msl} ม.รทก.`}
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  sta.severity === 'red' ? 'bg-red-100 text-red-700' :
                  sta.severity === 'orange' ? 'bg-orange-100 text-orange-700' :
                  sta.severity === 'yellow' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {sta.severity_label}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Subdistrict Tag Cloud */}
        {selectedDistrict && (
          <section className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-600 block">
              รายชื่อตำบลใน {selectedDistrict.name_th} ({selectedDistrict.subdistricts.length} ตำบล):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedDistrict.subdistricts.map((sub) => (
                <span
                  key={sub}
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-medium border border-slate-200/80 shadow-2xs"
                >
                  ต.{sub}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer footer */}
        <p className="text-[11px] leading-relaxed text-slate-400 text-center px-4 py-2">
          * ข้อมูลโทรมาตรและสภาพเส้นทางเชื่อมต่อโดยตรงจาก Open Data ของ สสน. (ThaiWater), กรมชลประทาน, GISTDA และกรมทางหลวง เพื่อการบริหารจัดการน้ำและการเตือนภัยล่วงหน้า
        </p>
      </main>

      {/* Drawers */}
      <EmergencyDrawer
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <TelemetryDetailDrawer
        station={selectedStation}
        highwayAlert={selectedHighwayAlert}
        onClose={() => {
          setSelectedStation(null);
          setSelectedHighwayAlert(null);
        }}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />
    </div>
  );
}
