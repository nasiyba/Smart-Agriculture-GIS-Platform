import { Header } from "@/components/layout/Header";
import type { CensusFilters } from "@/types";
import { CircleHelp, Map, BarChart3, Database } from "lucide-react";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

const helpItems = [
  {
    icon: Map,
    title: "Using the Dashboard",
    body: "Use the Dashboard for a quick overview of surveyed farms, total trees, area covered, and current farm selection on the map.",
  },
  {
    icon: BarChart3,
    title: "Reading Statistics",
    body: "Open the Statistics page for detailed charts by tree type, governorate, and wilayat. This is the best page for analysis and presentation.",
  },
  {
    icon: Database,
    title: "Checking Data Quality",
    body: "Use Data Explorer to review missing Farm IDs, unknown tree types, invalid coordinates, and other records that need correction before reporting.",
  },
  {
    icon: CircleHelp,
    title: "Getting Support",
    body: "For technical support, capture a screenshot, include the page name, and describe the action being performed when the issue occurred.",
  },
];

export function HelpPage() {
  return (
    <>
      <Header title="Help" filters={EMPTY_FILTERS} filterOptions={null} onChange={() => {}} />
      <div className="content-area page-shell">
        <section className="page-intro">
          <div>
            <span className="eyebrow">Guidance & support</span>
            <h2>Help center</h2>
            <p>Quick guidance for navigating the Agricultural Census platform, understanding the main pages, and reviewing data quality before generating reports.</p>
          </div>
          <div className="page-intro-metric"><strong>4</strong><span>quick guides</span></div>
        </section>

        <section className="help-grid">
          {helpItems.map(({ icon: Icon, title, body }) => (
            <div className="content-card help-card" key={title}>
              <div className="help-card-head">
                <span className="help-card-icon"><Icon size={18} strokeWidth={2.1} /></span>
                <h3>{title}</h3>
              </div>
              <p>{body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
