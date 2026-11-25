'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TelemetryNavbar } from '@/components/Navbar/TelemetryNavbar';
import { DynamicTelemetryMap } from '@/components/Map/DynamicTelemetryMap';
import { DynamicToxinContaminationMap } from '@/components/Map/DynamicToxinContaminationMap';
import { MobileDashboardBottomSheet, BottomSheetState } from '@/components/Dashboard/MobileDashboardBottomSheet';
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
import { BkkRoadFloodSensor } from '@/types/bkk-road-flood';

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
  const [bmaRoadSensors, setBmaRoadSensors] = useState<BkkRoadFloodSensor[]>([]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);

  const [currentView, setCurrentView] = useState<'map' | 'list'>('map');
  const [mobileSheetState, setMobileSheetState] = useState<BottomSheetState>('collapsed');

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
  const [isToxinMode, setIsToxinMode] = useState(false);
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
      const [data, bkkRoadRes] = await Promise.all([
        getAutomatedTelemetryData(),
        fetch('/api/bkk-road-flood')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
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

      if (bkkRoadRes) {
        const sensors = Array.isArray(bkkRoadRes)
          ? bkkRoadRes
          : bkkRoadRes.data || bkkRoadRes.sensors || [];
        setBmaRoadSensors(sensors);
      }

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
      // Exclude legacy BMA road sensors from the primary canal/river telemetry feed
      if (filter.stationType !== 'highway_flood' && (sta.id.startsWith('bma-road-') || sta.source_agency === 'BMA DDS')) {
        return false;
      }
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


  const filteredBmaRoadSensors = useMemo(() => {
    if (filter.province && filter.province !== 'all' && filter.province !== 'bangkok') {
      return [];
    }
    return bmaRoadSensors.filter((s) => {
      if (filter.district !== 'all') {
        const normDist = filter.district.replace(/^เขต/, '').trim();
        if (s.district !== normDist && !s.district.includes(normDist)) return false;
      }
      if (filter.searchQuery.trim() !== '') {
        const q = filter.searchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.district.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bmaRoadSensors, filter]);

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

  // Max Rain Station for Live Metric Pill
  const maxRainStation = useMemo(() => {
    const list = (activeProvince === 'all' ? stations : filteredStations).filter((s) => (s.rain_24h_mm || 0) > 0);
    if (list.length === 0) return null;
    return list.reduce((prev, curr) => ((curr.rain_24h_mm || 0) > (prev.rain_24h_mm || 0) ? curr : prev));
  }, [stations, filteredStations, activeProvince]);

  // Key Chao Phraya Gauge Station for Live Metric Pill
  const chaoPhrayaStation = useMemo(() => {
    return (
      stations.find((s) => s.station_code === 'BMA02') ||
      stations.find((s) => s.name_th?.includes('ปากคลองตลาด')) ||
      stations.find((s) => s.name_th?.includes('บางนา') && s.river_name?.includes('เจ้าพระยา')) ||
      stations.find((s) => s.river_name?.includes('เจ้าพระยา') && s.water_level_m_msl)
    );
  }, [stations]);

  // Road Flood Count for Live Metric Pill
  const floodedRoadCount = useMemo(() => {
    return bmaRoadSensors.filter((s) => s.status === 'warning' || s.status === 'critical').length;
  }, [bmaRoadSensors]);

  if (isToxinMode) {
    return <DynamicToxinContaminationMap onClose={() => setIsToxinMode(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden bg-slate-50 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar with Unified Command Center Bar */}
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
        coverage={coverage}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        filterSlot={
          <TelemetryFilterBar
            filter={filter}
            onFilterChange={setFilter}
            totalStations={filteredStations.length + (activeProvince === 'bangkok' ? filteredBmaRoadSensors.length : 0)}
            isAutoRefresh={isAutoRefresh}
            onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
            onManualRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            thaiWaterStatus={coverage?.providers?.thaiwater}
            availableDistricts={availableDistricts}
            variant="docked"
            tideAlert={
              SHOW_STATIC_TIDE_ALERT && highTide
                ? {
                    morningPeak: highTide.morning_peak_m_msl,
                    time: highTide.morning_peak_time,
                    onClick: () => {
                      clearAllSelections();
                      setSelectedHighTide(highTide);
                    },
                  }
                : undefined
            }
            roadFloodMetric={{
              floodedCount: floodedRoadCount,
              totalSensors: bmaRoadSensors.length,
              onClick: () => {
                if (floodedRoadCount > 0) {
                  const firstFlooded = bmaRoadSensors.find((s) => s.status === 'warning' || s.status === 'critical');
                  if (firstFlooded) {
                    setToastMessage(`พบน้ำท่วมขัง ${firstFlooded.name} (${firstFlooded.waterLevelCm} ซม.)`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }
                } else {
                  setToastMessage('ถนนและอุโมงค์ กทม. 248 จุดสัญจรได้ปกติ');
                  setTimeout(() => setToastMessage(null), 2500);
                }
              },
            }}
            maxRainMetric={
              maxRainStation && (maxRainStation.rain_24h_mm || 0) > 0
                ? {
                    amountMm: maxRainStation.rain_24h_mm || 0,
                    stationName: maxRainStation.name_th,
                    district: maxRainStation.district || maxRainStation.province || 'กทม.',
                    onClick: () => {
                      clearAllSelections();
                      setSelectedStation(maxRainStation);
                    },
                  }
                : undefined
            }
            chaoPhrayaMetric={
              chaoPhrayaStation
                ? {
                    stationName: chaoPhrayaStation.name_th,
                    waterLevelMsl: chaoPhrayaStation.water_level_m_msl,
                    bankLevelMsl: chaoPhrayaStation.bank_level_m_msl,
                    severity: chaoPhrayaStation.severity,
                    onClick: () => {
                      clearAllSelections();
                      setSelectedStation(chaoPhrayaStation);
                    },
                  }
                : undefined
            }
            flashFloodAlert={
              SHOW_STATIC_FLASH_FLOOD_ALERTS &&
              flashFloodAlerts.some((f) => f.severity === 'red' && (activeProvince === 'all' || f.province === activeProvince))
                ? {
                    district:
                      flashFloodAlerts.find((f) => f.severity === 'red' && (activeProvince === 'all' || f.province === activeProvince))?.district || '',
                    onClick: () => {
                      const flash = flashFloodAlerts.find((f) => f.severity === 'red' && (activeProvince === 'all' || f.province === activeProvince));
                      if (flash) {
                        clearAllSelections();
                        setSelectedFlashFlood(flash);
                      }
                    },
                  }
                : undefined
            }
          />
        }
      />

      {/* Main Content Area */}
      {currentView === 'map' ? (
        <>
          {/* Mobile Bottom Sheet (Edge-to-Edge Map Experience) */}
          <MobileDashboardBottomSheet
            sheetState={mobileSheetState}
            onSheetStateChange={setMobileSheetState}
            activeProvinceName={activeProvince === 'all' ? 'ทั่วประเทศ (77 จว.)' : (THAILAND_PROVINCES.find((p) => p.id === activeProvince)?.name_th || 'กรุงเทพมหานคร')}
            criticalCount={filteredStations.filter((s) => s.severity === 'red' && s.data_status !== 'STATIC').length}
            warningCount={filteredStations.filter((s) => s.severity === 'orange' && s.data_status !== 'STATIC').length}
            totalActiveStations={filteredStations.filter((s) => s.data_status !== 'STATIC').length}
            highTideMorningPeak={SHOW_STATIC_TIDE_ALERT && highTide ? highTide.morning_peak_m_msl : null}
            highTideTime={SHOW_STATIC_TIDE_ALERT && highTide ? highTide.morning_peak_time : null}
            onOpenHighTide={() => {
              clearAllSelections();
              if (highTide) setSelectedHighTide(highTide);
            }}
          >
            {/* Filter Bar in Mobile Sheet */}
            <div className="space-y-3 font-sans pb-4">
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

              {/* Provincial Status Card */}
              <ProvinceStatusCard
                selectedProvince={activeProvince}
                report={activeProvinceStatusReport}
                coverage={coverage ?? undefined}
              />

              {/* Metrics Summary Banner */}
              <MetricBanner
                stations={filteredStations}
                highwayAlerts={filteredHighwayAlerts}
                bmaRoadSensors={filteredBmaRoadSensors}
                highTide={highTide ?? undefined}
                flashFloodAlerts={filteredFlashFloodAlerts}
                dams={filteredDams}
                selectedProvince={activeProvince}
                onFilterSeverity={(sev) => setFilter({ ...filter, severity: sev as any })}
                onFilterRoad={() => {
                  setCurrentView('list');
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
            </div>
          </MobileDashboardBottomSheet>

          <main className="flex-1 w-full h-full pt-0 lg:pt-[102px] relative">
            <div className="w-full h-full">
              <DynamicTelemetryMap
                stations={filteredStations}
                highwayAlerts={filteredHighwayAlerts}
                gistdaGeoJson={gistdaGeoJson}
                dams={filteredDams}
                flashFloodAlerts={filteredFlashFloodAlerts}
                shelters={filteredShelters}
                bmaRoadSensors={filteredBmaRoadSensors}
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
                onOpenToxinMode={() => setIsToxinMode(true)}
                isBottomSheetExpanded={mobileSheetState === 'expanded'}
              />
            </div>
          </main>
        </>
      ) : (
        /* List View: Clean Natural Scrolling */
        <main className="flex-1 w-full h-full pt-14 sm:pt-16 lg:pt-[104px] overflow-y-auto bg-slate-50">
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

            {/* Filter Bar (Mobile only, desktop uses docked Command Center Bar) */}
            <div className="lg:hidden">
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
            </div>

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

