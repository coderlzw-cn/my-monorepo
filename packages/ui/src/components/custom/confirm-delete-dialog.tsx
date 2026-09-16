import type { ComponentProps, ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/shadcn/alert-dialog";
import { RiLoader4Line } from "@remixicon/react";

export type ConfirmDeleteDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: ComponentProps<typeof AlertDialogAction>["variant"];
  description: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function ConfirmDeleteDialog({
  cancelLabel = "取消",
  confirmLabel = "删除",
  confirmVariant = "destructive",
  description,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) {
          return;
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            variant={confirmVariant}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending && <RiLoader4Line aria-hidden="true" className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
