# Agricultural Census GIS Web Platform — Phase 1

A map-centered, government-presentation-quality GIS dashboard for an
agricultural census: farm boundaries, individual trees, tree/crop polygons,
and imagery, built on React + TypeScript + Vite + ArcGIS Maps SDK for
JavaScript.

This is **Phase 1** of the build. It delivers a fully working app with:

- Complete project architecture (`src/config`, `types`, `services`, `hooks`,
  `map`, `components`, `pages`)
- The GIS configuration file (`src/config/gisConfig.ts`) — the single place
  you'll paste your real ArcGIS REST service URLs
- The ArcGIS `MapView` with farm boundary, tree point, and tree polygon
  layers, symbolized by `Tree_Type`, plus zoom/home/basemap/legend/search/
  fullscreen/measure-and-select (Sketch) widgets
- Dashboard with 6 dynamic KPI cards, 4 interactive charts (Recharts),
  farm-click info panel, and draw-to-select area analytics
- The core statistics engine (`src/services/statsService.ts`) implementing
  the **Total Trees = points + Σ Tree_Count** rule everywhere
- A dependent Governorate → Wilayat → Farm filter bar
- Mock data generated in the browser (no backend needed) so you can run this
  today, before your services are published — flip one flag to switch to
  live data (see below)

Not yet built (Phase 2 — say "continue" and I'll generate these next):
Farms table w/ CSV export, Tree Census page, Statistics comparison page,
Reports/print-to-PDF, Data Explorer, Settings/Help.

## 1. Install

```bash
npm install
```

Requires Node 18+.

## 2. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`. The dashboard loads immediately using
generated mock data — 120 mock farms across Oman's governorates/wilayats,
with realistic tree points and crop polygons.

## 3. Connect your real ArcGIS services

Open **`src/config/gisConfig.ts`**:

1. Publish `Farm_Boundary`, `Individual_Trees`, and `Tree_Areas` from your
   File Geodatabase as an ArcGIS Feature Service (ArcGIS Online or
   Enterprise), and your GeoTIFF as an Image Service or hosted tile layer.
2. Paste each REST endpoint into `GIS_SERVICE_URLS`:
   ```ts
   export const GIS_SERVICE_URLS = {
     FARM_BOUNDARY_SERVICE: "https://.../FeatureServer/0",
     TREE_POINT_SERVICE: "https://.../FeatureServer/1",
     TREE_POLYGON_SERVICE: "https://.../FeatureServer/2",
     IMAGERY_SERVICE: "https://.../ImageServer",
   };
   ```
3. If your field names differ from `Tree_Type` / `Farm_ID` / etc., update
   `FIELD_NAMES` in the same file.
4. Set:
   ```ts
   export const DATA_SOURCE_MODE: DataSourceMode = "arcgis";
   ```

No component code changes are needed — `src/services/gisQueries.ts` already
contains the real `FeatureLayer` query paths (including `outStatistics` +
`groupByFieldsForStatistics` for server-side aggregation, and
`definitionExpression` for filtering) and switches to them automatically.

If your organization requires sign-in, set `AUTH_CONFIG.mode` to `"portal"`
and register an OAuth application in ArcGIS Online/Enterprise for the
`appClientId`.

## 4. Project structure

```
src/
├── components/
│   ├── layout/       Sidebar, Header (filters, search, profile)
│   ├── map/           MapView React wrapper
│   ├── dashboard/     KPI cards, layer toggle, farm/selection panels
│   └── charts/        Recharts chart components
├── pages/             Route-level pages (Dashboard built; others Phase 2)
├── map/               mapViewFactory.ts — ArcGIS Map/MapView + layers/widgets
├── services/          mockData.ts, gisQueries.ts, statsService.ts
├── hooks/             useCensusData, useFilteredStatistics
├── config/            gisConfig.ts — YOUR SERVICE URLS GO HERE
├── types/             Shared TypeScript interfaces
├── App.tsx
└── main.tsx
```

## 5. Performance notes for large datasets

- Tree point rendering automatically switches to marker clustering above
  `PERFORMANCE.clusterThreshold` (default 2,000 points) once `arcgis` mode
  is active and points come from a live `FeatureLayer`.
- Filtering uses `definitionExpression` server-side rather than fetching
  every feature into React state.
- Aggregate KPI/chart totals in `arcgis` mode use `outStatistics` +
  `groupByFieldsForStatistics` so tens of thousands of records are summed
  on the server, not looped over in the browser.

## 6. Reports / PDF export (documented for Phase 2)

Client-side PDF generation for the Reports page will use a headless-print
approach (`window.print()` against a print-styled report layout) so no
backend is required for a first version; a backend-rendered PDF (e.g. via a
headless-Chromium service) is a drop-in upgrade later if you need pixel-
perfect exports. The Reports page scaffold and this wiring will ship in
Phase 2.

## 2026 UI refresh
The dashboard has been restyled to closely follow the supplied agricultural monitoring reference: light ivory sidebar, full-screen imagery/map canvas, rounded floating KPI cards, olive/lime accents, floating location/coverage cards, and compact bottom analytics panels. Existing GIS filters, layer toggles, farm selection, map interactions, charts, and data pages are retained.

If dependencies were copied from another operating system, remove `node_modules` and run `npm install` before `npm run dev`. Rollup/Vite installs a platform-specific native package.
