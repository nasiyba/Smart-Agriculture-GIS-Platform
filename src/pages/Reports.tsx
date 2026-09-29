import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useCensusData } from "@/hooks/useCensusData";
import { calculateStatistics, buildFarmSummaries } from "@/services/statsService";
import type { CensusFilters } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

export function Reports() {
  const { loading, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [scope, setScope] = useState<CensusFilters>(EMPTY_FILTERS);

  const stats = useMemo(
    () => calculateStatistics(farms, treePoints, treePolygons, scope),
    [farms, treePoints, treePolygons, scope]
  );

  const farmSummaries = useMemo(() => {
    const scopedFarms = farms.filter(
      (f) =>
        (!scope.governorate || f.governorate === scope.governorate) &&
        (!scope.wilayat || f.wilayat === scope.wilayat) &&
        (!scope.farmId || f.farmId === scope.farmId)
    );
    return buildFarmSummaries(scopedFarms, treePoints, treePolygons);
  }, [farms, treePoints, treePolygons, scope]);

  const wilayatOptions = scope.governorate
    ? filterOptions?.wilayatsByGovernorate.get(scope.governorate) ?? []
    : [...(filterOptions?.wilayatsByGovernorate.values() ?? [])].flat();
  const farmOptions = scope.wilayat ? filterOptions?.farmsByWilayat.get(scope.wilayat) ?? [] : [];

  const scopeLabel = scope.farmId || scope.wilayat || scope.governorate || "All Farms";
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading reports…</p>
      </div>
    );
  }

  return (
    <>
      <header className="header no-print">
        <div className="header-top-row">
          <h1 className="header-title">Reports</h1>
          <button
            onClick={() => window.print()}
            className="filter-reset"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>
        <div className="filter-row">
          <select
            className="filter-select"
            value={scope.governorate ?? ""}
            onChange={(e) =>
              setScope({ governorate: e.target.value || null, wilayat: null, farmId: null, treeType: null })
            }
          >
            <option value="">All Governorates</option>
            {filterOptions?.governorates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={scope.wilayat ?? ""}
            onChange={(e) => setScope((s) => ({ ...s, wilayat: e.target.value || null, farmId: null }))}
          >
            <option value="">All Wilayats</option>
            {wilayatOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={scope.farmId ?? ""}
            onChange={(e) => setScope((s) => ({ ...s, farmId: e.target.value || null }))}
            disabled={!scope.wilayat}
          >
            <option value="">{scope.wilayat ? "All Farms" : "Select a wilayat first"}</option>
            {farmOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="content-area page-shell">
        <section className="page-intro no-print">
          <div>
            <span className="eyebrow">Reporting</span>
            <h2>Census reports</h2>
            <p>Generate a clean summary for the selected governorate, wilayat or farm and export it as PDF.</p>
          </div>
        </section>
        <div className="report-sheet" id="report-content">
          <div style={{ marginBottom: 20, borderBottom: "2px solid var(--color-olive)", paddingBottom: 14 }}>
            <h2 style={{ fontSize: 22 }}>Agricultural Census Summary</h2>
            <p style={{ color: "var(--color-ink-soft)", fontSize: 12.5, marginTop: 4 }}>
              Scope: {scopeLabel} · Generated {today}
            </p>
          </div>

          <div className="stat-summary-row">
            <div className="kpi-card">
              <span className="kpi-card-label">Total Farms</span>
              <span className="kpi-card-value">{stats.totalFarms.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card-label">Total Vegetation</span>
              <span className="kpi-card-value">{stats.totalTrees.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card-label">Surveyed Area</span>
              <span className="kpi-card-value">{formatSquareMeters(stats.totalSurveyedAreaHa)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card-label">Vegetation Types</span>
              <span className="kpi-card-value">{stats.treeTypeCount}</span>
            </div>
          </div>

          <h3 style={{ fontSize: 15, margin: "18px 0 10px" }}>Tree Distribution</h3>
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>Tree Type</th>
                <th className="align-right">Count</th>
                <th className="align-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.treesByType.map((t) => (
                <tr key={t.treeType}>
                  <td>{t.treeType}</td>
                  <td className="align-right">{t.count.toLocaleString()}</td>
                  <td className="align-right">
                    {stats.totalTrees ? ((t.count / stats.totalTrees) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 15, margin: "18px 0 10px" }}>Farm Statistics</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm ID</th>
                <th>Governorate</th>
                <th>Wilayat</th>
                <th className="align-right">Area (m²)</th>
                <th className="align-right">Total Vegetation</th>
                <th>Dominant Type</th>
              </tr>
            </thead>
            <tbody>
              {farmSummaries.map((f) => (
                <tr key={f.farmId}>
                  <td>{f.farmId}</td>
                  <td>{f.governorate}</td>
                  <td>{f.wilayat}</td>
                  <td className="align-right">{formatSquareMeters(f.farmAreaHa).replace(" m²", "")}</td>
                  <td className="align-right">{f.totalTrees.toLocaleString()}</td>
                  <td>{f.dominantTreeType}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 20, fontSize: 11, color: "var(--color-ink-soft)" }} className="print-only">
            Agricultural Census GIS Platform — {today}
          </p>
        </div>

        <p className="empty-state no-print" style={{ marginTop: 12 }}>
          This report uses your browser's print dialog — choose "Save as PDF" as the destination for a
          PDF export. A backend-rendered PDF service can be swapped in later without changing this page.
        </p>
      </div>
    </>
  );
}
