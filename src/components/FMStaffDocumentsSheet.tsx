import { useState, useMemo, useCallback } from "react";
import { useEntityGetAll, useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity, GetSignedFileUrlAction } from "@/product-types";
import type { IStaffProfilesEntity, IStaffDocumentsEntity } from "@/product-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  FileCheck,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  DOCUMENT_TYPE_LABELS,
  getDocumentDisplayName,
  isImageFile,
  filterRequiredDocuments,
  filterOptionalDocuments,
} from "@/utils/documentUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface FMStaffDocumentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: (IStaffProfilesEntity & { id: string }) | null;
}

function getInitials(staff: IStaffProfilesEntity): string {
  if (staff.firstName && staff.lastName) {
    return `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
  }
  if (staff.firstName) return staff.firstName.slice(0, 2).toUpperCase();
  if (staff.email) return staff.email.slice(0, 2).toUpperCase();
  return "??";
}

function getComplianceBadgeConfig(status?: string) {
  switch (status) {
    case "compliant":
      return { label: "Compliant", icon: CheckCircle, className: "bg-accent/20 text-accent" };
    case "pending":
      return { label: "Pending", icon: Clock, className: "bg-chart-3/20 text-chart-3" };
    case "expired":
      return { label: "Expired", icon: XCircle, className: "bg-destructive/20 text-destructive" };
    case "blocked":
      return { label: "Blocked", icon: AlertCircle, className: "bg-destructive/20 text-destructive" };
    default:
      return { label: status || "Unknown", icon: AlertCircle, className: "bg-muted text-muted-foreground" };
  }
}

function formatExpiryDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM yyyy");
  } catch {
    return "";
  }
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  fileName?: string;
  isImage: boolean;
  onDownload: () => void;
}

const DocumentPreviewDialog = ({
  open,
  onOpenChange,
  signedUrl,
  fileName,
  isImage,
  onDownload,
}: DocumentPreviewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{fileName || "Document Preview"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {signedUrl ? (
          <div className="w-full min-h-[400px] rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
            {isImage ? (
              <img
                src={signedUrl}
                alt={fileName || "Document"}
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : (
              <iframe
                src={signedUrl}
                title={fileName || "Document"}
                className="w-full h-[500px] border-0"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface DocumentRowProps {
  doc: IStaffDocumentsEntity & { id: string };
}

const DocumentRow = ({ doc }: DocumentRowProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const { executeFunction: getSignedUrl } = useExecuteAction(GetSignedFileUrlAction);

  const displayName = getDocumentDisplayName(doc);
  const expiryFormatted = formatExpiryDate(doc.expiryDate);
  const isImage = isImageFile(doc.fileUrl, doc.fileName);

  const handleGetSignedUrl = useCallback(async (): Promise<string | null> => {
    if (!doc.fileUrl) return null;
    if (signedUrl) return signedUrl;
    setIsLoadingUrl(true);
    try {
      const result = await getSignedUrl({ fileUrl: doc.fileUrl });
      const url = result?.signedUrl || null;
      setSignedUrl(url);
      return url;
    } catch {
      return null;
    } finally {
      setIsLoadingUrl(false);
    }
  }, [doc.fileUrl, signedUrl, getSignedUrl]);

  const handleView = useCallback(async () => {
    const url = await handleGetSignedUrl();
    if (url) setPreviewOpen(true);
  }, [handleGetSignedUrl]);

  const handleDownload = useCallback(async () => {
    const url = signedUrl || (await handleGetSignedUrl());
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || displayName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [signedUrl, handleGetSignedUrl, doc.fileName, displayName]);

  return (
    <>
      <div className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
        <CheckCircle className="h-4 w-4 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{displayName}</span>
            <Badge className="bg-accent/20 text-accent text-xs px-1.5 py-0 shrink-0">
              Approved
            </Badge>
          </div>
          {expiryFormatted && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Expires: {expiryFormatted}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={handleView}
            disabled={isLoadingUrl || !doc.fileUrl}
            title="View document"
          >
            {isLoadingUrl ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={handleDownload}
            disabled={isLoadingUrl || !doc.fileUrl}
            title="Download document"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        signedUrl={signedUrl}
        fileName={doc.fileName || displayName}
        isImage={isImage}
        onDownload={handleDownload}
      />
    </>
  );
};

export const FMStaffDocumentsSheet = ({
  open,
  onOpenChange,
  staff,
}: FMStaffDocumentsSheetProps) => {
  const [optionalOpen, setOptionalOpen] = useState(false);

  const { data: rawDocuments, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: staff?.id },
    { enabled: !!staff?.id && open }
  );

  const approvedRequiredDocs = useMemo(() => {
    if (!rawDocuments) return [];
    const required = filterRequiredDocuments(rawDocuments as (IStaffDocumentsEntity & { id: string })[]);
    return required.filter((d) => d.reviewStatus === "approved" && d.documentType !== "government_id") as (IStaffDocumentsEntity & { id: string })[];
  }, [rawDocuments]);

  const approvedOptionalDocs = useMemo(() => {
    if (!rawDocuments) return [];
    const optional = filterOptionalDocuments(rawDocuments as (IStaffDocumentsEntity & { id: string })[]);
    return optional.filter((d) => d.reviewStatus === "approved") as (IStaffDocumentsEntity & { id: string })[];
  }, [rawDocuments]);

  const complianceConfig = getComplianceBadgeConfig(staff?.complianceStatus);
  const ComplianceIcon = complianceConfig.icon;

  const fullName = staff
    ? [staff.firstName, staff.lastName].filter(Boolean).join(" ") || "Unknown Staff"
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Staff Documents</SheetTitle>
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-4 pb-8 space-y-4">
            {/* Staff Header Card */}
            <Card>
              <CardContent className="pt-4">
                {!staff ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage
                        src={staff.profilePhotoUrl}
                        alt={fullName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getInitials(staff)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold leading-tight">{fullName}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {staff.roleType && (
                          <Badge
                            className={cn(
                              "text-xs",
                              getRoleBadgeColor(staff.roleType)
                            )}
                          >
                            {staff.roleType}
                          </Badge>
                        )}
                        {staff.complianceStatus && (
                          <Badge
                            className={cn("text-xs flex items-center gap-1", complianceConfig.className)}
                          >
                            <ComplianceIcon className="h-3 w-3" />
                            {complianceConfig.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{staff.email}</span>
                          </div>
                        )}
                        {staff.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Documents Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-accent" />
                  Approved Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingDocs ? (
                  <>
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </>
                ) : approvedRequiredDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[120px] border border-dashed rounded-lg gap-2">
                    <FileCheck className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">
                      No approved documents yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedRequiredDocs.map((doc) => (
                      <DocumentRow key={(doc as any).id} doc={doc} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optional Documents Section (collapsible) */}
            {!loadingDocs && approvedOptionalDocs.length > 0 && (
              <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
                <Card>
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full text-left">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-muted-foreground" />
                          Optional Documents
                          <Badge variant="secondary" className="text-xs ml-1">
                            {approvedOptionalDocs.length}
                          </Badge>
                        </CardTitle>
                        {optionalOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-2">
                      <Separator className="mb-3" />
                      {approvedOptionalDocs.map((doc) => (
                        <DocumentRow key={(doc as any).id} doc={doc} />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};