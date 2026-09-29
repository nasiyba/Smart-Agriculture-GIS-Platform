# Agricultural Census Platform — UX review

## Changes in this version
- Removed the three chart cards from the dashboard map so ArcGIS controls stay visible.
- Made Dashboard and Map clearly different: Dashboard is executive/summary focused; Map is an operational map workspace without KPI overlays.
- Refined Farms, Tree Census, Statistics, Reports and Data Explorer with a consistent premium page hierarchy.
- Added page intros, section labels, cleaner content cards, improved tables, quieter colors and more consistent spacing.
- Statistics now owns the analytical comparison charts rather than duplicating them on the dashboard map.
- Reports now uses a dedicated report-sheet treatment suitable for print/PDF.

## Recommended next improvements
1. Performance: stop downloading the full tree dataset into React on initial load. Use ArcGIS server-side statistics and paged queries.
2. Dashboard: add one purposeful summary insight card (e.g. dominant crop / survey completion) instead of more charts.
3. Farm detail: create a dedicated farm profile drawer/page with imagery, tree mix, area, and census metadata.
4. Map: use scale-dependent rendering/clustering for individual trees and hide detailed points at small scales.
5. Navigation: keep each page purpose distinct—Dashboard=overview, Map=spatial exploration, Farms=registry, Tree Census=inventory, Statistics=analysis, Reports=output, Data Explorer=raw data.
6. Visual system: keep one chart palette and avoid unrelated orange/red/bright colors unless they encode meaning.
7. Loading UX: replace blank/loading text with skeleton cards and a map loading indicator.
8. Data quality: add a small QC/status area for unknown tree types, missing Farm_IDs, and incomplete attributes.
