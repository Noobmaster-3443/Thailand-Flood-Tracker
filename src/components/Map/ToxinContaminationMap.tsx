'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Biohazard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Info,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  TOXIN_DATASET_META,
  TOXIN_HEALTH_GUIDANCE,
  TOXIN_HOTLINES,
  TOXIN_STATUS_META,
  TOXIN_STATUS_ORDER,
  TOXIN_TYPES,
  getProvinceToxinRecord,
} from '@/data/water-toxins';
import {
  ProvinceToxinRecord,
  ToxinContaminationStatus,
  ToxinTypeId,
} from '@/types/toxin';

interface ToxinContaminationMapProps {
  onClose: () => void;
}

interface ExternalCheckInfo {
  provider: string;
  endpoint: string;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number;
  datasetsFound: number | null;
  sampleTitles: string[];
  checkedAt: string;
  error?: string;
}

interface WaterToxinsApiResponse {
  ok: boolean;
  apiStatus: 'LIVE' | 'DEGRADED';
  fetchedAt: string;
  latencyMs: number;
  flaggedProvinces: Record<string, ProvinceToxinRecord>;
  flaggedCount: number;
  totalProvinces: number;
  externalCheck: ExternalCheckInfo;
}

type ClientFetchState = 'loading' | 'success' | 'degraded' | 'error';

