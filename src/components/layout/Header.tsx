import { Search } from "lucide-react";
import type { CensusFilters } from "@/types";

interface FilterOptions {
  governorates: string[];
  wilayatsByGovernorate: Map<string, string[]>;
  farmsByWilayat: Map<string, string[]>;
  treeTypes: string[];
}

interface HeaderProps {
  title: string;
  filters: CensusFilters;
  filterOptions: FilterOptions | null;
  onChange: (filters: CensusFilters) => void;
}

export function Header({ title, filters, filterOptions, onChange }: HeaderProps) {
  const wilayatOptions = filters.governorate
    ? filterOptions?.wilayatsByGovernorate.get(filters.governorate) ?? []
    : [...(filterOptions?.wilayatsByGovernorate.values() ?? [])].flat();

  const farmOptions = filters.wilayat
    ? filterOptions?.farmsByWilayat.get(filters.wilayat) ?? []
    : [];

  function update(partial: Partial<CensusFilters>) {
    const next = { ...filters, ...partial };
    // Cascade resets: changing a parent clears dependent children.
    if (partial.governorate !== undefined) {
      next.wilayat = null;
      next.farmId = null;
    }
    if (partial.wilayat !== undefined) {
      next.farmId = null;
    }
    onChange(next);
  }

  const hasActiveFilters = filters.governorate || filters.wilayat || filters.farmId || filters.treeType;

  return (
    <header className="header">
      <div className="header-top-row">
        <h1 className="header-title">{title}</h1>
        <div className="header-actions">
          <div className="header-search">
            <Search size={14} />
            <input placeholder="Search farm ID, wilayat…" />
          </div>
        </div>
      </div>

      <div className="filter-row">
        <select
          className="filter-select"
          value={filters.governorate ?? ""}
          onChange={(e) => update({ governorate: e.target.value || null })}
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
          value={filters.wilayat ?? ""}
          onChange={(e) => update({ wilayat: e.target.value || null })}
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
          value={filters.farmId ?? ""}
          onChange={(e) => update({ farmId: e.target.value || null })}
          disabled={!filters.wilayat}
        >
          <option value="">{filters.wilayat ? "All Farms" : "Select a wilayat first"}</option>
          {farmOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.treeType ?? ""}
          onChange={(e) => update({ treeType: e.target.value || null })}
        >
          <option value="">All Tree Types</option>
          {filterOptions?.treeTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            className="filter-reset"
            onClick={() => onChange({ governorate: null, wilayat: null, farmId: null, treeType: null })}
          >
            Reset filters
          </button>
        )}
      </div>
    </header>
  );
}
