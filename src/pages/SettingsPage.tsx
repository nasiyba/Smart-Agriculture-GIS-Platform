import { Header } from "@/components/layout/Header";
import type { CensusFilters } from "@/types";
import { SlidersHorizontal, MapPinned, Database, Bell } from "lucide-react";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

const settingsGroups = [
  {
    icon: SlidersHorizontal,
    title: "Display Preferences",
    items: ["Default landing page: Dashboard", "Dashboard style: Executive overview", "Compact KPI cards enabled"],
  },
  {
    icon: MapPinned,
    title: "Map Workspace",
    items: ["Default extent: Census coverage", "Imagery layer visible on open", "Tree layers reveal on closer zoom"],
  },
  {
    icon: Database,
    title: "Data Source Mode",
    items: ["Current mode: Local / mock data", "Ready for ArcGIS Feature Services", "QC checks enabled in Data Explorer"],
  },
  {
    icon: Bell,
    title: "Notifications",
    items: ["Show data refresh status", "Show import warnings", "Highlight missing attributes in QC"],
  },
];

export function SettingsPage() {
  return (
    <>
      <Header title="Settings" filters={EMPTY_FILTERS} filterOptions={null} onChange={() => {}} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Application preferences</span>
            <h2>Platform settings</h2>
            <p>Review workspace preferences, current data mode, map behavior, and quality-control options for the Agricultural Census platform.</p>
          </div>
          <div className="page-intro-metric"><strong>4</strong><span>setting groups</span></div>
        </section>

        <section className="settings-grid">
          {settingsGroups.map(({ icon: Icon, title, items }) => (
            <div className="content-card settings-card" key={title}>
              <div className="settings-card-head">
                <span className="settings-card-icon"><Icon size={18} strokeWidth={2.1} /></span>
                <h3>{title}</h3>
              </div>
              <div className="settings-list">
                {items.map((item) => (
                  <div className="settings-list-item" key={item}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
