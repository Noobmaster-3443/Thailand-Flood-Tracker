'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TelemetryNavbar } from '@/components/Navbar/TelemetryNavbar';
import { DynamicTelemetryMap } from '@/components/Map/DynamicTelemetryMap';
import { TelemetryFilterBar } from '@/components/Filters/TelemetryFilterBar';
import { TelemetryStationFeedList } from '@/components/Feed/TelemetryStationFeedList';
import { TelemetryDetailDrawer } from '@/components/ReportDrawer/TelemetryDetailDrawer';
import { EmergencyDrawer } from '@/components/Emergency/EmergencyDrawer';
import { WeatherForecastModal } from '@/components/Weather/WeatherForecastModal';
import { BmaRadarModal } from '@/components/Radar/BmaRadarModal';
import { 
  TelemetryStation, 
  HighwayDisasterAlert, 
  DashboardFilterState,
  DamReservoirInfo,
  HighTideAlert,
  FlashFloodAlert,
  EvacuationShelter,
  SHOW_STATIC_FLASH_FLOOD_ALERTS,
  SHOW_STATIC_TIDE_ALERT,
} from '@/types/telemetry';
import { ProvinceStatusReport, NationwideCoverageSummary } from '@/lib/providers/types';
import { getAutomatedTelemetryData } from '@/lib/telemetry-service';
import { MetricBanner } from '@/components/Dashboard/MetricBanner';
import { ProvinceStatusCard } from '@/components/Dashboard/ProvinceStatusCard';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';
import { PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [stations, setStations] = useState<TelemetryStation[]>([]);
  const [highwayAlerts, setHighwayAlerts] = useState<HighwayDisasterAlert[]>([]);
  const [gistdaGeoJson, setGistdaGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [dams, setDams] = useState<DamReservoirInfo[]>([]);
  const [highTide, setHighTide] = useState<HighTideAlert | null>(null);
  const [flashFloodAlerts, setFlashFloodAlerts] = useState<FlashFloodAlert[]>([]);
  const [shelters, setShelters] = useState<EvacuationShelter[]>([]);
  const [provinceStatuses, setProvinceStatuses] = useState<ProvinceStatusReport[]>([]);
  const [coverage, setCoverage] = useState<NationwideCoverageSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);

  const [currentView, setCurrentView] = useState<'map' | 'list'>('map');

  // Selected hazard detail drawers
  const [selectedStation, setSelectedStation] = useState<TelemetryStation | null>(null);
  const [selectedHighwayAlert, setSelectedHighwayAlert] = useState<HighwayDisasterAlert | null>(null);
  const [selectedDam, setSelectedDam] = useState<DamReservoirInfo | null>(null);
  const [selectedFlashFlood, setSelectedFlashFlood] = useState<FlashFloodAlert | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<EvacuationShelter | null>(null);
  const [selectedHighTide, setSelectedHighTide] = useState<HighTideAlert | null>(null);

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isBmaRadarModalOpen, setIsBmaRadarModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clearAllSelections = useCallback(() => {
    setSelectedStation(null);
    setSelectedHighwayAlert(null);
    setSelectedDam(null);
    setSelectedFlashFlood(null);
    setSelectedShelter(null);
    setSelectedHighTide(null);
  }, []);

  // Filter state - Defaults to Bangkok ('bangkok') as the primary capital focus
  const [filter, setFilter] = useState<DashboardFilterState>({
    province: 'bangkok',
    district: 'all',
    stationType: 'all',
    severity: 'all',
    searchQuery: '',
  });

  // Calculate available districts for the selected province
  const availableDistricts = useMemo(() => {
    if (filter.province && filter.province !== 'all') {
      const provStations = stations.filter(
        (s) => s.province === filter.province
      );
      const districtSet = new Set<string>();
      provStations.forEach((s) => {
        if (s.district) districtSet.add(s.district);
      });
      if (filter.province === 'prachinburi') {
        PRACHINBURI_DISTRICTS.forEach((d) => districtSet.add(d.name_th));
      }
      return Array.from(districtSet).sort();
    }
    return [];
  }, [stations, filter.province]);

  // Fetch telemetry & multi-hazard data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await getAutomatedTelemetryData();
      setStations(data.stations);
      setHighwayAlerts(data.highwayAlerts);
      setGistdaGeoJson(data.gistdaGeoJson);
      setDams(data.dams);
      setHighTide(data.highTide);
      setFlashFloodAlerts(data.flashFloodAlerts);
      setShelters(data.shelters);
      if (data.provinceStatuses) setProvinceStatuses(data.provinceStatuses);
      if (data.coverage) setCoverage(data.coverage);
      setLastUpdated(data.lastUpdated);

      if (isManual) {
        setToastMessage('อัปเดตข้อมูลโทรมาตร 77 จังหวัด, เขื่อน, และศูนย์พักพิงเรียบร้อย');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to load automated telemetry data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (every 60 seconds)
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchData]);

  // Global Detail Drawer Openers
  useEffect(() => {
    (window as any).__openTelemetryStationById = (stationId: string) => {
      const st = stations.find((s) => s.id === stationId);
      if (st) {
        clearAllSelections();
        setSelectedStation(st);
      }
    };

    (window as any).__openTelemetryHighwayById = (highwayId: string) => {
      const hw = highwayAlerts.find((h) => h.id === highwayId);
      if (hw) {
        clearAllSelections();
        setSelectedHighwayAlert(hw);
      }
    };

    (window as any).__openTelemetryDamById = (damId: string) => {
      const d = dams.find((item) => item.id === damId);
      if (d) {
        clearAllSelections();
        setSelectedDam(d);
      }
    };

    (window as any).__openTelemetryFlashById = (flashId: string) => {
      const f = flashFloodAlerts.find((item) => item.id === flashId);
      if (f) {
        clearAllSelections();
        setSelectedFlashFlood(f);
      }
    };

    (window as any).__openTelemetryShelterById = (shelterId: string) => {
      const s = shelters.find((item) => item.id === shelterId);
      if (s) {
        clearAllSelections();
        setSelectedShelter(s);
      }
    };

    const handleCustomDrawerOpen = (e: any) => {
      const detail = e.detail;
      clearAllSelections();
      if (detail?.type === 'station') {
        const st = detail.station || stations.find((s) => s.id === detail.id || s.id === detail.stationId);
        if (st) setSelectedStation(st);
      } else if (detail?.type === 'highway') {
        const hw = detail.highway || highwayAlerts.find((h) => h.id === detail.id || h.id === detail.highwayId);
        if (hw) setSelectedHighwayAlert(hw);
      } else if (detail?.type === 'dam') {
        const d = detail.dam || dams.find((item) => item.id === detail.id);
        if (d) setSelectedDam(d);
      } else if (detail?.type === 'flashFlood') {
        const f = detail.flashFlood || flashFloodAlerts.find((item) => item.id === detail.id);
        if (f) setSelectedFlashFlood(f);
      } else if (detail?.type === 'shelter') {
        const s = detail.shelter || shelters.find((item) => item.id === detail.id);
        if (s) setSelectedShelter(s);
      } else if (detail?.type === 'highTide') {
        if (highTide) setSelectedHighTide(highTide);
      }
    };

    window.addEventListener('open-telemetry-drawer', handleCustomDrawerOpen as any);
    return () => {
      window.removeEventListener('open-telemetry-drawer', handleCustomDrawerOpen as any);
    };
  }, [stations, highwayAlerts, dams, flashFloodAlerts, shelters, highTide, clearAllSelections]);

  // Filter logic
  const filteredStations = useMemo(() => {
    return stations.filter((sta) => {
      // Province filter
      if (filter.province && filter.province !== 'all') {
        const staProv = sta.province || 'prachinburi';
        if (staProv !== filter.province) return false;
      }

      // District or Regional filter
      if (filter.district !== 'all') {
        if (filter.province === 'all') {
          const staProv = sta.province || 'prachinburi';
          const provMeta = THAILAND_PROVINCES.find((p) => p.id === staProv);
          if (provMeta && provMeta.region !== filter.district) {
            return false;
          }
        } else {
          const normSta = sta.district.replace(/^อ\./, '').trim();
          const normFilter = filter.district.replace(/^อ\./, '').trim();
          if (normSta !== normFilter) return false;
        }
      }

      if (filter.severity !== 'all' && sta.severity !== filter.severity) return false;
      if (filter.searchQuery.trim() !== '') {
        const query = filter.searchQuery.toLowerCase();
        const matchName = sta.name_th.toLowerCase().includes(query);
        const matchCode = sta.station_code.toLowerCase().includes(query);
        const matchDistrict = sta.district.toLowerCase().includes(query);
        const matchSubdistrict = sta.subdistrict.toLowerCase().includes(query);
        const matchRiver = sta.river_name?.toLowerCase().includes(query) ?? false;
        const matchProv = (sta.province || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchDistrict && !matchSubdistrict && !matchRiver && !matchProv) {
          return false;
        }
      }
      return true;
    });
  }, [stations, filter]);

  const filteredDams = useMemo(() => {
    return dams.filter((dam) => {
      if (filter.province && filter.province !== 'all') {
        const damProv = dam.province;
        if (damProv && damProv !== filter.province) return false;
      }
      if (filter.severity !== 'all' && dam.severity !== filter.severity) return false;
      if (filter.searchQuery.trim() !== '') {
        const query = filter.searchQuery.toLowerCase();
        const matchName = dam.name_th.toLowerCase().includes(query);
        const matchEn = dam.name_en.toLowerCase().includes(query);
        const matchDist = dam.district.toLowerCase().includes(query);
        if (!matchName && !matchEn && !matchDist) return false;
      }
      return true;
    });
  }, [dams, filter]);

  const filteredHighwayAlerts = useMemo(() => {
    return highwayAlerts.filter((alert) => {
      if (filter.province && filter.province !== 'all') {
        const prov = alert.province;
        if (prov && prov !== filter.province) return false;
      }
      if (filter.district !== 'all' && alert.district !== filter.district) return false;
      if (filter.searchQuery.trim() !== '') {
        const query = filter.searchQuery.toLowerCase();
        const matchRoad = alert.road_name.toLowerCase().includes(query);
        const matchRoute = alert.route_number.toLowerCase().includes(query);
        const matchDist = alert.district.toLowerCase().includes(query);
        if (!matchRoad && !matchRoute && !matchDist) return false;
      }
      return true;
    });
  }, [highwayAlerts, filter]);

  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (filter.province && filter.province !== 'all') {
        const prov = s.province;
        if (prov && prov !== filter.province) return false;
      }
      if (filter.district !== 'all' && s.district !== filter.district) return false;
      return true;
    });
  }, [shelters, filter]);

  const filteredFlashFloodAlerts = useMemo(() => {
    return flashFloodAlerts.filter((f) => {
      if (filter.province && filter.province !== 'all') {
        const prov = f.province;
        if (prov && prov !== filter.province) return false;
      }
      return true;
    });
  }, [flashFloodAlerts, filter]);

  // Province status report for selected province
  const activeProvinceStatusReport = useMemo(() => {
    if (!filter.province || filter.province === 'all') return undefined;
    return provinceStatuses.find((p) => p.provinceId === filter.province);
  }, [provinceStatuses, filter.province]);

  const activeProvince = filter.province || 'bangkok';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <TelemetryNavbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenBmaRadarModal={() => setIsBmaRadarModalOpen(true)}
        stations={activeProvince === 'all' ? stations : filteredStations}
        highwayAlerts={activeProvince === 'all' ? highwayAlerts : filteredHighwayAlerts}
        isAutoRefresh={isAutoRefresh}
        selectedProvince={activeProvince}
      />

      {/* Main Content Area */}
      {currentView === 'map' ? (
        <>
          {/* Floating Filter Bar (Map View Only) */}
          <div className="fixed top-[62px] sm:top-[76px] left-0 right-0 z-20 px-2 sm:px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-2xl sm:max-w-4xl mx-auto space-y-1.5">
              <TelemetryFilterBar
                filter={filter}
                onFilterChange={setFilter}
                totalStations={filteredStations.length}
                isAutoRefresh={isAutoRefresh}
                onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
                onManualRefresh={() => fetchData(true)}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
                thaiWaterStatus={coverage?.providers?.thaiwater}
                availableDistricts={availableDistricts}
              />

              {/* Compact Floating Alert Badges (High Tide & Critical Flash Floods) */}
              {((SHOW_STATIC_TIDE_ALERT && highTide) || (SHOW_STATIC_FLASH_FLOOD_ALERTS && flashFloodAlerts.some((f) => f.severity === 'red'))) && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {SHOW_STATIC_TIDE_ALERT && highTide && (
                    <button
                      type="button"
                      onClick={() => {
                        clearAllSelections();
                        setSelectedHighTide(highTide);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-700/95 hover:bg-blue-800 text-white shadow-xs backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <span>🌊</span>
                      <span>
                        {activeProvince === 'bangkok' ? 'หนุนเจ้าพระยา กทม.' : 'น้ำทะเลหนุน'} (+{highTide.morning_peak_m_msl}ม.)
                      </span>
                      <span className="text-blue-200 text-xs ml-0.5">›</span>
                    </button>
                  )}
                  {SHOW_STATIC_FLASH_FLOOD_ALERTS && flashFloodAlerts
                    .filter((f) => f.severity === 'red' && (activeProvince === 'all' || f.province === activeProvince))
                    .slice(0, 1)
                    .map((flash) => (
                      <button
                        key={flash.id}
                        type="button"
                        onClick={() => {
                          clearAllSelections();
                          setSelectedFlashFlood(flash);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/95 hover:bg-red-700 text-white shadow-xs backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>เตือนน้ำป่า ({flash.district})</span>
                        <span className="text-red-200 text-xs ml-0.5">›</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <main className="flex-1 w-full h-full pt-14 sm:pt-16 relative">
            <div className="w-full h-full">
              <DynamicTelemetryMap
                stations={filteredStations}
                highwayAlerts={filteredHighwayAlerts}
                gistdaGeoJson={gistdaGeoJson}
                dams={filteredDams}
                flashFloodAlerts={filteredFlashFloodAlerts}
                shelters={filteredShelters}
                selectedStation={selectedStation}
                selectedHighwayAlert={selectedHighwayAlert}
                selectedDam={selectedDam}
                selectedFlashFlood={selectedFlashFlood}
                selectedShelter={selectedShelter}
                onSelectStation={(s) => {
                  clearAllSelections();
                  setSelectedStation(s);
                }}
                onSelectHighwayAlert={(h) => {
                  clearAllSelections();
                  setSelectedHighwayAlert(h);
                }}
                onSelectDam={(d) => {
                  clearAllSelections();
                  setSelectedDam(d);
                }}
                onSelectFlashFlood={(f) => {
                  clearAllSelections();
                  setSelectedFlashFlood(f);
                }}
                onSelectShelter={(s) => {
                  clearAllSelections();
                  setSelectedShelter(s);
                }}
                selectedDistrict={filter.district}
                selectedProvince={activeProvince}
                onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
              />
            </div>
          </main>
        </>
      ) : (
        /* List View: Clean Natural Scrolling */
        <main className="flex-1 w-full h-full pt-14 sm:pt-16 overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-3 font-sans">
            {/* Provincial Key Metrics */}
            <MetricBanner
              stations={filteredStations}
              highwayAlerts={filteredHighwayAlerts}
              highTide={highTide ?? undefined}
              flashFloodAlerts={filteredFlashFloodAlerts}
              dams={filteredDams}
              selectedProvince={activeProvince}
              onFilterSeverity={(sev) => setFilter({ ...filter, severity: sev as any })}
              onFilterRoad={() => {
                const el = document.getElementById('highway-flood-alerts');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              onOpenHighTide={() => {
                clearAllSelections();
                if (highTide) setSelectedHighTide(highTide);
              }}
              onOpenFlashFlood={(flash) => {
                clearAllSelections();
                setSelectedFlashFlood(flash);
              }}
              onOpenDam={(d) => {
                clearAllSelections();
                setSelectedDam(d);
              }}
            />

            {/* Official Disclaimer & Emergency Call Notice */}
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-2 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
              <span className="leading-relaxed">
                ⚠️ ข้อมูลนี้ใช้เพื่อติดตามสถานการณ์เบื้องต้นเท่านั้น โปรดยึดประกาศทางการเป็นหลัก กรณีฉุกเฉินโทร{' '}
                <a
                  href="tel:1784"
                  className="font-bold underline text-red-600 hover:text-red-700 whitespace-nowrap inline-flex items-center gap-0.5"
                >
                  1784 (ปภ. โทรฟรี 24 ชม.)
                </a>
              </span>
            </div>

            {/* Province Status & Evidence / Nationwide Coverage Card */}
            <ProvinceStatusCard
              selectedProvince={activeProvince}
              report={activeProvinceStatusReport}
              coverage={coverage ?? undefined}
            />

            {/* Filter Bar */}
            <TelemetryFilterBar
              filter={filter}
              onFilterChange={setFilter}
              totalStations={filteredStations.length}
              isAutoRefresh={isAutoRefresh}
              onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
              onManualRefresh={() => fetchData(true)}
              isRefreshing={isRefreshing}
              lastUpdated={lastUpdated}
              thaiWaterStatus={coverage?.providers?.thaiwater}
              availableDistricts={availableDistricts}
            />

            {/* Feed List Items */}
            <TelemetryStationFeedList
              stations={filteredStations}
              highwayAlerts={filteredHighwayAlerts}
              dams={filteredDams}
              flashFloodAlerts={filteredFlashFloodAlerts}
              shelters={filteredShelters}
              highTide={highTide ?? undefined}
              selectedProvince={activeProvince}
              onSelectStation={(s) => {
                clearAllSelections();
                setSelectedStation(s);
                setCurrentView('map');
              }}
              onSelectHighwayAlert={(h) => {
                clearAllSelections();
                setSelectedHighwayAlert(h);
                setCurrentView('map');
              }}
              onSelectDam={(d) => {
                clearAllSelections();
                setSelectedDam(d);
                setCurrentView('map');
              }}
              onSelectFlashFlood={(f) => {
                clearAllSelections();
                setSelectedFlashFlood(f);
                setCurrentView('map');
              }}
              onSelectShelter={(s) => {
                clearAllSelections();
                setSelectedShelter(s);
                setCurrentView('map');
              }}
              onSelectHighTide={(t) => {
                clearAllSelections();
                setSelectedHighTide(t);
              }}
              onResetFilter={() => {
                setFilter({
                  province: 'all',
                  district: 'all',
                  stationType: 'all',
                  severity: 'all',
                  searchQuery: '',
                });
              }}
            />
          </div>
        </main>
      )}

      {/* Detail Slide Drawer */}
      <TelemetryDetailDrawer
        station={selectedStation}
        highwayAlert={selectedHighwayAlert}
        dam={selectedDam}
        flashFlood={selectedFlashFlood}
        shelter={selectedShelter}
        highTide={selectedHighTide}
        onClose={clearAllSelections}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
      />

      {/* Emergency Hotline Modal */}
      <EmergencyDrawer
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Weather Forecast Modal */}
      <WeatherForecastModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        initialProvince={activeProvince}
      />

      {/* BMA DDS Live Radar Modal */}
      <BmaRadarModal
        isOpen={isBmaRadarModalOpen}
        onClose={() => setIsBmaRadarModalOpen(false)}
      />
    </div>
  );
}
