import { useEffect, useRef, useState } from "react";
import { createAgriMapView, type AgriMapHandle } from "@/map/mapViewFactory";
import type { AreaSelection, CensusFilters, FarmBoundary, TreePoint, TreePolygon, SelectedMapFeature } from "@/types";
import type { LayerVisibility } from "@/config/operationalLayers";
import "./mapView.css";

interface MapViewProps {
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  treePolygons: TreePolygon[];
  /** Called when the user clicks a single farm boundary. */
  onFarmClick?: (farmId: string) => void;
  /** Called after a box/polygon draw selection resolves to exact intersecting features. */
  onAreaSelect?: (selection: AreaSelection) => void;
  /** Called when an individual tree or tree-area feature is clicked. */
  onTreeFeatureClick?: (feature: SelectedMapFeature) => void;
  /** Called when the editing tool adds a new individual tree. */
  onAddTree?: (tree: TreePoint) => void;
  /** Called when the editing tool adds a new tree-area polygon. */
  onAddTreeArea?: (area: TreePolygon) => void;
  layerVisibility: LayerVisibility;
  /** Imperative handle so parent pages (e.g. Farms table) can trigger zoomToFarm. */
  mapHandleRef?: React.MutableRefObject<AgriMapHandle | null>;
  /** Farm to zoom to — handled internally, safe to set before the map has finished loading. */
  focusFarmId?: string | null;
  /** Governorate/Wilayat/Farm/Tree Type filters — applied to what's drawn on the map. */
  filters?: CensusFilters;
}

