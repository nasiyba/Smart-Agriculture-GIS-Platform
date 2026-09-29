import { Header } from "@/components/layout/Header";
import type { CensusFilters } from "@/types";

const EMPTY_FILTERS: CensusFilters = { governorate: null, wilayat: null, farmId: null, treeType: null };

export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <>
      <Header title={title} filters={EMPTY_FILTERS} filterOptions={null} onChange={() => {}} />
      <div className="content-area">
        <div className="panel">
          <div className="panel-title">{title}</div>
          <p className="empty-state">{note}</p>
        </div>
      </div>
    </>
  );
}
