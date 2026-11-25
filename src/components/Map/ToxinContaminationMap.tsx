'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Biohazard,
  Droplets,
  Info,
  Layers,
  Phone,
  Search,
  ShieldAlert,
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
  const [isLoadingMapData, setIsLoadingMapData] = useState(true);

  const [selectedToxinType, setSelectedToxinType] = useState<ToxinTypeId>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<ToxinContaminationStatus | 'all'>('all');
  const [showRivers, setShowRivers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceToxinRecord | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

  // Load 77-province boundaries and major rivers independently from flood data
  useEffect(() => {
    let active = true;
    setIsLoadingMapData(true);

    Promise.all([
      fetch('/data/thailand-provinces.geojson').then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/data/rivers-major.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([provData, riverData]) => {
        if (!active) return;
        if (provData) setProvincesGeoJson(provData);
        if (riverData) setRiversGeoJson(riverData);
      })
      .catch((err) => {
        console.error('Failed to load toxin map geojson:', err);
      })
      .finally(() => {
        if (active) setIsLoadingMapData(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Compute province counts per status based on active toxin type filter
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
      return {
        detected: 20,
        downstream_watch: 3,
        ongoing_risk: 2,
        legacy_scar: 5,
        warehouse_waste: 2,
        no_data: 45,
      };
    }

    for (const feature of provincesGeoJson.features) {
      const proTh = (feature.properties?.pro_th as string) || '';
      const record = getProvinceToxinRecord(proTh);
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
  }, [provincesGeoJson, selectedToxinType]);

  // Initialize isolated Leaflet map
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

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO | OpenGISData-Thailand',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      provinceLayerRef.current = null;
      riverLayerRef.current = null;
    };
  }, []);

  // Render province choropleth polygons
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
        const record = getProvinceToxinRecord(proTh);

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
              ? 0.55
              : 0.85
            : 0.12,
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
        const record = getProvinceToxinRecord(proTh);
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
          if (featureLayer instanceof L.Polygon) {
            const bounds = featureLayer.getBounds();
            if (bounds.isValid()) {
              map.flyToBounds(bounds, { maxZoom: 8, padding: [40, 40], duration: 0.6 });
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
          opacity: 0.72,
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
    mapRef.current?.flyTo([13.2, 101.2], 6, { duration: 0.6 });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-100 font-sans">
      {/* Dedicated Top Header (Completely isolated from Flood UI) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่แผนที่น้ำท่วม</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Biohazard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold truncate">
                  {TOXIN_DATASET_META.title_th}
                </h1>
                <span className="hidden md:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  {TOXIN_DATASET_META.updatedLabel_th}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                โหมดแยกเฉพาะสารพิษในน้ำและแม่น้ำ — ไม่แสดงระดับน้ำท่วมหรือข้อมูลสถานีน้ำ
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRivers((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              showRivers
                ? 'bg-sky-600/25 border-sky-400/50 text-sky-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เส้นแม่น้ำ</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHealthModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shadow-sm"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>เจอและกินเข้าไปแล้วทำยังไง?</span>
          </button>
        </div>
      </header>

      {/* Toxin Type Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">
            ชนิดสารพิษ:
          </span>
          {TOXIN_TYPES.map((toxin) => {
            const active = selectedToxinType === toxin.id;
            return (
              <button
                key={toxin.id}
                type="button"
                onClick={() => setSelectedToxinType(toxin.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาจังหวัด..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {(selectedStatusFilter !== 'all' || selectedProvince || searchQuery) && (
            <button
              type="button"
              onClick={handleResetView}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer shrink-0"
            >
              รีเซ็ตมุมมอง
            </button>
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="relative flex-1 w-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {isLoadingMapData && (
          <div className="absolute inset-0 z-20 bg-slate-100/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white px-5 py-3.5 rounded-2xl shadow-lg border border-slate-200 text-sm font-bold text-slate-700">
              กำลังโหลดแผนที่จังหวัดและเส้นแม่น้ำ...
            </div>
          </div>
        )}

        {/* Interactive 6-Category Legend Panel (Top Left) */}
        <div className="absolute top-3 left-3 z-[500] max-w-[300px] sm:max-w-[330px]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsLegendExpanded((p) => !p)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 bg-slate-50 border-b border-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-extrabold text-slate-900">
                  สถานะการปนเปื้อน (77 จังหวัด)
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {isLegendExpanded ? 'ซ่อน' : 'แสดง'}
              </span>
            </button>

            {isLegendExpanded && (
              <div className="p-2.5 space-y-1.5 max-h-[60vh] overflow-y-auto">
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
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-md shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: meta.color,
                          borderColor: meta.borderColor,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold">
                            {meta.label_th}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {count} จังหวัด
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-snug mt-0.5 ${
                            isActive ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {meta.shortDesc_th}
                        </p>
                      </div>
                    </button>
                  );
                })}

                <div className="pt-2 mt-1 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed px-1">
                  <p>{TOXIN_DATASET_META.disclaimer_th}</p>
                  <p className="mt-1 font-semibold text-slate-600">
                    แหล่งข้อมูล: {TOXIN_DATASET_META.sources.join(' • ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Province Detail Drawer (Right / Bottom) */}
        {selectedProvince && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:top-3 sm:bottom-auto sm:right-3 sm:w-[360px] z-[550] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  ข้อมูลเฝ้าระวังสารพิษในน้ำ
                </div>
                <h2 className="text-base font-extrabold">
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

            <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto text-xs">
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    TOXIN_STATUS_META[selectedProvince.status].badgeBg
                  } ${TOXIN_STATUS_META[selectedProvince.status].badgeText}`}
                >
                  {TOXIN_STATUS_META[selectedProvince.status].label_th}
                </span>
                <p className="mt-2 text-sm font-bold text-slate-900 leading-snug">
                  {selectedProvince.summary_th}
                </p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {selectedProvince.detailNote_th}
                </p>
              </div>

              {selectedProvince.toxins.length > 0 && (
                <div>
                  <div className="font-bold text-slate-700 mb-1">
                    ชนิดสารพิษที่เกี่ยวข้อง
                  </div>
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
                </div>
              )}

              {selectedProvince.rivers.length > 0 && (
                <div>
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    <span>แม่น้ำ/แหล่งน้ำที่เชื่อมโยง</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvince.rivers.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-semibold text-[11px]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  อ้างอิง: {selectedProvince.sources.join(', ')} (จุดพบจริงอยู่เฉพาะบางอำเภอ)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsHealthModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>เจอและกินเข้าไปแล้วทำยังไง?</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Health & Safety Guidance Modal ("เจอและกินเข้าไปแล้วทำยังไง") */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">
                    สารตะกั่วและสารพิษในน้ำ: เจอและกินเข้าไปแล้วทำยังไง?
                  </h2>
                  <p className="text-xs text-slate-300">
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

            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
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