export function MapView({
  farms,
  treePoints,
  treePolygons,
  onFarmClick,
  onAreaSelect,
  onTreeFeatureClick,
  onAddTree,
  onAddTreeArea,
  layerVisibility,
  mapHandleRef,
  focusFarmId,
  filters,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<AgriMapHandle | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;
    setStatus("loading");

    createAgriMapView(containerRef.current, { farms, treePoints, treePolygons }, { onAreaSelect, onAddTree, onAddTreeArea })
      .then((handle) => {
        if (cancelled) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
        if (mapHandleRef) mapHandleRef.current = handle;

        handle.view.on("click", async (event) => {
          const genericLayers = Object.values(handle.operationalLayers).filter((layer) =>
            layer && layer !== handle.treePointLayer && layer !== handle.treePolygonLayer && layer !== handle.farmLayer && layer !== handle.imageryLayer
          );
          const response = await handle.view.hitTest(event, { include: [handle.treePointLayer, handle.treePolygonLayer, handle.farmLayer, ...genericLayers] as any });

          // Respect the map's visual draw order. This is important for
          // Agricultural Fields: clicking empty space inside a visible field
          // should select the field, while clicking an actual vegetation icon
          // still selects the vegetation point drawn above it.
          const firstRelevant = response.results.find((r: any) => {
            const layer = r.graphic?.layer;
            return layer === handle.treePointLayer || layer === handle.treePolygonLayer || genericLayers.includes(layer);
          }) as any;

          if (firstRelevant?.graphic?.layer === handle.treePointLayer) {
            handle.highlightFeature(firstRelevant.graphic);
            const a = firstRelevant.graphic.attributes ?? {};
            const g = firstRelevant.graphic.geometry as any;
            onTreeFeatureClick?.({
              kind: "point",
              id: a.Tree_ID ?? a.OBJECTID?.toString?.() ?? "Tree",
              farmId: a.Farm_ID ?? "",
              treeType: a.Tree_Type ?? "Unknown",
              governorate: a.Governorate ?? "",
              wilayat: a.Wilayat ?? "",
              longitude: a.Longitude ?? g?.longitude,
              latitude: a.Latitude ?? g?.latitude,
              treeTypeAr: a.Vegetation_Type_AR ?? undefined,
              vegetationHeight: a.Vegetation_Height ?? null,
              vegetationHealth: a.Vegetation_Health ?? null,
              canopyDiameter: a.Canopy_Diameter ?? null,
              attributes: a,
            });
            return;
          }

          if (firstRelevant?.graphic?.layer === handle.treePolygonLayer) {
            handle.highlightFeature(firstRelevant.graphic);
            const a = firstRelevant.graphic.attributes ?? {};
            onTreeFeatureClick?.({
              kind: "polygon",
              id: a.Area_ID ?? a.OBJECTID?.toString?.() ?? "Tree Area",
              farmId: a.Farm_ID ?? "",
              treeType: a.Tree_Type ?? "Unknown",
              governorate: a.Governorate ?? "",
              wilayat: a.Wilayat ?? "",
              count: a.Tree_Count ?? undefined,
              grassPointCount: a.Grass_Point_Count ?? undefined,
              areaHa: a.Area_Ha ?? undefined,
            });
            return;
          }

          const showOperationalFeature = (graphic: any) => {
            handle.highlightFeature(graphic);
            const a = graphic.attributes ?? {};
            const title = graphic.layer?.title ?? "Map Feature";
            const idKey = Object.keys(a).find((key) => /(^|_)id$/i.test(key)) ?? Object.keys(a)[0];
            onTreeFeatureClick?.({
              kind: "operational",
              id: idKey ? String(a[idKey] ?? title) : title,
              farmId: String(a.Farm_ID ?? a.Farm_ID_ ?? ""),
              treeType: title,
              governorate: String(a.Governorate ?? a.Governorat ?? ""),
              wilayat: String(a.Wilayat ?? ""),
              layerLabel: title,
              attributes: a,
            });
          };

          if (firstRelevant?.graphic && genericLayers.includes(firstRelevant.graphic.layer)) {
            showOperationalFeature(firstRelevant.graphic);
            return;
          }

          // Hatched/mostly-transparent polygon symbols can be difficult to hit
          // reliably between hatch strokes. If the Agricultural Fields layer is
          // visible and the normal hitTest missed it, explicitly query the field
          // polygon under the clicked map coordinate.
          const agriculturalFieldsLayer = handle.operationalLayers.agriculturalFields as any;
          if (agriculturalFieldsLayer?.visible && event.mapPoint) {
            try {
              await agriculturalFieldsLayer.when?.();
              const query = agriculturalFieldsLayer.createQuery();
              query.geometry = event.mapPoint;
              query.spatialRelationship = "intersects";
              query.returnGeometry = true;
              query.outFields = ["*"];
              query.num = 1;
              const fieldResult = await agriculturalFieldsLayer.queryFeatures(query);
              const fieldFeature = fieldResult?.features?.[0];
              if (fieldFeature) {
                // queryFeatures may return a graphic without its layer reference;
                // attach it so the shared information/highlight logic has the title.
                if (!fieldFeature.layer) fieldFeature.layer = agriculturalFieldsLayer;
                showOperationalFeature(fieldFeature);
                return;
              }
            } catch (error) {
              console.warn("Agricultural Field click query failed", error);
            }
          }

          const farmHit = response.results.find(
            (r: any) => r.graphic?.layer === handle.farmLayer
          ) as any;
          if (farmHit?.graphic?.attributes?.Farm_ID) {
            handle.highlightFeature(farmHit.graphic);
            onFarmClick?.(farmHit.graphic.attributes.Farm_ID);
          } else {
            handle.clearFeatureHighlight();
          }
        });

        // Ready — the effects below (watching `status`) pick up any
        // focusFarmId/filters that were already set, so nothing needs to
        // happen here beyond flipping the status flag.
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to initialize the map."
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Intentionally only re-init on mount / dataset identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farms, treePoints, treePolygons]);

  // Fires whenever the map finishes loading OR the requested farm changes —
  // covers both orderings (navigated here before vs after the map was ready)
  // without relying on a stale value captured inside the async .then() above.
  useEffect(() => {
    if (status === "ready" && focusFarmId && handleRef.current) {
      handleRef.current.zoomToFarm(focusFarmId);
    }
  }, [status, focusFarmId]);

  // Same pattern for filters — re-applies whenever the map becomes ready or
  // the dashboard's filter selections change.
  useEffect(() => {
    if (status === "ready" && filters && handleRef.current) {
      handleRef.current.applyFilters(filters);
    }
  }, [status, filters]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    (Object.entries(layerVisibility) as [keyof LayerVisibility, boolean][]).forEach(([key, visible]) => {
      handle.setLayerVisible(key, visible);
    });
  }, [layerVisibility]);

  return (
    <div className="agri-map-shell">
      <div ref={containerRef} className="agri-map-container" />
      {status === "loading" && (
        <div className="agri-map-overlay">
          <div className="agri-map-spinner" />
          <p>Loading map…</p>
        </div>
      )}
      {status === "error" && (
        <div className="agri-map-overlay agri-map-overlay--error">
          <p>Couldn't load the map.</p>
          <p className="agri-map-overlay-detail">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
