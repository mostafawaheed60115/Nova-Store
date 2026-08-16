import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/**
 * Safely extracts nested property or executes getter
 */
function extractValue(item, keyOrFn) {
  if (!item) return "";
  if (typeof keyOrFn === "function") {
    return keyOrFn(item);
  }
  if (typeof keyOrFn === "string" && keyOrFn.includes(".")) {
    return keyOrFn.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), item);
  }
  return item[keyOrFn];
}

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  pageSize = 10,
  isLoading = false,
  emptyMessage = "No records found.",
  customFilters = null,
  actions = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' | 'desc'
  const [perPage, setPerPage] = useState(pageSize);

  // Active sort column definition
  const activeCol = useMemo(
    () => columns.find((c) => (c.sortKey || c.key) === sortKey),
    [columns, sortKey]
  );

  // Filter Data with Deep Property Search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();

    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = extractValue(item, k);
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      }

      // Fallback: search all values recursively
      return Object.values(item).some((val) => {
        if (typeof val === "object" && val !== null) {
          return Object.values(val).some((subVal) =>
            subVal !== undefined && subVal !== null && String(subVal).toLowerCase().includes(q)
          );
        }
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sort Data with Numeric & String Detection
  const sortedData = useMemo(() => {
    if (!sortKey || !activeCol) return filteredData;
    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      let aVal = activeCol.sortValue ? activeCol.sortValue(a) : extractValue(a, activeCol.sortKey || activeCol.key);
      let bVal = activeCol.sortValue ? activeCol.sortValue(b) : extractValue(b, activeCol.sortKey || activeCol.key);

      // Handle null/undefined (push to end)
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle boolean
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        const diff = aVal === bVal ? 0 : aVal ? 1 : -1;
        return sortDirection === "asc" ? diff : -diff;
      }

      // Handle numbers or numeric strings
      const aNum = typeof aVal === "number" ? aVal : Number(String(aVal).replace(/[^0-9.-]/g, ""));
      const bNum = typeof bVal === "number" ? bVal : Number(String(bVal).replace(/[^0-9.-]/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== "boolean" && typeof bVal !== "boolean") {
        if (aNum < bNum) return sortDirection === "asc" ? -1 : 1;
        if (aNum > bNum) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      // String natural sort
      const strA = String(aVal);
      const strB = String(bVal);
      const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [filteredData, sortKey, activeCol, sortDirection]);

  // Paginate Data
  const totalPages = Math.ceil(sortedData.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, currentPage, perPage]);

  const handleSort = (key, sortable = true) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="data-table-container">
      {/* Table Top Controls Bar */}
      <div className="data-table-toolbar">
        {searchable && (
          <div className="data-table-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="clear-search-btn"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {customFilters && <div className="data-table-filters">{customFilters}</div>}

        {actions && <div className="data-table-actions">{actions}</div>}
      </div>

      {/* Table View */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  onClick={() => handleSort(col.sortKey || col.key, col.sortable !== false)}
                  className={col.sortable !== false ? "sortable-header" : ""}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className="th-content">
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <span className="sort-icon">
                        {sortKey === (col.sortKey || col.key) ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={14} color="var(--blue-bell)" />
                          ) : (
                            <ArrowDown size={14} color="var(--blue-bell)" />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="sort-idle" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="skeleton-row">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`}>
                      <div className="skeleton-cell" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  <div className="empty-content">
                    <p>{emptyMessage}</p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: "0.5rem" }}
                      >
                        Reset Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || `row-${rowIdx}`} className="data-table-row">
                  {columns.map((col) => (
                    <td key={col.key || col.label} className={col.className || ""}>
                      {col.render ? col.render(row, rowIdx) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div className="data-table-footer">
          <div className="pagination-info">
            Showing <strong>{(currentPage - 1) * perPage + 1}</strong> to{" "}
            <strong>{Math.min(currentPage * perPage, sortedData.length)}</strong> of{" "}
            <strong>{sortedData.length}</strong> items
          </div>

          <div className="pagination-controls">
            <div className="page-size-selector">
              <span>Show:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="page-nav-btns">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="page-indicator">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
