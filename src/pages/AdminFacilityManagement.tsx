import { useEntityGetAll, useEntityCreate, useEntityUpdate, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilitiesEntity, StaffRatesEntity, BillingRatesEntity, FacilityManagerProfilesEntity } from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Building2, DollarSign, UserCheck, Receipt, Plus, Edit2, ChevronRight, Lock, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { ManageLoginsSection } from "@/components/ManageLoginsSection";
import { FMCountBadge } from "@/components/FMCountBadge";
import { getFMCountForFacility } from "@/utils/fmUtils";
import { FacilityDocumentsTab } from "@/components/FacilityDocumentsTab";

export const pageIcon = "building-2";

export default function AdminFacilityManagementPage() {
  const user = useUser();
  const isMobile = useIsMobile();
  const { data: facilities, isLoading: loadingFacilities, refetch: refetchFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: staffRates, isLoading: loadingStaffRates, refetch: refetchStaffRates } = useEntityGetAll(StaffRatesEntity);
  const { data: billingRates, isLoading: loadingBillingRates, refetch: refetchBillingRates } = useEntityGetAll(BillingRatesEntity);
  const { data: fmProfiles, isLoading: loadingFMProfiles, refetch: refetchFMProfiles } = useEntityGetAll(FacilityManagerProfilesEntity);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState("logins");
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<typeof FacilitiesEntity['instanceType'] | null>(null);
  const [staffRateDialogOpen, setStaffRateDialogOpen] = useState(false);
  const [billingRateDialogOpen, setBillingRateDialogOpen] = useState(false);

  const { createFunction: createFacility, isLoading: creatingFacility } = useEntityCreate(FacilitiesEntity);
  const { updateFunction: updateFacility, isLoading: updatingFacility } = useEntityUpdate(FacilitiesEntity);
  const { createFunction: createStaffRate, isLoading: creatingStaffRate } = useEntityCreate(StaffRatesEntity);
  const { updateFunction: updateStaffRate, isLoading: updatingStaffRate } = useEntityUpdate(StaffRatesEntity);
  const { createFunction: createBillingRate, isLoading: creatingBillingRate } = useEntityCreate(BillingRatesEntity);
  const { updateFunction: updateBillingRate, isLoading: updatingBillingRate } = useEntityUpdate(BillingRatesEntity);

  // Form states
  const [facilityForm, setFacilityForm] = useState({
    name: "",
    city: "",
    province: "",
    status: "active" as "active" | "inactive",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    notes: "",
  });

  const [staffRateForm, setStaffRateForm] = useState({
    roleType: "RN" as "RN" | "LPN" | "CCA" | "CITR",
    staffRate: "",
    shortNoticeMultiplier: "1.0",
    holidayMultiplier: "1.5",
    overtimeMultiplier: "1.0",
  });

  const [billingRateForm, setBillingRateForm] = useState({
    roleType: "RN" as "RN" | "LPN" | "CCA" | "CITR",
    billingRate: "",
    shortNoticeMultiplier: "1.0",
    holidayMultiplier: "1.5",
    overtimeMultiplier: "1.0",
  });

  const selectedFacility = useMemo(() => {
    return facilities?.find((f) => f.id === selectedFacilityId);
  }, [facilities, selectedFacilityId]);

  const selectedFacilityStaffRates = useMemo(() => {
    if (!selectedFacilityId) return [];
    return staffRates?.filter((r) => r.facilityProfileId === selectedFacilityId) || [];
  }, [staffRates, selectedFacilityId]);

  const selectedFacilityBillingRates = useMemo(() => {
    if (!selectedFacilityId) return [];
    return billingRates?.filter((r) => r.facilityProfileId === selectedFacilityId) || [];
  }, [billingRates, selectedFacilityId]);

  // FM count per facility for badges
  const fmCountMap = useMemo(() => {
    const map = new Map<string, number>();
    facilities?.forEach((f) => {
      if (f.id) {
        map.set(f.id, getFMCountForFacility(fmProfiles || [], f.id));
      }
    });
    return map;
  }, [facilities, fmProfiles]);

  // Type-safe FM profiles with id for the ManageLoginsSection
  const typedFMProfiles = useMemo(() => {
    return (fmProfiles || []).map((p) => ({ ...p, id: p.id }));
  }, [fmProfiles]);

  const handleOpenAddFacility = () => {
    setEditingFacility(null);
    setFacilityForm({
      name: "",
      city: "",
      province: "",
      status: "active",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      notes: "",
    });
    setFacilityDialogOpen(true);
  };

  const handleOpenEditFacility = (facility: typeof FacilitiesEntity['instanceType']) => {
    setEditingFacility(facility);
    setFacilityForm({
      name: facility.name || "",
      city: facility.city || "",
      province: facility.province || "",
      status: (facility.status as "active" | "inactive") || "active",
      contactName: facility.contactName || "",
      contactEmail: facility.contactEmail || "",
      contactPhone: facility.contactPhone || "",
      address: facility.address || "",
      notes: facility.notes || "",
    });
    setFacilityDialogOpen(true);
  };

  const handleSaveFacility = async () => {
    if (!facilityForm.name || !facilityForm.city) {
      toast.error("Name and city are required");
      return;
    }

    try {
      if (editingFacility) {
        await updateFacility({
          id: editingFacility.id,
          data: facilityForm,
        });
        toast.success("Facility updated successfully");
      } else {
        await createFacility({ data: facilityForm });
        toast.success("Facility created successfully");
      }
      setFacilityDialogOpen(false);
      refetchFacilities();
    } catch (error) {
      toast.error("Failed to save facility");
      console.error(error);
    }
  };

  const handleOpenAddStaffRate = () => {
    setStaffRateForm({
      roleType: "RN",
      staffRate: "",
      shortNoticeMultiplier: "1.0",
      holidayMultiplier: "1.5",
      overtimeMultiplier: "1.0",
    });
    setStaffRateDialogOpen(true);
  };

  const handleSaveStaffRate = async () => {
    if (!selectedFacilityId || !staffRateForm.staffRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createStaffRate({
        data: {
          facilityProfileId: selectedFacilityId,
          roleType: staffRateForm.roleType,
          staffRate: parseFloat(staffRateForm.staffRate),
          shortNoticeMultiplier: 1.0, // Staff never gets short notice premium
          holidayMultiplier: parseFloat(staffRateForm.holidayMultiplier),
          overtimeMultiplier: parseFloat(staffRateForm.overtimeMultiplier),
        },
      });
      toast.success("Staff rate added successfully");
      setStaffRateDialogOpen(false);
      refetchStaffRates();
    } catch (error) {
      toast.error("Failed to add staff rate");
      console.error(error);
    }
  };

  const handleOpenAddBillingRate = () => {
    setBillingRateForm({
      roleType: "RN",
      billingRate: "",
      shortNoticeMultiplier: "1.0",
      holidayMultiplier: "1.5",
      overtimeMultiplier: "1.0",
    });
    setBillingRateDialogOpen(true);
  };

  const handleSaveBillingRate = async () => {
    if (!selectedFacilityId || !billingRateForm.billingRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createBillingRate({
        data: {
          facilityProfileId: selectedFacilityId,
          roleType: billingRateForm.roleType,
          billingRate: parseFloat(billingRateForm.billingRate),
          shortNoticeMultiplier: parseFloat(billingRateForm.shortNoticeMultiplier),
          holidayMultiplier: parseFloat(billingRateForm.holidayMultiplier),
          overtimeMultiplier: parseFloat(billingRateForm.overtimeMultiplier),
        },
      });
      toast.success("Billing rate added successfully");
      setBillingRateDialogOpen(false);
      refetchBillingRates();
    } catch (error) {
      toast.error("Failed to add billing rate");
      console.error(error);
    }
  };

  const handleUpdateStaffRate = async (rateId: string, field: string, value: string) => {
    // Staff shortNoticeMultiplier is always 1.0 — short notice does not apply to staff pay
    if (field === "shortNoticeMultiplier") return;

    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      await updateStaffRate({
        id: rateId,
        data: { [field]: numValue },
      });
      refetchStaffRates();
    } catch (error) {
      toast.error("Failed to update staff rate");
      console.error(error);
    }
  };

  const handleUpdateBillingRate = async (rateId: string, field: string, value: string) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      await updateBillingRate({
        id: rateId,
        data: { [field]: numValue },
      });
      refetchBillingRates();
    } catch (error) {
      toast.error("Failed to update billing rate");
      console.error(error);
    }
  };

  const isLoading = loadingFacilities || loadingStaffRates || loadingBillingRates || loadingFMProfiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facility Management</h1>
          <p className="text-muted-foreground">Manage facilities and configure rates</p>
        </div>
        <Button onClick={handleOpenAddFacility}>
          <Plus className="h-4 w-4" />
          Add Facility
        </Button>
      </div>

      {/* Facilities List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : facilities?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No facilities found</p>
            <p className="text-sm text-muted-foreground">Get started by adding your first facility</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile: Card List
        <div className="space-y-3">
          {facilities?.map((facility) => (
            <Card
              key={facility.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                setSelectedFacilityId(facility.id);
                handleOpenEditFacility(facility);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-base">{facility.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {facility.city}{facility.province ? `, ${facility.province}` : ""}
                    </p>
                    <FMCountBadge count={fmCountMap.get(facility.id) || 0} className="mt-1" />
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={
                          facility.status === "active"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {facility.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                      {facility.contactName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {facility.contactName}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop: Table
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Managers</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities?.map((facility) => (
                <TableRow
                  key={facility.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedFacilityId(facility.id);
                  }}
                >
                  <TableCell className="font-medium">{facility.name}</TableCell>
                  <TableCell>{facility.city}</TableCell>
                  <TableCell>{facility.province}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        facility.status === "active"
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {facility.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <FMCountBadge count={fmCountMap.get(facility.id) || 0} />
                  </TableCell>
                  <TableCell>{facility.contactName}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditFacility(facility);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Facility Detail Tabs - Shows when facility selected */}
      {selectedFacility && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{selectedFacility.name}</h2>
          </div>

          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="logins" className="flex-1 md:flex-none">
                Logins
              </TabsTrigger>
              <TabsTrigger value="rates" className="flex-1 md:flex-none">
                Rates
              </TabsTrigger>
              {user.role === "admin" && (
                <TabsTrigger value="documents" className="flex-1 md:flex-none gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Documents
                </TabsTrigger>
              )}
            </TabsList>

            {/* Logins Tab */}
            <TabsContent value="logins" className="mt-6">
              <ManageLoginsSection
                facilityId={selectedFacility.id}
                facilityName={selectedFacility.name || ""}
                allFMProfiles={typedFMProfiles}
                isLoadingFM={loadingFMProfiles}
                refetchFMProfiles={refetchFMProfiles}
              />
            </TabsContent>

            {/* Rates Tab */}
            <TabsContent value="rates" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Staff Rates Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-accent" />
                        <CardTitle className="text-lg">Staff Rates</CardTitle>
                      </div>
                      <Button size="sm" onClick={handleOpenAddStaffRate}>
                        <Plus className="h-4 w-4" />
                        Add Rate
                      </Button>
                    </div>
                    <CardDescription>Compensation rates paid to staff (short notice does not apply)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedFacilityStaffRates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No staff rates configured</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Role</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead className="text-xs">Short Notice</TableHead>
                              <TableHead className="text-xs">Holiday</TableHead>
                              <TableHead className="text-xs">Overtime</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFacilityStaffRates?.map((rate) => (
                              <TableRow key={rate.id}>
                                <TableCell>
                                  <Badge variant="outline">{rate.roleType}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={rate.staffRate}
                                    onBlur={(e) =>
                                      handleUpdateStaffRate(rate.id, "staffRate", e.target.value)
                                    }
                                    className="w-20 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative">
                                          <Input
                                            type="number"
                                            value="1.0"
                                            disabled
                                            className="w-16 h-8 text-sm opacity-60 pr-6"
                                          />
                                          <Lock className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs max-w-48">Short notice does not apply to staff pay. Only facilities are charged the short notice uplift.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    defaultValue={rate.holidayMultiplier}
                                    onBlur={(e) =>
                                      handleUpdateStaffRate(
                                        rate.id,
                                        "holidayMultiplier",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    defaultValue={rate.overtimeMultiplier}
                                    onBlur={(e) =>
                                      handleUpdateStaffRate(
                                        rate.id,
                                        "overtimeMultiplier",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Rates Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-chart-1" />
                        <CardTitle className="text-lg">Billing Rates</CardTitle>
                      </div>
                      <Button size="sm" onClick={handleOpenAddBillingRate}>
                        <Plus className="h-4 w-4" />
                        Add Rate
                      </Button>
                    </div>
                    <CardDescription>Rates billed to facility</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedFacilityBillingRates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No billing rates configured</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Role</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead className="text-xs">Short Notice</TableHead>
                              <TableHead className="text-xs">Holiday</TableHead>
                              <TableHead className="text-xs">Overtime</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFacilityBillingRates?.map((rate) => (
                              <TableRow key={rate.id}>
                                <TableCell>
                                  <Badge variant="outline">{rate.roleType}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={rate.billingRate}
                                    onBlur={(e) =>
                                      handleUpdateBillingRate(rate.id, "billingRate", e.target.value)
                                    }
                                    className="w-20 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    defaultValue={rate.shortNoticeMultiplier}
                                    onBlur={(e) =>
                                      handleUpdateBillingRate(
                                        rate.id,
                                        "shortNoticeMultiplier",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    defaultValue={rate.holidayMultiplier}
                                    onBlur={(e) =>
                                      handleUpdateBillingRate(
                                        rate.id,
                                        "holidayMultiplier",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    defaultValue={rate.overtimeMultiplier}
                                    onBlur={(e) =>
                                      handleUpdateBillingRate(
                                        rate.id,
                                        "overtimeMultiplier",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab - Admin only */}
            {user.role === "admin" && (
              <TabsContent value="documents" className="mt-6">
                <FacilityDocumentsTab facilityId={selectedFacility.id} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Add/Edit Facility Dialog */}
      <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFacility ? "Edit Facility" : "Add New Facility"}
            </DialogTitle>
            <DialogDescription>
              {editingFacility
                ? "Update facility information and contact details"
                : "Enter facility information and contact details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Facility Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Facility Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Facility Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={facilityForm.name}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, name: e.target.value })
                    }
                    placeholder="St. Mary's Hospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={facilityForm.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFacilityForm({ ...facilityForm, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={facilityForm.city}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, city: e.target.value })
                    }
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={facilityForm.province}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, province: e.target.value })
                    }
                    placeholder="ON"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={facilityForm.address}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, address: e.target.value })
                    }
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={facilityForm.contactName}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, contactName: e.target.value })
                    }
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={facilityForm.contactPhone}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, contactPhone: e.target.value })
                    }
                    placeholder="(416) 555-0123"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={facilityForm.contactEmail}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, contactEmail: e.target.value })
                    }
                    placeholder="contact@facility.com"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Additional Details</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={facilityForm.notes}
                  onChange={(e) =>
                    setFacilityForm({ ...facilityForm, notes: e.target.value })
                  }
                  placeholder="Internal notes about this facility"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFacilityDialogOpen(false)}
              disabled={creatingFacility || updatingFacility}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFacility}
              disabled={creatingFacility || updatingFacility}
            >
              {creatingFacility || updatingFacility
                ? "Saving..."
                : editingFacility
                ? "Update Facility"
                : "Create Facility"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Staff Rate Dialog */}
      <Dialog open={staffRateDialogOpen} onOpenChange={setStaffRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Rate</DialogTitle>
            <DialogDescription>
              Configure compensation rate for a role at {selectedFacility?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staffRoleType">Role Type</Label>
              <Select
                value={staffRateForm.roleType}
                onValueChange={(value: "RN" | "LPN" | "CCA" | "CITR") =>
                  setStaffRateForm({ ...staffRateForm, roleType: value })
                }
              >
                <SelectTrigger id="staffRoleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="LPN">LPN</SelectItem>
                  <SelectItem value="CCA">CCA</SelectItem>
                  <SelectItem value="CITR">CITR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffRate">
                Hourly Rate (CAD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staffRate"
                type="number"
                step="0.01"
                value={staffRateForm.staffRate}
                onChange={(e) =>
                  setStaffRateForm({ ...staffRateForm, staffRate: e.target.value })
                }
                placeholder="35.00"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="staffShortNotice" className="flex items-center gap-1">
                  Short Notice <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        id="staffShortNotice"
                        type="number"
                        value="1.0"
                        disabled
                        className="opacity-60"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Short notice does not apply to staff pay. Only facilities are charged the short notice uplift.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffHoliday">Holiday</Label>
                <Input
                  id="staffHoliday"
                  type="number"
                  step="0.1"
                  value={staffRateForm.holidayMultiplier}
                  onChange={(e) =>
                    setStaffRateForm({
                      ...staffRateForm,
                      holidayMultiplier: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffOvertime">Overtime</Label>
                <Input
                  id="staffOvertime"
                  type="number"
                  step="0.1"
                  value={staffRateForm.overtimeMultiplier}
                  onChange={(e) =>
                    setStaffRateForm({
                      ...staffRateForm,
                      overtimeMultiplier: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStaffRateDialogOpen(false)}
              disabled={creatingStaffRate}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStaffRate} disabled={creatingStaffRate}>
              {creatingStaffRate ? "Adding..." : "Add Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Billing Rate Dialog */}
      <Dialog open={billingRateDialogOpen} onOpenChange={setBillingRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Billing Rate</DialogTitle>
            <DialogDescription>
              Configure billing rate for a role at {selectedFacility?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="billingRoleType">Role Type</Label>
              <Select
                value={billingRateForm.roleType}
                onValueChange={(value: "RN" | "LPN" | "CCA" | "CITR") =>
                  setBillingRateForm({ ...billingRateForm, roleType: value })
                }
              >
                <SelectTrigger id="billingRoleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="LPN">LPN</SelectItem>
                  <SelectItem value="CCA">CCA</SelectItem>
                  <SelectItem value="CITR">CITR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingRate">
                Hourly Rate (CAD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="billingRate"
                type="number"
                step="0.01"
                value={billingRateForm.billingRate}
                onChange={(e) =>
                  setBillingRateForm({ ...billingRateForm, billingRate: e.target.value })
                }
                placeholder="45.00"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="billingShortNotice">Short Notice</Label>
                <Input
                  id="billingShortNotice"
                  type="number"
                  step="0.1"
                  value={billingRateForm.shortNoticeMultiplier}
                  onChange={(e) =>
                    setBillingRateForm({
                      ...billingRateForm,
                      shortNoticeMultiplier: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingHoliday">Holiday</Label>
                <Input
                  id="billingHoliday"
                  type="number"
                  step="0.1"
                  value={billingRateForm.holidayMultiplier}
                  onChange={(e) =>
                    setBillingRateForm({
                      ...billingRateForm,
                      holidayMultiplier: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingOvertime">Overtime</Label>
                <Input
                  id="billingOvertime"
                  type="number"
                  step="0.1"
                  value={billingRateForm.overtimeMultiplier}
                  onChange={(e) =>
                    setBillingRateForm({
                      ...billingRateForm,
                      overtimeMultiplier: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBillingRateDialogOpen(false)}
              disabled={creatingBillingRate}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveBillingRate} disabled={creatingBillingRate}>
              {creatingBillingRate ? "Adding..." : "Add Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}