export const ToxinContaminationMap: React.FC<ToxinContaminationMapProps> = ({
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const provinceLayerRef = useRef<L.GeoJSON | null>(null);
  const riverLayerRef = useRef<L.GeoJSON | null>(null);

  const [provincesGeoJson, setProvincesGeoJson] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [riversGeoJson, setRiversGeoJson] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [apiData, setApiData] = useState<WaterToxinsApiResponse | null>(null);
  const [apiFetchState, setApiFetchState] = useState<ClientFetchState>('loading');
  const [apiError, setApiError] = useState<string | null>(null);
  const [clientLatencyMs, setClientLatencyMs] = useState<number | null>(null);

  const [selectedToxinType, setSelectedToxinType] = useState<ToxinTypeId>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<ToxinContaminationStatus | 'all'>('all');
  const [showRivers, setShowRivers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceToxinRecord | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Mobile-first compact defaults (matches Flood Map UI)
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const fetchAllToxinData = useCallback(async () => {
    const startedAt = performance.now();
    setApiFetchState('loading');
    setApiError(null);

    try {
      const [apiRes, provRes, riverRes] = await Promise.all([
        fetch('/api/water-toxins', { cache: 'no-store' }),
        provincesGeoJson
          ? Promise.resolve(null)
          : fetch('/data/thailand-provinces.geojson'),
        riversGeoJson
          ? Promise.resolve(null)
          : fetch('/data/rivers-major.json'),
      ]);

      if (!apiRes.ok) {
        throw new Error(`HTTP ${apiRes.status} from /api/water-toxins`);
      }

      const parsedApi: WaterToxinsApiResponse = await apiRes.json();
      if (!parsedApi?.ok) {
        throw new Error('API returned ok=false');
      }

      if (provRes) {
        if (!provRes.ok) throw new Error(`HTTP ${provRes.status} loading provinces`);
        setProvincesGeoJson(await provRes.json());
      }
      if (riverRes && riverRes.ok) {
        setRiversGeoJson(await riverRes.json());
      }

      setApiData(parsedApi);
      setClientLatencyMs(Math.round(performance.now() - startedAt));
      setApiFetchState(parsedApi.apiStatus === 'LIVE' ? 'success' : 'degraded');
    } catch (err) {
      setClientLatencyMs(Math.round(performance.now() - startedAt));
      setApiFetchState('error');
      setApiError(err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ API ได้');
    }
  }, [provincesGeoJson, riversGeoJson]);

  useEffect(() => {
    fetchAllToxinData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveRecord = useCallback(
    (provinceNameTh: string): ProvinceToxinRecord => {
      const normalized = provinceNameTh.trim();
      if (apiData?.flaggedProvinces?.[normalized]) {
        return apiData.flaggedProvinces[normalized];
      }
      return getProvinceToxinRecord(normalized);
    },
    [apiData]
  );

  // Compute live province counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<ToxinContaminationStatus, number> = {
      detected: 0,
      downstream_watch: 0,
      ongoing_risk: 0,
      legacy_scar: 0,
      warehouse_waste: 0,
      no_data: 0,
    };

    if (!provincesGeoJson) {
      return counts;
    }

    for (const feature of provincesGeoJson.features) {
      const proTh = (feature.properties?.pro_th as string) || '';
      const record = resolveRecord(proTh);
      const matchesToxin =
        selectedToxinType === 'all' ||
        record.status === 'no_data' ||
        record.toxins.includes(selectedToxinType);

      if (matchesToxin) {
        counts[record.status] += 1;
      } else {
        counts.no_data += 1;
      }
    }

    return counts;
  }, [provincesGeoJson, selectedToxinType, resolveRecord]);

  // Initialize Leaflet map with free OpenStreetMap tiles (no API key watermark)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.2, 101.2],
      zoom: 6,
      minZoom: 5,
      maxZoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | OpenGISData-Thailand',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      provinceLayerRef.current = null;
      riverLayerRef.current = null;
    };
  }, []);

  // Render 77-province choropleth polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !provincesGeoJson) return;

    if (provinceLayerRef.current) {
      provinceLayerRef.current.remove();
      provinceLayerRef.current = null;
    }

    const query = searchQuery.trim().toLowerCase();

    const layer = L.geoJSON(provincesGeoJson, {
      style: (feature) => {
        const proTh = (feature?.properties?.pro_th as string) || '';
        const proEn = ((feature?.properties?.pro_en as string) || '').toLowerCase();
        const record = resolveRecord(proTh);

        const matchesToxin =
          selectedToxinType === 'all' ||
          record.status === 'no_data' ||
          record.toxins.includes(selectedToxinType);

        const effectiveStatus: ToxinContaminationStatus = matchesToxin
          ? record.status
          : 'no_data';

        const meta = TOXIN_STATUS_META[effectiveStatus];
        const matchesStatusFilter =
          selectedStatusFilter === 'all' || effectiveStatus === selectedStatusFilter;
        const matchesSearch =
          !query || proTh.toLowerCase().includes(query) || proEn.includes(query);

        const isSelected = selectedProvince?.provinceNameTh === proTh;
        const isHighlighted = matchesStatusFilter && matchesSearch;

        return {
          fillColor: meta.color,
          fillOpacity: isHighlighted
            ? effectiveStatus === 'no_data'
              ? 0.42
              : 0.78
            : 0.1,
          color: isSelected ? '#0f172a' : isHighlighted ? '#ffffff' : '#cbd5e1',
          weight: isSelected ? 3 : 1,
          dashArray:
            effectiveStatus === 'downstream_watch'
              ? '4 3'
              : effectiveStatus === 'ongoing_risk'
              ? '2 2'
              : undefined,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const proTh = (feature.properties?.pro_th as string) || '';
        const record = resolveRecord(proTh);
        const matchesToxin =
          selectedToxinType === 'all' ||
          record.status === 'no_data' ||
          record.toxins.includes(selectedToxinType);
        const effectiveStatus: ToxinContaminationStatus = matchesToxin
          ? record.status
          : 'no_data';
        const meta = TOXIN_STATUS_META[effectiveStatus];

        featureLayer.bindTooltip(
          `<div class="font-sans text-xs">
            <div class="font-bold text-slate-900">จ.${proTh}</div>
            <div class="text-[11px] font-semibold" style="color:${
              effectiveStatus === 'no_data' ? '#475569' : meta.color
            }">${meta.label_th}</div>
          </div>`,
          { sticky: true, direction: 'top', opacity: 0.96 }
        );

        featureLayer.on('click', () => {
          setSelectedProvince(record);
          setIsLegendOpen(false);
          setIsSheetExpanded(false);
          if (featureLayer instanceof L.Polygon) {
            const bounds = featureLayer.getBounds();
            if (bounds.isValid()) {
              map.flyToBounds(bounds, { maxZoom: 8, padding: [40, 40], duration: 0.5 });
            }
          }
        });
      },
    }).addTo(map);

    provinceLayerRef.current = layer;

    if (riverLayerRef.current) {
      riverLayerRef.current.bringToFront();
    }
  }, [
    provincesGeoJson,
    selectedToxinType,
    selectedStatusFilter,
    searchQuery,
    selectedProvince,
    resolveRecord,
  ]);

  // Render major rivers layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (riverLayerRef.current) {
      riverLayerRef.current.remove();
      riverLayerRef.current = null;
    }

    if (!showRivers || !riversGeoJson) return;

    const riverLayer = L.geoJSON(riversGeoJson, {
      style: (feature) => {
        const order = Number(feature?.properties?.o || 3);
        return {
          color: '#0284c7',
          weight: order >= 5 ? 2.4 : 1.4,
          opacity: 0.78,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const th = feature.properties?.th as string;
        const basin = feature.properties?.b as string;
        if (th) {
          featureLayer.bindTooltip(
            `<div class="font-sans text-xs">
              <div class="font-bold text-sky-900">${th}</div>
              ${basin ? `<div class="text-[11px] text-slate-600">${basin}</div>` : ''}
            </div>`,
            { sticky: true, direction: 'top' }
          );
        }
      },
    }).addTo(map);

    riverLayerRef.current = riverLayer;
    riverLayer.bringToFront();
  }, [riversGeoJson, showRivers]);

  const handleResetView = () => {
    setSelectedProvince(null);
    setSelectedStatusFilter('all');
    setSearchQuery('');
    mapRef.current?.flyTo([13.2, 101.2], 6, { duration: 0.5 });
  };

  const apiBadge = (() => {
    if (apiFetchState === 'loading') {
      return {
        dot: 'bg-blue-500 animate-pulse',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'กำลังดึง API...',
      };
    }
    if (apiFetchState === 'success') {
      return {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'API สำเร็จ',
      };
    }
    if (apiFetchState === 'degraded') {
      return {
        dot: 'bg-amber-500',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'API บางส่วน',
      };
    }
    return {
      dot: 'bg-red-500',
      bg: 'bg-red-50 text-red-700 border-red-200',
      label: 'API ล้มเหลว',
    };
  })();

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-100 font-sans overflow-hidden">
      {/* Full-bleed Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top Command Bar (Matches Flood Map Mobile/Desktop style) */}
      <div className="absolute top-3 left-3 right-3 z-[600] flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 px-2.5 sm:px-3.5 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="กลับสู่แผนที่น้ำท่วม"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">แผนที่น้ำท่วม</span>
          </button>

          <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Biohazard className="w-4 h-4 text-amber-600" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                สารพิษในน้ำ
              </span>
              <button
                type="button"
                onClick={() => setIsApiModalOpen(true)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer shrink-0 ${apiBadge.bg}`}
                title="คลิกเพื่อดูสถานะการดึงข้อมูล API จริง"
              >
                <span className={`w-2 h-2 rounded-full ${apiBadge.dot}`} />
                <span>{apiBadge.label}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden sm:block">
              {TOXIN_DATASET_META.updatedLabel_th} • แยกข้อมูลน้ำท่วมออกทั้งหมด
            </p>
          </div>
        </div>

        {/* Compact Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRivers((p) => !p)}
            className={`w-9 h-9 sm:w-auto sm:px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              showRivers
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="เปิด/ปิดเส้นแม่น้ำ"
            aria-label="เปิด/ปิดเส้นแม่น้ำ"
          >
            <Droplets className="w-4 h-4" />
            <span className="hidden md:inline">แม่น้ำ</span>
          </button>

          <button
            type="button"
            onClick={fetchAllToxinData}
            disabled={apiFetchState === 'loading'}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล API"
            aria-label="รีเฟรชข้อมูล API"
          >
            <RefreshCw
              className={`w-4 h-4 ${apiFetchState === 'loading' ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsHealthModalOpen(true)}
            className="h-9 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-sm"
            title="เจอและกินเข้าไปแล้วทำยังไง?"
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">เจอ/กินเข้าไปทำไง?</span>
          </button>
        </div>
      </div>

      {/* Top-Left Compact "สัญลักษณ์" Pill (Matches Image 4!) */}
      <div className="absolute top-[70px] left-3 z-[550] flex flex-col items-start gap-2 max-w-[calc(100vw-24px)] sm:max-w-[320px]">
        <button
          type="button"
          onClick={() => setIsLegendOpen((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-50"
        >
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>สัญลักษณ์</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
              isLegendOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isLegendOpen && (
          <div className="w-[290px] sm:w-[320px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2.5 space-y-1.5 max-h-[52vh] overflow-y-auto">
            {TOXIN_STATUS_ORDER.map((statusKey) => {
              const meta = TOXIN_STATUS_META[statusKey];
              const count = statusCounts[statusKey];
              const isActive = selectedStatusFilter === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() =>
                    setSelectedStatusFilter((prev) =>
                      prev === statusKey ? 'all' : statusKey
                    )
                  }
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded shrink-0 border"
                      style={{
                        backgroundColor: meta.color,
                        borderColor: meta.borderColor,
                      }}
                    />
                    <span className="text-xs font-bold truncate">{meta.label_th}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {count} จ.
                  </span>
                </button>
              );
            })}
            <p className="text-[10px] text-slate-500 leading-snug pt-1 px-1 border-t border-slate-200">
              {TOXIN_DATASET_META.disclaimer_th}
            </p>
          </div>
        )}
      </div>

      {/* Loading / Error Banner if API failed */}
      {apiFetchState === 'error' && (
        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-[650] bg-red-600 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>ดึงข้อมูล API ไม่สำเร็จ: {apiError}</span>
          <button
            type="button"
            onClick={fetchAllToxinData}
            className="underline ml-1 cursor-pointer"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Selected Province Detail Floating Card */}
      {selectedProvince && (
        <div className="absolute bottom-[74px] left-3 right-3 sm:left-auto sm:top-[70px] sm:bottom-auto sm:right-14 sm:w-[350px] z-[580] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">
                เฝ้าระวังสารพิษในน้ำ
              </div>
              <h2 className="text-sm sm:text-base font-extrabold">
                จังหวัด{selectedProvince.provinceNameTh}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProvince(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              aria-label="ปิดรายละเอียดจังหวัด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 space-y-2.5 max-h-[42vh] overflow-y-auto text-xs">
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  TOXIN_STATUS_META[selectedProvince.status].badgeBg
                } ${TOXIN_STATUS_META[selectedProvince.status].badgeText}`}
              >
                {TOXIN_STATUS_META[selectedProvince.status].label_th}
              </span>
              <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                {selectedProvince.summary_th}
              </p>
              <p className="mt-1 text-slate-600 leading-relaxed">
                {selectedProvince.detailNote_th}
              </p>
            </div>

            {selectedProvince.toxins.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProvince.toxins.map((tid) => {
                  const tMeta = TOXIN_TYPES.find((t) => t.id === tid);
                  return (
                    <span
                      key={tid}
                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]"
                    >
                      {tMeta?.name_th || tid}
                    </span>
                  );
                })}
              </div>
            )}

            {selectedProvince.rivers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                {selectedProvince.rivers.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-semibold text-[11px]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>อ้างอิง: {selectedProvince.sources.join(', ')}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsHealthModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>เจอและกินเข้าไปแล้วทำยังไง?</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet (Matches Image 4's clean collapsible bottom bar!) */}
      <div className="absolute bottom-0 left-0 right-0 sm:left-3 sm:right-auto sm:bottom-3 sm:w-[400px] z-[600] bg-white/95 backdrop-blur-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsSheetExpanded((p) => !p)}
          className="w-full px-4 pt-2 pb-3 flex flex-col items-center cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 mb-2 sm:hidden" />
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c25525] shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                สารพิษในน้ำ 77 จังหวัด
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                ({TOXIN_DATASET_META.updatedLabel_th})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold">
                พบแล้ว {statusCounts.detected}
              </span>
              {isSheetExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>
        </button>

        {isSheetExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-200 space-y-3 max-h-[55vh] overflow-y-auto">
            {/* Search & Reset */}
            <div className="flex items-center gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาจังหวัด..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {(selectedStatusFilter !== 'all' ||
                selectedToxinType !== 'all' ||
                selectedProvince ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedToxinType('all');
                    handleResetView();
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer shrink-0"
                >
                  รีเซ็ต
                </button>
              )}
            </div>

            {/* Toxin Type Filter */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                กรองตามชนิดสารพิษ
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TOXIN_TYPES.map((toxin) => {
                  const active = selectedToxinType === toxin.id;
                  return (
                    <button
                      key={toxin.id}
                      type="button"
                      onClick={() => setSelectedToxinType(toxin.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {toxin.name_th}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6-Level Breakdown */}
            <div className="space-y-1.5">
              {TOXIN_STATUS_ORDER.map((statusKey) => {
                const meta = TOXIN_STATUS_META[statusKey];
                const count = statusCounts[statusKey];
                const isActive = selectedStatusFilter === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() =>
                      setSelectedStatusFilter((prev) =>
                        prev === statusKey ? 'all' : statusKey
                      )
                    }
                    className={`w-full text-left px-2.5 py-2 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded shrink-0 mt-0.5 border"
                      style={{
                        backgroundColor: meta.color,
                        borderColor: meta.borderColor,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{meta.label_th}</span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {count} จังหวัด
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isActive ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {meta.shortDesc_th}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Real API Status Details Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold">
                    สถานะการดึงข้อมูล API จริง
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    ตรวจสอบการเชื่อมต่อจริงแบบ Real-time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs">
              {/* Internal API Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">
                    1. Toxin Dataset API (/api/water-toxins)
                  </span>
                  {apiFetchState === 'error' ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                      ล้มเหลว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HTTP 200 OK
                    </span>
                  )}
                </div>
                {apiData && (
                  <div className="text-slate-600 space-y-0.5">
                    <div>
                      ความเร็วตอบสนอง (Client): <strong>{clientLatencyMs} ms</strong>
                    </div>
                    <div>
                      ข้อมูลจังหวัดที่ดึงได้:{' '}
                      <strong>
                        {apiData.flaggedCount} จังหวัดเฝ้าระวัง / {apiData.totalProvinces}{' '}
                        จังหวัดทั้งหมด
                      </strong>
                    </div>
                    <div>
                      เวลาดึงล่าสุด:{' '}
                      <strong>
                        {new Date(apiData.fetchedAt).toLocaleString('th-TH')}
                      </strong>
                    </div>
                  </div>
                )}
                {apiError && <div className="text-red-600 font-semibold">{apiError}</div>}
              </div>

              {/* Real External Gov Open Data Check */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-900">
                    2. Open Government Data (data.go.th)
                  </span>
                  {apiData?.externalCheck?.ok ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HTTP {apiData.externalCheck.httpStatus} OK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                      {apiData?.externalCheck?.error || 'ไม่พร้อมใช้งาน'}
                    </span>
                  )}
                </div>
                {apiData?.externalCheck && (
                  <div className="text-slate-600 space-y-1">
                    <div>
                      Latency:{' '}
                      <strong>{apiData.externalCheck.latencyMs} ms</strong> • ชุดข้อมูลคุณภาพน้ำที่พบ:{' '}
                      <strong>
                        {apiData.externalCheck.datasetsFound ?? '-'} ชุดข้อมูล
                      </strong>
                    </div>
                    {apiData.externalCheck.sampleTitles.length > 0 && (
                      <ul className="list-disc pl-4 text-[11px] text-slate-500">
                        {apiData.externalCheck.sampleTitles.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={fetchAllToxinData}
                disabled={apiFetchState === 'loading'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${apiFetchState === 'loading' ? 'animate-spin' : ''}`}
                />
                <span>ทดสอบดึงข้อมูล API ใหม่ตอนนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health & Safety Guidance Modal ("เจอและกินเข้าไปแล้วทำยังไง") */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold">
                    สารตะกั่วและสารพิษในน้ำ: เจอและกินเข้าไปแล้วทำยังไง?
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    คำแนะนำการปฐมพยาบาลเบื้องต้น การป้องกัน และสายด่วนฉุกเฉิน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHealthModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {TOXIN_HEALTH_GUIDANCE.map((sec) => (
                <div
                  key={sec.title_th}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {sec.title_th}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700 leading-relaxed">
                    {sec.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 font-extrabold text-amber-950 text-sm">
                  <Phone className="w-4 h-4 text-amber-700" />
                  <span>สายด่วนแจ้งเหตุและปรึกษาทางการแพทย์</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TOXIN_HOTLINES.map((h) => (
                    <a
                      key={h.number}
                      href={`tel:${h.number}`}
                      className="p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 transition-colors flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {h.name_th}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {h.description_th}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-sm shrink-0">
                        {h.number}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
