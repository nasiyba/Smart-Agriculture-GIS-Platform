import { DATA_SOURCE_MODE, GIS_SERVICE_URLS, MAP_DEFAULTS, PERFORMANCE, TREE_TYPE_COLORS, DEFAULT_TREE_TYPE_COLOR, IMAGERY_MODE, LOCAL_IMAGERY_TILE_URL, LOCAL_IMAGERY_EXTENT } from "@/config/gisConfig";
import { OPERATIONAL_LAYER_DEFINITIONS, type OperationalLayerKey } from "@/config/operationalLayers";
import type { AreaSelection, CensusFilters, FarmBoundary, TreePoint, TreePolygon, SelectedMapFeature } from "@/types";
import { getTreeTypeDataUrl, getHighlightedTreeTypeDataUrl } from "@/utils/treeTypeSymbols";
import { getPolygonHatch } from "@/utils/polygonHatch";

// ---------------------------------------------------------------------------
// Builds the ArcGIS Map + MapView and every operational layer.
//
// In "arcgis" mode, farm/tree/imagery layers are real FeatureLayer/ImageryLayer
// instances pointed at GIS_SERVICE_URLS — definitionExpression drives filtering
// and rendering/clustering happens on the client from server-streamed features.
//
// In "mock" mode (no services published yet), the same visual result is
// produced from local GraphicsLayers populated from the generated dataset,
// so the map is fully interactive from day one and swapping in real service
// URLs later requires no changes to component code — only gisConfig.ts.
// ---------------------------------------------------------------------------

export interface AgriMapHandle {
  view: __esri.MapView;
  map: __esri.Map;
  farmLayer: __esri.FeatureLayer | __esri.GraphicsLayer;
  treePointLayer: __esri.FeatureLayer | __esri.GraphicsLayer;
  treePolygonLayer: __esri.FeatureLayer | __esri.GraphicsLayer;
  imageryLayer: __esri.Layer | null;
  operationalLayers: Partial<Record<OperationalLayerKey, __esri.Layer>>;
  setLayerVisible: (layer: OperationalLayerKey, visible: boolean) => void;
  setDefinitionExpression: (where: string | null) => void;
  /** Applies the dashboard's Governorate/Wilayat/Farm/Tree Type filters to what's actually drawn on the map. */
  applyFilters: (filters: CensusFilters) => void;
  zoomToFarm: (farmId: string) => Promise<void>;
  zoomToTree: (treeId: string) => Promise<SelectedMapFeature | null>;
  highlightFeature: (graphic: __esri.Graphic) => void;
  clearFeatureHighlight: () => void;
  destroy: () => void;
}

function pictureTreePointSymbol(treeType: string) {
  return {
    type: "picture-marker",
    url: getTreeTypeDataUrl(treeType),
    width: "30px",
    height: "30px",
    yoffset: "0px",
  };
}

function treePointRenderer() {
  return {
    type: "unique-value",
    field: "Tree_Type",
    defaultSymbol: pictureTreePointSymbol("Other"),
    uniqueValueInfos: Object.keys(TREE_TYPE_COLORS).map((value) => ({
      value,
      symbol: pictureTreePointSymbol(value),
    })),
  };
}

