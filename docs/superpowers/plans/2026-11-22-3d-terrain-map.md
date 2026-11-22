# 3D Terrain Map Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3D terrain elevation map toggle to Thailand Flood Tracker using MapLibre GL JS and Open Terrain-RGB DEM, enabling users to analyze mountain slopes and flood runoff pathways alongside the existing 2D Leaflet map.

**Architecture:** Maintain the existing 2D Leaflet map as the fast default. Add an accessible floating "3D / 2D" toggle control that lazily imports a high-performance WebGL 3D viewer (`TelemetryMap3D.tsx`), synchronizing camera coordinates and zoom between views while rendering 3D terrain elevation, satellite imagery, telemetry stations, and GISTDA flood polygons.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, MapLibre GL JS (`maplibre-gl`), Open Terrain-RGB DEM (AWS / Terrarium), ESRI World Imagery.

**Spec:** [docs/superpowers/specs/2026-11-22-3d-terrain-map-design.md](file:///c:/Users/chatp/Thailand-Flood-Tracker/docs/superpowers/specs/2026-11-22-3d-terrain-map-design.md)

## Global Constraints
- Next.js 15 App Router compatibility; all map components must use `'use client'`.
- Dynamic code splitting via `next/dynamic` so `maplibre-gl` bundle does not impact initial 2D page load.
- 100% free open-source data sources (no Mapbox API tokens or billing constraints).
- Existing 2D Leaflet implementation in `src/components/Map/TelemetryMap.tsx` must remain untouched and fully functional.
- Zero TypeScript and ESLint errors (`npm.cmd run lint` & `npm.cmd run build` must pass cleanly).

## Review Focus
1. **WebGL Failure / Unsupported Hardware:** Devices without WebGL support or GPU crash must gracefully display a fallback message and button to return to 2D rather than crashing the page.
2. **Camera Viewport Drift on Toggle:** Switching 2D -> 3D -> 2D must not drift coordinate center or zoom level away from what the user was inspecting.
3. **Marker Elevation Clamping:** Markers and popups in 3D must properly align with the undulating terrain surface without clipping beneath mountain peaks.
4. **Mobile Bottom Sheet Compatibility:** Floating 3D controls and map canvas must respect the mobile bottom drawer height and viewport bounds.
5. **Memory Cleanup on Toggle:** Switching between 2D and 3D must properly clean up WebGL map instances (`map.remove()`) to avoid GPU memory leaks on mobile devices.

---

### Task 1: Install MapLibre GL JS & Setup Dependencies

**Files:**
- Modify: `package.json`
- Test: Build / typecheck via `npm.cmd run lint`

**Interfaces:**
- Consumes: `npm.cmd install maplibre-gl`
- Produces: `maplibre-gl` installed in `node_modules` with TypeScript definitions available.

- [ ] **Step 1: Install maplibre-gl**
Run: `npm.cmd install maplibre-gl`
Expected: `maplibre-gl` added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify package.json and run linter**
Run: `npm.cmd run lint`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add maplibre-gl dependency for 3D terrain map"
```

---

### Task 2: Build 3D Map Viewer Component with Terrain-RGB & Satellite Basemap

**Files:**
- Create: `src/components/Map/TelemetryMap3D.tsx`
- Test: Component rendering and WebGL context initialization

**Interfaces:**
- Consumes:
  - `TelemetryStation[]` from `@/types/telemetry`
  - `GeoJSON.FeatureCollection | null` for `gistdaGeoJson`
  - `initialCenter: [number, number]` ([lng, lat])
  - `initialZoom: number`
  - `onSelectStation: (station: TelemetryStation | null) => void`
  - `onToggle2D: () => void`
- Produces: `TelemetryMap3D` React client component with 3D terrain mesh, pitch tilt, and navigation compass.

- [ ] **Step 1: Write `src/components/Map/TelemetryMap3D.tsx`**
Implement the component with:
- WebGL availability check (fallback UI if WebGL is unavailable).
- MapLibre GL map instance initialized with `pitch: 58`, `bearing: -15`, `maxPitch: 85`.
- Raster DEM source using Terrarium RGB elevation tiles:
  `tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']` with `encoding: 'terrarium'`.
- `map.setTerrain({ source: 'terrain-source', exaggeration: 1.6 })`.
- Basemap: ESRI World Imagery raster tiles with Carto/OSM hybrid labels layer.
- Cleanup: Call `map.remove()` on component unmount.

- [ ] **Step 2: Typecheck & Lint Verification**
Run: `npm.cmd run lint`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/Map/TelemetryMap3D.tsx
git commit -m "feat: create TelemetryMap3D component with 3D terrain and satellite basemap"
```

---

### Task 3: Render Telemetry Stations & GISTDA Flood Polygons in 3D

**Files:**
- Modify: `src/components/Map/TelemetryMap3D.tsx`
- Modify: `src/types/telemetry.ts` (if any helper needed)

**Interfaces:**
- Consumes:
  - `stations: TelemetryStation[]`
  - `gistdaGeoJson: GeoJSON.FeatureCollection | null`
  - `selectedStation: TelemetryStation | null`
- Produces:
  - 3D interactive station markers with color-coded severity badges.
  - Station popup showing telemetry metrics (water level, status, timestamp) on click.
  - GeoJSON fill/outline layers for GISTDA flood polygons draped onto the 3D terrain surface.

- [ ] **Step 1: Implement GISTDA flood polygon layer**
Add GeoJSON source `gistda-flood` and layers:
- `fill` with color `#3b82f6`, opacity `0.45`
- `line` with color `#1d4ed8`, width `1.5`

- [ ] **Step 2: Implement Station Markers & Popups in 3D**
- Create DOM markers using `new maplibregl.Marker()` with custom HTML elements matching the 2D severity badge design.
- Bind click listener to call `onSelectStation(station)` and open a styled `maplibregl.Popup`.

- [ ] **Step 3: Verify with linter**
Run: `npm.cmd run lint`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/components/Map/TelemetryMap3D.tsx
git commit -m "feat: add telemetry station markers and GISTDA flood polygons to 3D map"
```

---

### Task 4: Integrate 2D/3D Floating Toggle & Viewport Synchronization

**Files:**
- Create: `src/components/Map/MapModeToggle.tsx`
- Modify: `src/components/Map/TelemetryMap.tsx` (add toggle button and state management)
- Modify: `src/components/Map/DynamicTelemetryMap.tsx` (support 3D dynamic lazy load)

**Interfaces:**
- Consumes:
  - `mode: '2d' | '3d'`
  - `onToggleMode: (newMode: '2d' | '3d') => void`
- Produces:
  - Floating badge button with 3D/2D icon in the top-right map controls toolbar.
  - Seamless state toggle with coordinate and zoom sync.

- [ ] **Step 1: Create `MapModeToggle.tsx`**
Create a button with 3D cube icon (or Box / Mountain icon from `lucide-react`) styled to match the existing Leaflet floating toolbars (`bg-white/95 dark:bg-slate-900/95 shadow-md rounded-xl p-2 font-medium text-xs`).

- [ ] **Step 2: Wire up Toggle & Coordinate Sync in `TelemetryMap.tsx`**
- Store current Leaflet `center` and `zoom` in state when user clicks "3D".
- Render `TelemetryMap3D` dynamically when `mode === '3d'`.
- Provide an exit "2D Mode" button inside `TelemetryMap3D` that restores Leaflet view at the same center/zoom.

- [ ] **Step 3: Verify with linter**
Run: `npm.cmd run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/Map/MapModeToggle.tsx src/components/Map/TelemetryMap.tsx
git commit -m "feat: add 2D/3D toggle button and viewport coordinate sync"
```

---

### Task 5: End-to-End Build & Visual Verification

**Files:**
- Test: Full build via `npm.cmd run build`

- [ ] **Step 1: Run production build**
Run: `npm.cmd run build`
Expected: Build successfully completes with 0 errors and generates `.next` output.

- [ ] **Step 2: Final Commit & Tag**
```bash
git add -A
git commit -m "feat: complete 3D terrain map integration with hybrid toggle"
```
