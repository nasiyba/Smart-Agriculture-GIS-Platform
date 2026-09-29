import { Link } from "react-router-dom";
import { Sprout, Trees, Tag, Ruler, Map, MapPinned, ArrowUpRight } from "lucide-react";
import type { CensusStatistics } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";

interface KpiCardsProps {
  stats: CensusStatistics;
}

const ICONS = { Sprout, Trees, Tag, Ruler, Map, MapPinned };

export function KpiCards({ stats }: KpiCardsProps) {
  const heroValue = stats.totalFarms
    ? Math.round(stats.totalTrees / stats.totalFarms).toLocaleString()
    : "0";

  const pillCards: { label: string; value: string; unit?: string; icon: keyof typeof ICONS }[] = [
    { label: "Total Farms", value: stats.totalFarms.toLocaleString(), icon: "Sprout" },
    { label: "Total Vegetation", value: stats.totalTrees.toLocaleString(), icon: "Trees" },
    { label: "Vegetation Types", value: stats.treeTypeCount.toString(), icon: "Tag" },
    { label: "Surveyed Area", value: formatSquareMeters(stats.totalSurveyedAreaHa), icon: "Ruler" },
    { label: "Governorates", value: stats.governoratesCovered.toString(), icon: "Map" },
    { label: "Wilayats", value: stats.wilayatsCovered.toString(), icon: "MapPinned" },
  ];


  return (
    <>
      <div className="kpi-row">
        <div className="kpi-hero-card">
          <span className="kpi-hero-label">Avg. vegetation / farm</span>
          <span className="kpi-hero-value">{heroValue}</span>
          <span className="kpi-hero-sub">across {stats.totalFarms} surveyed farms</span>
        </div>

        {pillCards.map((c) => {
          const Icon = ICONS[c.icon];
          return (
            <div className="kpi-pill-card" key={c.label}>
              <span className="kpi-pill-icon">
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="kpi-pill-text">
                <span className="kpi-pill-value">
                  {c.value}
                  {c.unit && <span className="kpi-pill-unit"> {c.unit}</span>}
                </span>
                <span className="kpi-pill-label">{c.label}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="kpi-secondary-row">
        <Link to="/statistics" className="kpi-accent-button">
          View statistics <ArrowUpRight size={13} />
        </Link>
      </div>
    </>
  );
}
