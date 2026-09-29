import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCensusData } from "@/hooks/useCensusData";
import { useFilteredStatistics } from "@/hooks/useFilteredStatistics";
import { Header } from "@/components/layout/Header";
import { MapView } from "@/components/map/MapView";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { FarmInfoPanel } from "@/components/dashboard/FarmInfoPanel";
import { SelectionPanel } from "@/components/dashboard/SelectionPanel";
import { TreeInfoPanel } from "@/components/dashboard/TreeInfoPanel";
import { TreeTypeLegendPanel } from "@/components/dashboard/TreeTypeLegendPanel";
import { FarmAssistant } from "@/components/dashboard/FarmAssistant";
import { calculateAreaSelectionStatistics, calculateFarmSummary, calculateStatistics } from "@/services/statsService";
import type { AreaSelection, CensusFilters, SelectedMapFeature, TreePoint, TreePolygon } from "@/types";
import type { AgriMapHandle } from "@/map/mapViewFactory";
import { DEFAULT_LAYER_VISIBILITY } from "@/config/operationalLayers";

const EMPTY_FILTERS: CensusFilters = {
  governorate: null,
  wilayat: null,
  farmId: null,
  treeType: null,
};

function groupPointTypes(points: TreePoint[], farmIds: Set<string> | null, filters: CensusFilters) {
  const counts = new Map<string, number>();
  for (const p of points) {
    // Mixed categories in this census belong to polygon/tree-area records,
    // not the individual-tree legend.
    if (p.treeType.toLowerCase().includes("mixed")) continue;
    if (farmIds && !farmIds.has(p.farmId)) continue;
    if (filters.governorate && p.governorate !== filters.governorate) continue;
    if (filters.wilayat && p.wilayat !== filters.wilayat) continue;
    if (filters.farmId && p.farmId !== filters.farmId) continue;
    if (filters.treeType && p.treeType !== filters.treeType) continue;
    counts.set(p.treeType, (counts.get(p.treeType) ?? 0) + 1);
  }
  return [...counts.entries()].map(([treeType, count]) => ({ treeType, count })).sort((a, b) => b.count - a.count);
}

function groupPolygonTypes(polygons: TreePolygon[], farmIds: Set<string> | null, filters: CensusFilters) {
  const counts = new Map<string, number>();
  for (const p of polygons) {
    if (farmIds && !farmIds.has(p.farmId)) continue;
    if (filters.governorate && p.governorate !== filters.governorate) continue;
    if (filters.wilayat && p.wilayat !== filters.wilayat) continue;
    if (filters.farmId && p.farmId !== filters.farmId) continue;
    if (filters.treeType && p.treeType !== filters.treeType) continue;
    counts.set(p.treeType, (counts.get(p.treeType) ?? 0) + p.treeCount);
  }
  return [...counts.entries()].map(([treeType, count]) => ({ treeType, count })).sort((a, b) => b.count - a.count);
}

