import React from "react";
import { useUser, useEntityGetAll, useEntityCreate, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
  FacilitiesEntity,
  AdminProfilesEntity
} from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, AlertCircle, FileCheck, Shield, Phone, Pencil, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const user = useUser();

  if (!user.isAuthenticated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user.role === "Staff") {
    return <StaffProfileForm />;
  }

  if (user.role === "FacilityManager") {
    return <FacilityManagerProfileForm />;
  }

  if (user.role === "admin") {
    return <AdminProfileForm />;
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-sm"><span className="font-medium">Name:</span> {user.name}</p>
            <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
            <p className="text-sm"><span className="font-medium">Role:</span> {user.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffProfileForm() {
  const user = useUser();
  const { data: profiles, isLoading: loadingProfile } = useEntityGetAll(StaffProfilesEntity, {
    email: user.email
  });
  const profile = profiles?.[0];

  const { data: allFacilities, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);

  const { createFunction, isLoading: creating } = useEntityCreate(StaffProfilesEntity);
  const { updateFunction, isLoading: updating } = useEntityUpdate(StaffProfilesEntity);

  const [formData, setFormData] = useState<Partial<typeof StaffProfilesEntity['instanceType']>>({
    staffType: "",
    roleType: undefined,
    licenseNumber: "",
    yearsExperience: undefined,
    specialties: "",
    city: "",
    state: "",
    phone: "",
    availability: undefined,
    hourlyRate: undefined,
    dateOfBirth: undefined,
    sin: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (profile) {
      setFormData({
        staffType: profile.staffType || "",
        roleType: profile.roleType || undefined,
        licenseNumber: profile.licenseNumber || "",
        yearsExperience: profile.yearsExperience || undefined,
        specialties: profile.specialties || "",
        city: profile.city || "",
        state: profile.state || "",
        phone: profile.phone || "",
        availability: profile.availability || undefined,
        hourlyRate: profile.hourlyRate || undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
        sin: profile.sin || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || ""
      });

      if (profile.dateOfBirth) {
        setDateOfBirth(new Date(profile.dateOfBirth));
      }
    }
  }, [profile]);

  const orientedFacilities = useMemo(() => {
    if (!profile?.orientedFacilityIds || !allFacilities) return [];
    return allFacilities.filter(f => profile.orientedFacilityIds?.includes(f.id || ""));
  }, [profile?.orientedFacilityIds, allFacilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
      toast.error("Emergency contact name and phone are required");
      return;
    }

    try {
      const data = {
        email: user.email,
        staffType: formData.staffType as any,
        roleType: formData.roleType as any || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        yearsExperience: formData.yearsExperience || undefined,
        specialties: formData.specialties || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        phone: formData.phone || undefined,
        availability: formData.availability as any || undefined,
        hourlyRate: formData.hourlyRate || undefined,
        dateOfBirth: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : undefined,
        sin: formData.sin || undefined,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        status: "Active"
      };

      if (profile) {
        await updateFunction({ id: profile.id || "", data });
        toast.success("Profile updated successfully");
      } else {
        await createFunction({ data });
        toast.success("Profile created successfully");
      }
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const isLoading = creating || updating;

  const getComplianceStatusBadge = () => {
    if (!profile?.complianceStatus) return null;

    const statusConfig = {
      compliant: { icon: CheckCircle, className: "bg-accent/20 text-accent", label: "Compliant" },
      pending: { icon: Clock, className: "bg-chart-3/20 text-chart-3", label: "Pending" },
      expired: { icon: XCircle, className: "bg-destructive/20 text-destructive", label: "Expired" },
      blocked: { icon: XCircle, className: "bg-destructive/20 text-destructive", label: "Blocked" }
    };

    const config = statusConfig[profile.complianceStatus];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getOnboardingStatusBadge = () => {
    if (!profile?.onboardingStatus) return null;

    const statusConfig = {
      incomplete: { icon: AlertCircle, className: "bg-muted text-muted-foreground", label: "Incomplete" },
      pending_review: { icon: Clock, className: "bg-chart-3/20 text-chart-3", label: "Pending Review" },
      approved: { icon: CheckCircle, className: "bg-accent/20 text-accent", label: "Approved" },
      rejected: { icon: XCircle, className: "bg-destructive/20 text-destructive", label: "Rejected" }
    };

    const config = statusConfig[profile.onboardingStatus];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Profile</h1>
        <p className="text-muted-foreground">Manage your professional information and compliance status</p>
      </div>

      {loadingProfile || loadingFacilities ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal details for compliance and verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateOfBirth"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1940}
                        toYear={new Date().getFullYear() - 18}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sin">Social Insurance Number (SIN)</Label>
                  <Input
                    id="sin"
                    type="password"
                    value={formData.sin}
                    onChange={(e) => setFormData({ ...formData, sin: e.target.value })}
                    placeholder="XXX-XXX-XXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Your credentials and professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffType">Staff Type *</Label>
                  <Select
                    value={formData.staffType}
                    onValueChange={(value) => setFormData({ ...formData, staffType: value })}
                    required
                  >
                    <SelectTrigger id="staffType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registered Nurse (RN)">Registered Nurse (RN)</SelectItem>
                      <SelectItem value="Licensed Practical Nurse (LPN)">Licensed Practical Nurse (LPN)</SelectItem>
                      <SelectItem value="Certified Nursing Assistant (CNA)">Certified Nursing Assistant (CNA)</SelectItem>
                      <SelectItem value="Care Aide">Care Aide</SelectItem>
                      <SelectItem value="Medical Assistant">Medical Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleType">Role Type</Label>
                  <Select
                    value={formData.roleType || ""}
                    onValueChange={(value) => setFormData({ ...formData, roleType: value as any })}
                  >
                    <SelectTrigger id="roleType">
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RN">RN - Registered Nurse</SelectItem>
                      <SelectItem value="LPN">LPN - Licensed Practical Nurse</SelectItem>
                      <SelectItem value="CCA">CCA - Continuing Care Assistant</SelectItem>
                      <SelectItem value="CITR">CITR - Care in the Round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="License or certification number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    value={formData.yearsExperience || ""}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="e.g., Geriatric Care, Wound Care, ICU"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Emergency Section */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Emergency Information</CardTitle>
              <CardDescription>Your contact details and emergency contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                  Emergency Contact
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability & Compensation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Availability & Compensation</CardTitle>
              <CardDescription>Your work preferences and desired pay rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability Preferences</Label>
                  <Select
                    value={formData.availability || ""}
                    onValueChange={(value) => setFormData({ ...formData, availability: value as any })}
                  >
                    <SelectTrigger id="availability">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time Per Diem">Full-time Per Diem</SelectItem>
                      <SelectItem value="Part-time Per Diem">Part-time Per Diem</SelectItem>
                      <SelectItem value="Weekends Only">Weekends Only</SelectItem>
                      <SelectItem value="Nights Only">Nights Only</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Desired Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate || ""}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="25.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status Section - Read Only */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Compliance Status
                </CardTitle>
                <CardDescription>Your current compliance and onboarding status (managed by admin)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Compliance Status</Label>
                    <div>
                      {getComplianceStatusBadge() || (
                        <Badge className="bg-muted text-muted-foreground">Not Set</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Onboarding Status</Label>
                    <div>
                      {getOnboardingStatusBadge() || (
                        <Badge className="bg-muted text-muted-foreground">Not Set</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label>Oriented Facilities</Label>
                  {orientedFacilities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {orientedFacilities.map(facility => (
                        <Badge key={facility.id} variant="outline">
                          {facility.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No facilities assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      )}
    </div>
  );
}

function FacilityManagerProfileForm() {
  const user = useUser();
  const { data: profiles, isLoading: loadingProfile } = useEntityGetAll(FacilityManagerProfilesEntity, {
    email: user.email
  });
  const profile = profiles?.[0];

  const { data: facilities, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);

  const { createFunction, isLoading: creating } = useEntityCreate(FacilityManagerProfilesEntity);
  const { updateFunction, isLoading: updating } = useEntityUpdate(FacilityManagerProfilesEntity);

  const [formData, setFormData] = useState({
    facilityId: "",
    position: "",
    phone: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        facilityId: profile.facilityId || "",
        position: profile.position || "",
        phone: profile.phone || ""
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        email: user.email,
        facilityId: formData.facilityId,
        position: formData.position || undefined,
        phone: formData.phone || undefined
      };

      if (profile) {
        await updateFunction({ id: profile.id || "", data });
        toast.success("Profile updated successfully");
      } else {
        await createFunction({ data });
        toast.success("Profile created successfully");
      }
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const selectedFacility = facilities?.find(f => f.id === formData.facilityId);
  const isLoading = creating || updating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facility Manager Profile</h1>
        <p className="text-muted-foreground">Manage your facility information</p>
      </div>

      {loadingProfile || loadingFacilities ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Manager Information</CardTitle>
              <CardDescription>Your contact details and facility assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="facilityId">Facility *</Label>
                  <Select
                    value={formData.facilityId}
                    onValueChange={(value) => setFormData({ ...formData, facilityId: value })}
                    required
                  >
                    <SelectTrigger id="facilityId">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities?.map(facility => (
                        <SelectItem key={facility.id} value={facility.id || ""}>
                          {facility.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g., Director of Nursing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedFacility && (
            <Card>
              <CardHeader>
                <CardTitle>Facility Details</CardTitle>
                <CardDescription>Information about your assigned facility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{selectedFacility.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{selectedFacility.facilityType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFacility.address}
                    {selectedFacility.city && `, ${selectedFacility.city}`}
                    {selectedFacility.state && `, ${selectedFacility.state}`}
                    {selectedFacility.zipCode && ` ${selectedFacility.zipCode}`}
                  </p>
                </div>
                {selectedFacility.phone && (
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedFacility.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function AdminProfileForm() {
  const user = useUser();
  const { data: profiles, isLoading: loadingProfile } = useEntityGetAll(AdminProfilesEntity, {
    email: user.email
  });
  const profile = profiles?.[0];

  const { createFunction, isLoading: creating } = useEntityCreate(AdminProfilesEntity);
  const { updateFunction, isLoading: updating } = useEntityUpdate(AdminProfilesEntity);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user.name || "");
      setPhone(profile.phone || "");
    } else {
      setDisplayName(user.name || "");
      setPhone("");
    }
  }, [profile, user.name]);

  const handleEdit = () => {
    setDisplayName(profile?.displayName || user.name || "");
    setPhone(profile?.phone || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const data = {
        displayName: displayName || undefined,
        phone: phone || undefined,
        email: user.email
      };

      if (profile?.id) {
        await updateFunction({ id: profile.id, data });
      } else {
        await createFunction({ data });
      }

      toast.success("Profile saved!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const isSaving = creating || updating;
  const currentDisplayName = profile?.displayName || user.name || "";
  const currentPhone = profile?.phone;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your administrator account information</p>
      </div>

      {loadingProfile ? (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <CardTitle>Admin Profile</CardTitle>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil data-icon="inline-start" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                    <X data-icon="inline-start" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save data-icon="inline-start" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>Your administrator account details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              {isEditing ? (
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              ) : (
                <p className="text-sm text-foreground">{currentDisplayName || "Not set"}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="text-muted-foreground"
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <div>
                <Badge variant="secondary">admin</Badge>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="size-4" />
                Phone Number
              </Label>
              {isEditing ? (
                <div className="flex flex-col gap-1.5">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+12025551234"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter in E.164 format (e.g. +12025551234). This number will receive SMS when someone sends you a direct message.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {currentPhone ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{currentPhone}</span>
                      <Badge variant="secondary" className="text-xs">SMS notifications enabled</Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Not set</span>
                        <Badge variant="outline" className="text-xs">SMS notifications disabled</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add a phone number to receive SMS notifications when someone sends you a direct message.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}