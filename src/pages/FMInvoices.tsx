import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Receipt, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  InvoicesEntity,
  FacilityManagerProfilesEntity,
  FacilitiesEntity,
} from "@/product-types";

import { FMInvoiceCard } from "@/components/FMInvoiceCard";
import { FMInvoiceDetailSheet } from "@/components/FMInvoiceDetailSheet";
import { formatCAD } from "@/utils/invoiceUtils";

type InvoiceInstance = typeof InvoicesEntity["instanceType"] & { id?: string; createdAt?: string };
type FMProfileInstance = typeof FacilityManagerProfilesEntity["instanceType"] & { id?: string };
type FacilityInstance = typeof FacilitiesEntity["instanceType"] & { id?: string };

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function FMInvoices() {
  const user = useUser();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInstance | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Fetch FM profile by email to get facilityProfileId
  const { data: fmProfilesRaw, isLoading: loadingFMProfile } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated }
  );

  const fmProfile = useMemo(() => {
    const profiles = (fmProfilesRaw as FMProfileInstance[] | undefined) || [];
    return profiles[0] || null;
  }, [fmProfilesRaw]);

  const facilityProfileId = fmProfile?.facilityProfileId || "";

  // Fetch invoices for this facility
  const { data: invoicesRaw, isLoading: loadingInvoices } = useEntityGetAll(
    InvoicesEntity,
    { facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  // Fetch facility details for name
  const { data: facilitiesRaw } = useEntityGetAll(
    FacilitiesEntity,
    {},
    { enabled: !!facilityProfileId }
  );

  const facilityName = useMemo(() => {
    const facilities = (facilitiesRaw as FacilityInstance[] | undefined) || [];
    const facility = facilities.find((f) => f.id === facilityProfileId);
    return facility?.name || "Your Facility";
  }, [facilitiesRaw, facilityProfileId]);

  const invoices = useMemo(() => {
    return ((invoicesRaw as InvoiceInstance[] | undefined) || []).sort((a, b) => {
      // Sort by createdAt descending (newest first)
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });
  }, [invoicesRaw]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return invoices;
    return invoices.filter((inv) => inv.invoiceStatus === statusFilter);
  }, [invoices, statusFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const outstanding = invoices
      .filter((inv) => inv.invoiceStatus === "draft" || inv.invoiceStatus === "sent")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paid = invoices
      .filter((inv) => inv.invoiceStatus === "paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    return { totalInvoiced, outstanding, paid };
  }, [invoices]);

  const handleViewDetails = useCallback((invoice: InvoiceInstance) => {
    setSelectedInvoice(invoice);
    setDetailSheetOpen(true);
  }, []);

  const isLoading = loadingFMProfile || loadingInvoices;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            View and download your facility invoices
          </p>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Invoiced
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {isLoading ? <Skeleton className="h-8 w-32" /> : formatCAD(kpis.totalInvoiced)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Outstanding
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {isLoading ? <Skeleton className="h-8 w-32" /> : formatCAD(kpis.outstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Paid
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {isLoading ? <Skeleton className="h-8 w-32" /> : formatCAD(kpis.paid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors min-h-[36px]",
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/50"
            )}
          >
            {filter.label}
            {filter.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {invoices.filter((inv) =>
                  filter.value === "all" ? true : inv.invoiceStatus === filter.value
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredInvoices.length === 0 && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold">No invoices found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "There are no invoices for your facility yet."
                : `No ${statusFilter} invoices found.`}
            </p>
          </div>
        </div>
      )}

      {/* Invoice Cards */}
      {!isLoading && filteredInvoices.length > 0 && (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <FMInvoiceCard
              key={invoice.id}
              invoice={invoice}
              onViewDetails={() => handleViewDetails(invoice)}
            />
          ))}
        </div>
      )}

      {/* Invoice Detail Sheet (FM Read-Only) */}
      <FMInvoiceDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        invoice={selectedInvoice}
        facilityName={facilityName}
      />
    </div>
  );
}