export function Dashboard() {
  const { loading, error, farms, treePoints: sourceTreePoints, treePolygons: sourceTreePolygons, filterOptions } = useCensusData();
  const [addedTreePoints, setAddedTreePoints] = useState<TreePoint[]>(() => {
    try { return JSON.parse(localStorage.getItem("agri-added-tree-points") || "[]"); } catch { return []; }
  });
  const [addedTreePolygons, setAddedTreePolygons] = useState<TreePolygon[]>(() => {
    try { return JSON.parse(localStorage.getItem("agri-added-tree-polygons") || "[]"); } catch { return []; }
  });
  const treePoints = useMemo(() => [...sourceTreePoints, ...addedTreePoints], [sourceTreePoints, addedTreePoints]);
  const treePolygons = useMemo(() => [...sourceTreePolygons, ...addedTreePolygons], [sourceTreePolygons, addedTreePolygons]);
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedAreaSelection, setSelectedAreaSelection] = useState<AreaSelection | null>(null);
  const [selectedTreeFeature, setSelectedTreeFeature] = useState<SelectedMapFeature | null>(null);
  const [layerVisibility, setLayerVisibility] = useState({ ...DEFAULT_LAYER_VISIBILITY });
  const location = useLocation();
  const mapHandleRef = useRef<AgriMapHandle | null>(null);

  useEffect(() => {
    localStorage.setItem("agri-added-tree-points", JSON.stringify(addedTreePoints));
  }, [addedTreePoints]);
  useEffect(() => {
    localStorage.setItem("agri-added-tree-polygons", JSON.stringify(addedTreePolygons));
  }, [addedTreePolygons]);

  useEffect(() => {
    const incomingFarmId = (location.state as { selectedFarmId?: string } | null)?.selectedFarmId;
    if (incomingFarmId && farms.some((f) => f.farmId === incomingFarmId)) {
      setSelectedFarmId(incomingFarmId);
      setSelectedAreaSelection(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, farms]);

  const stats = useFilteredStatistics(farms, treePoints, treePolygons, filters, null);
  const globalStats = useMemo(() => calculateStatistics(farms, treePoints, treePolygons, EMPTY_FILTERS), [farms, treePoints, treePolygons]);

  const selectedFarmSummary = useMemo(() => {
    if (!selectedFarmId) return null;
    const farm = farms.find((f) => f.farmId === selectedFarmId);
    if (!farm) return null;
    return calculateFarmSummary(farm, treePoints, treePolygons);
  }, [selectedFarmId, farms, treePoints, treePolygons]);

  const selectionStats = useMemo(() => {
    if (!selectedAreaSelection) return null;
    return calculateAreaSelectionStatistics(farms, treePoints, treePolygons, filters, selectedAreaSelection);
  }, [selectedAreaSelection, farms, treePoints, treePolygons, filters]);

  const selectedFarmIdsForContext = useMemo(() => {
    if (selectedAreaSelection) return new Set(selectedAreaSelection.farmIds);
    if (selectedFarmId) return new Set([selectedFarmId]);
    return null;
  }, [selectedAreaSelection, selectedFarmId]);


  const legendFilters = selectedFarmIdsForContext ? EMPTY_FILTERS : filters;
  const legendPointTypes = useMemo(() => {
    if (selectedAreaSelection) {
      const ids = new Set(selectedAreaSelection.treeIds);
      return groupPointTypes(treePoints.filter((p) => ids.has(p.treeId)), null, filters);
    }
    return groupPointTypes(treePoints, selectedFarmIdsForContext, legendFilters);
  }, [treePoints, selectedAreaSelection, selectedFarmIdsForContext, legendFilters, filters]);
  const legendPolygonTypes = useMemo(() => {
    if (selectedAreaSelection) {
      const ids = new Set(selectedAreaSelection.areaIds);
      return groupPolygonTypes(treePolygons.filter((p) => ids.has(p.areaId)), null, filters);
    }
    return groupPolygonTypes(treePolygons, selectedFarmIdsForContext, legendFilters);
  }, [treePolygons, selectedAreaSelection, selectedFarmIdsForContext, legendFilters, filters]);
  const legendTitle = selectedAreaSelection ? "Selected Area Legend" : selectedFarmId ? `Farm ${selectedFarmId} Legend` : "Legend";
  const legendSubtitle = undefined;


  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading census data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-loading page-loading--error">
        <p>Couldn't load census data.</p>
        <p className="agri-map-overlay-detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-stage">
      <div className="hero-map-wrap">
        <div className="hero-map-fill">
          <MapView
            farms={farms}
            treePoints={treePoints}
            treePolygons={treePolygons}
            layerVisibility={layerVisibility}
            mapHandleRef={mapHandleRef}
            focusFarmId={selectedFarmId}
            filters={filters}
            onFarmClick={(farmId) => {
              setSelectedFarmId(farmId);
              setSelectedAreaSelection(null);
              setSelectedTreeFeature(null);
            }}
            onAreaSelect={(selection) => {
              setSelectedAreaSelection(selection);
              setSelectedFarmId(null);
              setSelectedTreeFeature(null);
            }}
            onTreeFeatureClick={(feature) => {
              setSelectedTreeFeature(feature);
              setSelectedFarmId(null);
              setSelectedAreaSelection(null);
            }}
            onAddTree={(tree) => setAddedTreePoints((current) => [...current, tree])}
            onAddTreeArea={(area) => setAddedTreePolygons((current) => [...current, area])}
          />
        </div>

        <div className="dashboard-header-overlay">
          <Header
            title={selectedFarmId ? `Farm ${selectedFarmId}` : "Smart Agriculture GIS Platform"}
            filters={filters}
            filterOptions={filterOptions}
            onChange={setFilters}
          />
        </div>

        <div className="hero-overlay-top">
          <KpiCards stats={stats} />
        </div>



        <div className="hero-legend-panel">
          <TreeTypeLegendPanel
            pointTypes={legendPointTypes}
            polygonTypes={legendPolygonTypes}
            title={legendTitle}
            subtitle={legendSubtitle}
          />
        </div>

        <div className="hero-info-panel">
          {selectedTreeFeature ? (
            <TreeInfoPanel feature={selectedTreeFeature} onClose={() => setSelectedTreeFeature(null)} />
          ) : selectedAreaSelection ? (
            <SelectionPanel
              stats={selectionStats}
              selection={selectedAreaSelection}
              farms={farms}
              treePoints={treePoints}
              treePolygons={treePolygons}
              getMapScreenshot={async () => {
                const view = mapHandleRef.current?.view;
                if (!view) return null;
                const shot = await view.takeScreenshot({ format: "png", quality: 90 });
                return shot.dataUrl;
              }}
              onClear={() => setSelectedAreaSelection(null)}
            />
          ) : (
            <FarmInfoPanel farm={selectedFarmSummary} onClose={() => setSelectedFarmId(null)} />
          )}
        </div>

        <FarmAssistant stats={globalStats} contextLabel="whole platform" />
      </div>
    </div>
  );
}
