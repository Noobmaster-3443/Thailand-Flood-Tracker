'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  Popup,
  AttributionControl,
  type StyleSpecification,
  type GeoJSONSource
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  TelemetryStation,
  SeverityLevel,
} from '@/types/telemetry';
import { 
  Layers, 
  MapPin, 
  Compass, 
  Mountain, 
  AlertTriangle, 
  ArrowLeft,
  Maximize2,
  RotateCcw
} from 'lucide-react';

interface TelemetryMap3DProps {
  stations: TelemetryStation[];
  gistdaGeoJson?: GeoJSON.FeatureCollection | null;
  selectedStation: TelemetryStation | null;
  onSelectStation: (station: TelemetryStation | null) => void;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  onClose3D: () => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
  isBottomSheetExpanded?: boolean;
}

const severityConfig: Record<SeverityLevel, { hex: string; bg: string; text: string; label: string }> = {
  red: { hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', label: 'วิกฤต/ล้นตลิ่ง' },
  orange: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-600', label: 'เตือนภัย/เฝ้าระวังสูง' },
  yellow: { hex: '#eab308', bg: 'bg-amber-500', text: 'text-amber-600', label: 'เฝ้าระวัง' },
  green: { hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'ระดับน้ำปกติ' },
};

export const TelemetryMap3D: React.FC<TelemetryMap3DProps> = ({
  stations,
  gistdaGeoJson,
  selectedStation,
  onSelectStation,
  initialCenter = [101.5, 14.05],
  initialZoom = 8.5,
  onClose3D,
  onViewportChange,
  isBottomSheetExpanded = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [exaggeration, setExaggeration] = useState<number>(1.6);
  const [showGistda, setShowGistda] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Keep callback and initial props stable
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);

  // Check WebGL support on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
      }
    } catch {
      setIsSupported(false);
    }
  }, []);

  // Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!isSupported || !mapContainerRef.current) return;

    // Build style spec with DEM terrain and Satellite tiles
    const style: StyleSpecification = {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxzoom: 19,
        },
        'carto-labels': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          maxzoom: 20,
        },
        'terrain-dem': {
          type: 'raster-dem',
          tiles: [
            'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
          ],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15,
        },
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'carto-labels-layer',
          type: 'raster',
          source: 'carto-labels',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
      terrain: {
        source: 'terrain-dem',
        exaggeration: 1.6,
      },
      sky: {
        'sky-color': '#93c5fd',
        'sky-horizon-blend': 0.5,
        'horizon-color': '#f8fafc',
        'horizon-fog-blend': 0.8,
        'fog-color': '#cbd5e1',
        'fog-ground-blend': 0.5,
      },
    };

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style,
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      pitch: 58,
      bearing: -15,
      maxPitch: 85,
      attributionControl: false,
    });

    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(
      new NavigationControl({ 
        visualizePitch: true, 
        showZoom: true, 
        showCompass: true 
      }), 
      'bottom-right'
    );

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (onViewportChangeRef.current) {
        onViewportChangeRef.current([center.lng, center.lat], zoom);
      }
    });

    mapRef.current = map;

    return () => {
      // Cleanup markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (popupRef.current) {
        popupRef.current.remove();
      }
      map.remove();
      mapRef.current = null;
    };
  }, [isSupported]);

  // Update Terrain Exaggeration
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    try {
      map.setTerrain({
        source: 'terrain-dem',
        exaggeration: exaggeration,
      });
    } catch {
      // Ignore if terrain not yet ready
    }
  }, [exaggeration, mapLoaded]);

  // Add or update GISTDA flood polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (gistdaGeoJson && gistdaGeoJson.features && gistdaGeoJson.features.length > 0) {
      const source = map.getSource('gistda-flood-source') as GeoJSONSource | undefined;
      if (source) {
        source.setData(gistdaGeoJson);
      } else {
        map.addSource('gistda-flood-source', {
          type: 'geojson',
          data: gistdaGeoJson,
        });

        if (!map.getLayer('gistda-flood-fill')) {
          map.addLayer({
            id: 'gistda-flood-fill',
            type: 'fill',
            source: 'gistda-flood-source',
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.45,
            },
          });
        }

        if (!map.getLayer('gistda-flood-line')) {
          map.addLayer({
            id: 'gistda-flood-line',
            type: 'line',
            source: 'gistda-flood-source',
            paint: {
              'line-color': '#0369a1',
              'line-width': 1.5,
            },
          });
        }
      }
    }
  }, [gistdaGeoJson, mapLoaded]);

  // Update GISTDA Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('gistda-flood-fill')) {
      map.setLayoutProperty('gistda-flood-fill', 'visibility', showGistda ? 'visible' : 'none');
    }
    if (map.getLayer('gistda-flood-line')) {
      map.setLayoutProperty('gistda-flood-line', 'visibility', showGistda ? 'visible' : 'none');
    }
  }, [showGistda, mapLoaded]);

  // Render 3D Station Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showStations) return;

    stations.forEach((station) => {
      if (!station.latitude || !station.longitude) return;

      const conf = severityConfig[station.severity] || severityConfig.green;

      // Create custom DOM element for 3D marker
      const el = document.createElement('div');
      el.className = 'group relative cursor-pointer';

      // HTML structure for elevated 3D pin
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${(station.severity === 'red' || station.severity === 'orange') ? `
            <span class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${conf.bg} opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 ${conf.bg}"></span>
            </span>
          ` : ''}
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-xl ${conf.bg} text-white font-bold text-[11px] transform transition-transform group-hover:scale-125 duration-150">
            ${station.water_level_m_msl !== undefined ? station.water_level_m_msl.toFixed(1) : '•'}
          </div>
          <div class="w-1.5 h-2 ${conf.bg} shadow-md"></div>
          <div class="w-2.5 h-1 bg-black/40 rounded-full blur-[1px]"></div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            ${station.name_th}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectStation(station);

        // Open detailed popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popupContent = `
          <div class="p-3 text-slate-800 font-sans max-w-[280px]">
            <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <span class="font-extrabold text-sm text-slate-900 line-clamp-1">${station.name_th}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${conf.bg}">
                ${conf.label}
              </span>
            </div>
            <div class="text-xs text-slate-600 space-y-1 mb-2">
              <div>📍 ${station.district}, ${station.province || 'ปราจีนบุรี'}</div>
              ${station.river_name ? `<div>🌊 ลำน้ำ: ${station.river_name}</div>` : ''}
              ${station.water_level_m_msl !== undefined ? `
                <div class="font-semibold text-slate-900 mt-1">
                  ระดับน้ำ: <span class="${conf.text} font-bold text-sm">${station.water_level_m_msl.toFixed(2)}</span> ม.(รทก.)
                </div>
              ` : ''}
              ${station.capacity_percentage !== undefined ? `
                <div>ความจุลำน้ำ: <span class="font-bold">${station.capacity_percentage}%</span></div>
              ` : ''}
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>แหล่งข้อมูล: ${station.source_agency}</span>
              <span>${station.observed_at ? station.observed_at.slice(11, 16) : ''} น.</span>
            </div>
          </div>
        `;

        const popup = new Popup({ 
          offset: 25, 
          closeButton: true,
          className: 'shadow-2xl rounded-2xl overflow-hidden'
        })
          .setLngLat([station.longitude, station.latitude])
          .setHTML(popupContent)
          .addTo(map);

        popupRef.current = popup;
      });

      const marker = new Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [stations, showStations, mapLoaded, onSelectStation]);

  // Fly to selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStation || !mapLoaded) return;

    if (selectedStation.latitude && selectedStation.longitude) {
      map.flyTo({
        center: [selectedStation.longitude, selectedStation.latitude],
        zoom: Math.max(map.getZoom(), 11.5),
        pitch: 65,
        bearing: map.getBearing(),
        duration: 1800,
      });
    }
  }, [selectedStation, mapLoaded]);

  // Reset 3D Pitch & Bearing
  const handleReset3DView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch: 60,
      bearing: -15,
      duration: 1000,
    });
  };

  // Top-down 2D in 3D canvas
  const handleTopDown = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
  };

  if (!isSupported) {
    return (
      <div className="w-full h-full min-h-[500px] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold">อุปกรณ์ไม่รองรับการแสดงผล 3D (WebGL)</h3>
          <p className="text-sm text-slate-400 max-w-md">
            เบราว์เซอร์หรือชิปประมวลผลกราฟิกของอุปกรณ์นี้ไม่สามารถเปิดใช้งาน WebGL 3D Terrain ได้
          </p>
        </div>
        <button
          onClick={onClose3D}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
        >
          กลับสู่แผนที่ 2D ปกติ
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Badge & Back to 2D Button (Top Left) */}
      <div className={`absolute top-4 left-3 sm:left-4 z-[700] flex items-center gap-2 ${isBottomSheetExpanded ? 'hidden lg:flex' : ''}`}>
        <button
          onClick={onClose3D}
          className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white shadow-xl backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="กลับไปที่แผนที่ 2D"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>กลับมุมมอง 2D</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
          <Mountain className="w-4 h-4 text-emerald-400" />
          <span>โหมดภูมิประเทศ 3D (Terrain Elevation)</span>
        </div>
      </div>

      {/* Floating 3D Controls (Top Right) */}
      <div className={`absolute top-4 right-3 sm:right-4 z-[700] flex flex-col items-end gap-2 ${isBottomSheetExpanded ? 'hidden lg:flex' : ''}`}>
        <div className="flex items-center gap-2">
          {/* Reset 3D Pitch / Bearing */}
          <button
            onClick={handleReset3DView}
            className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-800 shadow-xl backdrop-blur-md border border-slate-200/90 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="ปรับมุมเอียง 3D เหมาะสม (Pitch 60°)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">เอียง 3D</span>
          </button>

          {/* Top-down View */}
          <button
            onClick={handleTopDown}
            className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-800 shadow-xl backdrop-blur-md border border-slate-200/90 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="มองมุมตรงจากด้านบน"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">มุมบน</span>
          </button>

          {/* Exaggeration Selector */}
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-1 text-xs font-bold text-slate-700">
            <span className="px-2 text-[10px] text-slate-400 hidden sm:inline">ความชัน:</span>
            {[1.0, 1.6, 2.2].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setExaggeration(lvl)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  exaggeration === lvl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>

        {/* 3D Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStations(!showStations)}
            className={`min-h-[38px] px-3 py-1.5 rounded-2xl shadow-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showStations
                ? 'bg-white text-blue-600 border-blue-200'
                : 'bg-white/80 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>หมุดระดับน้ำ ({stations.length})</span>
          </button>

          {gistdaGeoJson && gistdaGeoJson.features && gistdaGeoJson.features.length > 0 && (
            <button
              onClick={() => setShowGistda(!showGistda)}
              className={`min-h-[38px] px-3 py-1.5 rounded-2xl shadow-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showGistda
                  ? 'bg-white text-sky-600 border-sky-200'
                  : 'bg-white/80 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>น้ำท่วม GISTDA</span>
            </button>
          )}
        </div>
      </div>

      {/* Legend & Navigation Tips (Bottom Left) */}
      <div className={`absolute bottom-6 left-3 sm:left-4 z-[700] max-w-xs ${isBottomSheetExpanded ? 'hidden lg:block' : ''}`}>
        <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-white text-[11px] shadow-2xl space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-xs text-sky-300">
            <Compass className="w-3.5 h-3.5" />
            <span>การควบคุมมุมมอง 3D</span>
          </div>
          <div className="text-slate-300 space-y-1 text-[10px]">
            <div>• <strong className="text-white">หมุนมุมมอง:</strong> กดคลิกขวาแล้วลาก (หรือสองนิ้วหมุนบนมือถือ)</div>
            <div>• <strong className="text-white">ปรับมุมก้ม-เงย:</strong> กด <kbd className="px-1 bg-white/20 rounded">Ctrl</kbd> + ลากเมาส์ซ้าย</div>
            <div>• <strong className="text-white">เลื่อนแผนที่:</strong> กดคลิกซ้ายแล้วลาก</div>
          </div>
        </div>
      </div>
    </div>
  );
};
