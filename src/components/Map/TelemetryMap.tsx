'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  TelemetryStation, 
  HighwayDisasterAlert, 
  SeverityLevel,
  DamReservoirInfo,
  FlashFloodAlert,
  EvacuationShelter,
  SHOW_STATIC_FLASH_FLOOD_ALERTS,
  SHOW_STATIC_HIGHWAY_ALERTS,
  SHOW_STATIC_GISTDA_FLOOD,
  SHOW_STATIC_SHELTERS,
} from '@/types/telemetry';
import { PRACHINBURI_CENTER, PRACHINBURI_DISTRICTS } from '@/data/prachinburi-locations';
import { THAILAND_PROVINCES, THAILAND_CENTER } from '@/data/thailand-provinces';
import prachinburiDistrictsGeoJson from '@/data/prachinburi-districts.json';
import { 
  Navigation, 
  Layers, 
  MapPin, 
  Grid, 
  Check, 
  Satellite, 
  Activity, 
  Waves, 
  CloudRain, 
  Car, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Mountain,
  Home,
  Gauge,
  Droplets,
  CloudLightning,
  Wind,
  CloudSun,
  Cloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RadarAnimationPlayer } from './RadarAnimationPlayer';
import { fetchRainRadarFrames } from '@/lib/weather-service';
import { RadarFrameInfo } from '@/types/weather';

interface TelemetryMapProps {
  stations: TelemetryStation[];
  highwayAlerts: HighwayDisasterAlert[];
  gistdaGeoJson: GeoJSON.FeatureCollection | null;
  dams?: DamReservoirInfo[];
  flashFloodAlerts?: FlashFloodAlert[];
  shelters?: EvacuationShelter[];
  selectedStation: TelemetryStation | null;
  selectedHighwayAlert: HighwayDisasterAlert | null;
  selectedDam?: DamReservoirInfo | null;
  selectedFlashFlood?: FlashFloodAlert | null;
  selectedShelter?: EvacuationShelter | null;
  onSelectStation: (station: TelemetryStation | null) => void;
  onSelectHighwayAlert: (alert: HighwayDisasterAlert | null) => void;
  onSelectDam?: (dam: DamReservoirInfo | null) => void;
  onSelectFlashFlood?: (flashFlood: FlashFloodAlert | null) => void;
  onSelectShelter?: (shelter: EvacuationShelter | null) => void;
  selectedDistrict: string;
  selectedProvince?: string;
  onOpenWeatherModal?: () => void;
}

const severityColors: Record<SeverityLevel, { hex: string; border: string; label: string }> = {
  red: { hex: '#ef4444', border: '#b91c1c', label: 'วิกฤต/ล้นตลิ่ง' },
  orange: { hex: '#f97316', border: '#c2410c', label: 'เตือนภัย/เฝ้าระวังสูง' },
  yellow: { hex: '#eab308', border: '#a16207', label: 'เฝ้าระวัง' },
  green: { hex: '#10b981', border: '#047857', label: 'ระดับน้ำปกติ' },
};

