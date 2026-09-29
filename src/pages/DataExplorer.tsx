import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCensusData } from "@/hooks/useCensusData";
import { Header } from "@/components/layout/Header";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import type { CensusFilters, FarmBoundary, TreePoint, TreePolygon } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";
import { classifyVegetationHealth, healthClassName } from "@/utils/healthClassification";
import { UPDATED_DATASET_SUMMARY } from "@/config/dataSchema";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

type DatasetKey = "farms" | "points" | "polygons";

export function DataExplorer() {
  const { loading, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [dataset, setDataset] = useState<DatasetKey>("farms");
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const navigate = useNavigate();

  const filteredFarms = useMemo(
    () =>
      farms.filter(
        (f) =>
          (!filters.governorate || f.governorate === filters.governorate) &&
          (!filters.wilayat || f.wilayat === filters.wilayat) &&
          (!filters.farmId || f.farmId === filters.farmId)
      ),
    [farms, filters]
  );

  const filteredPoints = useMemo(
    () =>
      treePoints.filter(
        (p) =>
          (!filters.governorate || p.governorate === filters.governorate) &&
          (!filters.wilayat || p.wilayat === filters.wilayat) &&
          (!filters.farmId || p.farmId === filters.farmId) &&
          (!filters.treeType || p.treeType === filters.treeType)
      ),
    [treePoints, filters]
  );

  const filteredPolygons = useMemo(
    () =>
      treePolygons.filter(
        (p) =>
          (!filters.governorate || p.governorate === filters.governorate) &&
          (!filters.wilayat || p.wilayat === filters.wilayat) &&
          (!filters.farmId || p.farmId === filters.farmId) &&
          (!filters.treeType || p.treeType === filters.treeType)
      ),
    [treePolygons, filters]
  );

  const quality = useMemo(() => {
    const unknownTreeTypes = [...treePoints, ...treePolygons].filter((r) =>
      !r.treeType || r.treeType.trim().toLowerCase() === "unknown"
    ).length;
    const missingFarmLinks = [...treePoints, ...treePolygons].filter((r) => !r.farmId?.trim()).length;
    const missingAreaNames = [...farms, ...treePoints, ...treePolygons].filter(
      (r) => !r.governorate?.trim() || !r.wilayat?.trim()
    ).length;
    const invalidCoordinates = treePoints.filter(
      (r) => !Number.isFinite(r.longitude) || !Number.isFinite(r.latitude)
    ).length;
    return { unknownTreeTypes, missingFarmLinks, missingAreaNames, invalidCoordinates };
  }, [farms, treePoints, treePolygons]);

  const farmColumns: DataTableColumn<FarmBoundary>[] = [
    { key: "farmId", label: "Farm ID" },
    { key: "governorate", label: "Governorate" },
    { key: "wilayat", label: "Wilayat" },
    { key: "farmAreaHa", label: "Farm Area (m²)", align: "right", render: (row) => formatSquareMeters(row.farmAreaHa).replace(" m²", "") },
    {
      key: "farmId",
      label: "Action",
      sortable: false,
      render: (row) => (
        <button className="data-table-export" onClick={(e) => { e.stopPropagation(); navigate("/", { state: { selectedFarmId: row.farmId } }); }}>
          Zoom to farm
        </button>
      ),
    },
  ];

  const pointColumns: DataTableColumn<TreePoint>[] = [
    { key: "treeId", label: "Vegetation ID" },
    { key: "treeType", label: "Vegetation Type" },
    { key: "farmId", label: "Farm ID" },
    { key: "governorate", label: "Governorate" },
    { key: "wilayat", label: "Wilayat" },
    { key: "longitude", label: "Longitude", align: "right" },
    { key: "latitude", label: "Latitude", align: "right" },
    { key: "vegetationHeight", label: "Height (m)", align: "right", render: (row) => row.vegetationHeight == null ? "—" : String(row.vegetationHeight) },
    { key: "canopyDiameter", label: "Canopy Diameter (m)", align: "right", render: (row) => row.canopyDiameter == null ? "—" : String(row.canopyDiameter) },
    { key: "vegetationHealth", label: "Health", render: (row) => <span className={healthClassName(row.vegetationHealth)}>{classifyVegetationHealth(row.vegetationHealth)}</span> },
  ];

  const polygonColumns: DataTableColumn<TreePolygon>[] = [
    { key: "areaId", label: "Area ID" },
    { key: "treeType", label: "Tree Type" },
    { key: "treeCount", label: "Tree Count", align: "right" },
    { key: "areaHa", label: "Area (m²)", align: "right", render: (row) => formatSquareMeters(row.areaHa).replace(" m²", "") },
    { key: "farmId", label: "Farm ID" },
    { key: "governorate", label: "Governorate" },
    { key: "wilayat", label: "Wilayat" },
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading data explorer…</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Data Explorer" filters={filters} filterOptions={filterOptions} onChange={setFilters} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Data management</span>
            <h2>Data explorer</h2>
            <p>Inspect the source datasets used by the platform with search, sorting and export tools.</p>
          </div>
        </section>
        <div className="page-toolbar refined-toolbar">
          {(
            [
              ["farms", `Farm Boundaries (${filteredFarms.length})`],
              ["points", `Vegetation (${filteredPoints.length})`],
              ["polygons", `Vegetation Areas (${filteredPolygons.length})`],
            ] as [DatasetKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className="pill-select"
              style={{
                cursor: "pointer",
                background: dataset === key ? "var(--color-lime)" : "var(--color-glass)",
                color: dataset === key ? "var(--color-olive-deep)" : "var(--color-ink)",
                fontWeight: dataset === key ? 700 : 500,
              }}
              onClick={() => setDataset(key)}
            >
              {label}
            </button>
          ))}
        </div>


        <section className="content-card data-schema-card">
          <div className="panel-title">Updated source layers</div>
          <div className="data-schema-grid">
            {UPDATED_DATASET_SUMMARY.map((item) => (
              <div className="data-schema-item" key={item.file}>
                <div><strong>{item.layer}</strong><span>{item.geometry}</span></div>
                <b>{item.records.toLocaleString()}</b>
                <small>{item.fields}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="quality-strip" aria-label="Data quality overview">
          <div className="quality-card">
            <span>Unknown tree types</span>
            <strong>{quality.unknownTreeTypes.toLocaleString()}</strong>
            <small>Records needing classification</small>
          </div>
          <div className="quality-card">
            <span>Missing farm links</span>
            <strong>{quality.missingFarmLinks.toLocaleString()}</strong>
            <small>Vegetation records without Farm ID</small>
          </div>
          <div className="quality-card">
            <span>Missing area names</span>
            <strong>{quality.missingAreaNames.toLocaleString()}</strong>
            <small>Governorate or Wilayat missing</small>
          </div>
          <div className="quality-card">
            <span>Invalid coordinates</span>
            <strong>{quality.invalidCoordinates.toLocaleString()}</strong>
            <small>Point records to review</small>
          </div>
        </section>

        <section className="content-card content-card--table">
        {dataset === "farms" && (
          <DataTable
            rows={filteredFarms as unknown as (FarmBoundary & Record<string, unknown>)[]}
            columns={farmColumns}
            searchKeys={["farmId", "governorate", "wilayat"]}
            csvFilename="farm_boundaries"
            emptyMessage="No farm boundary records match your filters."
          />
        )}
        {dataset === "points" && (
          <DataTable
            rows={filteredPoints as unknown as (TreePoint & Record<string, unknown>)[]}
            columns={pointColumns}
            searchKeys={["treeId", "treeType", "farmId", "governorate", "wilayat"]}
            csvFilename="tree_points"
            emptyMessage="No vegetation records match your filters."
          />
        )}
        {dataset === "polygons" && (
          <DataTable
            rows={filteredPolygons as unknown as (TreePolygon & Record<string, unknown>)[]}
            columns={polygonColumns}
            searchKeys={["areaId", "treeType", "farmId", "governorate", "wilayat"]}
            csvFilename="tree_polygons"
            emptyMessage="No tree polygon records match your filters."
          />
        )}
        </section>
      </div>
    </>
  );
}
