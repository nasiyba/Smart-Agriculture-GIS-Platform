# Data update notes

This build uses the uploaded September 2026 GeoJSON dataset.

- Farm boundaries: `Area.geojson` -> 23 farms.
- Total Trees KPI: uses only the actual `Trees.geojson` point layer (12,048 point features).
- Tree-area polygons are kept separate from Total Trees and are rendered with type-specific hatching.
- `Grass_Points.geojson` is not counted as trees. Grass point totals are spatially counted inside each Grass polygon and shown only in the clicked Grass-area information panel.
- Point/polygon clicks add a persistent map highlight while the feature information is shown.
