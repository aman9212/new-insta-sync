import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  variant?: "default" | "elevated" | "glass";
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  emptyMessage = "No data",
  onRowClick,
  variant = "default",
}: DataTableProps<T>) {
  const tableVariants = {
    default: "border border-border bg-surface",
    elevated: "border border-border-strong bg-surface-elevated shadow-xl shadow-black/20",
    glass: "glass border border-border-strong",
  };

  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border p-8 text-center text-sm ${tableVariants[variant]}`}>
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-text-muted">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive rounded-2xl overflow-hidden">
      <div className={`overflow-x-auto ${tableVariants[variant]}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 font-medium text-text-secondary text-xs uppercase tracking-wider whitespace-nowrap
                    ${col.hideOnMobile ? "hidden md:table-cell" : ""}
                    ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"}
                    ${col.className || ""}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={String(row[keyField])}
                className={`
                  bg-surface transition-all duration-150 ease-out
                  ${onRowClick ? "cursor-pointer hover:bg-surface-hover hover:shadow-sm" : "hover:bg-surface-hover/50"}
                  ${onRowClick ? "active:bg-surface-overlay" : ""}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-4 py-3 whitespace-nowrap
                      ${col.hideOnMobile ? "hidden md:table-cell" : ""}
                      ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"}
                      ${col.className || ""}
                    `}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}