function treePolygonRenderer() {
  return {
    type: "unique-value",
    field: "Tree_Type",
    defaultSymbol: {
      type: "simple-fill",
      style: "backward-diagonal",
      color: [...hexToRgb(DEFAULT_TREE_TYPE_COLOR), 0.58],
      outline: { color: DEFAULT_TREE_TYPE_COLOR, width: 1.1 },
    },
    uniqueValueInfos: Object.keys(TREE_TYPE_COLORS).map((value) => {
      const hatch = getPolygonHatch(value);
      return {
        value,
        symbol: {
          type: "simple-fill",
          style: hatch.arcgisStyle,
          color: [...hexToRgb(hatch.color), 0.62],
          outline: { color: hatch.color, width: 1.2 },
        },
      };
    }),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const farmBoundarySymbol = {
  type: "simple-fill",
  color: [124, 181, 24, 0], // near-transparent so imagery stays visible
  outline: { color: "#2F5233", width: 1.5 },
};

const farmBoundaryHighlightSymbol = {
  type: "simple-fill",
  color: [232, 163, 61, 0],
  outline: { color: "#E8A33D", width: 2.5 },
};

function agriculturalFieldRenderer() {
  const classes = [
    ["Palm", "#4B7B38", "forward-diagonal"],
    ["Grass", "#79A85B", "horizontal"],
    ["Seasonal Crops", "#C99A32", "backward-diagonal"],
    ["Lemon", "#D7B726", "vertical"],
    ["Mango", "#D87B2E", "diagonal-cross"],
    ["Mixed Vegetation", "#4E9A79", "cross"],
    ["غطاء نباتي مختلط", "#4E9A79", "cross"],
    ["Banana", "#70A92E", "forward-diagonal"],
    ["Coconut", "#687E37", "diagonal-cross"],
    ["Uncultivated Area", "#8C8F88", "horizontal"],
    ["Sidr", "#60784E", "backward-diagonal"],
    ["Fig", "#7C5A9C", "horizontal"],
    ["Orange", "#E1912F", "vertical"],
    ["Prickly pear", "#749768", "cross"],
    ["Pomegranate", "#B94B4B", "forward-diagonal"],
    ["Papaya", "#E1A347", "diagonal-cross"],
  ] as const;

  return {
    type: "unique-value",
    field: "Plant_Type_EN",
    defaultSymbol: {
      type: "simple-fill",
      style: "forward-diagonal",
      color: [115, 145, 85, 0.10],
      outline: { color: "#6F8F56", width: 1.8 },
    },
    uniqueValueInfos: classes.map(([value, color, style]) => ({
      value,
      label: value,
      symbol: {
        type: "simple-fill",
        style,
        color: [...hexToRgb(color), 0.12],
        outline: { color, width: 1.8 },
      },
    })),
  };
}

function operationalRenderer(def: (typeof OPERATIONAL_LAYER_DEFINITIONS)[number]) {
  if (def.key === "agriculturalFields") return agriculturalFieldRenderer();
  if (def.key === "streets") {
    return { type: "simple", symbol: { type: "simple-line", color: def.color, width: 2.6, style: "solid" } };
  }
  if (def.geometry === "point") {
    return { type: "simple", symbol: { type: "simple-marker", color: def.color, size: 9, outline: { color: "#ffffff", width: 1 } } };
  }
  const styles: Record<string, string> = {
    animalPens: "backward-diagonal",
    buildings: "solid",
    greenhouses: "forward-diagonal",
    shadeHouses: "cross",
    solarPanels: "diagonal-cross",
    landCover: "vertical",
  };
  const alpha = def.key === "buildings" ? 0.18 : 0.10;
  return {
    type: "simple",
    symbol: {
      type: "simple-fill",
      style: styles[def.key] ?? "solid",
      color: [...hexToRgb(def.color), alpha],
      outline: { color: def.color, width: def.key === "greenhouses" ? 1.8 : 1.4 },
    },
  };
}

export async function createAgriMapView(
  container: HTMLDivElement,
  data: { farms: FarmBoundary[]; treePoints: TreePoint[]; treePolygons: TreePolygon[] },
  callbacks?: { onAreaSelect?: (selection: AreaSelection) => void; onAddTree?: (tree: TreePoint) => void; onAddTreeArea?: (area: TreePolygon) => void }
): Promise<AgriMapHandle> {
  const [
    { default: Map },
    { default: MapView },
    { default: GraphicsLayer },
    { default: Graphic },
    { default: FeatureLayer },
    { default: Polygon },
    { default: Point },
    { intersects, geodesicArea },
    { geographicToWebMercator, webMercatorToGeographic },
  ] = await Promise.all([
    import("@arcgis/core/Map"),
    import("@arcgis/core/views/MapView"),
    import("@arcgis/core/layers/GraphicsLayer"),
    import("@arcgis/core/Graphic"),
    import("@arcgis/core/layers/FeatureLayer"),
    import("@arcgis/core/geometry/Polygon"),
    import("@arcgis/core/geometry/Point"),
    import("@arcgis/core/geometry/geometryEngine"),
    import("@arcgis/core/geometry/support/webMercatorUtils"),
  ]);

  const map = new Map({ basemap: MAP_DEFAULTS.basemap });

  let imageryLayer: __esri.Layer | null = null;
  if (IMAGERY_MODE === "arcgis") {
    const { default: ImageryLayer } = await import("@arcgis/core/layers/ImageryLayer");
    imageryLayer = new ImageryLayer({ url: GIS_SERVICE_URLS.IMAGERY_SERVICE, title: "Imagery" });
    map.add(imageryLayer);
  } else if (IMAGERY_MODE === "local-tiles") {
    // Locally generated XYZ tile pyramid (gdal2tiles.py --xyz output),
    // served as static files from /public/tiles — no GIS server required.
    const { default: WebTileLayer } = await import("@arcgis/core/layers/WebTileLayer");
    imageryLayer = new WebTileLayer({
      urlTemplate: `${window.location.origin}${LOCAL_IMAGERY_TILE_URL}`,
      title: "Farm Survey Imagery",
      copyright: "Local imagery tiles",
    } as any);
    map.add(imageryLayer);
  }

  const operationalLayers: Partial<Record<OperationalLayerKey, __esri.Layer>> = {};
  const { default: GeoJSONLayer } = await import("@arcgis/core/layers/GeoJSONLayer");
  const genericLayerDefs = OPERATIONAL_LAYER_DEFINITIONS.filter(
    (def) => def.url && !def.empty && !["farms", "points", "imagery"].includes(def.key)
  );
  for (const def of genericLayerDefs) {
    const renderer = operationalRenderer(def);
    const layer = new GeoJSONLayer({
      url: def.url!,
      title: def.label,
      visible: def.visibleByDefault,
      renderer: renderer as any,
      outFields: ["*"],
      popupEnabled: true,
    } as any);
    operationalLayers[def.key] = layer as any;
    map.add(layer as any);
  }

  let farmLayer: __esri.FeatureLayer | __esri.GraphicsLayer;
  let treePointLayer: __esri.FeatureLayer | __esri.GraphicsLayer;
  let treePolygonLayer: __esri.FeatureLayer | __esri.GraphicsLayer;

  if (DATA_SOURCE_MODE === "arcgis") {
    farmLayer = new FeatureLayer({
      url: GIS_SERVICE_URLS.FARM_BOUNDARY_SERVICE,
      title: "Farm Boundaries",
      renderer: farmBoundarySymbol as any,
      popupTemplate: {
        title: "Farm Information",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "Farm_ID", label: "Farm ID" },
              { fieldName: "Governorate", label: "Governorate" },
              { fieldName: "Wilayat", label: "Wilayat" },
              { fieldName: "Farm_Area", label: "Farm Area" },
            ],
          },
        ],
      },
    });
    treePointLayer = new FeatureLayer({
      url: GIS_SERVICE_URLS.TREE_POINT_SERVICE,
      title: "Individual Trees",
      renderer: treePointRenderer() as any,
      featureReduction:
        data.treePoints.length > PERFORMANCE.clusterThreshold
          ? ({ type: "cluster", clusterRadius: "80px" } as any)
          : undefined,
      popupTemplate: {
        title: "Tree Information",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "Tree_Type", label: "Tree Type" },
              { fieldName: "Latitude", label: "Latitude" },
              { fieldName: "Longitude", label: "Longitude" },
              { fieldName: "Governorate", label: "Governorate" },
              { fieldName: "Wilayat", label: "Wilayat" },
              { fieldName: "Farm_ID", label: "Farm ID" },
            ],
          },
        ],
      },
    });
    treePolygonLayer = new FeatureLayer({
      url: GIS_SERVICE_URLS.TREE_POLYGON_SERVICE,
      title: "Tree Areas",
      renderer: treePolygonRenderer() as any,
      popupTemplate: {
        title: "Crop Area Information",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "Tree_Type", label: "Tree Type" },
              { fieldName: "Tree_Count", label: "Tree Count" },
              { fieldName: "Governorate", label: "Governorate" },
              { fieldName: "Wilayat", label: "Wilayat" },
              { fieldName: "Farm_ID", label: "Farm ID" },
            ],
          },
        ],
      },
    });
  } else {
    // --- Mock mode: build client-side graphics that look/behave identically ---
    farmLayer = new GraphicsLayer({ title: "Farm Boundaries" });
    treePointLayer = new GraphicsLayer({ title: "Individual Trees" });
    treePolygonLayer = new GraphicsLayer({ title: "Tree Areas" });

    // Build graphics in memory, then add each collection once. Calling
    // GraphicsLayer.add() thousands of times causes thousands of incremental
    // layer updates and was one of the biggest startup bottlenecks.
    const farmGraphics = data.farms.map((farm) =>
      new Graphic({
        geometry: { type: "polygon", rings: farm.rings, spatialReference: { wkid: 4326 } } as any,
        symbol: farmBoundarySymbol as any,
        attributes: {
          Farm_ID: farm.farmId,
          Governorate: farm.governorate,
          Wilayat: farm.wilayat,
          Farm_Area: farm.farmAreaHa,
        },
        popupTemplate: {
          title: "Farm Information",
          content: `Farm ID: {Farm_ID}<br/>Governorate: {Governorate}<br/>Wilayat: {Wilayat}<br/>Farm Area: {Farm_Area} ha`,
        },
      })
    );
    (farmLayer as __esri.GraphicsLayer).addMany(farmGraphics);

    // Individual tree points are intentionally NOT materialized here.
    // With 20k+ points, keeping every Graphic alive made pan/zoom/click feel
    // sluggish. We render only the trees inside the current viewport once the
    // user is zoomed in, capped to a safe amount for smooth interaction.

    const polygonGraphics = data.treePolygons.map((area) => {
      const hatch = getPolygonHatch(area.treeType);
      const isGroundCover = area.treeType === "Grass";
      return new Graphic({
        geometry: { type: "polygon", rings: area.rings, spatialReference: { wkid: 4326 } } as any,
        symbol: { type: "simple-fill", style: hatch.arcgisStyle, color: [...hexToRgb(hatch.color), 0.62], outline: { color: hatch.color, width: 1.2 } } as any,
        attributes: {
          Tree_Type: area.treeType,
          Tree_Count: area.treeCount,
          Governorate: area.governorate,
          Wilayat: area.wilayat,
          Farm_ID: area.farmId,
          Area_ID: area.areaId,
          Area_Ha: area.areaHa,
          Grass_Point_Count: area.grassPointCount,
        },
        popupTemplate: isGroundCover
          ? {
              title: "Ground Cover Area",
              content:
                "Type: Grass / pasture (not included in tree count)<br/>Governorate: {Governorate}<br/>Wilayat: {Wilayat}<br/>Farm ID: {Farm_ID}",
            }
          : {
              title: "Crop Area Information",
              content:
                "Tree Type: {Tree_Type}<br/>Tree Count: {Tree_Count}<br/>Governorate: {Governorate}<br/>Wilayat: {Wilayat}<br/>Farm ID: {Farm_ID}",
            },
      });
    });
    (treePolygonLayer as __esri.GraphicsLayer).addMany(polygonGraphics);
  }

  map.addMany([farmLayer, treePolygonLayer, treePointLayer]);
  operationalLayers.farms = farmLayer as any;
  operationalLayers.points = treePointLayer as any;
  operationalLayers.imagery = imageryLayer ?? undefined;
  const featureHighlightLayer = new GraphicsLayer({ title: "Feature Highlight", listMode: "hide" });
  map.add(featureHighlightLayer);

  // Keep regional views clean and fast: farms are always visible, while
  // individual trees only appear once the user is close enough to inspect them.
  treePointLayer.minScale = 20000;
  treePolygonLayer.minScale = 50000;

  const view = new MapView({
    container,
    map,
    center: MAP_DEFAULTS.center,
    zoom: MAP_DEFAULTS.zoom,
    constraints: { minZoom: MAP_DEFAULTS.minZoom, maxZoom: MAP_DEFAULTS.maxZoom },
    popupEnabled: false,
    ui: { components: ["attribution"] },
  });

  // Note: MAP_DEFAULTS.center/zoom are already set to frame the imagery
  // extent directly (see gisConfig.ts), so no extra goTo-on-load is needed
  // here. An earlier version fired a second, un-awaited view.goTo() at load
  // time that could race with (and silently override) a zoomToFarm() call
  // requested immediately after the map mounts — removed for that reason.

  // --- Widgets -------------------------------------------------------------
  // Keep the initial map lightweight. Heavy ArcGIS widgets are imported only
  // after the map is already usable, so they do not block first interaction.
  const addDeferredWidgets = async () => {
    try {
      const [
        { default: Home },
        { default: Fullscreen },
        { default: Search },
        { default: BasemapGallery },
        { default: Expand },
        { default: LayerList },
        { default: DistanceMeasurement2D },
      ] = await Promise.all([
        import("@arcgis/core/widgets/Home"),
        import("@arcgis/core/widgets/Fullscreen"),
        import("@arcgis/core/widgets/Search"),
        import("@arcgis/core/widgets/BasemapGallery"),
        import("@arcgis/core/widgets/Expand"),
        import("@arcgis/core/widgets/LayerList"),
        import("@arcgis/core/widgets/DistanceMeasurement2D"),
      ]);

      if ((view as any).destroyed) return;
      view.ui.add(new Home({ view }), { position: "top-left", index: 1 });
      view.ui.add(new Expand({ view, content: new Search({ view }), expandIcon: "search", group: "map-tools" }), { position: "top-left", index: 2 });
      view.ui.add(new Expand({ view, content: new BasemapGallery({ view }), expandIcon: "basemap", group: "map-tools" }), { position: "top-left", index: 3 });
      view.ui.add(new Expand({ view, content: new LayerList({ view }), expandIcon: "layers", group: "map-tools" }), { position: "top-left", index: 4 });
      view.ui.add(new Expand({ view, content: new DistanceMeasurement2D({ view }), expandIcon: "measure-line", group: "map-tools" }), { position: "top-left", index: 5 });
      view.ui.add(new Fullscreen({ view }), { position: "top-left", index: 8 });
    } catch (error) {
      console.warn("Deferred map widgets could not be initialized", error);
    }
  };

  const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: any) => number) | undefined;

  const sketchLayer = new GraphicsLayer({ title: "Selection Sketch", listMode: "hide" });
  map.add(sketchLayer);

  const editLayer = new GraphicsLayer({ title: "Added Census Features", listMode: "show" });
  map.add(editLayer);

  const addDeferredSketch = async () => {
    try {
      const [{ default: Sketch }, { default: Expand }] = await Promise.all([
        import("@arcgis/core/widgets/Sketch"),
        import("@arcgis/core/widgets/Expand"),
      ]);
      if ((view as any).destroyed) return;
      const sketch = new Sketch({ view, layer: sketchLayer, creationMode: "update" });
      if ((sketch as any).viewModel) {
        (sketch as any).viewModel.polygonSymbol = {
          type: "simple-fill",
          color: [0, 0, 0, 0],
          outline: { color: "#E59B32", width: 2 },
        };
        (sketch as any).viewModel.rectangleSymbol = {
          type: "simple-fill",
          color: [0, 0, 0, 0],
          outline: { color: "#E59B32", width: 2 },
        };
      }
      view.ui.add(new Expand({ view, content: sketch, expandIcon: "rectangle", group: "map-tools" }), { position: "top-left", index: 6 });
      sketch.on("create", (event: any) => {
        if (event.state !== "complete" || !callbacks?.onAreaSelect) return;
        try {
          // Select farms by actual polygon intersection, not just by centroid.
          // This makes rectangle/polygon selections work even when the sketch only
          // overlaps part of a farm boundary.
          const sketchGeometry = event.graphic.geometry;
          const selectedFarmIds = data.farms
            .filter((farm) => {
              const geographicFarm = new Polygon({ rings: farm.rings, spatialReference: { wkid: 4326 } });
              const farmGeometry = view.spatialReference.isWebMercator ? geographicToWebMercator(geographicFarm) : geographicFarm;
              return intersects(sketchGeometry, farmGeometry as any);
            })
            .map((farm) => farm.farmId);

          const selectedTreeIds = data.treePoints
            .filter((tree) => {
              const geographicPoint = new Point({ longitude: tree.longitude, latitude: tree.latitude, spatialReference: { wkid: 4326 } });
              const pointGeometry = view.spatialReference.isWebMercator ? geographicToWebMercator(geographicPoint) : geographicPoint;
              return intersects(sketchGeometry, pointGeometry as any);
            })
            .map((tree) => tree.treeId);

          const selectedAreaIds = data.treePolygons
            .filter((area) => {
              const geographicArea = new Polygon({ rings: area.rings, spatialReference: { wkid: 4326 } });
              const areaGeometry = view.spatialReference.isWebMercator ? geographicToWebMercator(geographicArea) : geographicArea;
              return intersects(sketchGeometry, areaGeometry as any);
            })
            .map((area) => area.areaId);

          const selectedAreaHa = Math.abs(geodesicArea(sketchGeometry as any, "hectares") || 0);
          callbacks.onAreaSelect({
            farmIds: selectedFarmIds,
            treeIds: selectedTreeIds,
            areaIds: selectedAreaIds,
            areaHa: Number(selectedAreaHa.toFixed(3)),
          });
        } catch (error) {
          console.warn("Unable to calculate sketch selection", error);
        }
      });
    } catch (error) {
      console.warn("Sketch tool could not be initialized", error);
    }
  };

  const findFarmForGeometry = (geometry: any) => {
    return data.farms.find((farm) => {
      const geographicFarm = new Polygon({ rings: farm.rings, spatialReference: { wkid: 4326 } });
      const farmGeometry = view.spatialReference.isWebMercator ? geographicToWebMercator(geographicFarm) : geographicFarm;
      return intersects(geometry, farmGeometry as any);
    }) ?? null;
  };

  const addDeferredEditor = async () => {
    try {
      const [{ default: SketchViewModel }, { default: Expand }] = await Promise.all([
        import("@arcgis/core/widgets/Sketch/SketchViewModel"),
        import("@arcgis/core/widgets/Expand"),
      ]);
      if ((view as any).destroyed) return;

      const editorRoot = document.createElement("div");
      editorRoot.className = "agri-add-data-widget";
      editorRoot.innerHTML = `
        <div class="agri-add-data-title">Add census data</div>
        <button type="button" data-mode="tree" class="agri-add-data-action">
          <span class="agri-add-data-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </span>
          <span>Add Tree Point</span>
        </button>
        <button type="button" data-mode="polygon" class="agri-add-data-action">
          <span class="agri-add-data-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 5l12-1 3 10-7 6-9-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="5" cy="5" r="1.6" fill="currentColor"/><circle cx="17" cy="4" r="1.6" fill="currentColor"/><circle cx="20" cy="14" r="1.6" fill="currentColor"/><circle cx="13" cy="20" r="1.6" fill="currentColor"/><circle cx="4" cy="15" r="1.6" fill="currentColor"/></svg>
          </span>
          <span>Add Tree Area</span>
        </button>
        <small>Choose a tool, place the feature on the map, then complete its census information.</small>
      `;

      let pointClickHandle: any = null;
      const sketchVM = new SketchViewModel({ view, layer: editLayer });
      (sketchVM as any).polygonSymbol = {
        type: "simple-fill",
        color: [0, 0, 0, 0],
        outline: { color: "#1F7A52", width: 2 },
      };

      const existingTypes = Array.from(new Set([
        ...data.treePoints.map((t) => t.treeType),
        ...data.treePolygons.map((a) => a.treeType),
      ].filter(Boolean))).sort();

      const showFeatureForm = (options: {
        mode: "tree" | "polygon";
        latitude: number;
        longitude: number;
        farm: FarmBoundary | null;
        areaHa?: number;
        onSave: (values: { treeType: string; treeCount: number }) => void;
        onCancel: () => void;
      }) => {
        document.querySelector(".agri-feature-editor-overlay")?.remove();
        const overlay = document.createElement("div");
        overlay.className = "agri-feature-editor-overlay";
        const locationText = options.farm
          ? `${options.farm.wilayat || "Unknown Wilayat"}, ${options.farm.governorate || "Unknown Governorate"}${options.farm.farmId ? ` · Farm ${options.farm.farmId}` : ""}`
          : "Outside a mapped farm";
        const optionMarkup = existingTypes.map((type) => `<option value="${String(type).replace(/"/g, "&quot;")}">${type}</option>`).join("");
        overlay.innerHTML = `
          <div class="agri-feature-editor-dialog" role="dialog" aria-modal="true" aria-label="Add census feature">
            <div class="agri-feature-editor-head">
              <div><strong>${options.mode === "tree" ? "Add New Tree" : "Add New Tree Area"}</strong><span>${options.mode === "tree" ? "Point feature" : "Polygon feature"}</span></div>
              <button type="button" data-action="close" aria-label="Close">×</button>
            </div>
            <label class="agri-editor-field">
              <span>Tree Type</span>
              <select data-field="treeType">
                <option value="">Select tree type…</option>
                ${optionMarkup}
              </select>
            </label>
            <label class="agri-editor-field">
              <span>Location</span>
              <input value="${locationText.replace(/"/g, "&quot;")}" readonly />
            </label>
            <label class="agri-editor-field">
              <span>Coordinates</span>
              <input value="${options.latitude.toFixed(6)}, ${options.longitude.toFixed(6)}" readonly />
            </label>
            ${options.mode === "polygon" ? `
              <div class="agri-editor-two-col">
                <label class="agri-editor-field"><span>Tree Count</span><input data-field="treeCount" type="number" min="0" step="1" value="0" /></label>
                <label class="agri-editor-field"><span>Area</span><input value="${((options.areaHa ?? 0) * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²" readonly /></label>
              </div>` : ""}
            <div class="agri-feature-editor-actions">
              <button type="button" data-action="cancel">Cancel</button>
              <button type="button" class="primary" data-action="save">✓ ${options.mode === "tree" ? "Add Tree" : "Add Area"}</button>
            </div>
          </div>
        `;
        container.closest(".agri-map-shell")?.appendChild(overlay);
        const close = (cancelled: boolean) => {
          overlay.remove();
          if (cancelled) options.onCancel();
        };
        overlay.querySelector('[data-action="close"]')?.addEventListener("click", () => close(true));
        overlay.querySelector('[data-action="cancel"]')?.addEventListener("click", () => close(true));
        overlay.addEventListener("click", (event) => { if (event.target === overlay) close(true); });
        overlay.querySelector('[data-action="save"]')?.addEventListener("click", () => {
          const treeType = (overlay.querySelector('[data-field="treeType"]') as HTMLSelectElement | null)?.value?.trim() ?? "";
          if (!treeType) {
            (overlay.querySelector('[data-field="treeType"]') as HTMLElement | null)?.classList.add("is-invalid");
            return;
          }
          const treeCount = Math.max(0, Number((overlay.querySelector('[data-field="treeCount"]') as HTMLInputElement | null)?.value || 0) || 0);
          overlay.remove();
          options.onSave({ treeType, treeCount });
        });
      };

      editorRoot.querySelector('[data-mode="tree"]')?.addEventListener("click", () => {
        pointClickHandle?.remove?.();
        view.container!.style.cursor = "crosshair";
        pointClickHandle = view.on("click", (event: any) => {
          pointClickHandle?.remove?.();
          pointClickHandle = null;
          view.container!.style.cursor = "";
          const mapPoint = event.mapPoint;
          const geographicPoint: any = view.spatialReference.isWebMercator ? webMercatorToGeographic(mapPoint) : mapPoint;
          const farm = findFarmForGeometry(mapPoint);
          const longitude = geographicPoint.longitude ?? geographicPoint.x;
          const latitude = geographicPoint.latitude ?? geographicPoint.y;
          showFeatureForm({
            mode: "tree",
            latitude,
            longitude,
            farm,
            onCancel: () => {},
            onSave: ({ treeType }) => {
              const tree: TreePoint = {
                treeId: `NEW-TREE-${Date.now()}`,
                farmId: farm?.farmId ?? "",
                treeType,
                longitude,
                latitude,
                governorate: farm?.governorate ?? "",
                wilayat: farm?.wilayat ?? "",
              };
              editLayer.add(new Graphic({
                geometry: mapPoint,
                symbol: pictureTreePointSymbol(tree.treeType) as any,
                attributes: { Tree_ID: tree.treeId, Farm_ID: tree.farmId, Tree_Type: tree.treeType, Governorate: tree.governorate, Wilayat: tree.wilayat, Longitude: tree.longitude, Latitude: tree.latitude },
              }));
              callbacks?.onAddTree?.(tree);
            },
          });
        });
      });

      editorRoot.querySelector('[data-mode="polygon"]')?.addEventListener("click", () => {
        pointClickHandle?.remove?.();
        pointClickHandle = null;
        view.container!.style.cursor = "";
        sketchVM.create("polygon");
      });

      sketchVM.on("create", (event: any) => {
        if (event.state !== "complete") return;
        const geometry = event.graphic.geometry;
        const geographicGeometry: any = view.spatialReference.isWebMercator ? webMercatorToGeographic(geometry) : geometry;
        const rings = geographicGeometry.rings as number[][][];
        const center = geographicGeometry.extent?.center;
        const geographicCenter: any = center && view.spatialReference.isWebMercator ? webMercatorToGeographic(center) : center;
        const longitude = geographicCenter?.longitude ?? geographicCenter?.x ?? 0;
        const latitude = geographicCenter?.latitude ?? geographicCenter?.y ?? 0;
        const farm = findFarmForGeometry(geometry);
        const areaHa = Math.abs(geodesicArea(geometry as any, "hectares") || 0);

        showFeatureForm({
          mode: "polygon",
          latitude,
          longitude,
          farm,
          areaHa,
          onCancel: () => editLayer.remove(event.graphic),
          onSave: ({ treeType, treeCount }) => {
            const area: TreePolygon = {
              areaId: `NEW-AREA-${Date.now()}`,
              farmId: farm?.farmId ?? "",
              treeType,
              treeCount,
              areaHa: Number(areaHa.toFixed(4)),
              governorate: farm?.governorate ?? "",
              wilayat: farm?.wilayat ?? "",
              rings,
              centroid: [longitude, latitude],
            };
            event.graphic.attributes = { Area_ID: area.areaId, Farm_ID: area.farmId, Tree_Type: area.treeType, Tree_Count: area.treeCount, Area_Ha: area.areaHa, Governorate: area.governorate, Wilayat: area.wilayat };
            const hatch = getPolygonHatch(area.treeType);
            event.graphic.symbol = { type: "simple-fill", style: hatch.arcgisStyle, color: [...hexToRgb(hatch.color), 0.62], outline: { color: hatch.color, width: 1.6 } } as any;
            callbacks?.onAddTreeArea?.(area);
          },
        });
      });

      view.ui.add(new Expand({ view, content: editorRoot, expandIcon: "add-layer", group: "map-tools" }), { position: "top-left", index: 8 });
    } catch (error) {
      console.warn("Add-data tool could not be initialized", error);
    }
  };

  await view.when();

  // Toolbar is pinned below the dashboard statistics button.

  // The map is interactive now. Load optional widgets only while the browser
  // is idle, instead of competing with the initial render and user input.
  if (idle) {
    idle(() => void addDeferredWidgets(), { timeout: 2200 });
    idle(() => void addDeferredSketch(), { timeout: 2600 });
    idle(() => void addDeferredEditor(), { timeout: 3000 });
  } else {
    window.setTimeout(() => void addDeferredWidgets(), 900);
    window.setTimeout(() => void addDeferredSketch(), 1200);
    window.setTimeout(() => void addDeferredEditor(), 1500);
  }

  // --- Fast local point rendering -----------------------------------------
  // In local/GeoJSON mode we keep only viewport-relevant point graphics in
  // memory. This is the largest responsiveness improvement for 20k+ trees.
  let activeFilters: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };
  const MAX_VIEWPORT_POINTS = 1800;
  let refreshTimer: number | null = null;

  const pointMatchesFilters = (tree: TreePoint) => {
    if (activeFilters.governorate && tree.governorate !== activeFilters.governorate) return false;
    if (activeFilters.wilayat && tree.wilayat !== activeFilters.wilayat) return false;
    if (activeFilters.farmId && tree.farmId !== activeFilters.farmId) return false;
    if (activeFilters.treeType && tree.treeType !== activeFilters.treeType) return false;
    return true;
  };

  const refreshVisibleTreePoints = () => {
    if (DATA_SOURCE_MODE === "arcgis") return;
    const layer = treePointLayer as __esri.GraphicsLayer;
    if (!layer.visible || view.scale > 22000 || !view.extent) {
      layer.removeAll();
      return;
    }

    let extent: any = view.extent;
    if (view.spatialReference.isWebMercator) {
      extent = webMercatorToGeographic(view.extent as any) as any;
    }
    if (!extent) return;

    const candidates: TreePoint[] = [];
    for (const tree of data.treePoints) {
      if (!pointMatchesFilters(tree)) continue;
      if (tree.longitude < extent.xmin || tree.longitude > extent.xmax || tree.latitude < extent.ymin || tree.latitude > extent.ymax) continue;
      candidates.push(tree);
    }

    const stride = Math.max(1, Math.ceil(candidates.length / MAX_VIEWPORT_POINTS));
    const graphics: __esri.Graphic[] = [];
    for (let i = 0; i < candidates.length; i += stride) {
      const tree = candidates[i];
      graphics.push(new Graphic({
        geometry: { type: "point", longitude: tree.longitude, latitude: tree.latitude } as any,
        symbol: pictureTreePointSymbol(tree.treeType) as any,
        attributes: {
          Tree_Type: tree.treeType,
          Latitude: tree.latitude,
          Longitude: tree.longitude,
          Governorate: tree.governorate,
          Wilayat: tree.wilayat,
          Farm_ID: tree.farmId,
          Tree_ID: tree.treeId,
          Vegetation_Type_AR: tree.treeTypeAr,
          Vegetation_Height: tree.vegetationHeight,
          Vegetation_Health: tree.vegetationHealth,
          Canopy_Diameter: tree.canopyDiameter,
        },
      }));
    }
    layer.removeAll();
    if (graphics.length) layer.addMany(graphics);
  };

  const scheduleTreePointRefresh = () => {
    if (DATA_SOURCE_MODE === "arcgis") return;
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshVisibleTreePoints, 90);
  };

  if (DATA_SOURCE_MODE !== "arcgis") {
    view.watch("stationary", (stationary) => {
      if (stationary) scheduleTreePointRefresh();
    });
    scheduleTreePointRefresh();
  }

  function setLayerVisible(layer: OperationalLayerKey, visible: boolean) {
    const target = operationalLayers[layer];
    if (target) target.visible = visible;
    if (layer === "points" && DATA_SOURCE_MODE !== "arcgis") scheduleTreePointRefresh();
  }

  function setDefinitionExpression(where: string | null) {
    if (DATA_SOURCE_MODE !== "arcgis") return; // client graphics filtered via applyFilters instead
    for (const l of [farmLayer, treePointLayer, treePolygonLayer]) {
      (l as __esri.FeatureLayer).definitionExpression = where ?? "";
    }
  }

  function buildWhereClause(filters: CensusFilters): string | null {
    const clauses: string[] = [];
    if (filters.governorate) clauses.push(`Governorate = '${filters.governorate}'`);
    if (filters.wilayat) clauses.push(`Wilayat = '${filters.wilayat}'`);
    if (filters.farmId) clauses.push(`Farm_ID = '${filters.farmId}'`);
    return clauses.length ? clauses.join(" AND ") : null;
  }

  function applyFilters(filters: CensusFilters) {
    if (DATA_SOURCE_MODE === "arcgis") {
      // Real FeatureLayers: server-side filtering via definitionExpression.
      // Tree_Type only applies to the point/polygon layers, not farms.
      const baseWhere = buildWhereClause(filters);
      const farmWhere = baseWhere;
      const treeWhere = [baseWhere, filters.treeType ? `Tree_Type = '${filters.treeType}'` : null]
        .filter(Boolean)
        .join(" AND ");
      (farmLayer as __esri.FeatureLayer).definitionExpression = farmWhere ?? "";
      (treePointLayer as __esri.FeatureLayer).definitionExpression = treeWhere || "";
      (treePolygonLayer as __esri.FeatureLayer).definitionExpression = treeWhere || "";
      return;
    }

    // Client GraphicsLayers (mock/geojson mode): toggle each graphic's
    // visibility rather than rebuilding the layer, so filtering stays fast
    // even with thousands of features.
    const matches = (attrs: Record<string, any>, requireTreeType: boolean) => {
      if (filters.governorate && attrs.Governorate !== filters.governorate) return false;
      if (filters.wilayat && attrs.Wilayat !== filters.wilayat) return false;
      if (filters.farmId && attrs.Farm_ID !== filters.farmId) return false;
      if (requireTreeType && filters.treeType && attrs.Tree_Type !== filters.treeType) return false;
      return true;
    };

    const farmGraphics = (farmLayer as __esri.GraphicsLayer).graphics;
    farmGraphics.forEach((g) => {
      g.visible = matches(g.attributes, false);
    });

    activeFilters = filters;
    scheduleTreePointRefresh();

    const polygonGraphics = (treePolygonLayer as __esri.GraphicsLayer).graphics;
    polygonGraphics.forEach((g) => {
      g.visible = matches(g.attributes, true);
    });
  }


  function clearFeatureHighlight() {
    featureHighlightLayer.removeAll();
  }

  function highlightFeature(graphic: __esri.Graphic) {
    featureHighlightLayer.removeAll();
    const geometry: any = graphic.geometry;
    if (!geometry) return;
    const isPoint = geometry.type === "point";
    const treeType = graphic.attributes?.Tree_Type ?? "Unknown";
    const isFarm = !isPoint && Boolean(graphic.attributes?.Farm_ID) && !graphic.attributes?.Tree_Type;
    featureHighlightLayer.add(new Graphic({
      geometry,
      symbol: isPoint
        ? (graphic.attributes?.Tree_Type
            ? ({ type: "picture-marker", url: getHighlightedTreeTypeDataUrl(treeType), width: "38px", height: "38px", yoffset: "0px" } as any)
            : ({ type: "simple-marker", style: "circle", color: [214,255,63,0.18], size: 18, outline: { color: "#D6FF3F", width: 3 } } as any))
        : geometry.type === "polyline"
        ? ({ type: "simple-line", color: "#D6FF3F", width: 4 } as any)
        : ({ type: "simple-fill", style: "none", color: [255,255,255,0], outline: { color: isFarm ? "#E8A33D" : "#D6FF3F", width: isFarm ? 3.6 : 3.2 } } as any),
    }));
  }

  async function zoomToFarm(farmId: string) {
    const farm = data.farms.find((f) => f.farmId === farmId);
    if (!farm) {
      console.warn("[zoomToFarm] no farm found for id", farmId);
      return;
    }
    // Highlight the focused farm as soon as it is selected/zoomed.
    featureHighlightLayer.removeAll();
    featureHighlightLayer.add(new Graphic({
      geometry: { type: "polygon", rings: farm.rings, spatialReference: { wkid: 4326 } } as any,
      symbol: farmBoundaryHighlightSymbol as any,
      attributes: { Farm_ID: farm.farmId },
    }));

    // Simple, predictable: center on the farm's centroid at a fixed close
    // zoom level. (A previous extent-fit version was fragile in practice —
    // this is easier to reason about and always lands somewhere sensible.)
    await view.goTo(
      { center: farm.centroid, zoom: 18 },
      { duration: 600, easing: "ease-in-out" }
    );
  }

  async function zoomToTree(treeId: string): Promise<SelectedMapFeature | null> {
    const tree = data.treePoints.find((t) => t.treeId.toLowerCase() === treeId.toLowerCase());
    if (!tree) return null;
    await view.goTo({ center: [tree.longitude, tree.latitude], zoom: 20 }, { duration: 550, easing: "ease-in-out" });
    return {
      kind: "point",
      id: tree.treeId,
      farmId: tree.farmId,
      treeType: tree.treeType,
      governorate: tree.governorate,
      wilayat: tree.wilayat,
      longitude: tree.longitude,
      latitude: tree.latitude,
      treeTypeAr: tree.treeTypeAr,
      vegetationHeight: tree.vegetationHeight ?? null,
      vegetationHealth: tree.vegetationHealth ?? null,
      canopyDiameter: tree.canopyDiameter ?? null,
      attributes: {
        Tree_ID: tree.treeId,
        Farm_ID: tree.farmId,
        Tree_Type: tree.treeType,
        Vegetation_Type_EN: tree.treeType,
        Vegetation_Type_AR: tree.treeTypeAr ?? null,
        Vegetation_Height: tree.vegetationHeight ?? null,
        Vegetation_Health: tree.vegetationHealth ?? null,
        Canopy_Diameter: tree.canopyDiameter ?? null,
        Longitude: tree.longitude,
        Latitude: tree.latitude,
        Governorate: tree.governorate,
        Wilayat: tree.wilayat,
      },
    };
  }

  function destroy() {
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    view.destroy();
  }

  return {
    view,
    map,
    farmLayer,
    treePointLayer,
    treePolygonLayer,
    imageryLayer,
    operationalLayers,
    setLayerVisible,
    setDefinitionExpression,
    applyFilters,
    zoomToFarm,
    zoomToTree,
    highlightFeature,
    clearFeatureHighlight,
    destroy,
  };
}

export { farmBoundaryHighlightSymbol };
