import type { RowData } from "@tanstack/react-table";

import { Checkbox } from "@workspace/ui/components/shadcn/checkbox";
import type { DataTableColumnDef } from "@workspace/ui/components/table/types";

export interface DataTableSelectionOptions<TData extends RowData> {
  getLabel: (row: TData) => string;
  canSelect?: (row: TData) => boolean;
}

/** 创建统一的当前页全选与单行选择列。 */
export function createDataTableSelectionColumn<TData extends RowData>({ getLabel, canSelect = () => true }: DataTableSelectionOptions<TData>): DataTableColumnDef<TData> {
  return {
    id: "select",
    size: 48,
    header: ({ table }) => {
      const rows = table.getRowModel().rows.filter((row) => canSelect(row.original));
      const selectedCount = rows.filter((row) => row.getIsSelected()).length;
      const checked = rows.length > 0 && selectedCount === rows.length ? true : selectedCount > 0 ? "indeterminate" : false;

      return (
        <div className="flex justify-center">
          <Checkbox aria-label="全选当前页" checked={checked} onCheckedChange={(value) => rows.forEach((row) => row.toggleSelected(Boolean(value)))} />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox aria-label={`选择 ${getLabel(row.original)}`} checked={row.getIsSelected()} disabled={!canSelect(row.original)} onCheckedChange={(value) => row.toggleSelected(Boolean(value))} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
  };
}
