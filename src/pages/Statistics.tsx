import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCensusData } from "@/hooks/useCensusData";
import { useFilteredStatistics } from "@/hooks/useFilteredStatistics";
import { Header } from "@/components/layout/Header";
import { buildFarmSummaries } from "@/services/statsService";
import type { CensusFilters } from "@/types";
import { formatSquareMeters, hectaresToSquareMeters } from "@/utils/areaUnits";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };
const AXIS_STYLE = { fontSize: 11, fill: "#5B6152" };

type CompareBy = "governorate" | "wilayat" | "farm" | "treeType";

export function Statistics() {
  const { loading, farms, treePoints, treePolygons, filterOptions } = useCensusData();
  const [filters, setFilters] = useState<CensusFilters>(EMPTY_FILTERS);
  const [compareBy, setCompareBy] = useState<CompareBy>("wilayat");

  const stats = useFilteredStatistics(farms, treePoints, treePolygons, filters, null);

  const farmSummaries = useMemo(
    () => buildFarmSummaries(farms, treePoints, treePolygons),
    [farms, treePoints, treePolygons]
  );

  const farmComparisonData = useMemo(
    () =>
      [...farmSummaries]
        .sort((a, b) => b.totalTrees - a.totalTrees)
        .slice(0, 15)
        .map((f) => ({ label: f.farmId, trees: f.totalTrees, area: hectaresToSquareMeters(f.farmAreaHa) })),
    [farmSummaries]
  );

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading statistics…</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Farms", value: stats.totalFarms.toLocaleString() },
    { label: "Total Vegetation", value: stats.totalTrees.toLocaleString() },
    { label: "Avg. Vegetation / Farm", value: stats.totalFarms ? Math.round(stats.totalTrees / stats.totalFarms).toLocaleString() : "0" },
    { label: "Surveyed Area", value: formatSquareMeters(stats.totalSurveyedAreaHa) },
  ];

  return (
    <>
      <Header title="Statistics" filters={filters} filterOptions={filterOptions} onChange={setFilters} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Analytics</span>
            <h2>Census statistics</h2>
            <p>Compare agricultural coverage and vegetation distribution across governorates, wilayats, farms and vegetation types.</p>
          </div>
          <div className="page-intro-metric"><strong>{stats.totalTrees.toLocaleString()}</strong><span>vegetation records analysed</span></div>
        </section>
        <div className="section-label">Key indicators</div>
        <div className="stat-summary-row">
          {summaryCards.map((c) => (
            <div className="kpi-card" key={c.label}>
              <span className="kpi-card-label">{c.label}</span>
              <span className="kpi-card-value">{c.value}</span>
            </div>
          ))}
        </div>

        <div className="section-label">Comparison</div>
        <div className="page-toolbar refined-toolbar">
          <span style={{ fontSize: 12.5, color: "var(--color-ink-soft)", fontWeight: 600 }}>
            Compare by:
          </span>
          <select
            className="pill-select"
            value={compareBy}
            onChange={(e) => setCompareBy(e.target.value as CompareBy)}
          >
            <option value="governorate">Governorate</option>
            <option value="wilayat">Wilayat</option>
            <option value="farm">Farm (top 15 by vegetation count)</option>
            <option value="treeType">Vegetation Type</option>
          </select>
        </div>

        {compareBy === "governorate" && (
          <div className="panel analytics-panel">
            <div className="panel-title">Vegetation by Governorate</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={stats.treesByGovernorate}>
                <XAxis dataKey="governorate" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Bar dataKey="count" name="Vegetation" fill="#7A875F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {compareBy === "wilayat" && (
          <div className="panel analytics-panel">
            <div className="panel-title">Vegetation by Wilayat</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={stats.treesByWilayat}>
                <XAxis dataKey="wilayat" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Bar dataKey="count" name="Vegetation" fill="#A9C91B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {compareBy === "farm" && (
          <div className="panel analytics-panel">
            <div className="panel-title">Top 15 Farms by Vegetation Count</div>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={farmComparisonData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={AXIS_STYLE} width={70} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Bar dataKey="trees" name="Vegetation" fill="#59664D" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {compareBy === "treeType" && (
          <div className="panel analytics-panel">
            <div className="panel-title">Vegetation by Type</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={stats.treesByType}>
                <XAxis dataKey="treeType" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Bar dataKey="count" name="Vegetation" fill="#93A55D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