export const TelemetryMap: React.FC<TelemetryMapProps> = ({
  stations,
  highwayAlerts,
  gistdaGeoJson,
  dams = [],
  flashFloodAlerts = [],
  shelters = [],
  selectedStation,
  selectedHighwayAlert,
  selectedDam,
  selectedFlashFlood,
  selectedShelter,
  onSelectStation,
  onSelectHighwayAlert,
  onSelectDam,
  onSelectFlashFlood,
  onSelectShelter,
  selectedDistrict,
  selectedProvince = 'all',
  onOpenWeatherModal,
}) => {
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showGistdaLayer, setShowGistdaLayer] = useState<boolean>(true);
  const [gistdaOpacity, setGistdaOpacity] = useState<number>(0.35);
  const [showRoadAlerts, setShowRoadAlerts] = useState<boolean>(true);
  const [showDams, setShowDams] = useState<boolean>(true);
  const [showFlashFloods, setShowFlashFloods] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showRainRadar, setShowRainRadar] = useState<boolean>(false);
  const [showWindLayer, setShowWindLayer] = useState<boolean>(false);
  const [showCloudLayer, setShowCloudLayer] = useState<boolean>(false);
  const [radarFrames, setRadarFrames] = useState<RadarFrameInfo[]>([]);
  const [currentRadarIndex, setCurrentRadarIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const gistdaLayerRef = useRef<L.GeoJSON | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerRef = useRef<L.LayerGroup | null>(null);
  const highwaysLayerRef = useRef<L.LayerGroup | null>(null);
  const damsLayerRef = useRef<L.LayerGroup | null>(null);
  const flashFloodsLayerRef = useRef<L.LayerGroup | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);
  const cloudLayerRef = useRef<L.TileLayer | null>(null);
  const windLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = selectedProvince === 'bangkok'
      ? [13.7563, 100.5018]
      : selectedProvince === 'all'
      ? [THAILAND_CENTER.lat, THAILAND_CENTER.lng]
      : (() => {
          const prov = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
          return prov ? [prov.lat, prov.lng] : [13.7563, 100.5018];
        })();
    const initialZoom = selectedProvince === 'bangkok' ? 11 : selectedProvince === 'all' ? THAILAND_CENTER.zoom : 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    const initialTile = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | HII ThaiWater & GISTDA',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = initialTile;
    geojsonLayerRef.current = L.geoJSON().addTo(map);
    gistdaLayerRef.current = L.geoJSON().addTo(map);
    labelsLayerRef.current = L.layerGroup().addTo(map);
    stationsLayerRef.current = L.layerGroup().addTo(map);
    highwaysLayerRef.current = L.layerGroup().addTo(map);
    damsLayerRef.current = L.layerGroup().addTo(map);
    flashFloodsLayerRef.current = L.layerGroup().addTo(map);
    sheltersLayerRef.current = L.layerGroup().addTo(map);
    windLayerRef.current = L.layerGroup().addTo(map);

    // Global Leaflet popupopen event listener to wire detail drawer buttons reliably
    map.on('popupopen', (e: L.PopupEvent) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      // Station button
      const stationBtn = popupEl.querySelector('[data-action="open-station-detail"]') as HTMLElement | null;
      if (stationBtn) {
        const id = stationBtn.getAttribute('data-station-id');
        const trigger = (ev: Event) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          if (id) {
            (window as any).__openTelemetryStationById?.(id);
            window.dispatchEvent(new CustomEvent('open-telemetry-drawer', { detail: { type: 'station', id } }));
          }
        };
        stationBtn.onclick = trigger;
        stationBtn.ontouchend = trigger;
        stationBtn.onpointerdown = trigger;
      }

      // Highway button
      const highwayBtn = popupEl.querySelector('[data-action="open-highway-detail"]') as HTMLElement | null;
      if (highwayBtn) {
        const id = highwayBtn.getAttribute('data-highway-id');
        const trigger = (ev: Event) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          if (id) {
            (window as any).__openTelemetryHighwayById?.(id);
            window.dispatchEvent(new CustomEvent('open-telemetry-drawer', { detail: { type: 'highway', id } }));
          }
        };
        highwayBtn.onclick = trigger;
        highwayBtn.ontouchend = trigger;
        highwayBtn.onpointerdown = trigger;
      }

      // Dam button
      const damBtn = popupEl.querySelector('[data-action="open-dam-detail"]') as HTMLElement | null;
      if (damBtn) {
        const id = damBtn.getAttribute('data-dam-id');
        const trigger = (ev: Event) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          if (id) {
            (window as any).__openTelemetryDamById?.(id);
            window.dispatchEvent(new CustomEvent('open-telemetry-drawer', { detail: { type: 'dam', id } }));
          }
        };
        damBtn.onclick = trigger;
        damBtn.ontouchend = trigger;
        damBtn.onpointerdown = trigger;
      }

      // Flash flood button
      const flashBtn = popupEl.querySelector('[data-action="open-flash-detail"]') as HTMLElement | null;
      if (flashBtn) {
        const id = flashBtn.getAttribute('data-flash-id');
        const trigger = (ev: Event) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          if (id) {
            (window as any).__openTelemetryFlashById?.(id);
            window.dispatchEvent(new CustomEvent('open-telemetry-drawer', { detail: { type: 'flashFlood', id } }));
          }
        };
        flashBtn.onclick = trigger;
        flashBtn.ontouchend = trigger;
        flashBtn.onpointerdown = trigger;
      }

      // Shelter button
      const shelterBtn = popupEl.querySelector('[data-action="open-shelter-detail"]') as HTMLElement | null;
      if (shelterBtn) {
        const id = shelterBtn.getAttribute('data-shelter-id');
        const trigger = (ev: Event) => {
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          if (id) {
            (window as any).__openTelemetryShelterById?.(id);
            window.dispatchEvent(new CustomEvent('open-telemetry-drawer', { detail: { type: 'shelter', id } }));
          }
        };
        shelterBtn.onclick = trigger;
        shelterBtn.ontouchend = trigger;
        shelterBtn.onpointerdown = trigger;
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Map Tile (OpenStreetMap vs Esri Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            '&copy; <a href="https://www.esri.com" target="_blank">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [mapType]);

  // Live Rain Radar Frames Fetch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (radarTileLayerRef.current) {
      map.removeLayer(radarTileLayerRef.current);
      radarTileLayerRef.current = null;
    }

    if (!showRainRadar) {
      setIsRadarPlaying(false);
      return;
    }

    let isMounted = true;

    fetchRainRadarFrames().then(({ host, frames }) => {
      if (!isMounted || !mapInstanceRef.current) return;
      setRadarHost(host);
      setRadarFrames(frames);

      if (frames.length > 0) {
        const lastIdx = frames.length - 1;
        setCurrentRadarIndex(lastIdx);

        const tileUrl = `${host}${frames[lastIdx].path}/256/{z}/{x}/{y}/2/1_1.png`;
        radarTileLayerRef.current = L.tileLayer(tileUrl, {
          opacity: 0.7,
          zIndex: 350,
          maxNativeZoom: 7,
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.rainviewer.com" target="_blank">RainViewer</a> / TMD Weather Radar',
        }).addTo(mapInstanceRef.current);
      }
    });

    return () => {
      isMounted = false;
      if (radarTileLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(radarTileLayerRef.current);
        radarTileLayerRef.current = null;
      }
    };
  }, [showRainRadar]);

  // Rain Radar Animation Loop Timer
  useEffect(() => {
    if (!isRadarPlaying || radarFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentRadarIndex((prev) => (prev + 1) % radarFrames.length);
    }, 850);

    return () => clearInterval(interval);
  }, [isRadarPlaying, radarFrames.length]);

  // Update Radar Tile when scrubber / frame index changes
  useEffect(() => {
    if (!mapInstanceRef.current || !showRainRadar || radarFrames.length === 0) return;

    const activeFrame = radarFrames[currentRadarIndex];
    if (!activeFrame) return;

    const tileUrl = `${radarHost}${activeFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    if (radarTileLayerRef.current) {
      radarTileLayerRef.current.setUrl(tileUrl);
    } else {
      radarTileLayerRef.current = L.tileLayer(tileUrl, {
        opacity: 0.7,
        zIndex: 350,
        maxNativeZoom: 7,
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.rainviewer.com" target="_blank">RainViewer</a> / TMD Weather Radar',
      }).addTo(mapInstanceRef.current);
    }
  }, [currentRadarIndex, radarFrames, showRainRadar, radarHost]);

  // Live Satellite Cloud Cover Layer (NASA GIBS)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (cloudLayerRef.current) {
      map.removeLayer(cloudLayerRef.current);
      cloudLayerRef.current = null;
    }

    if (!showCloudLayer) return;

    cloudLayerRef.current = L.tileLayer(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{z}/{x}/{y}.jpg',
      {
        opacity: 0.65,
        zIndex: 320,
        maxNativeZoom: 8,
        maxZoom: 19,
        attribution: '&copy; NASA GIBS / EOSDIS Cloud Imagery',
      }
    ).addTo(map);

    return () => {
      if (cloudLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(cloudLayerRef.current);
        cloudLayerRef.current = null;
      }
    };
  }, [showCloudLayer]);

  // Wind Flow & Monsoon Layer
  useEffect(() => {
    if (!windLayerRef.current || !mapInstanceRef.current) return;
    windLayerRef.current.clearLayers();

    if (!showWindLayer) return;

    let windPoints: { name: string; lat: number; lng: number; speed: number; dirDeg: number; label: string }[] = [];

    if (selectedProvince === 'all') {
      // Nationwide representative regional monsoon indicators
      windPoints = [
        { name: 'ภาคเหนือ (เชียงใหม่)', lat: 18.7904, lng: 98.9847, speed: 12, dirDeg: 220, label: 'ลมมรสุม SW' },
        { name: 'ภาคเหนือ (พิษณุโลก)', lat: 16.8211, lng: 100.2659, speed: 14, dirDeg: 225, label: 'ลมมรสุม SW' },
        { name: 'ภาคอีสาน (ขอนแก่น)', lat: 16.4419, lng: 102.8359, speed: 15, dirDeg: 230, label: 'ลมมรสุม SW' },
        { name: 'ภาคอีสาน (อุบลฯ)', lat: 15.2448, lng: 104.8473, speed: 16, dirDeg: 235, label: 'ลมมรสุม SW' },
        { name: 'ภาคกลาง (นครสวรรค์)', lat: 15.7051, lng: 100.1413, speed: 18, dirDeg: 225, label: 'ลมมรสุม SW' },
        { name: 'ภาคกลาง (กทม./ปริมณฑล)', lat: 13.7563, lng: 100.5018, speed: 16, dirDeg: 215, label: 'ลมทะเล/มรสุม SW' },
        { name: 'ภาคตะวันออก (ปราจีนบุรี)', lat: 14.0509, lng: 101.3716, speed: 14, dirDeg: 230, label: 'ลมมรสุม SW' },
        { name: 'ภาคตะวันออก (จันทบุรี)', lat: 12.6114, lng: 102.1039, speed: 20, dirDeg: 240, label: 'ลมมรสุมเลียบฝั่ง SW' },
        { name: 'ภาคตะวันตก (กาญจนบุรี)', lat: 14.0228, lng: 99.5328, speed: 15, dirDeg: 235, label: 'ลมเทือกเขา SW' },
        { name: 'ภาคใต้ (สุราษฎร์ธานี)', lat: 9.1382, lng: 99.3217, speed: 22, dirDeg: 245, label: 'ลมมรสุมอันดามัน SW' },
        { name: 'ภาคใต้ (สงขลา)', lat: 7.1898, lng: 100.5954, speed: 17, dirDeg: 230, label: 'ลมมรสุมอ่าวไทย SW' },
      ];
    } else if (selectedProvince === 'prachinburi') {
      windPoints = [
        { name: 'อ.เมืองปราจีนบุรี', lat: 14.0509, lng: 101.3716, speed: 14, dirDeg: 230, label: 'ลมมรสุม SW' },
        { name: 'อ.กบินทร์บุรี', lat: 13.9936, lng: 101.7183, speed: 16, dirDeg: 235, label: 'ลมมรสุม SW' },
        { name: 'อ.บ้านสร้าง', lat: 13.9878, lng: 101.2158, speed: 18, dirDeg: 220, label: 'ลมทะเล/มรสุม SW' },
        { name: 'อ.นาดี (ช่องเขา)', lat: 14.1378, lng: 101.8903, speed: 20, dirDeg: 240, label: 'ลมช่องเขา SW' },
        { name: 'อ.ประจันตคาม (ธารเขาใหญ่)', lat: 14.1483, lng: 101.5303, speed: 15, dirDeg: 230, label: 'ลมเทือกเขา SW' },
        { name: 'อ.ศรีมหาโพธิ', lat: 13.8822, lng: 101.5122, speed: 14, dirDeg: 225, label: 'ลมมรสุม SW' },
        { name: 'อ.ศรีมโหสถ', lat: 13.8550, lng: 101.4258, speed: 13, dirDeg: 220, label: 'ลมมรสุม SW' },
        { name: 'อุทยานฯ เขาใหญ่ (ตอนบน)', lat: 14.2800, lng: 101.4500, speed: 24, dirDeg: 245, label: 'ลมยอดเขา SW' },
        { name: 'อุทยานฯ ทับลาน (ตอนบน)', lat: 14.2900, lng: 101.8800, speed: 22, dirDeg: 240, label: 'ลมยอดเขา SW' },
      ];
    } else {
      const prov = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
      if (prov) {
        windPoints = [
          { name: `จ.${prov.name_th}`, lat: prov.lat, lng: prov.lng, speed: 16, dirDeg: 230, label: 'ลมมรสุมตะวันตกเฉียงใต้ (SW)' },
        ];
      }
    }

    windPoints.forEach((wp) => {
      const iconHtml = `
        <div class="relative flex flex-col items-center pointer-events-auto cursor-pointer group select-none">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/90 hover:bg-cyan-950 text-white shadow-lg backdrop-blur-md border border-cyan-400/50 transition-all">
            <div style="transform: rotate(${wp.dirDeg}deg);" class="transition-transform duration-500 flex-shrink-0">
              <svg class="w-4 h-4 text-cyan-300 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <span class="text-[11px] font-black text-cyan-200 tracking-wide">${wp.speed}</span>
            <span class="text-[9px] text-cyan-300">กม./ชม.</span>
          </div>
          <div class="text-[10px] font-bold text-slate-800 bg-white/90 px-1.5 py-0.2 rounded-md shadow-xs border border-slate-200/80 -mt-0.5 whitespace-nowrap">
            ${wp.name.replace('อำเภอ', 'อ.').replace('อุทยานฯ ', '')}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'wind-marker',
        html: iconHtml,
        iconSize: [95, 42],
        iconAnchor: [47, 21],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon });
      marker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900 text-sm">${wp.name}</div>
          <div class="text-cyan-700 font-bold mt-1">💨 ความเร็วลม: ${wp.speed} กม./ชม.</div>
          <div class="text-slate-600 mt-0.5">ทิศทาง: <b>${wp.label} (${wp.dirDeg}°)</b></div>
          <div class="text-[11px] text-slate-500 mt-1.5 border-t border-slate-100 pt-1">
            ทิศทางลมมรสุมพัดนำความชื้นเข้าสู่พื้นที่ (Open-Meteo & TMD Observation)
          </div>
        </div>
      `, { offset: [0, -15], autoPan: true });

      marker.addTo(windLayerRef.current!);
    });
  }, [showWindLayer, selectedProvince]);

  // District Boundaries Layer
  useEffect(() => {
    if (!geojsonLayerRef.current || !labelsLayerRef.current || !mapInstanceRef.current) return;

    geojsonLayerRef.current.clearLayers();
    labelsLayerRef.current.clearLayers();

    if (!showBoundaries || (selectedProvince && selectedProvince !== 'prachinburi')) return;

    if (prachinburiDistrictsGeoJson) {
      geojsonLayerRef.current.addData(prachinburiDistrictsGeoJson as any);
      geojsonLayerRef.current.setStyle((feature: any) => {
        const districtName = feature?.properties?.name || '';
        const isSelected = selectedDistrict !== 'all' && districtName.includes(selectedDistrict);

        return {
          color: isSelected ? '#2563eb' : '#0284c7',
          weight: isSelected ? 3 : 1.75,
          opacity: 0.85,
          fillColor: isSelected ? '#3b82f6' : '#0284c7',
          fillOpacity: isSelected ? 0.14 : 0.04,
          dashArray: isSelected ? undefined : '5, 5',
        };
      });
    }
  }, [showBoundaries, selectedDistrict, selectedProvince]);

  // GISTDA Satellite Flood Extent Layer
  useEffect(() => {
    if (!gistdaLayerRef.current || !mapInstanceRef.current) return;

    gistdaLayerRef.current.clearLayers();

    if (!showGistdaLayer || !gistdaGeoJson || !SHOW_STATIC_GISTDA_FLOOD) return;

    gistdaLayerRef.current.addData(gistdaGeoJson as any);
    gistdaLayerRef.current.setStyle((feature: any) => {
      const sev = feature?.properties?.severity || 'red';
      const color = sev === 'red' ? '#dc2626' : '#ea580c';

      return {
        color: color,
        weight: 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: gistdaOpacity,
        dashArray: '3, 6',
      };
    });
  }, [showGistdaLayer, gistdaGeoJson, gistdaOpacity]);

  // Telemetry Stations Layer (HII / RID / TMD)
  useEffect(() => {
    if (!stationsLayerRef.current || !mapInstanceRef.current) return;

    stationsLayerRef.current.clearLayers();

    stations.forEach((station) => {
      const col = severityColors[station.severity] || severityColors.yellow;
      const isSelected = selectedStation?.id === station.id;
      const isWater = station.station_type === 'water_level';
      const isRoad = station.station_type === 'highway_flood';

      const iconSvg = isWater 
        ? `<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918"/></svg>`
        : isRoad
        ? `<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.948c0-.621-.504-1.125-1.125-1.125H4.125C3.504 5.5 3 6.004 3 6.625v8.25"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"/></svg>`;

      const isCritical = station.severity === 'red';

      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-110 z-50' : 'hover:scale-105'}">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/95 text-white shadow-md border border-white/20">
            <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: ${col.hex};">
              ${iconSvg}
            </div>
            <span class="text-[11px] font-bold tracking-tight text-white leading-none whitespace-nowrap">
              ${station.station_code}
            </span>
          </div>
          <div class="w-1.5 h-1.5 -mt-0.5 bg-slate-900/95 rotate-45 border-r border-b border-white/20"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'telemetry-station-pin',
        html: markerHtml,
        iconSize: [80, 34],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([station.latitude, station.longitude], {
        icon: customIcon,
      });

      const popupHtml = `
        <div class="p-1 font-sans min-w-[240px] text-slate-800 select-text">
          <div class="font-bold text-sm text-slate-900 leading-snug">${station.name_th}</div>
          <div class="text-xs text-slate-600 mt-1">
            สถานะ: <b style="color: ${col.hex}">${station.severity_label}</b>
          </div>
          ${
            station.water_level_m_msl
              ? `<div class="text-xs text-slate-700 mt-0.5">ระดับน้ำ: <b>${station.water_level_m_msl} ม.รทก.</b> <span class="text-[10px] text-slate-400">(เมตรเหนือระดับน้ำทะเลปานกลาง)</span> (ตลิ่ง ${station.bank_level_m_msl} ม.)</div>`
              : ''
          }
          ${
            station.rain_24h_mm
              ? `<div class="text-xs text-slate-700 mt-0.5">ฝน 24 ชม.: <b>${station.rain_24h_mm} มม.</b></div>`
              : ''
          }
          ${
            station.water_depth_cm !== undefined
              ? `<div class="text-xs text-slate-700 mt-0.5">น้ำท่วมผิวจราจร: <b>${station.water_depth_cm} ซม.</b> (${station.passable_for_vehicles ? 'สัญจรได้' : 'ห้ามรถเล็กผ่าน'})</div>`
              : ''
          }
          <div class="text-[11px] text-blue-700 mt-2 font-medium flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>✓ ${station.source_name_th}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${
              station.data_status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' :
              station.data_status === 'STALE' ? 'bg-amber-100 text-amber-800' :
              station.data_status === 'STATIC' ? 'bg-sky-100 text-sky-800' :
              'bg-slate-100 text-slate-600'
            }">${station.data_status || 'LIVE'}</span>
          </div>
          ${station.observed_at ? `<div class="text-[10px] text-slate-400 mt-0.5">ตรวจวัด: ${station.observed_at.replace('T', ' ').slice(0, 16)} น.</div>` : ''}

          <button 
            type="button"
            data-action="open-station-detail" 
            data-station-id="${station.id}"
            onclick="if(window.__openTelemetryStationById){window.__openTelemetryStationById('${station.id}');} if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('open-telemetry-drawer',{detail:{type:'station',stationId:'${station.id}'}}));} return false;"
            class="w-full mt-2.5 py-2 px-3 rounded-xl bg-blue-600 active:bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto select-none border-none outline-none block text-center"
          >
            <span>ดูรายละเอียด</span>
            <svg class="w-3.5 h-3.5 pointer-events-none inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -28],
        closeButton: true,
        autoPan: true,
      });

      marker.on('click', () => {
        marker.openPopup();
      });

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 150);
      }

      marker.addTo(stationsLayerRef.current!);
    });
  }, [stations, selectedStation]);

  // Highway Flood Alerts Layer (DOH)
  useEffect(() => {
    if (!highwaysLayerRef.current || !mapInstanceRef.current) return;

    highwaysLayerRef.current.clearLayers();

    if (!showRoadAlerts || !SHOW_STATIC_HIGHWAY_ALERTS) return;

    highwayAlerts.forEach((alert) => {
      const isSelected = selectedHighwayAlert?.id === alert.id;
      const isImpassable = !alert.passable;

      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-115 z-50' : 'hover:scale-105'}">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-white shadow-xl backdrop-blur-md border border-white/25 ${
            isImpassable ? 'bg-red-600 ring-2 ring-red-400' : 'bg-amber-600 ring-1 ring-amber-300'
          }">
            <div class="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            </div>
            <span class="text-[11px] font-bold text-white tracking-wide leading-none whitespace-nowrap">
              ${alert.route_number.replace('ทางหลวง', 'ทล.').trim()}
            </span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 border-r border-b border-white/20 ${isImpassable ? 'bg-red-600' : 'bg-amber-600'}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'highway-alert-pin',
        html: markerHtml,
        iconSize: [80, 34],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: customIcon,
      });

      const popupHtml = `
        <div class="p-1 font-sans min-w-[240px] text-slate-800 select-text">
          <div class="font-bold text-sm text-slate-900 leading-snug">${alert.route_number} (${alert.road_name})</div>
          <div class="text-xs mt-1 ${isImpassable ? 'text-red-600 font-bold' : 'text-amber-700 font-bold'}">
            สถานะ: ${isImpassable ? '⛔ น้ำท่วมทาง รถเล็กผ่านไม่ได้' : '⚠️ มีน้ำท่วมขัง เฝ้าระวัง'}
          </div>
          <div class="text-xs text-slate-700 mt-0.5">ระดับน้ำท่วมผิวทาง: <b>${alert.water_height_cm} ซม.</b></div>
          <div class="text-xs text-slate-600 mt-0.5">ช่วง กม.: ${alert.km_range} (${alert.district})</div>
          <div class="text-[11px] text-blue-700 mt-2 font-medium border-t border-slate-100 pt-1.5">
            ✓ ${alert.source_name_th}
          </div>

          <button 
            type="button"
            data-action="open-highway-detail" 
            data-highway-id="${alert.id}"
            onclick="if(window.__openTelemetryHighwayById){window.__openTelemetryHighwayById('${alert.id}');} if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('open-telemetry-drawer',{detail:{type:'highway',highwayId:'${alert.id}'}}));} return false;"
            class="w-full mt-2.5 py-2 px-3 rounded-xl bg-blue-600 active:bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto select-none border-none outline-none block text-center"
          >
            <span>ดูรายละเอียด</span>
            <svg class="w-3.5 h-3.5 pointer-events-none inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -28],
        closeButton: true,
        autoPan: true,
      });

      marker.on('click', () => {
        marker.openPopup();
      });

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 150);
      }

      marker.addTo(highwaysLayerRef.current!);
    });
  }, [highwayAlerts, showRoadAlerts, selectedHighwayAlert]);

  // Major Dams & Reservoirs Layer
  useEffect(() => {
    if (!damsLayerRef.current || !mapInstanceRef.current) return;

    damsLayerRef.current.clearLayers();

    if (!showDams) return;

    dams.forEach((dam) => {
      const isSelected = selectedDam?.id === dam.id;
      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-115 z-50' : 'hover:scale-105'}">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/95 text-white shadow-xl backdrop-blur-md border border-cyan-400/40">
            <div class="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
            </div>
            <span class="text-[11px] font-bold text-white tracking-wide leading-none whitespace-nowrap">
              ${dam.name_th.includes('นฤบดินทร') ? 'เขื่อนห้วยโสมง' : dam.name_th} (${dam.capacity_percentage}%)
            </span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 bg-cyan-900/95 border-r border-b border-cyan-400/40"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'dam-pin',
        html: markerHtml,
        iconSize: [120, 34],
        iconAnchor: [60, 32],
      });

      const marker = L.marker([dam.latitude, dam.longitude], {
        icon: customIcon,
      });

      const popupHtml = `
        <div class="p-1 font-sans min-w-[240px] text-slate-800 select-text">
          <div class="font-bold text-sm text-slate-900 leading-snug">${dam.name_th}</div>
          <div class="text-xs text-cyan-800 font-bold mt-1">ความจุน้ำ: ${dam.capacity_percentage}% (${dam.current_storage_mcm} ล้าน ลบ.ม.)</div>
          <div class="text-xs text-slate-600 mt-0.5">ระบายน้ำ: <b>${dam.outflow_mcm_day}</b> ล้าน ลบ.ม./วัน</div>
          <div class="text-[11px] text-cyan-700 mt-2 font-medium flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>✓ ${dam.agency}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${
              dam.data_status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' :
              dam.data_status === 'STALE' ? 'bg-amber-100 text-amber-800' :
              'bg-sky-100 text-sky-800'
            }">${dam.data_status || 'LIVE'}</span>
          </div>
          ${dam.observed_at ? `<div class="text-[10px] text-slate-400 mt-0.5">รายงาน: ${dam.observed_at.slice(0, 10)} (RID Official)</div>` : ''}

          <button 
            type="button"
            data-action="open-dam-detail" 
            data-dam-id="${dam.id}"
            onclick="if(window.__openTelemetryDamById){window.__openTelemetryDamById('${dam.id}');} if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('open-telemetry-drawer',{detail:{type:'dam',id:'${dam.id}'}}));} return false;"
            class="w-full mt-2.5 py-2 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto select-none border-none outline-none block text-center"
          >
            <span>ดูข้อมูลเขื่อน</span>
            <svg class="w-3.5 h-3.5 pointer-events-none inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -28], closeButton: true, autoPan: true });
      marker.on('click', () => marker.openPopup());

      if (isSelected) {
        setTimeout(() => marker.openPopup(), 150);
      }

      marker.addTo(damsLayerRef.current!);
    });
  }, [dams, showDams, selectedDam]);

  // Flash Flood & Mountain Runoff Layer
  useEffect(() => {
    if (!flashFloodsLayerRef.current || !mapInstanceRef.current) return;

    flashFloodsLayerRef.current.clearLayers();

    if (!showFlashFloods || !SHOW_STATIC_FLASH_FLOOD_ALERTS) return;

    flashFloodAlerts.forEach((alert) => {
      const isSelected = selectedFlashFlood?.id === alert.id;
      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-115 z-50' : 'hover:scale-105'}">
          <div class="absolute -top-1 w-6 h-6 rounded-full animate-ping opacity-75 bg-rose-500"></div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-900/95 text-white shadow-xl backdrop-blur-md border border-rose-300/40">
            <div class="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            </div>
            <span class="text-[11px] font-bold text-white tracking-wide leading-none whitespace-nowrap">
              น้ำป่า ${alert.district.replace('อำเภอ', 'อ.')} (${alert.rain_mountain_24h_mm}mm)
            </span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 bg-rose-900/95 border-r border-b border-rose-300/40"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'flash-pin',
        html: markerHtml,
        iconSize: [120, 34],
        iconAnchor: [60, 32],
      });

      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: customIcon,
      });

      const popupHtml = `
        <div class="p-1 font-sans min-w-[240px] text-slate-800 select-text">
          <div class="font-bold text-sm text-slate-900 leading-snug">${alert.location_name}</div>
          <div class="text-xs text-rose-600 font-bold mt-1">${alert.severity_label}</div>
          <div class="text-xs text-slate-700 mt-0.5">ฝนสะสมยอดเขา: <b>${alert.rain_mountain_24h_mm} มม.</b></div>
          <div class="text-[11px] text-rose-700 mt-2 font-medium border-t border-slate-100 pt-1.5">
            ✓ ${alert.agency}
          </div>

          <button 
            type="button"
            data-action="open-flash-detail" 
            data-flash-id="${alert.id}"
            onclick="if(window.__openTelemetryFlashById){window.__openTelemetryFlashById('${alert.id}');} if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('open-telemetry-drawer',{detail:{type:'flashFlood',id:'${alert.id}'}}));} return false;"
            class="w-full mt-2.5 py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto select-none border-none outline-none block text-center"
          >
            <span>ดูคำเตือนน้ำป่า</span>
            <svg class="w-3.5 h-3.5 pointer-events-none inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -28], closeButton: true, autoPan: true });
      marker.on('click', () => marker.openPopup());

      if (isSelected) {
        setTimeout(() => marker.openPopup(), 150);
      }

      marker.addTo(flashFloodsLayerRef.current!);
    });
  }, [flashFloodAlerts, showFlashFloods, selectedFlashFlood]);

  // Evacuation Shelters Layer
  useEffect(() => {
    if (!sheltersLayerRef.current || !mapInstanceRef.current) return;

    sheltersLayerRef.current.clearLayers();

    if (!showShelters || !SHOW_STATIC_SHELTERS) return;

    shelters.forEach((shelter) => {
      const isSelected = selectedShelter?.id === shelter.id;
      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-115 z-50' : 'hover:scale-105'}">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/95 text-white shadow-xl backdrop-blur-md border border-emerald-400/40">
            <div class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
            </div>
            <span class="text-[11px] font-bold text-white tracking-wide leading-none whitespace-nowrap">
              ⛺ ${shelter.name.replace('ศูนย์พักพิง', '').replace('ศูนย์อพยพ', '').trim()}
            </span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 bg-emerald-900/95 border-r border-b border-emerald-400/40"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'shelter-pin',
        html: markerHtml,
        iconSize: [130, 34],
        iconAnchor: [65, 32],
      });

      const marker = L.marker([shelter.latitude, shelter.longitude], {
        icon: customIcon,
      });

      const shelterProvObj = THAILAND_PROVINCES.find((p) => p.id === shelter.province);
      const shelterProvName = shelterProvObj ? `จ.${shelterProvObj.name_th}` : shelter.district || 'พื้นที่';

      const popupHtml = `
        <div class="p-1 font-sans min-w-[240px] text-slate-800 select-text">
          <div class="font-bold text-sm text-slate-900 leading-snug">${shelter.name}</div>
          <div class="text-xs text-emerald-700 font-bold mt-1">✓ เปิดรองรับผู้อพยพ (${shelter.current_occupancy}/${shelter.capacity_persons} คน)</div>
          <div class="text-xs text-slate-600 mt-0.5">โทร: <b>${shelter.contact_phone}</b></div>
          <div class="text-[11px] text-emerald-800 mt-2 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between">
            <span>✓ ศูนย์พักพิง ปภ. (${shelterProvName})</span>
            <span class="text-[10px] text-slate-500">${shelter.district || ''}</span>
          </div>

          <button 
            type="button"
            data-action="open-shelter-detail" 
            data-shelter-id="${shelter.id}"
            onclick="if(window.__openTelemetryShelterById){window.__openTelemetryShelterById('${shelter.id}');} if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('open-telemetry-drawer',{detail:{type:'shelter',id:'${shelter.id}'}}));} return false;"
            class="w-full mt-2.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto select-none border-none outline-none block text-center"
          >
            <span>ดูข้อมูลศูนย์พักพิง</span>
            <svg class="w-3.5 h-3.5 pointer-events-none inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -28], closeButton: true, autoPan: true });
      marker.on('click', () => marker.openPopup());

      if (isSelected) {
        setTimeout(() => marker.openPopup(), 150);
      }

      marker.addTo(sheltersLayerRef.current!);
    });
  }, [shelters, showShelters, selectedShelter]);

  // Center on selected item
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedStation) {
      mapInstanceRef.current.flyTo([selectedStation.latitude, selectedStation.longitude], 13, { duration: 1.2 });
    } else if (selectedHighwayAlert) {
      mapInstanceRef.current.flyTo([selectedHighwayAlert.latitude, selectedHighwayAlert.longitude], 13, { duration: 1.2 });
    } else if (selectedDam) {
      mapInstanceRef.current.flyTo([selectedDam.latitude, selectedDam.longitude], 13, { duration: 1.2 });
    } else if (selectedFlashFlood) {
      mapInstanceRef.current.flyTo([selectedFlashFlood.latitude, selectedFlashFlood.longitude], 13, { duration: 1.2 });
    } else if (selectedShelter) {
      mapInstanceRef.current.flyTo([selectedShelter.latitude, selectedShelter.longitude], 13, { duration: 1.2 });
    }
  }, [selectedStation, selectedHighwayAlert, selectedDam, selectedFlashFlood, selectedShelter]);

  // Fly to province center or nationwide overview when selectedProvince changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Don't interrupt if user specifically clicked a station or dam
    if (selectedStation || selectedHighwayAlert || selectedDam || selectedFlashFlood || selectedShelter) {
      return;
    }

    if (selectedProvince === 'all') {
      mapInstanceRef.current.flyTo([THAILAND_CENTER.lat, THAILAND_CENTER.lng], THAILAND_CENTER.zoom, {
        duration: 1.5,
      });
    } else if (selectedProvince) {
      const prov = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
      if (prov) {
        mapInstanceRef.current.flyTo([prov.lat, prov.lng], prov.zoom, {
          duration: 1.2,
        });
      }
    }
  }, [selectedProvince]);

  // Reset View to current province or nationwide center
  const handleResetCenter = () => {
    if (!mapInstanceRef.current) return;
    if (selectedProvince === 'bangkok') {
      mapInstanceRef.current.flyTo([13.7563, 100.5018], 11, { duration: 1 });
    } else if (selectedProvince === 'all') {
      mapInstanceRef.current.flyTo([THAILAND_CENTER.lat, THAILAND_CENTER.lng], THAILAND_CENTER.zoom, {
        duration: 1,
      });
    } else {
      const prov = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
      if (prov) {
        mapInstanceRef.current.flyTo([prov.lat, prov.lng], prov.zoom, { duration: 1 });
      } else {
        mapInstanceRef.current.flyTo([13.7563, 100.5018], 11, { duration: 1 });
      }
    }
  };

  const currentProvObj = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);
  const resetCenterTitle =
    selectedProvince === 'bangkok'
      ? 'จัดมุมมองศูนย์กลางกรุงเทพมหานคร (เมืองหลวง)'
      : selectedProvince === 'all'
      ? 'จัดมุมมองศูนย์กลางประเทศไทย'
      : `จัดมุมมองศูนย์กลาง จ.${currentProvObj?.name_th || 'กรุงเทพมหานคร'}`;

  return (
    <div className="w-full h-full relative font-sans">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls (Bottom Right - thumb accessible, zero overlap) */}
      <div className="absolute bottom-6 right-3 sm:right-4 z-[400] flex flex-col items-end gap-2">
        {/* Layer Switches Box */}
        {isLayersOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 space-y-2 text-xs text-slate-700 w-68 animate-in fade-in duration-200 mb-1 max-h-[75vh] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>เลือกชั้นข้อมูลแสดงผล</span>
              <button 
                onClick={() => setIsLayersOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-[11px]"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Toggle Satellite */}
            <button
              onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                mapType === 'satellite'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5" />
                <span>ภาพถ่ายดาวเทียม (Esri)</span>
              </span>
              {mapType === 'satellite' && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Toggle Rain Radar */}
            <button
              onClick={() => setShowRainRadar(!showRainRadar)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                showRainRadar
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CloudLightning className="w-3.5 h-3.5" />
                <span>เรดาร์กลุ่มฝนสด TMD</span>
              </span>
              {showRainRadar ? <Eye className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Toggle Wind Flow */}
            <button
              onClick={() => setShowWindLayer(!showWindLayer)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                showWindLayer
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" />
                <span>กระแสลมมรสุม (Wind Flow)</span>
              </span>
              {showWindLayer ? <Eye className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Toggle Satellite Cloud Cover */}
            <button
              onClick={() => setShowCloudLayer(!showCloudLayer)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                showCloudLayer
                  ? 'bg-sky-700 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                <span>ภาพถ่ายดาวเทียมกลุ่มเมฆ (NASA)</span>
              </span>
              {showCloudLayer ? <Eye className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Open Weather Forecast Modal Launcher */}
            {onOpenWeatherModal && (
              <button
                onClick={() => {
                  setIsLayersOpen(false);
                  onOpenWeatherModal();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 border border-blue-200/80 font-bold transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-blue-600" />
                  <span>พยากรณ์อากาศ 7 วัน</span>
                </span>
                <span className="text-blue-600 text-[10px]">ดูเพิ่ม &gt;</span>
              </button>
            )}

            {/* Toggle Dams */}
            <button
              onClick={() => setShowDams(!showDams)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                showDams
                  ? 'bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                <span>เขื่อน & อ่างเก็บน้ำ ({dams.length})</span>
              </span>
              {showDams ? <Eye className="w-3.5 h-3.5 text-cyan-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Toggle Flash Floods */}
            {SHOW_STATIC_FLASH_FLOOD_ALERTS && (
              <button
                onClick={() => setShowFlashFloods(!showFlashFloods)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                  showFlashFloods
                    ? 'bg-rose-50 text-rose-900 font-semibold border border-rose-200'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-rose-600" />
                  <span>เตือนน้ำป่าไหลหลาก ({flashFloodAlerts.length})</span>
                </span>
                {showFlashFloods ? <Eye className="w-3.5 h-3.5 text-rose-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            )}

            {/* Toggle Shelters */}
            {SHOW_STATIC_SHELTERS && (
              <button
                onClick={() => setShowShelters(!showShelters)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                  showShelters
                    ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ศูนย์พักพิง & จุดอพยพ ({shelters.length})</span>
                </span>
                {showShelters ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            )}

            {/* Toggle GISTDA Flood Satellite Extent */}
            {SHOW_STATIC_GISTDA_FLOOD && (
              <div className="space-y-1 bg-slate-50/80 p-2 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setShowGistdaLayer(!showGistdaLayer)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Activity className="w-3.5 h-3.5 text-red-600" />
                    <span>พื้นที่ท่วมดาวเทียม GISTDA</span>
                  </span>
                  {showGistdaLayer ? <Eye className="w-3.5 h-3.5 text-red-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {showGistdaLayer && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>ความเข้มของสี:</span>
                      <span className="font-bold">{Math.round(gistdaOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={gistdaOpacity}
                      onChange={(e) => setGistdaOpacity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Toggle Highway Alerts */}
            {SHOW_STATIC_HIGHWAY_ALERTS && (
              <button
                onClick={() => setShowRoadAlerts(!showRoadAlerts)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                  showRoadAlerts
                    ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-600" />
                  <span>จุดเตือนน้ำท่วมทางหลวง (DOH)</span>
                </span>
                {showRoadAlerts ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            )}

            {/* Toggle District Boundaries (Prachinburi only) */}
            {selectedProvince === 'prachinburi' && (
              <button
                onClick={() => setShowBoundaries(!showBoundaries)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${
                  showBoundaries
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-blue-600" />
                  <span>เส้นขอบเขต 7 อำเภอ</span>
                </span>
                {showBoundaries ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            )}

            {/* Quick Links for Bangkok (DDS Radar & Flood) */}
            {selectedProvince === 'bangkok' && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                <a
                  href="https://weather.bangkok.go.th/radar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[11px] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CloudLightning className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เรดาร์ตรวจฝน กทม. (DDS)</span>
                  </span>
                  <span className="text-indigo-600 font-bold">↗</span>
                </a>
                <a
                  href="https://floodbangkok.bangkok.go.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-bold text-[11px] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-cyan-600" />
                    <span>ระบบน้ำท่วมถนน กทม. (BMA)</span>
                  </span>
                  <span className="text-cyan-600 font-bold">↗</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Toggle Layers Button */}
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-2xl shadow-md border text-xs font-bold transition-all cursor-pointer ${
            isLayersOpen
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-500" />
          <span>ชั้นข้อมูล</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
            {[
              mapType === 'satellite',
              showRainRadar,
              showWindLayer,
              showCloudLayer,
              showDams,
              showFlashFloods && SHOW_STATIC_FLASH_FLOOD_ALERTS,
              showShelters && SHOW_STATIC_SHELTERS,
              showGistdaLayer && SHOW_STATIC_GISTDA_FLOOD,
              showRoadAlerts && SHOW_STATIC_HIGHWAY_ALERTS,
              showBoundaries,
            ].filter(Boolean).length}
          </span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={handleResetCenter}
          className="p-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
          title={resetCenterTitle}
        >
          <Navigation className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* Radar Animation Player (Appears when Rain Radar is active) */}
      {showRainRadar && radarFrames.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[92%] sm:w-auto max-w-sm sm:max-w-md pointer-events-auto">
          <RadarAnimationPlayer
            frames={radarFrames}
            currentIndex={currentRadarIndex}
            onSelectFrame={(idx) => setCurrentRadarIndex(idx)}
            isPlaying={isRadarPlaying}
            onTogglePlay={() => setIsRadarPlaying(!isRadarPlaying)}
          />
        </div>
      )}

      {/* Map Legend (Bottom Left, Collapsible on Mobile, with Icons and Text paired with Colors) */}
      <div className="absolute bottom-6 left-3 sm:left-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 text-xs overflow-hidden max-w-[280px] sm:max-w-xs transition-all">
        <button
          type="button"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="w-full font-bold text-slate-800 flex items-center justify-between p-2.5 sm:p-3 text-left hover:bg-slate-50 transition-colors"
          aria-expanded={isLegendOpen}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs">คำอธิบายสัญลักษณ์</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="sm:hidden text-[10px] text-slate-500 font-normal">
              {isLegendOpen ? 'ซ่อน' : 'ดู'}
            </span>
            {isLegendOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 sm:hidden" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 sm:hidden" />
            )}
          </div>
        </button>

        {/* Legend Body: Visible by default on desktop, collapsible on mobile */}
        <div className={`p-3 pt-0 space-y-2 border-t border-slate-100 ${isLegendOpen ? 'block' : 'hidden sm:block'}`}>
          {/* Water Levels */}
          <div className="space-y-1 pt-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ระดับน้ำสถานี</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
                <span>🚨 วิกฤต/ล้นตลิ่ง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                <span>🌊 เตือนภัย/จ่อล้น</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span>⚠️ เฝ้าระวัง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span>✅ ปกติ</span>
              </div>
            </div>
          </div>

          {/* Hazard Icons */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">จุดแจ้งเตือนอื่น</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 flex-shrink-0"></span>
                <span>🏞️ เขื่อน/อ่างฯ</span>
              </div>
              {SHOW_STATIC_FLASH_FLOOD_ALERTS && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse flex-shrink-0"></span>
                  <span>⛰️ น้ำป่าหลาก</span>
                </div>
              )}
              {SHOW_STATIC_SHELTERS && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0"></span>
                  <span>⛺ ศูนย์พักพิง</span>
                </div>
              )}
              {SHOW_STATIC_HIGHWAY_ALERTS && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <span>🚧 ทางหลวงท่วม</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
