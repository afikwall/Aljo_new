import { useMemo, useCallback } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReportSectionCard, type KpiChip } from "@/components/ReportSectionCard";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import {
  type DateRange,
  downloadCSV,
  getCSVFilename,
  getStaffName,
  getStaffInitials,
} from "@/utils/reportUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface StaffProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleType?: string;
  complianceStatus?: string;
  onboardingStatus?: string;
  orientedFacilityIds?: string[];
  createdAt?: string;
}

interface StaffDocument {
  id?: string;
  staffProfileId?: string;
  documentType?: string;
  expiryDate?: string;
  reviewStatus?: string;
  isRequired?: boolean;
}

interface RoleUpgradeApp {
  id?: string;
  status?: string;
  staffProfileId?: string;
  currentRole?: string;
  requestedRole?: string;
  appliedAt?: string;
  staffEmail?: string;
}

interface Facility {
  id?: string;
  name?: string;
}

interface ComplianceSectionProps {
  staffProfiles: StaffProfile[];
  staffDocuments: StaffDocument[];
  roleUpgradeApps: RoleUpgradeApp[];
  staffMap: Map<string, StaffProfile>;
  facilityMap: Map<string, Facility>;
  facilityFilter: string;
  dateRange: DateRange;
  isLoading: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  government_id: "Government ID",
  background_check: "Background Check",
  tb_test: "TB Test",
  covid_vaccination: "COVID Vaccination",
  nursing_license: "Nursing License",
  cpr_certification: "CPR Certification",
};

