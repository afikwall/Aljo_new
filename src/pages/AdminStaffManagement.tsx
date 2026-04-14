import { useEntityGetAll, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffProfilesEntity, StaffDocumentsEntity, RoleUpgradeApplicationsEntity, RoleTypesEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffCard } from "@/components/StaffCard";
import { FullStaffProfilePanel } from "@/components/FullStaffProfilePanel";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { PendingUpgradeAlert } from "@/components/PendingUpgradeAlert";

export const pageIcon = "users";

export default function AdminStaffManagementPage() {
  const user = useUser();
  const isMobile = useIsMobile();
  const { data: staffProfiles, isLoading: loadingStaff, refetch: refetchStaff } = useEntityGetAll(StaffProfilesEntity);
  const { data: staffDocuments, isLoading: loadingDocs, refetch: refetchDocs } = useEntityGetAll(StaffDocumentsEntity);
  const { data: upgradeApplications } = useEntityGetAll(RoleUpgradeApplicationsEntity);
  const { data: roleTypes } = useEntityGetAll(RoleTypesEntity);

  const pendingUpgradeCount = useMemo(() => {
    if (!upgradeApplications) return 0;
    return upgradeApplications.filter(
      (app) => app.status === "pending" || app.status === "under_review"
    ).length;
  }, [upgradeApplications]);

  const activeRoleTypes = useMemo(() => {
    if (!roleTypes) return [];
    return [...roleTypes]
      .filter((rt) => rt.isActive !== false)
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [roleTypes]);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filters
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
  const [onboardingFilter, setOnboardingFilter] = useState<string>("all");
  const [emailSearch, setEmailSearch] = useState("");

  // Calculate document counts per staff
  const documentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    staffDocuments?.forEach((doc) => {
      if (doc.staffProfileId) {
        counts.set(doc.staffProfileId, (counts.get(doc.staffProfileId) || 0) + 1);
      }
    });
    return counts;
  }, [staffDocuments]);

  // Filter staff based on filters
  const filteredStaff = useMemo(() => {
    if (!staffProfiles) return [];

    let filtered = [...staffProfiles];

    // Role type filter
    if (roleTypeFilter !== "all") {
      filtered = filtered.filter((s) => s.roleType === roleTypeFilter);
    }

    // Compliance filter
    if (complianceFilter !== "all") {
      filtered = filtered.filter((s) => s.complianceStatus === complianceFilter);
    }

    if (onboardingFilter !== "all") {
      filtered = filtered.filter((s) => s.onboardingStatus === onboardingFilter);
    }

    // Email search
    if (emailSearch.trim()) {
      const searchLower = emailSearch.toLowerCase();
      filtered = filtered.filter((s) => {
        const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim().toLowerCase();
        return (
          s.email?.toLowerCase().includes(searchLower) ||
          s.firstName?.toLowerCase().includes(searchLower) ||
          s.lastName?.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
    }

    return filtered;
  }, [staffProfiles, roleTypeFilter, complianceFilter, onboardingFilter, emailSearch]);

  // Get documents for the selected staff member
  const selectedStaffDocs = useMemo(() => {
    if (!selectedStaffId) return [];
    return (staffDocuments?.filter((d) => d.staffProfileId === selectedStaffId) || []) as (typeof StaffDocumentsEntity.instanceType & { id: string })[];
  }, [staffDocuments, selectedStaffId]);

  const handleStaffClick = useCallback((staffId: string) => {
    setSelectedStaffId(staffId);
    setSheetOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchStaff();
    refetchDocs();
  }, [refetchStaff, refetchDocs]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setSelectedStaffId(null);
  }, []);

  const getComplianceBadge = useCallback((status?: string) => {
    if (status === "compliant") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Compliant
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    if (status === "expired") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  }, []);

  const getOnboardingBadge = useCallback((status?: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    if (status === "pending_review") {
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      );
    }
    if (status === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
    if (status === "incomplete") {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Incomplete
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  }, []);

  const isLoading = loadingStaff || loadingDocs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <p className="text-muted-foreground">Manage all staff members and review documents</p>
      </div>

      {/* Pending Upgrade Alert */}
      {pendingUpgradeCount > 0 && (
        <PendingUpgradeAlert
          upgradeApplications={upgradeApplications as any}
          staffProfiles={staffProfiles as any}
          onGoToUpgrades={() => {}}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Role Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Type</label>
              <Select value={roleTypeFilter} onValueChange={setRoleTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {activeRoleTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.code || ""}>
                      {rt.code} – {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance Status</label>
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Onboarding Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Onboarding Status</label>
              <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by Name or Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredStaff.length} staff member{filteredStaff.length !== 1 ? "s" : ""}
      </p>

      {/* Staff List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No staff members found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredStaff?.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              documentCount={documentCounts.get(staff.id) || 0}
              onClick={() => handleStaffClick(staff.id)}
              getComplianceBadge={getComplianceBadge}
              getOnboardingBadge={getOnboardingBadge}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role Type</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Onboarding Status</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff?.map((staff) => (
                <TableRow
                  key={staff.id}
                  className="cursor-pointer"
                  onClick={() => handleStaffClick(staff.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{staff.email}</span>
                      {(staff.withdrawalCount || 0) >= 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Frequent withdrawer ({staff.withdrawalCount} withdrawals)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {staff.firstName || staff.lastName
                      ? `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim()
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{staff.roleType || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{getComplianceBadge(staff.complianceStatus)}</TableCell>
                  <TableCell>{getOnboardingBadge(staff.onboardingStatus)}</TableCell>
                  <TableCell>
                    <AvailabilityBadge isAvailabilitySet={staff.isAvailabilitySet} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {documentCounts.get(staff.id) || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Full Profile Panel */}
      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) {
          handleSheetClose();
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedStaffId && (
            <FullStaffProfilePanel
              staffId={selectedStaffId}
              staffDocuments={selectedStaffDocs}
              showOnboardingApproval={false}
              onRefresh={handleRefresh}
              onSheetClose={handleSheetClose}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}