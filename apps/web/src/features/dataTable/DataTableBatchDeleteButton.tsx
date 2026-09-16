import { RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@workspace/ui/components/shadcn/button";

export interface DataTableBatchDeleteButtonProps {
  count: number;
  disabled?: boolean;
  onDelete: () => void;
}

export function DataTableBatchDeleteButton({ count, disabled, onDelete }: DataTableBatchDeleteButtonProps) {
  if (count === 0) return null;

  return (
    <Button disabled={disabled} size="sm" type="button" variant="destructive" onClick={onDelete}>
      <RiDeleteBinLine aria-hidden="true" />
      批量删除（{count}）
    </Button>
  );
}
