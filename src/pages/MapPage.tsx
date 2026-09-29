import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCensusData } from "@/hooks/useCensusData";
import { Header } from "@/components/layout/Header";
import { MapView } from "@/components/map/MapView";
import { LayerToggle } from "@/components/dashboard/LayerToggle";
import { FarmInfoPanel } from "@/components/dashboard/FarmInfoPanel";
import { SelectionPanel } from "@/components/dashboard/SelectionPanel";
import { calculateFarmSummary, calculateStatistics } from "@/services/statsService";
import { DEFAULT_LAYER_VISIBILITY } from "@/config/operationalLayers";
import type { AreaSelection, CensusFilters } from "@/types";
import type { AgriMapHandle } from "@/map/mapViewFactory";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

export function MapPage() {
  const { loading, error, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedAreaFarmIds, setSelectedAreaFarmIds] = useState<string[] | null>(null);
  const [selectedAreaSelection, setSelectedAreaSelection] = useState<AreaSelection | null>(null);
  const [layerVisibility, setLayerVisibility] = useState({ ...DEFAULT_LAYER_VISIBILITY });
  const mapHandleRef = useRef<AgriMapHandle | null>(null);
  const location = useLocation();
  const incomingFarmId = (location.state as { selectedFarmId?: string } | null)?.selectedFarmId ?? null;
  const focusFarmId = selectedFarmId ?? incomingFarmId;

  const selectedFarmSummary = useMemo(() => {
    const id = selectedFarmId ?? incomingFarmId;
    if (!id) return null;
    const farm = farms.find((f) => f.farmId === id);
    if (!farm) return null;
    return calculateFarmSummary(farm, treePoints, treePolygons);
  }, [selectedFarmId, incomingFarmId, farms, treePoints, treePolygons]);

  const selectionStats = useMemo(() => {
    if (!selectedAreaFarmIds || selectedAreaFarmIds.length === 0) return null;
    return calculateStatistics(farms, treePoints, treePolygons, EMPTY_FILTERS, selectedAreaFarmIds);
  }, [selectedAreaFarmIds, farms, treePoints, treePolygons]);

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading map…</p>
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
    <>
      <Header title="Map Workspace" filters={filters} filterOptions={filterOptions} onChange={setFilters} />

      <div className="map-workspace-note">
        <div>
          <strong>Operational Map</strong>
          <span>Explore farms, trees and imagery without dashboard overlays.</span>
        </div>
      </div>

      <div className="hero-map-wrap hero-map-wrap--tall map-workspace">
        <div className="hero-map-fill">
          <MapView
            farms={farms}
            treePoints={treePoints}
            treePolygons={treePolygons}
            layerVisibility={layerVisibility}
            mapHandleRef={mapHandleRef}
            focusFarmId={focusFarmId}
            filters={filters}
            onFarmClick={(farmId) => {
              setSelectedFarmId(farmId);
              setSelectedAreaFarmIds(null);
            }}
            onAreaSelect={(selection) => {
              setSelectedAreaSelection(selection);
              setSelectedAreaFarmIds(selection.farmIds);
              setSelectedFarmId(null);
            }}
          />
        </div>


        <div className="hero-overlay-right">
          <LayerToggle visibility={layerVisibility} onChange={setLayerVisibility} />
          {selectedAreaFarmIds && selectedAreaSelection ? (
            <SelectionPanel
              stats={selectionStats}
              selection={selectedAreaSelection}
              farms={farms}
              treePoints={treePoints}
              treePolygons={treePolygons}
              onClear={() => {
                setSelectedAreaFarmIds(null);
                setSelectedAreaSelection(null);
              }}
            />
          ) : (
            <FarmInfoPanel farm={selectedFarmSummary} onClose={() => setSelectedFarmId(null)} />
          )}
        </div>
      </div>
    </>
  );
}