export const ComplianceSection = ({
  staffProfiles,
  staffDocuments,
  roleUpgradeApps,
  staffMap,
  facilityMap,
  facilityFilter,
  dateRange,
  isLoading,
}: ComplianceSectionProps) => {
  // Filter staff by facility if needed (using orientedFacilityIds)
  const filteredStaff = useMemo(() => {
    if (facilityFilter === "all") return staffProfiles;
    return staffProfiles.filter(s =>
      s.orientedFacilityIds?.includes(facilityFilter)
    );
  }, [staffProfiles, facilityFilter]);

  // Compliance status counts
  const complianceCounts = useMemo(() => {
    const counts = { compliant: 0, pending: 0, expired: 0, blocked: 0 };
    filteredStaff.forEach(s => {
      const status = s.complianceStatus || "pending";
      if (status in counts) counts[status as keyof typeof counts]++;
    });
    return counts;
  }, [filteredStaff]);

  // Pie chart data
  const pieData = useMemo(() => {
    const entries = [
      { name: "compliant", label: "Compliant", value: complianceCounts.compliant },
      { name: "pending", label: "Pending", value: complianceCounts.pending },
      { name: "expired", label: "Expired", value: complianceCounts.expired },
      { name: "blocked", label: "Blocked", value: complianceCounts.blocked },
    ];
    return entries.filter(e => e.value > 0);
  }, [complianceCounts]);

  const chartConfig = useMemo(
    () => ({
      compliant: { label: "Compliant", color: "hsl(var(--accent))" },
      pending: { label: "Pending", color: "hsl(var(--chart-3))" },
      expired: { label: "Expired", color: "hsl(var(--destructive))" },
      blocked: { label: "Blocked", color: "hsl(var(--chart-4))" },
    }),
    []
  );

  const COLORS = useMemo(
    () => ({
      compliant: "hsl(var(--accent))",
      pending: "hsl(var(--chart-3))",
      expired: "hsl(var(--destructive))",
      blocked: "hsl(var(--chart-4))",
    }),
    []
  );

  // Expiring documents (next 30 days)
  const now = useMemo(() => new Date(), []);
  const thirtyDaysOut = useMemo(() => addDays(now, 30), [now]);

  const expiringDocs = useMemo(() => {
    // Filter to staff in our filtered set
    const staffIds = new Set(filteredStaff.map(s => s.id).filter(Boolean));
    return staffDocuments
      .filter(doc => {
        if (!doc.expiryDate || !doc.staffProfileId) return false;
        if (!staffIds.has(doc.staffProfileId)) return false;
        try {
          const expiry = parseISO(doc.expiryDate);
          return expiry >= now && expiry <= thirtyDaysOut;
        } catch {
          return false;
        }
      })
      .map(doc => {
        const expiryDate = parseISO(doc.expiryDate!);
        const daysUntil = differenceInDays(expiryDate, now);
        return {
          ...doc,
          staff: staffMap.get(doc.staffProfileId!),
          daysUntil,
          expiryDateFormatted: format(expiryDate, "MMM d, yyyy"),
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [staffDocuments, filteredStaff, staffMap, now, thirtyDaysOut]);

  // Incomplete onboarding
  const incompleteOnboarding = useMemo(
    () => filteredStaff.filter(s => s.onboardingStatus !== "approved"),
    [filteredStaff]
  );

  // Pending role upgrades
  const pendingUpgrades = useMemo(
    () => roleUpgradeApps.filter(a => a.status === "pending" || a.status === "under_review"),
    [roleUpgradeApps]
  );

  const kpis: KpiChip[] = useMemo(
    () => [
      { label: "Total Staff", value: filteredStaff.length },
      { label: "Compliant", value: complianceCounts.compliant },
      { label: "Non-Compliant", value: filteredStaff.length - complianceCounts.compliant },
      { label: "Expiring (30d)", value: expiringDocs.length },
    ],
    [filteredStaff, complianceCounts, expiringDocs]
  );

  const handleDownloadCSV = useCallback(() => {
    const rows = filteredStaff.map(s => {
      const docs = staffDocuments.filter(d => d.staffProfileId === s.id);
      const expiringDoc = docs.find(d => {
        if (!d.expiryDate) return false;
        try {
          const exp = parseISO(d.expiryDate);
          return exp >= now && exp <= thirtyDaysOut;
        } catch { return false; }
      });
      return {
        staffName: getStaffName(s),
        email: s.email || "",
        complianceStatus: s.complianceStatus || "",
        onboardingStatus: s.onboardingStatus || "",
        expiringDocType: expiringDoc?.documentType || "",
        expiryDate: expiringDoc?.expiryDate || "",
      };
    });
    downloadCSV(rows, getCSVFilename("compliance", dateRange.start, dateRange.end));
    toast.success("CSV downloaded");
  }, [filteredStaff, staffDocuments, now, thirtyDaysOut, dateRange]);

  const getOnboardingBadgeColor = useCallback((status?: string) => {
    switch (status) {
      case "approved": return "bg-accent/20 text-accent";
      case "pending_review": return "bg-chart-3/20 text-chart-3";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "incomplete": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  }, []);

  return (
    <ReportSectionCard
      title="Compliance Report"
      icon={ShieldCheck}
      kpis={kpis}
      isLoading={isLoading}
      hasData={filteredStaff.length > 0}
      emptyIcon={ShieldCheck}
      emptyMessage="No staff data found"
      onDownloadCSV={handleDownloadCSV}
    >
      <div className="space-y-6">
        {/* Compliance Status Pie Chart */}
        {pieData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Compliance Status Distribution</h4>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                >
                  {pieData.map(entry => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name as keyof typeof COLORS] || "hsl(var(--muted))"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Expiring Documents */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Documents Expiring in Next 30 Days ({expiringDocs.length})
          </h4>
          {expiringDocs.length > 0 ? (
            <div className="space-y-2">
              {expiringDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-chart-3/10 text-chart-3">
                      {getStaffInitials(doc.staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{getStaffName(doc.staff)}</span>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_TYPE_LABELS[doc.documentType || ""] || doc.documentType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doc.daysUntil < 7 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge
                      variant={doc.daysUntil < 7 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {doc.daysUntil}d left — {doc.expiryDateFormatted}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents expiring soon</p>
          )}
        </div>

        {/* Incomplete Onboarding */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Incomplete Onboarding ({incompleteOnboarding.length})
          </h4>
          {incompleteOnboarding.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="grid grid-cols-4 gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pb-2 border-b">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Status</span>
                  <span>Registered</span>
                </div>
                <div className="divide-y divide-border">
                  {incompleteOnboarding.slice(0, 10).map(s => (
                    <div key={s.id} className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-muted/30">
                      <span className="font-medium truncate">{getStaffName(s)}</span>
                      <span className="text-muted-foreground truncate">{s.email}</span>
                      <span>
                        <Badge className={`text-xs ${getOnboardingBadgeColor(s.onboardingStatus)}`}>
                          {s.onboardingStatus || "unknown"}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground">
                        {s.createdAt ? format(parseISO(s.createdAt), "MMM d, yyyy") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All staff have completed onboarding</p>
          )}
        </div>

        {/* Pending Role Upgrades */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Pending Role Upgrades ({pendingUpgrades.length})
          </h4>
          {pendingUpgrades.length > 0 ? (
            <div className="space-y-2">
              {pendingUpgrades.map(app => {
                const staff = staffMap.get(app.staffProfileId || "");
                return (
                  <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-chart-4/10 text-chart-4">
                        {getStaffInitials(staff)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{getStaffName(staff)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-xs ${getRoleBadgeColor(app.currentRole)}`}>
                        {app.currentRole}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge className={`text-xs ${getRoleBadgeColor(app.requestedRole)}`}>
                        {app.requestedRole}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending role upgrade applications</p>
          )}
        </div>
      </div>
    </ReportSectionCard>
  );
};