import { useMemo, useState } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { exportToCsv } from "@/utils/csvExport";

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

interface DataTableProps<T extends object> {
  rows: T[];
  columns: DataTableColumn<T>[];
  /** Which fields the search box filters against (defaults to all string/number fields). */
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  csvFilename?: string;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  rows,
  columns,
  searchKeys,
  onRowClick,
  csvFilename,
  pageSize = 25,
  emptyMessage = "No records match your search.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const effectiveSearchKeys = searchKeys ?? columns.map((c) => c.key);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      effectiveSearchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, effectiveSearchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleExport() {
    exportToCsv(
      sorted,
      columns.map((c) => ({ key: c.key, label: c.label })),
      csvFilename ?? "export"
    );
  }

  return (
    <div className="data-table-wrap">
      <div className="data-table-toolbar">
        <div className="header-search data-table-search">
          <Search size={14} />
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="data-table-count">{sorted.length.toLocaleString()} records</span>
        {csvFilename && (
          <button className="data-table-export" onClick={handleExport}>
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={`${String(col.key)}-${col.label}`}
                  className={col.align === "right" ? "align-right" : undefined}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? "pointer" : "default" }}
                >
                  {col.label}
                  {col.sortable !== false && <ArrowUpDown size={11} className="data-table-sort-icon" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {pageRows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "clickable" : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={`${String(col.key)}-${col.label}`}
                    className={col.align === "right" ? "align-right" : undefined}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="data-table-pagination">
          <button disabled={clampedPage <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            Page {clampedPage} of {totalPages}
          </span>
          <button disabled={clampedPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
