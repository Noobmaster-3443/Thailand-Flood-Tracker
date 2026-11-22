'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
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
import { BkkRoadFloodSensor } from '@/types/bkk-road-flood';
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
  bmaRoadSensors?: BkkRoadFloodSensor[];
  gistdaGeoJson?: GeoJSON.FeatureCollection | null;
  selectedStation: TelemetryStation | null;
  onSelectStation: (station: TelemetryStation | null) => void;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  onClose3D: () => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
  isBottomSheetExpanded?: boolean;
}

const severityColors: Record<SeverityLevel, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#10b981',
};

export const TelemetryMap3D: React.FC<TelemetryMap3DProps> = ({
  stations,
  bmaRoadSensors = [],
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

  // Build combined GeoJSON points for 3D rendering (Stations + BMA Road Sensors)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    // 1. Water telemetry stations
    stations.forEach((sta) => {
      if (!sta.latitude || !sta.longitude) return;
      const color = severityColors[sta.severity] || severityColors.green;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sta.longitude, sta.latitude],
        },
        properties: {
          id: sta.id,
          name: sta.name_th,
          type: 'station',
          severity: sta.severity,
          severityLabel: sta.severity_label || 'ระดับน้ำปกติ',
          color: color,
          waterLevel: sta.water_level_m_msl !== undefined ? `${sta.water_level_m_msl.toFixed(2)} ม.(รทก.)` : '-',
          capacity: sta.capacity_percentage !== undefined ? `${sta.capacity_percentage}%` : null,
          district: sta.district,
          province: sta.province || 'ปราจีนบุรี',
          river: sta.river_name || '',
          agency: sta.source_agency || 'HII',
          time: sta.observed_at ? sta.observed_at.slice(11, 16) : '',
        },
      });
    });

    // 2. BMA Road flood sensors
    bmaRoadSensors.forEach((sensor) => {
      if (!sensor.lat || !sensor.lng) return;
      const sevColor =
        sensor.status === 'critical'
          ? '#ef4444'
          : sensor.status === 'warning'
          ? '#f97316'
          : sensor.status === 'offline'
          ? '#64748b'
          : '#10b981';
      const sevLabel =
        sensor.status === 'critical'
          ? 'วิกฤต (> 10 ซม.)'
          : sensor.status === 'warning'
          ? 'เตือนภัย (5-10 ซม.)'
          : sensor.status === 'offline'
          ? 'ออฟไลน์'
          : 'ปกติ';

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sensor.lng, sensor.lat],
        },
        properties: {
          id: sensor.id,
          name: sensor.name,
          type: 'bma_road',
          severity: sensor.status,
          severityLabel: sevLabel,
          color: sevColor,
          waterLevel: sensor.waterLevelCm !== null ? `${sensor.waterLevelCm} ซม.` : '-',
          capacity: null,
          district: sensor.district,
          province: 'กรุงเทพมหานคร',
          river: 'ถนนในเขต กทม.',
          agency: 'BMA DDS',
          time: sensor.updatedAt ? sensor.updatedAt.slice(11, 16) : '',
        },
      });
    });

    const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features,
    };

    const source = map.getSource('telemetry-3d-source') as GeoJSONSource | undefined;
    if (source) {
      source.setData(geojsonData);
    } else {
      map.addSource('telemetry-3d-source', {
        type: 'geojson',
        data: geojsonData,
      });

      // Layer 1: Outer Glow Circle
      map.addLayer({
        id: 'telemetry-3d-glow',
        type: 'circle',
        source: 'telemetry-3d-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 7, 10, 11, 14, 18],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.35,
          'circle-pitch-alignment': 'map',
        },
      });

      // Layer 2: Core Marker Circle
      map.addLayer({
        id: 'telemetry-3d-core',
        type: 'circle',
        source: 'telemetry-3d-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 10, 6.5, 14, 9],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-pitch-alignment': 'map',
        },
      });

      // Layer 3: Text Label (Zoom in >= 10)
      map.addLayer({
        id: 'telemetry-3d-labels',
        type: 'symbol',
        source: 'telemetry-3d-source',
        minzoom: 10.5,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-max-width': 12,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2,
        },
      });

      // Cursor pointer on hover
      map.on('mouseenter', 'telemetry-3d-core', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'telemetry-3d-core', () => {
        map.getCanvas().style.cursor = '';
      });

      // Interactive Popup on Click
      map.on('click', 'telemetry-3d-core', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties as any;
        const geom = feat.geometry as GeoJSON.Point;

        if (popupRef.current) {
          popupRef.current.remove();
        }

        const isBma = props.type === 'bma_road';

        const popupHtml = `
          <div class="p-3 text-slate-800 font-sans max-w-[280px]">
            <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <span class="font-extrabold text-sm text-slate-900 line-clamp-1">${props.name}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style="background-color: ${props.color}">
                ${props.severityLabel}
              </span>
            </div>
            <div class="text-xs text-slate-600 space-y-1 mb-2">
              <div>📍 ${props.district}, ${props.province}</div>
              ${props.river ? `<div>🌊 ${isBma ? 'ตำแหน่ง' : 'ลำน้ำ'}: ${props.river}</div>` : ''}
              <div class="font-semibold text-slate-900 mt-1">
                ระดับน้ำ: <span class="font-bold text-sm" style="color: ${props.color}">${props.waterLevel}</span>
              </div>
              ${props.capacity ? `<div>ความจุลำน้ำ: <span class="font-bold">${props.capacity}</span></div>` : ''}
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>แหล่งข้อมูล: ${props.agency}</span>
              <span>${props.time ? props.time + ' น.' : ''}</span>
            </div>
          </div>
        `;

        const popup = new Popup({
          offset: 15,
          closeButton: true,
          className: 'shadow-2xl rounded-2xl overflow-hidden',
        })
          .setLngLat(geom.coordinates as [number, number])
          .setHTML(popupHtml)
          .addTo(map);

        popupRef.current = popup;

        // If it's a station, trigger selection callback
        if (!isBma) {
          const matchSta = stations.find((s) => s.id === props.id);
          if (matchSta) onSelectStation(matchSta);
        }
      });
    }
  }, [stations, bmaRoadSensors, mapLoaded, onSelectStation]);

  // Update Telemetry Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layers = ['telemetry-3d-glow', 'telemetry-3d-core', 'telemetry-3d-labels'];
    layers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', showStations ? 'visible' : 'none');
      }
    });
  }, [showStations, mapLoaded]);

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

  const totalPoints = stations.length + bmaRoadSensors.length;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-900">
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
            <span>จุดตรวจวัด ({totalPoints})</span>
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
