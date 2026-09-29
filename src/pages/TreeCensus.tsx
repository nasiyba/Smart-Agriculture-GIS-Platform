import { useMemo, useState } from "react";
import { useCensusData } from "@/hooks/useCensusData";
import { useFilteredStatistics } from "@/hooks/useFilteredStatistics";
import { Header } from "@/components/layout/Header";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TreesByTypeChart } from "@/components/charts/CensusCharts";
import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import { classifyVegetationHealth, healthClassName } from "@/utils/healthClassification";
import type { CensusFilters, GeometryFilter } from "@/types";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

interface TreeRow {
  id: string;
  geometry: "Point" | "Polygon";
  treeType: string;
  count: number; // 1 for points, Tree_Count for polygons
  farmId: string;
  governorate: string;
  wilayat: string;
  height?: number | null;
  health?: string | null;
  canopyDiameter?: number | null;
}

export function TreeCensus() {
  const { loading, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const [geometryFilter, setGeometryFilter] = useState<GeometryFilter>("all");

  const stats = useFilteredStatistics(farms, treePoints, treePolygons, filters, null);

  const rows: TreeRow[] = useMemo(() => {
    const pointRows: TreeRow[] = treePoints
      .filter(
        (p) =>
          (!filters.governorate || p.governorate === filters.governorate) &&
          (!filters.wilayat || p.wilayat === filters.wilayat) &&
          (!filters.farmId || p.farmId === filters.farmId) &&
          (!filters.treeType || p.treeType === filters.treeType)
      )
      .map((p) => ({
        id: p.treeId,
        geometry: "Point" as const,
        treeType: p.treeType,
        count: 1,
        farmId: p.farmId || "—",
        governorate: p.governorate,
        wilayat: p.wilayat,
        height: p.vegetationHeight ?? null,
        health: p.vegetationHealth ?? null,
        canopyDiameter: p.canopyDiameter ?? null,
      }));

    const polygonRows: TreeRow[] = treePolygons
      .filter(
        (p) =>
          (!filters.governorate || p.governorate === filters.governorate) &&
          (!filters.wilayat || p.wilayat === filters.wilayat) &&
          (!filters.farmId || p.farmId === filters.farmId) &&
          (!filters.treeType || p.treeType === filters.treeType)
      )
      .map((p) => ({
        id: p.areaId,
        geometry: "Polygon" as const,
        treeType: p.treeType,
        count: p.treeCount,
        farmId: p.farmId || "—",
        governorate: p.governorate,
        wilayat: p.wilayat,
      }));

    if (geometryFilter === "points") return pointRows;
    if (geometryFilter === "polygons") return polygonRows;
    return [...pointRows, ...polygonRows];
  }, [treePoints, treePolygons, filters, geometryFilter]);

  const columns: DataTableColumn<TreeRow>[] = [
    { key: "id", label: "ID" },
    { key: "geometry", label: "Geometry" },
    { key: "treeType", label: "Vegetation Type", render: (row) => <span className="table-tree-type"><TreeTypeIcon treeType={row.treeType} size={28} /><span>{row.treeType}</span></span> },
    { key: "count", label: "Count", align: "right" },
    { key: "farmId", label: "Farm ID" },
    { key: "governorate", label: "Governorate" },
    { key: "wilayat", label: "Wilayat" },
    { key: "height", label: "Height (m)", align: "right", render: (row) => row.height == null ? "—" : row.height.toString() },
    { key: "canopyDiameter", label: "Canopy Diameter (m)", align: "right", render: (row) => row.canopyDiameter == null ? "—" : row.canopyDiameter.toString() },
    { key: "health", label: "Health", render: (row) => <span className={healthClassName(row.health)}>{classifyVegetationHealth(row.health)}</span> },
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading vegetation census…</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Vegetation Census" filters={filters} filterOptions={filterOptions} onChange={setFilters} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Census inventory</span>
            <h2>Vegetation census</h2>
            <p>Explore the updated vegetation census records, including vegetation type, location, and available vegetation attributes.</p>
          </div>
          <div className="page-intro-metric"><strong>{stats.totalTrees.toLocaleString()}</strong><span>vegetation records</span></div>
        </section>
        <div className="section-label">Overview</div>
        <KpiCards stats={stats} />

        <section className="dashboard-grid premium-grid tree-census-grid" style={{ marginBottom: 24 }}>
          <TreesByTypeChart stats={stats} />
          <div className="panel tree-ranking-panel">
            <div className="panel-title">Top Vegetation Types</div>
            <div className="tree-ranking-list">
              {stats.treesByType.slice(0, 8).map((t, i) => (
                <div key={t.treeType} className="tree-ranking-item">
                  <span className="tree-ranking-index">{i + 1}</span>
                  <span className="tree-ranking-name"><TreeTypeIcon treeType={t.treeType} size={28} /><span>{t.treeType}</span></span>
                  <span className="tree-ranking-value">{t.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-label">Records</div>
        <div className="page-toolbar refined-toolbar">
          <span style={{ fontSize: 12.5, color: "var(--color-ink-soft)", fontWeight: 600 }}>
            Geometry type:
          </span>
          <select
            className="pill-select"
            value={geometryFilter}
            onChange={(e) => setGeometryFilter(e.target.value as GeometryFilter)}
          >
            <option value="all">All</option>
            <option value="points">Vegetation Points</option>
            <option value="polygons">Vegetation Areas</option>
          </select>
        </div>

        <section className="content-card content-card--table">
        <DataTable
          rows={rows}
          columns={columns}
          searchKeys={["id", "treeType", "farmId", "governorate", "wilayat"]}
          csvFilename="vegetation_census"
          emptyMessage="No vegetation records match your filters."
        />
        </section>
      </div>
    </>
  );
}
