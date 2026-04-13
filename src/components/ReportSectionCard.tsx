import React from "react";
import { useState, useCallback, type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Download, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiChip {
  label: string;
  value: string | number;
}

interface ReportSectionCardProps {
  title: string;
  icon: LucideIcon;
  kpis: KpiChip[];
  isLoading: boolean;
  hasData: boolean;
  emptyIcon: LucideIcon;
  emptyMessage: string;
  onDownloadCSV: () => void;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export const ReportSectionCard = ({
  title,
  icon: Icon,
  kpis,
  isLoading,
  hasData,
  emptyIcon: EmptyIcon,
  emptyMessage,
  onDownloadCSV,
  children,
  defaultExpanded = true,
}: ReportSectionCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDownloadCSV();
    },
    [onDownloadCSV]
  );

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-3 px-4"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-base font-semibold shrink-0">{title}</span>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-24 rounded-full" />
                  ))
                : kpis.map(kpi => (
                    <span
                      key={kpi.label}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {kpi.label}:{" "}
                      <span className="text-foreground font-semibold">{kpi.value}</span>
                    </span>
                  ))}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handleDownload}
              disabled={isLoading || !hasData}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
              <EmptyIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  );
};