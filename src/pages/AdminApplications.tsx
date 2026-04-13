import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ShiftApplicationsEntity,
  ShiftsEntity,
  StaffProfilesEntity,
  FacilitiesEntity,
  StaffDocumentsEntity,
  ShiftTradesEntity,
  ApproveWithdrawalAction,
  DenyWithdrawalAction,
} from "@/product-types";
import type { IShiftsEntity, IStaffProfilesEntity, IFacilitiesEntity } from "@/product-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Inbox, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { subDays, isAfter, parseISO } from "date-fns";
import { PendingApplicationCard } from "@/components/PendingApplicationCard";
import { RecentApplicationCard } from "@/components/RecentApplicationCard";
import { WithdrawalRequestCard } from "@/components/WithdrawalRequestCard";
import { ApplicationFilters } from "@/components/ApplicationFilters";
import { ShiftDetailSheet } from "@/components/ShiftDetailSheet";
import { StaffDetailSheet } from "@/components/StaffDetailSheet";
import { AdminTradesTab } from "@/components/AdminTradesTab";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatShiftDate,
  getStaffDisplayName,
} from "@/utils/shiftApplicationUtils";

export default function AdminApplicationsPage() {
  const [activeTab, setActiveTab] = useState("pending");

  // Filters state
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("oldest");

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Withdrawal processing state
  const [withdrawalProcessingId, setWithdrawalProcessingId] = useState<string | null>(null);
  const [withdrawalProcessingAction, setWithdrawalProcessingAction] = useState<"approve" | "deny" | null>(null);

  // Detail sheet state
  const [shiftSheetOpen, setShiftSheetOpen] = useState(false);
  const [staffSheetOpen, setStaffSheetOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<(IShiftsEntity & { id: string }) | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<(IFacilitiesEntity & { id: string }) | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<(IStaffProfilesEntity & { id: string }) | null>(null);

  // Data fetching
  const {
    data: applications,
    isLoading: loadingApplications,
    refetch: refetchApplications,
  } = useEntityGetAll(ShiftApplicationsEntity);
  const {
    data: shifts,
    isLoading: loadingShifts,
    refetch: refetchShifts,
  } = useEntityGetAll(ShiftsEntity);
  const {
    data: staffProfiles,
    isLoading: loadingStaff,
    refetch: refetchStaff,
  } = useEntityGetAll(StaffProfilesEntity);
  const {
    data: facilities,
    isLoading: loadingFacilities,
    refetch: refetchFacilities,
  } = useEntityGetAll(FacilitiesEntity);
  const {
    data: staffDocuments,
    isLoading: loadingDocuments,
    refetch: refetchDocuments,
  } = useEntityGetAll(StaffDocumentsEntity);

  // Fetch shift trades for the badge count
  const { data: allTrades } = useEntityGetAll(ShiftTradesEntity);
  const pendingTradesCount = useMemo(() => {
    if (!allTrades) return 0;
    return allTrades.filter((t) => t.status === "pending").length;
  }, [allTrades]);

  const { updateFunction: updateApplication } =
    useEntityUpdate(ShiftApplicationsEntity);
  const { updateFunction: updateShift } = useEntityUpdate(ShiftsEntity);
  const { executeFunction: executeApproveWithdrawal } = useExecuteAction(ApproveWithdrawalAction);
  const { executeFunction: executeDenyWithdrawal } = useExecuteAction(DenyWithdrawalAction);

  const isLoading =
    loadingApplications || loadingShifts || loadingStaff || loadingFacilities || loadingDocuments;

  // Build lookup maps
  const staffMap = useMemo(() => {
    const map = new Map<
      string,
      typeof StaffProfilesEntity.instanceType & { id: string }
    >();
    staffProfiles?.forEach((s) => {
      if (s.id) map.set(s.id, s as typeof StaffProfilesEntity.instanceType & { id: string });
    });
    return map;
  }, [staffProfiles]);

  const shiftMap = useMemo(() => {
    const map = new Map<
      string,
      typeof ShiftsEntity.instanceType & { id: string }
    >();
    shifts?.forEach((s) => {
      if (s.id) map.set(s.id, s as typeof ShiftsEntity.instanceType & { id: string });
    });
    return map;
  }, [shifts]);

  const facilityMap = useMemo(() => {
    const map = new Map<
      string,
      typeof FacilitiesEntity.instanceType & { id: string }
    >();
    facilities?.forEach((f) => {
      if (f.id) map.set(f.id, f as typeof FacilitiesEntity.instanceType & { id: string });
    });
    return map;
  }, [facilities]);

  // Filter documents for the selected staff member
  const selectedStaffDocuments = useMemo(() => {
    if (!selectedStaff?.id || !staffDocuments) return [];
    return staffDocuments.filter((d) => d.staffProfileId === selectedStaff.id);
  }, [staffDocuments, selectedStaff?.id]);

  // Count pending applications per shift for "other applicants" display
  const pendingCountByShift = useMemo(() => {
    const counts = new Map<string, number>();
    applications?.forEach((app) => {
      if (app.status === "pending" && app.shiftProfileId) {
        counts.set(
          app.shiftProfileId,
          (counts.get(app.shiftProfileId) || 0) + 1
        );
      }
    });
    return counts;
  }, [applications]);

  // Pending applications (filtered)
  const pendingApplications = useMemo(() => {
    if (!applications) return [];
    let filtered = applications.filter((app) => app.status === "pending");

    // Facility filter
    if (facilityFilter !== "all") {
      filtered = filtered.filter((app) => {
        const shift = app.shiftProfileId
          ? shiftMap.get(app.shiftProfileId)
          : null;
        return shift?.facilityProfileId === facilityFilter;
      });
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((app) => {
        const shift = app.shiftProfileId
          ? shiftMap.get(app.shiftProfileId)
          : null;
        return shift?.requiredRole === roleFilter;
      });
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((app) => {
        const shift = app.shiftProfileId
          ? shiftMap.get(app.shiftProfileId)
          : null;
        if (!shift?.startDateTime) return false;
        try {
          return shift.startDateTime.slice(0, 10) >= startDate;
        } catch {
          return true;
        }
      });
    }
    if (endDate) {
      filtered = filtered.filter((app) => {
        const shift = app.shiftProfileId
          ? shiftMap.get(app.shiftProfileId)
          : null;
        if (!shift?.startDateTime) return false;
        try {
          return shift.startDateTime.slice(0, 10) <= endDate;
        } catch {
          return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aTime = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const bTime = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return filtered;
  }, [
    applications,
    facilityFilter,
    roleFilter,
    startDate,
    endDate,
    sortOrder,
    shiftMap,
  ]);

  // Withdrawal pending applications
  const withdrawalPendingApplications = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app) => app.status === "withdrawal_pending");
  }, [applications]);

  // Recent applications (approved/rejected in last 7 days)
  const recentApplications = useMemo(() => {
    if (!applications) return [];
    const sevenDaysAgo = subDays(new Date(), 7);
    return applications
      .filter((app) => {
        if (app.status !== "approved" && app.status !== "rejected") return false;
        if (!app.respondedAt) return false;
        try {
          return isAfter(parseISO(app.respondedAt), sevenDaysAgo);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aTime = a.respondedAt
          ? new Date(a.respondedAt).getTime()
          : 0;
        const bTime = b.respondedAt
          ? new Date(b.respondedAt).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [applications]);

  // Facility options for filter (only facilities with pending applications)
  const facilityOptions = useMemo(() => {
    const facilityIds = new Set<string>();
    applications?.forEach((app) => {
      if (app.status === "pending" && app.shiftProfileId) {
        const shift = shiftMap.get(app.shiftProfileId);
        if (shift?.facilityProfileId) {
          facilityIds.add(shift.facilityProfileId);
        }
      }
    });
    return Array.from(facilityIds)
      .map((id) => {
        const f = facilityMap.get(id);
        return { id, name: f?.name || "Unknown" };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [applications, shiftMap, facilityMap]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchApplications(),
      refetchShifts(),
      refetchStaff(),
      refetchFacilities(),
      refetchDocuments(),
    ]);
  }, [refetchApplications, refetchShifts, refetchStaff, refetchFacilities, refetchDocuments]);

  // Get details for dialog display
  const getApplicationDetails = useCallback(
    (appId: string) => {
      const app = applications?.find((a) => (a as { id: string }).id === appId);
      if (!app) return null;
      const staff = app.staffProfileId
        ? staffMap.get(app.staffProfileId)
        : null;
      const shift = app.shiftProfileId
        ? shiftMap.get(app.shiftProfileId)
        : null;
      const facility = shift?.facilityProfileId
        ? facilityMap.get(shift.facilityProfileId)
        : null;
      return { app, staff, shift, facility };
    },
    [applications, staffMap, shiftMap, facilityMap]
  );

  // Approve flow
  const handleApproveClick = useCallback((applicationId: string) => {
    setApproveTargetId(applicationId);
    setApproveDialogOpen(true);
  }, []);

  const handleApproveConfirm = useCallback(async () => {
    if (!approveTargetId || !applications) return;
    setApproveDialogOpen(false);
    setProcessingId(approveTargetId);

    try {
      const details = getApplicationDetails(approveTargetId);
      if (!details) throw new Error("Application not found");

      const shiftId = details.shift
        ? (details.shift as { id: string }).id
        : "";

      // 1. Approve this application
      await updateApplication({
        id: approveTargetId,
        data: {
          status: "approved",
          respondedAt: new Date().toISOString(),
        },
      });

      // 2. Claim the shift
      if (shiftId) {
        await updateShift({
          id: shiftId,
          data: { status: "claimed" },
        });
      }

      // 3. Auto-reject other pending applications for the same shift
      const otherPending = applications.filter(
        (a) =>
          a.shiftProfileId === details.app.shiftProfileId &&
          a.status === "pending" &&
          (a as { id: string }).id !== approveTargetId
      );

      for (const otherApp of otherPending) {
        await updateApplication({
          id: (otherApp as { id: string }).id,
          data: {
            status: "rejected",
            respondedAt: new Date().toISOString(),
          },
        });
      }

      const staffName = getStaffDisplayName(
        details.staff?.firstName,
        details.staff?.lastName,
        details.staff?.email
      );
      toast.success(
        `Approved! ${staffName} is assigned. ${otherPending.length} other applicant(s) auto-rejected.`
      );

      await refetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve application");
    } finally {
      setProcessingId(null);
      setApproveTargetId(null);
    }
  }, [
    approveTargetId,
    applications,
    getApplicationDetails,
    updateApplication,
    updateShift,
    refetchAll,
  ]);

  // Reject flow
  const handleRejectClick = useCallback((applicationId: string) => {
    setRejectTargetId(applicationId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectTargetId) return;
    setRejectDialogOpen(false);
    setProcessingId(rejectTargetId);

    try {
      await updateApplication({
        id: rejectTargetId,
        data: {
          status: "rejected",
          respondedAt: new Date().toISOString(),
        },
      });

      toast.success("Application rejected.");
      await refetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject application");
    } finally {
      setProcessingId(null);
      setRejectTargetId(null);
      setRejectionReason("");
    }
  }, [rejectTargetId, updateApplication, refetchAll]);

  // Withdrawal handlers
  const handleApproveWithdrawal = useCallback(async (applicationId: string) => {
    setWithdrawalProcessingId(applicationId);
    setWithdrawalProcessingAction("approve");
    try {
      const app = applications?.find((a) => (a as { id: string }).id === applicationId);
      if (!app) throw new Error("Application not found");

      const staff = app.staffProfileId ? staffMap.get(app.staffProfileId) : null;
      const shift = app.shiftProfileId ? shiftMap.get(app.shiftProfileId) : null;

      await executeApproveWithdrawal({
        applicationId,
        shiftId: shift ? (shift as { id: string }).id : "",
        staffProfileId: staff ? (staff as { id: string }).id : "",
        currentWithdrawalCount: staff?.withdrawalCount || 0,
        currentFilledCount: shift?.filledCount || 0,
      });

      toast.success("Withdrawal approved. Shift is now open again.");
      await refetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve withdrawal");
    } finally {
      setWithdrawalProcessingId(null);
      setWithdrawalProcessingAction(null);
    }
  }, [applications, staffMap, shiftMap, executeApproveWithdrawal, refetchAll]);

  const handleDenyWithdrawal = useCallback(async (applicationId: string) => {
    setWithdrawalProcessingId(applicationId);
    setWithdrawalProcessingAction("deny");
    try {
      await executeDenyWithdrawal({
        applicationId,
      });

      toast.success("Withdrawal denied. Staff remains assigned.");
      await refetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to deny withdrawal");
    } finally {
      setWithdrawalProcessingId(null);
      setWithdrawalProcessingAction(null);
    }
  }, [executeDenyWithdrawal, refetchAll]);

  // Detail sheet handlers
  const handleShiftClick = useCallback(
    (
      shift: (IShiftsEntity & { id: string }) | null,
      facility: (IFacilitiesEntity & { id: string }) | null
    ) => {
      setSelectedShift(shift);
      setSelectedFacility(facility);
      setShiftSheetOpen(true);
    },
    []
  );

  const handleStaffClick = useCallback(
    (staff: (IStaffProfilesEntity & { id: string }) | null) => {
      setSelectedStaff(staff);
      setStaffSheetOpen(true);
    },
    []
  );

  // Dialog display data
  const approveDetails = useMemo(() => {
    if (!approveTargetId) return null;
    return getApplicationDetails(approveTargetId);
  }, [approveTargetId, getApplicationDetails]);

  const rejectDetails = useMemo(() => {
    if (!rejectTargetId) return null;
    return getApplicationDetails(rejectTargetId);
  }, [rejectTargetId, getApplicationDetails]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shift Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage staff shift applications
        </p>
      </div>

      {/* Withdrawal Alert Banner */}
      {withdrawalPendingApplications.length > 0 && (
        <Alert className="bg-chart-3/10 border-chart-3/30 text-chart-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {withdrawalPendingApplications.length} withdrawal request{withdrawalPendingApplications.length !== 1 ? "s" : ""} pending review
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-auto">
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center gap-1.5">
            Withdrawals
            {withdrawalPendingApplications.length > 0 && (
              <span className="bg-chart-3 text-white text-xs px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                {withdrawalPendingApplications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent ({recentApplications.length})
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Trades
            {pendingTradesCount > 0 && (
              <span className="bg-chart-1 text-white text-xs px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                {pendingTradesCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6 space-y-6">
          {/* Filters */}
          <ApplicationFilters
            facilityOptions={facilityOptions}
            facilityFilter={facilityFilter}
            onFacilityFilterChange={setFacilityFilter}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {/* Pending applications list */}
          {pendingApplications.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed p-8">
              <div className="text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-accent" />
                <p className="mt-3 font-bold">No pending applications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All caught up! 🎉
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApplications.map((app) => {
                const appId = (app as { id: string }).id;
                const shift = app.shiftProfileId
                  ? shiftMap.get(app.shiftProfileId)
                  : null;
                const staff = app.staffProfileId
                  ? staffMap.get(app.staffProfileId)
                  : null;
                const facility = shift?.facilityProfileId
                  ? facilityMap.get(shift.facilityProfileId)
                  : null;
                const otherApplicantCount = app.shiftProfileId
                  ? (pendingCountByShift.get(app.shiftProfileId) || 1) - 1
                  : 0;

                return (
                  <PendingApplicationCard
                    key={appId}
                    applicationId={appId}
                    shift={shift || null}
                    staff={staff || null}
                    facility={facility || null}
                    appliedAt={app.appliedAt}
                    otherApplicantCount={otherApplicantCount}
                    onApprove={handleApproveClick}
                    onReject={handleRejectClick}
                    isProcessing={!!processingId}
                    processingId={processingId}
                    onShiftClick={() => handleShiftClick(shift || null, facility || null)}
                    onStaffClick={() => handleStaffClick(staff || null)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* WITHDRAWAL REQUESTS TAB */}
        <TabsContent value="withdrawals" className="mt-6 space-y-4">
          {withdrawalPendingApplications.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed p-8">
              <div className="text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-accent" />
                <p className="mt-3 font-bold">No pending withdrawal requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All withdrawal requests have been processed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalPendingApplications.map((app) => {
                const appId = (app as { id: string }).id;
                const shift = app.shiftProfileId
                  ? shiftMap.get(app.shiftProfileId)
                  : null;
                const staff = app.staffProfileId
                  ? staffMap.get(app.staffProfileId)
                  : null;
                const facility = shift?.facilityProfileId
                  ? facilityMap.get(shift.facilityProfileId)
                  : null;

                return (
                  <WithdrawalRequestCard
                    key={appId}
                    applicationId={appId}
                    shift={shift || null}
                    staff={staff || null}
                    facility={facility || null}
                    onApproveWithdrawal={handleApproveWithdrawal}
                    onDenyWithdrawal={handleDenyWithdrawal}
                    isProcessing={!!withdrawalProcessingId}
                    processingId={withdrawalProcessingId}
                    processingAction={withdrawalProcessingAction}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* RECENT TAB */}
        <TabsContent value="recent" className="mt-6 space-y-3">
          {recentApplications.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed p-8">
              <div className="text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-bold">
                  No recent decisions in the last 7 days
                </p>
              </div>
            </div>
          ) : (
            recentApplications.map((app) => {
              const appId = (app as { id: string }).id;
              const shift = app.shiftProfileId
                ? shiftMap.get(app.shiftProfileId)
                : null;
              const staff = app.staffProfileId
                ? staffMap.get(app.staffProfileId)
                : null;
              const facility = shift?.facilityProfileId
                ? facilityMap.get(shift.facilityProfileId)
                : null;

              return (
                <RecentApplicationCard
                  key={appId}
                  shift={shift || null}
                  staff={staff || null}
                  facility={facility || null}
                  withdrawalReason={app.withdrawalReason}
                  status={app.status}
                  respondedAt={app.respondedAt}
                  onShiftClick={() => handleShiftClick(shift || null, facility || null)}
                  onStaffClick={() => handleStaffClick(staff || null)}
                />
              );
            })
          )}
        </TabsContent>

        {/* TRADES TAB */}
        <TabsContent value="trades" className="mt-6">
          <AdminTradesTab />
        </TabsContent>
      </Tabs>

      {/* APPROVE CONFIRMATION DIALOG */}
      <AlertDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application?</AlertDialogTitle>
            <AlertDialogDescription>
              {approveDetails
                ? `Approve ${getStaffDisplayName(
                    approveDetails.staff?.firstName,
                    approveDetails.staff?.lastName,
                    approveDetails.staff?.email
                  )} for ${
                    approveDetails.shift?.requiredRole || "shift"
                  } at ${
                    approveDetails.facility?.name || "facility"
                  } on ${formatShiftDate(
                    approveDetails.shift?.startDateTime
                  )}?`
                : "Approve this application?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleApproveConfirm}
            >
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REJECT DIALOG WITH REASON */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              {rejectDetails
                ? `Reject ${getStaffDisplayName(
                    rejectDetails.staff?.firstName,
                    rejectDetails.staff?.lastName,
                    rejectDetails.staff?.email
                  )}'s application for ${
                    rejectDetails.shift?.requiredRole || "shift"
                  } at ${rejectDetails.facility?.name || "facility"}?`
                : "Reject this application?"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Reason for rejection (optional)
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHIFT DETAIL SHEET */}
      <ShiftDetailSheet
        open={shiftSheetOpen}
        onOpenChange={setShiftSheetOpen}
        shift={selectedShift}
        facility={selectedFacility}
      />

      {/* STAFF DETAIL SHEET */}
      <StaffDetailSheet
        open={staffSheetOpen}
        onOpenChange={setStaffSheetOpen}
        staff={selectedStaff}
        documents={selectedStaffDocuments}
        onRefresh={refetchAll}
      />
    </div>
  );
}