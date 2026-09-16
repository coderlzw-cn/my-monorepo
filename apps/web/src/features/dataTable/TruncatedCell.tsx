import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/ui/components/shadcn/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type TruncatedCellProps = ComponentPropsWithoutRef<"span"> & {
  value: string;
  tooltipClassName?: string;
};

export function TruncatedCell({ value, className, tooltipClassName, ...props }: TruncatedCellProps) {
  return (
    <Tooltip disableHoverableContent>
      <TooltipTrigger asChild>
        <span className={cn("block cursor-default truncate", className)} tabIndex={0} {...props}>
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent className={cn("max-w-xs break-all", tooltipClassName)}>{value}</TooltipContent>
    </Tooltip>
  );
}
