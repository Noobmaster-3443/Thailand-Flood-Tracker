# 3D Terrain Map Integration Design Document

**Date:** 2026-11-22  
**Status:** Approved  
**Topic:** 3D Terrain Map with MapLibre GL JS & Open Terrain-RGB DEM  

## 1. Intent & The "Why"
Thailand Flood Tracker is currently an interactive 2D web application built on Next.js 15 and Leaflet. While the 2D map clearly displays telemetry sensor locations, radar, highway alerts, and flood extents, flood analysis in Thailand (particularly flash floods in mountainous regions such as Prachinburi/Khao Yai, Nakhon Nayok, and northern basins) inherently relies on terrain topology. Water flows from high elevation to low basins.
A 3D terrain view empowers users and responders to inspect slope, elevation drop, basin depressions, and runoff paths directly.

## 2. Goals, Non-Goals & Anti-Goals
### Goals
- **Hybrid 2D/3D Mode:** Keep the default lightweight 2D Leaflet map for maximum mobile speed and low data usage. Provide an intuitive floating "3D / 2D" toggle button.
- **Synchronized Viewport:** When toggling from 2D to 3D, maintain the current map center coordinates and zoom level, automatically tilting the camera (pitch: 55°–60°) into 3D perspective.
- **Open-source & Free 3D Stack:** Utilize MapLibre GL JS with open Terrain-RGB DEM (AWS/Terrarium elevation tiles) and ESRI World Imagery + Labels without requiring proprietary tokens or subscriptions.
- **Zero Regression on 2D Leaflet:** Keep the existing 1,600+ lines in `TelemetryMap.tsx` intact; lazy-load the 3D viewer component with `next/dynamic` so the WebGL bundle is only fetched when activated.
- **Phase 1 Data Layers in 3D:**
  - 3D Terrain elevation mesh with realistic exaggeration (~1.5x - 1.8x).
  - Hybrid Satellite basemap (High-res satellite + geographic labels).
  - Telemetry water station markers styled by severity (Red/Orange/Yellow/Green) clickable for popups/details.
  - GISTDA satellite flood extent GeoJSON draped over the 3D surface.

### Non-Goals
- Replacing Leaflet in Phase 1 (Leaflet remains the reliable default).
- Dynamic water surface hydraulic simulation (e.g. rising 3D water polygon mesh based on volumetric flow rate).
- Porting all complex 2D layers (RainViewer animated radar, 10-layer control checkboxes) into 3D in Phase 1.

### Anti-Goals
- Bloating initial page load: MapLibre GL JS and DEM tiles must NEVER load until the user actively clicks the "3D" toggle.
- Breaking responsive mobile layout: 3D map must properly respect the mobile bottom drawer and floating banners.

## 3. Approaches Considered & Trade-offs
1. **Full Migration to MapLibre GL JS (Rejected for Phase 1):**
   - *Pros:* Single map engine for both 2D and 3D with smooth animated pitch transitions.
   - *Cons:* Heavy refactoring of 1,600+ lines in `TelemetryMap.tsx` risking regressions on radar overlays, cluster logic, and custom SVG popups.
2. **Mapbox GL JS v3 (Rejected):**
   - *Pros:* High-fidelity 3D lighting out of the box.
   - *Cons:* Proprietary token required, billing constraints for public open data apps.
3. **Lazy-loaded Hybrid MapLibre GL Component (Selected):**
   - *Pros:* Zero risk to existing features, 100% free open-source, code-split via `next/dynamic`, clean separation of concerns.

## 4. Architecture & Technical Design
### Components
- `src/components/Map/TelemetryMap3D.tsx`:
  - Dynamically imported by `DynamicTelemetryMap.tsx` or `TelemetryMap.tsx`.
  - Initializes `maplibregl.Map` in WebGL container.
  - Adds raster DEM source (`terrarium` or `terrain-rgb` from AWS open terrain tiles).
  - Configures `map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 })`.
  - Adds ESRI Satellite raster tile layer and Carto/OSM label layer.
  - Adds GISTDA flood polygons as a GeoJSON fill layer draped over the terrain.
  - Renders Station markers using HTML markers or GeoJSON symbol layer with severity colors.
- `src/components/Map/MapModeToggle.tsx` (or integrated in map toolbar):
  - Floating button with 3D/2D badge icon.
  - Manages `mode: '2d' | '3d'` state.
- Synchronization:
  - Captures `{ lat, lng, zoom }` from Leaflet before switching to 3D.
  - Passes `{ initialCenter: [lng, lat], initialZoom: zoom }` to MapLibre.
  - Re-syncs back when returning to 2D.
