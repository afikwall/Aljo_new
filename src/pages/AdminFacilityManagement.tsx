import { useEntityGetAll, useEntityCreate, useEntityUpdate, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilitiesEntity, StaffRatesEntity, BillingRatesEntity, FacilityManagerProfilesEntity, AppSettingsEntity } from "@/product-types";
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
import { Switch } from "@/components/ui/switch";
import { Building2, DollarSign, UserCheck, Receipt, Plus, Edit2, ChevronRight, Lock, FileText, MapPin, MapPinOff, AlertTriangle, Search, Loader2 } from "lucide-react";
import { GeofenceMapPreview } from "@/components/GeofenceMapPreview";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { ManageLoginsSection } from "@/components/ManageLoginsSection";
import { FMCountBadge } from "@/components/FMCountBadge";
import { getFMCountForFacility } from "@/utils/fmUtils";
import { cn } from "@/lib/utils";
import { FacilityDocumentsTab } from "@/components/FacilityDocumentsTab";

export const pageIcon = "building-2";

export default function AdminFacilityManagementPage() {
  const user = useUser();
  const isMobile = useIsMobile();
  const { data: facilities, isLoading: loadingFacilities, refetch: refetchFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: staffRates, isLoading: loadingStaffRates, refetch: refetchStaffRates } = useEntityGetAll(StaffRatesEntity);
  const { data: billingRates, isLoading: loadingBillingRates, refetch: refetchBillingRates } = useEntityGetAll(BillingRatesEntity);
  const { data: fmProfiles, isLoading: loadingFMProfiles, refetch: refetchFMProfiles } = useEntityGetAll(FacilityManagerProfilesEntity);
  const { data: appSettingsRaw, isLoading: loadingSettings } = useEntityGetAll(AppSettingsEntity);
  const { createFunction: createSetting } = useEntityCreate(AppSettingsEntity);
  const { updateFunction: updateSetting, isLoading: isUpdatingSetting } = useEntityUpdate(AppSettingsEntity);

  const geotrackingSetting = useMemo(() => {
    const settings = appSettingsRaw as Array<typeof AppSettingsEntity['instanceType'] & { id: string }> | undefined;
    return settings?.find((s) => s.settingKey === "geotrackingEnabled");
  }, [appSettingsRaw]);
  const geotrackingEnabled = geotrackingSetting?.settingValue ?? true;

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
    latitude: null as number | null,
    longitude: null as number | null,
    geofenceRadius: 200,
    geofenceMode: "off" as "strict" | "flag" | "off",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState("");

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

  const handleToggleGeotracking = async () => {
    const newValue = !geotrackingEnabled;
    try {
      if (geotrackingSetting) {
        await updateSetting({
          id: geotrackingSetting.id,
          data: {
            settingValue: newValue,
            updatedByEmail: user.email || "",
          },
        });
      } else {
        await createSetting({
          data: {
            settingKey: "geotrackingEnabled",
            settingValue: newValue,
            updatedByEmail: user.email || "",
            description: "Controls GPS geofence validation on staff clock-in",
          },
        });
      }
      toast.success(newValue ? "Geotracking enabled" : "Geotracking disabled");
    } catch {
      toast.error("Failed to update geotracking setting");
    }
  };

  const handleGeocodeAddress = async () => {
    if (!facilityForm.address) {
      toast.error("Please enter an address first");
      return;
    }
    setIsGeocoding(true);
    try {
      const query = [facilityForm.address, facilityForm.city, facilityForm.province].filter(Boolean).join(", ");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const results = await response.json();
      if (results?.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setFacilityForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setLastGeocodedAddress(facilityForm.address);
        toast.success("Coordinates found");
      } else {
        toast.error("No results found for this address");
      }
    } catch {
      toast.error("Geocoding failed. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

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
      latitude: null,
      longitude: null,
      geofenceRadius: 200,
      geofenceMode: "off",
    });
    setLastGeocodedAddress("");
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
      latitude: facility.latitude ?? null,
      longitude: facility.longitude ?? null,
      geofenceRadius: facility.geofenceRadius || 200,
      geofenceMode: (facility.geofenceMode as "strict" | "flag" | "off") || "off",
    });
    setLastGeocodedAddress(facility.address || "");
    setFacilityDialogOpen(true);
  };

  const handleSaveFacility = async () => {
    if (!facilityForm.name || !facilityForm.city) {
      toast.error("Name and city are required");
      return;
    }

    if (facilityForm.geofenceRadius < 50 || facilityForm.geofenceRadius > 2000) {
      toast.error("Geofence radius must be between 50 and 2000 meters");
      return;
    }

    // Treat 0,0 as not configured
    const lat = (facilityForm.latitude === 0 && facilityForm.longitude === 0) ? null : facilityForm.latitude;
    const lng = (facilityForm.latitude === 0 && facilityForm.longitude === 0) ? null : facilityForm.longitude;

    const saveData = {
      name: facilityForm.name,
      city: facilityForm.city,
      province: facilityForm.province,
      status: facilityForm.status,
      contactName: facilityForm.contactName,
      contactEmail: facilityForm.contactEmail,
      contactPhone: facilityForm.contactPhone,
      address: facilityForm.address,
      notes: facilityForm.notes,
      latitude: lat,
      longitude: lng,
      geofenceRadius: facilityForm.geofenceRadius,
      geofenceMode: facilityForm.geofenceMode,
    };

    try {
      if (editingFacility) {
        await updateFacility({
          id: editingFacility.id,
          data: saveData,
        });
        toast.success("Facility updated successfully");
      } else {
        await createFacility({ data: saveData });
        toast.success("Facility created successfully");
      }
      setFacilityDialogOpen(false);
      refetchFacilities();
    } catch {
      toast.error("Failed to save facility");
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
    }
  };

  const isLoading = loadingFacilities || loadingStaffRates || loadingBillingRates || loadingFMProfiles;

  return (
    <div className="space-y-6">
      {/* Global Geotracking Card */}
      <Card className={geotrackingEnabled ? "border-l-4 border-l-primary" : "border-l-4 border-l-chart-3"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className={geotrackingEnabled ? "text-primary" : "text-chart-3"} />
              <div>
                <h3 className="font-semibold">GPS Geotracking</h3>
                <p className="text-sm text-muted-foreground">
                  Master switch — when off, staff can clock in/out without GPS checks at all facilities.
                </p>
                {geotrackingSetting?.updatedByEmail && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated by: {geotrackingSetting.updatedByEmail}
                    {geotrackingSetting.updatedAt ? ` on ${new Date(geotrackingSetting.updatedAt).toLocaleDateString()}` : ""}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={geotrackingEnabled}
              onCheckedChange={() => handleToggleGeotracking()}
              disabled={isUpdatingSetting || loadingSettings}
            />
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className={geotrackingEnabled ? "" : "opacity-50 pointer-events-none"}>
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
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        className={
                          facility.status === "active"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {facility.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                      {facility.latitude === 0 && facility.longitude === 0 ? (
                        <Badge className="bg-chart-3/20 text-chart-3">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          0,0 coords
                        </Badge>
                      ) : facility.latitude != null && facility.longitude != null && (facility.geofenceMode === "strict" || facility.geofenceMode === "flag") ? (
                        <Badge className="bg-accent/20 text-accent">
                          <MapPin className="h-3 w-3 mr-1" />
                          Geofence
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">
                          <MapPinOff className="h-3 w-3 mr-1" />
                          No fence
                        </Badge>
                      )}
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
                <TableHead>Geofence</TableHead>
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
                    {facility.latitude === 0 && facility.longitude === 0 ? (
                      <span className="flex items-center gap-1 text-chart-3 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        0,0
                      </span>
                    ) : facility.latitude != null && facility.longitude != null && (facility.geofenceMode === "strict" || facility.geofenceMode === "flag") ? (
                      <Badge className="bg-accent/20 text-accent">
                        <MapPin className="h-3 w-3 mr-1" />
                        {facility.geofenceMode}
                      </Badge>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPinOff className="h-3 w-3" />
                        Off
                      </span>
                    )}
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

      </div>{/* end geotracking opacity wrapper */}

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
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
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

            {/* Geofence Configuration Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Geofence Configuration</h3>

              {/* Lookup Coordinates Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeocodeAddress}
                  disabled={isGeocoding || !facilityForm.address}
                >
                  {isGeocoding ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Search data-icon="inline-start" />
                  )}
                  Lookup Coordinates
                </Button>
                {facilityForm.address && facilityForm.address !== lastGeocodedAddress && lastGeocodedAddress && (
                  <span className="text-xs text-chart-3">Address changed — click Lookup Coordinates to update the map.</span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={facilityForm.latitude ?? ""}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, latitude: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    placeholder="e.g. 43.6532"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={facilityForm.longitude ?? ""}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, longitude: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    placeholder="e.g. -79.3832"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="geofenceRadius">Geofence Radius (meters)</Label>
                  <Input
                    id="geofenceRadius"
                    type="number"
                    min={50}
                    max={2000}
                    value={facilityForm.geofenceRadius}
                    onChange={(e) =>
                      setFacilityForm({ ...facilityForm, geofenceRadius: parseInt(e.target.value) || 200 })
                    }
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="geofenceToggle">Enable Geofencing</Label>
                    <Switch
                      id="geofenceToggle"
                      checked={facilityForm.geofenceMode !== "off"}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setFacilityForm({ ...facilityForm, geofenceMode: "off" });
                        } else {
                          setFacilityForm({
                            ...facilityForm,
                            geofenceMode: facilityForm.geofenceMode !== "off" ? facilityForm.geofenceMode : "flag",
                          });
                        }
                      }}
                    />
                  </div>
                  {facilityForm.geofenceMode !== "off" && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className={cn(
                          "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          facilityForm.geofenceMode === "flag"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => setFacilityForm({ ...facilityForm, geofenceMode: "flag" })}
                      >
                        <div>Flag</div>
                        <div className="text-xs font-normal opacity-80">Allow but record</div>
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          facilityForm.geofenceMode === "strict"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => setFacilityForm({ ...facilityForm, geofenceMode: "strict" })}
                      >
                        <div>Strict</div>
                        <div className="text-xs font-normal opacity-80">Block clock-in</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <GeofenceMapPreview
                latitude={facilityForm.latitude}
                longitude={facilityForm.longitude}
                radiusMeters={facilityForm.geofenceRadius}
                draggable
                onPositionChange={(lat, lng) =>
                  setFacilityForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                }
                height="250px"
              />
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