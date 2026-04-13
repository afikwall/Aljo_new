import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  Receipt,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

import {
  InvoicesEntity,
  FacilitiesEntity,
} from "@/product-types";

import { StatsCard } from "@/components/StatsCard";
import { InvoiceCard } from "@/components/InvoiceCard";
import { InvoiceDetailSheet } from "@/components/InvoiceDetailSheet";

import { buildLookupMap } from "@/utils/reportUtils";
import { formatCAD, isInCurrentMonth } from "@/utils/invoiceUtils";

// Type aliases
type InvoiceInstance = typeof InvoicesEntity["instanceType"] & {
  id?: string;
  createdAt?: string;
};
type FacilityInstance = typeof FacilitiesEntity["instanceType"] & {
  id?: string;
};

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";

export default function AdminInvoices() {
  // ─── Filter State ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Sheet State ───────────────────────────────────────────────────────────
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInstance | null>(null);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const {
    data: invoicesRaw,
    isLoading: loadingInvoices,
    refetch: refetchInvoices,
  } = useEntityGetAll(InvoicesEntity);
  const { data: facilitiesRaw, isLoading: loadingFacilities } =
    useEntityGetAll(FacilitiesEntity);
  const { updateFunction, isLoading: isUpdating } =
    useEntityUpdate(InvoicesEntity);

  // Cast data
  const invoices = useMemo(
    () => (invoicesRaw as InvoiceInstance[] | undefined) || [],
    [invoicesRaw]
  );
  const facilities = useMemo(
    () => (facilitiesRaw as FacilityInstance[] | undefined) || [],
    [facilitiesRaw]
  );

  // Lookup maps
  const facilityMap = useMemo(() => buildLookupMap(facilities), [facilities]);

  // Facility options for filter
  const facilityOptions = useMemo(
    () =>
      facilities
        .filter((f) => f.name)
        .map((f) => ({ id: (f as any).id || "", name: f.name || "" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [facilities]
  );

  const isLoading = loadingInvoices || loadingFacilities;

  // ─── KPI Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalThisMonth = invoices
      .filter((inv) => isInCurrentMonth(inv.createdAt))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const outstanding = invoices
      .filter(
        (inv) =>
          inv.invoiceStatus === "draft" || inv.invoiceStatus === "sent"
      )
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const paidThisMonth = invoices
      .filter(
        (inv) =>
          inv.invoiceStatus === "paid" && isInCurrentMonth(inv.paidAt)
      )
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const overdueCount = invoices.filter(
      (inv) => inv.invoiceStatus === "overdue"
    ).length;

    return { totalThisMonth, outstanding, paidThisMonth, overdueCount };
  }, [invoices]);

  // ─── Filtered Invoices ─────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.invoiceStatus === statusFilter);
    }

    // Facility filter
    if (facilityFilter !== "all") {
      result = result.filter(
        (inv) => inv.facilityProfileId === facilityFilter
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [invoices, statusFilter, facilityFilter, searchQuery]);

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleMarkSent = useCallback(
    async (invoiceId: string) => {
      try {
        await updateFunction({
          id: invoiceId,
          data: {
            invoiceStatus: "sent",
            sentAt: new Date().toISOString(),
          },
        });
        toast.success("Invoice marked as sent");
        refetchInvoices();
      } catch {
        toast.error("Failed to update invoice");
      }
    },
    [updateFunction, refetchInvoices]
  );

  const handleMarkPaid = useCallback(
    async (invoiceId: string) => {
      try {
        await updateFunction({
          id: invoiceId,
          data: {
            invoiceStatus: "paid",
            paidAt: new Date().toISOString(),
          },
        });
        toast.success("Invoice marked as paid");
        refetchInvoices();
      } catch {
        toast.error("Failed to update invoice");
      }
    },
    [updateFunction, refetchInvoices]
  );

  const handleMarkOverdue = useCallback(
    async (invoiceId: string) => {
      try {
        await updateFunction({
          id: invoiceId,
          data: {
            invoiceStatus: "overdue",
          },
        });
        toast.success("Invoice marked as overdue");
        refetchInvoices();
      } catch {
        toast.error("Failed to update invoice");
      }
    },
    [updateFunction, refetchInvoices]
  );

  const handleViewDetails = useCallback((invoice: InvoiceInstance) => {
    setSelectedInvoice(invoice);
    setDetailSheetOpen(true);
  }, []);

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track facility billing invoices
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Invoiced"
          value={formatCAD(stats.totalThisMonth)}
          icon={FileText}
          isLoading={isLoading}
          trend="This month"
        />
        <StatsCard
          title="Outstanding"
          value={formatCAD(stats.outstanding)}
          icon={Clock}
          isLoading={isLoading}
          trend="Draft + Sent"
        />
        <StatsCard
          title="Paid"
          value={formatCAD(stats.paidThisMonth)}
          icon={DollarSign}
          isLoading={isLoading}
          trend="This month"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdueCount}
          icon={AlertTriangle}
          isLoading={isLoading}
          iconClassName={stats.overdueCount > 0 ? "text-destructive" : undefined}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((sf) => (
            <Button
              key={sf.value}
              variant={statusFilter === sf.value ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setStatusFilter(sf.value)}
            >
              {sf.label}
            </Button>
          ))}
        </div>

        {/* Facility + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">
              <SelectValue placeholder="All Facilities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              {facilityOptions.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>
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
        <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold">No invoices found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || facilityFilter !== "all"
                ? "Try adjusting your filters."
                : "Generate invoices from the Payroll page."}
            </p>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const facility = invoice.facilityProfileId
              ? facilityMap.get(invoice.facilityProfileId)
              : undefined;

            return (
              <InvoiceCard
                key={(invoice as any).id}
                invoice={invoice}
                facilityName={facility?.name || "Unknown Facility"}
                onViewDetails={() => handleViewDetails(invoice)}
                onMarkSent={() => handleMarkSent((invoice as any).id)}
                onMarkPaid={() => handleMarkPaid((invoice as any).id)}
                onMarkOverdue={() => handleMarkOverdue((invoice as any).id)}
                isUpdating={isUpdating}
              />
            );
          })}
        </div>
      )}

      {/* Invoice Detail Sheet */}
      <InvoiceDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        invoice={selectedInvoice}
        facilityName={
          selectedInvoice?.facilityProfileId
            ? facilityMap.get(selectedInvoice.facilityProfileId)?.name ||
              "Unknown Facility"
            : "Unknown Facility"
        }
        onMarkSent={() =>
          selectedInvoice && handleMarkSent((selectedInvoice as any).id)
        }
        onMarkPaid={() =>
          selectedInvoice && handleMarkPaid((selectedInvoice as any).id)
        }
        onMarkOverdue={() =>
          selectedInvoice && handleMarkOverdue((selectedInvoice as any).id)
        }
        isUpdating={isUpdating}
      />
    </div>
  );
}