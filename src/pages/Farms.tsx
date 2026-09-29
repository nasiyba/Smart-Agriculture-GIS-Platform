import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCensusData } from "@/hooks/useCensusData";
import { Header } from "@/components/layout/Header";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { buildFarmSummaries } from "@/services/statsService";
import type { CensusFilters, FarmSummary } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

export function Farms() {
  const { loading, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const navigate = useNavigate();

  const summaries = useMemo(() => {
    const filteredFarms = farms.filter(
      (f) =>
        (!filters.governorate || f.governorate === filters.governorate) &&
        (!filters.wilayat || f.wilayat === filters.wilayat) &&
        (!filters.farmId || f.farmId === filters.farmId)
    );
    return buildFarmSummaries(filteredFarms, treePoints, treePolygons);
  }, [farms, treePoints, treePolygons, filters]);

  const columns: DataTableColumn<FarmSummary>[] = [
    { key: "farmId", label: "Farm ID" },
    { key: "governorate", label: "Governorate" },
    { key: "wilayat", label: "Wilayat" },
    {
      key: "farmAreaHa",
      label: "Farm Area (m²)",
      align: "right",
      render: (row) => formatSquareMeters(row.farmAreaHa).replace(" m²", ""),
    },
    {
      key: "totalTrees",
      label: "Total Trees",
      align: "right",
      render: (row) => row.totalTrees.toLocaleString(),
    },
    { key: "treeTypeCount", label: "Tree Types", align: "right" },
    { key: "dominantTreeType", label: "Dominant Type" },
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading farms…</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Farms" filters={filters} filterOptions={filterOptions} onChange={setFilters} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Farm registry</span>
            <h2>Surveyed farms</h2>
            <p>Review farm coverage, area and tree totals. Select any row to open it on the dashboard map.</p>
          </div>
          <div className="page-intro-metric"><strong>{summaries.length.toLocaleString()}</strong><span>farms in view</span></div>
        </section>
        <section className="content-card content-card--table">
        <DataTable
          rows={summaries}
          columns={columns}
          searchKeys={["farmId", "governorate", "wilayat", "dominantTreeType"]}
          csvFilename="farms"
          onRowClick={(row) => navigate("/", { state: { selectedFarmId: row.farmId } })}
          emptyMessage="No farms match your filters."
        />
        </section>
      </div>
    </>
  );
}
