import { cn } from "cn";
import React from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../shadcn/breadcrumb";


export interface BreadcrumbTrailItem {
  href?: string;
  label: React.ReactNode;
}
interface BreadcrumbTrailProps extends Omit<React.ComponentProps<typeof Breadcrumb>, "children"> {
  items: BreadcrumbTrailItem[];
  renderLink?: (item: BreadcrumbTrailItem) => React.ReactNode;
}


function BreadcrumbTrail({ className, items, renderLink, ...props }: BreadcrumbTrailProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb className={cn("min-w-0", className)} {...props}>
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <React.Fragment key={`${item.href ?? "current"}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {current ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild={Boolean(renderLink)} className="truncate" href={renderLink ? undefined : item.href}>
                    {renderLink ? renderLink(item) : item.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export {BreadcrumbTrail}
