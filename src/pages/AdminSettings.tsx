import { useEntityGetAll, useEntityCreate, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { RoleTypesEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stethoscope, Plus, Edit2, Shield } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { data: roleTypes, isLoading: loadingRoleTypes, refetch: refetchRoleTypes } = useEntityGetAll(RoleTypesEntity);
  const { createFunction: createRoleType, isLoading: creatingRoleType } = useEntityCreate(RoleTypesEntity);
  const { updateFunction: updateRoleType, isLoading: updatingRoleType } = useEntityUpdate(RoleTypesEntity);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoleType, setEditingRoleType] = useState<typeof RoleTypesEntity['instanceType'] | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
    claimableRoles: { codes: [] },
  });

  const sortedRoleTypes = useMemo(() => {
    if (!roleTypes) return [];
    return [...roleTypes].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [roleTypes]);

  const getRoleBadgeColor = (index: number) => {
    const colors = ["bg-chart-1/20 text-chart-1", "bg-chart-2/20 text-chart-2", "bg-chart-3/20 text-chart-3", "bg-chart-4/20 text-chart-4"];
    return colors[index % colors.length];
  };

  const getClaimableBadgeColor = (index: number) => {
    const colors = [
      "bg-chart-1/20 text-chart-1",
      "bg-chart-2/20 text-chart-2",
      "bg-chart-3/20 text-chart-3",
      "bg-chart-4/20 text-chart-4",
    ];
    return colors[index % colors.length];
  };

  const handleOpenAddDialog = () => {
    setEditingRoleType(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
      claimableRoles: { codes: [] },
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (roleType: typeof RoleTypesEntity['instanceType']) => {
    setEditingRoleType(roleType);
    setFormData({
      code: roleType.code || "",
      name: roleType.name || "",
      description: roleType.description || "",
      isActive: roleType.isActive !== false,
      claimableRoles: roleType.claimableRoles || { codes: [] },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const codeUpper = formData.code.toUpperCase();

    try {
      if (editingRoleType) {
        await updateRoleType({
          id: editingRoleType.id || "",
          data: {
            code: codeUpper,
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            claimableRoles: formData.claimableRoles,
          },
        });
        toast.success("Role type updated successfully");
      } else {
        await createRoleType({
          data: {
            code: codeUpper,
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            claimableRoles: formData.claimableRoles,
          },
        });
        toast.success("Role type added successfully");
      }
      setDialogOpen(false);
      refetchRoleTypes();
    } catch (error) {
      toast.error("Failed to save role type");
      console.error(error);
    }
  };

  const handleToggleActive = async (roleType: typeof RoleTypesEntity['instanceType']) => {
    if (!roleType.id) return;

    const newStatus = !roleType.isActive;
    const confirmMessage = newStatus
      ? `Are you sure you want to activate ${roleType.code}?`
      : `Are you sure you want to deactivate ${roleType.code}? This will prevent it from being used in new shift postings.`;

    if (!confirm(confirmMessage)) return;

    try {
      await updateRoleType({
        id: roleType.id,
        data: {
          isActive: newStatus,
        },
      });
      toast.success(`${roleType.code} ${newStatus ? "activated" : "deactivated"} successfully`);
      refetchRoleTypes();
    } catch (error) {
      toast.error("Failed to update role type status");
      console.error(error);
    }
  };

  const handleToggleClaimableRole = (roleCode: string) => {
    const currentCodes = formData.claimableRoles?.codes || [];
    const isSelected = currentCodes.includes(roleCode);

    const newCodes = isSelected
      ? currentCodes.filter((code) => code !== roleCode)
      : [...currentCodes, roleCode];

    setFormData({
      ...formData,
      claimableRoles: { codes: newCodes },
    });
  };

  const isLoading = creatingRoleType || updatingRoleType;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage platform configuration</p>
      </div>

      {/* Clinical Role Types Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              <CardTitle>Clinical Role Types</CardTitle>
            </div>
            <Button size="sm" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4" />
              Add Role Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRoleTypes ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : sortedRoleTypes.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Stethoscope className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-base">No role types yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first clinical role type to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRoleTypes.map((roleType, index) => (
                <Card key={roleType.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleBadgeColor(index)}>
                            {roleType.code}
                          </Badge>
                          <h3 className="font-bold text-base">{roleType.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {roleType.description}
                        </p>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Can claim shifts for:
                            </p>
                          </div>
                          {roleType.claimableRoles?.codes && roleType.claimableRoles.codes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {roleType.claimableRoles.codes.map((code, idx) => (
                                <Badge key={code} className={`text-xs ${getClaimableBadgeColor(idx)}`}>
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No rules configured</p>
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center gap-2">
                          {roleType.isActive ? (
                            <Badge className="bg-accent/20 text-accent">Active</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(roleType)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(roleType)}
                        >
                          {roleType.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Role Type Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoleType ? "Edit Role Type" : "Add Role Type"}
            </DialogTitle>
            <DialogDescription>
              {editingRoleType
                ? "Update the role type information"
                : "Add a new clinical role type to the platform"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PSW"
                maxLength={10}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Short uppercase code (e.g., RN, LPN, PSW)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Personal Support Worker"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role's responsibilities and qualifications..."
                className="min-h-[120px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Claim Rules
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Select which role types this role can claim shifts for
              </p>
              {loadingRoleTypes ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sortedRoleTypes.map((role) => {
                    const isSelected = formData.claimableRoles?.codes?.includes(role.code || "") || false;
                    return (
                      <Button
                        key={role.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleClaimableRole(role.code || "")}
                        disabled={isLoading}
                        className="h-8 min-w-[44px]"
                      >
                        {role.code}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this role type for use in the platform
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : editingRoleType ? "Update Role Type" : "Add Role Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}