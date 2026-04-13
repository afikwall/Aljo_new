import { useEntityGetAll, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { cn } from "@/lib/utils";
import { StaffProfilesEntity, StaffDocumentsEntity, RoleUpgradeApplicationsEntity, RoleTypesEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffCard } from "@/components/StaffCard";
import { FullStaffProfilePanel } from "@/components/FullStaffProfilePanel";
import { RoleUpgradesTab } from "@/components/RoleUpgradesTab";
import { OnboardingStaffCard } from "@/components/OnboardingStaffCard";
import { AdminFavoritesTab } from "@/components/AdminFavoritesTab";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { PendingUpgradeAlert } from "@/components/PendingUpgradeAlert";
import { PendingReviewTab } from "@/components/PendingReviewTab";
import { getRequiredDocTypesForRole } from "@/utils/documentUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { Heart, ClipboardCheck } from "lucide-react";

export const pageIcon = "users";

export default function AdminStaffManagementPage() {
  const user = useUser();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
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

  // Pending review count for badge
  const pendingReviewCount = useMemo(() => {
    if (!staffProfiles) return 0;
    return staffProfiles.filter(
      (s) => s.complianceStatus === "pending" || s.onboardingStatus === "pending_review"
    ).length;
  }, [staffProfiles]);

  const activeRoleTypes = useMemo(() => {
    if (!roleTypes) return [];
    return [...roleTypes]
      .filter((rt) => rt.isActive !== false)
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [roleTypes]);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showOnboardingApproval, setShowOnboardingApproval] = useState(false);

  // Auto-select pending_review tab from URL param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "pending_review") {
      setActiveTab("pending_review");
    }
  }, [searchParams]);

  // Filters
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");
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

  // Calculate approved required document counts per staff
  const approvedDocCounts = useMemo(() => {
    const counts = new Map<string, number>();
    staffDocuments?.forEach((doc) => {
      if (doc.staffProfileId && doc.reviewStatus === "approved" && doc.isRequired !== false) {
        counts.set(doc.staffProfileId, (counts.get(doc.staffProfileId) || 0) + 1);
      }
    });
    return counts;
  }, [staffDocuments]);

  // Filter staff based on active tab and filters
  const filteredStaff = useMemo(() => {
    if (!staffProfiles) return [];

    let filtered = [...staffProfiles];

    // Tab filter
    if (activeTab === "pending") {
      filtered = filtered.filter((s) => s.onboardingStatus === "pending_review");
    } else if (activeTab === "onboarding") {
      filtered = filtered.filter((s) => s.onboardingStatus !== "approved");
    }

    // Role type filter
    if (roleTypeFilter !== "all") {
      filtered = filtered.filter((s) => s.roleType === roleTypeFilter);
    }

    // Compliance filter
    if (complianceFilter !== "all") {
      filtered = filtered.filter((s) => s.complianceStatus === complianceFilter);
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
  }, [staffProfiles, activeTab, roleTypeFilter, complianceFilter, emailSearch]);

  // Get documents for the selected staff member
  const selectedStaffDocs = useMemo(() => {
    if (!selectedStaffId) return [];
    return (staffDocuments?.filter((d) => d.staffProfileId === selectedStaffId) || []) as (typeof StaffDocumentsEntity.instanceType & { id: string })[];
  }, [staffDocuments, selectedStaffId]);

  const handleStaffClick = useCallback((staffId: string, fromOnboardingTab = false) => {
    setSelectedStaffId(staffId);
    setShowOnboardingApproval(fromOnboardingTab);
    setSheetOpen(true);
  }, []);

  const handleViewProfile = useCallback((staffProfileId: string) => {
    setSelectedStaffId(staffProfileId);
    setShowOnboardingApproval(false);
    setSheetOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchStaff();
    refetchDocs();
  }, [refetchStaff, refetchDocs]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setSelectedStaffId(null);
    setShowOnboardingApproval(false);
  }, []);

  const tabsSectionRef = useRef<HTMLDivElement>(null);

  const handleGoToUpgrades = useCallback(() => {
    setActiveTab("upgrades");
    setTimeout(() => {
      tabsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
          onGoToUpgrades={handleGoToUpgrades}
        />
      )}

      {/* Filters - Mobile: vertical stack, Desktop: horizontal row */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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

      {/* Tabs */}
      <div ref={tabsSectionRef}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all" className="flex-1 md:flex-none">
            All Staff
          </TabsTrigger>
          <TabsTrigger
            value="pending_review"
            className={cn(
              "flex-1 md:flex-none gap-1.5",
              pendingReviewCount > 0 && "text-chart-3"
            )}
          >
            <ClipboardCheck className="h-4 w-4" />
            Pending Review
            {pendingReviewCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-chart-3 text-white text-xs font-medium h-5 min-w-[20px] px-1.5">
                {pendingReviewCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 md:flex-none">
            Pending Onboarding
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex-1 md:flex-none">
            <UserCheck className="h-4 w-4 mr-1.5" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger
            value="upgrades"
            className={cn(
              "flex-1 md:flex-none gap-1.5",
              pendingUpgradeCount > 0 && "text-chart-3"
            )}
          >
            Role Upgrades
            {pendingUpgradeCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-chart-3 text-white text-xs font-medium h-5 min-w-[20px] px-1.5">
                {pendingUpgradeCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1 md:flex-none gap-1.5">
            <Heart className="h-4 w-4 mr-1" />
            Favorites
          </TabsTrigger>
        </TabsList>

        {/* All Staff / Pending Onboarding Content */}
        {(activeTab === "all" || activeTab === "pending") && (
          <TabsContent value={activeTab} className="mt-6">
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
              // Mobile: Card List
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
              // Desktop: Table
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
          </TabsContent>
        )}

        {/* Pending Review Tab Content */}
        <TabsContent value="pending_review" className="mt-6">
          <PendingReviewTab
            staffProfiles={staffProfiles as any}
            isLoadingStaff={loadingStaff}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        {/* Onboarding Tab Content */}
        <TabsContent value="onboarding" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No staff in onboarding</p>
                <p className="text-sm text-muted-foreground">
                  All staff members have completed onboarding
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStaff?.map((staff) => (
                <OnboardingStaffCard
                  key={staff.id}
                  staff={staff}
                  approvedDocCount={approvedDocCounts.get(staff.id) || 0}
                  totalRequiredDocs={getRequiredDocTypesForRole(staff.roleType).length}
                  onClick={() => handleStaffClick(staff.id, true)}
                  getComplianceBadge={getComplianceBadge}
                  getOnboardingBadge={getOnboardingBadge}
                  getRoleBadgeColor={getRoleBadgeColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Role Upgrades Tab Content */}
        <TabsContent value="upgrades" className="mt-6">
          <RoleUpgradesTab
            staffProfiles={staffProfiles as any}
            staffDocuments={staffDocuments as any}
            onViewProfile={handleViewProfile}
          />
        </TabsContent>

        {/* Favorites Tab Content */}
        <TabsContent value="favorites" className="mt-6">
          <AdminFavoritesTab />
        </TabsContent>
      </Tabs>
      </div>

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
              showOnboardingApproval={showOnboardingApproval}
              onRefresh={handleRefresh}
              onSheetClose={handleSheetClose}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}