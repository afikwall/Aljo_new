import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Calendar, Eye, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { IFacilityDocumentsEntity } from "@/product-types";
import {
  getDocumentTypeLabel,
  getDocumentTypeBadgeClass,
  getExpiryStatus,
  getExpiryBadgeProps,
} from "@/utils/facilityDocumentUtils";
import { cn } from "@/lib/utils";

interface FacilityDocumentCardProps {
  document: IFacilityDocumentsEntity & { id: string };
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const FacilityDocumentCard = ({
  document,
  onDelete,
  isDeleting,
}: FacilityDocumentCardProps) => {
  const [deletingThis, setDeletingThis] = useState(false);

  const expiryStatus = getExpiryStatus(document.expiryDate);
  const expiryBadge = getExpiryBadgeProps(expiryStatus);

  const uploadDate = document.uploadedAt || document.createdAt;
  const formattedUploadDate = uploadDate
    ? format(parseISO(uploadDate), "MMM d, yyyy")
    : null;

  const formattedExpiryDate = document.expiryDate
    ? format(parseISO(document.expiryDate), "MMM d, yyyy")
    : null;

  const handleView = useCallback(() => {
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
    }
  }, [document.fileUrl]);

  const handleDelete = useCallback(async () => {
    setDeletingThis(true);
    try {
      await onDelete(document.id);
    } finally {
      setDeletingThis(false);
    }
  }, [onDelete, document.id]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-3">
          {/* Header row: name + type badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate">
                {document.documentName || "Untitled Document"}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  className={cn(
                    "text-xs",
                    getDocumentTypeBadgeClass(document.documentType)
                  )}
                >
                  {getDocumentTypeLabel(document.documentType)}
                </Badge>
                {expiryBadge && (
                  <Badge className={cn("text-xs", expiryBadge.className)}>
                    {expiryBadge.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* File name */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{document.fileName || "Unknown file"}</span>
          </div>

          {/* Dates row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {formattedUploadDate && (
              <span>Uploaded {formattedUploadDate}</span>
            )}
            {formattedExpiryDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Expires {formattedExpiryDate}
              </span>
            )}
          </div>

          {/* Notes */}
          {document.notes && (
            <p className="text-sm text-muted-foreground italic">
              {document.notes}
            </p>
          )}

          {/* Footer: uploaded by + actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground truncate">
              {document.uploadedByEmail || "Unknown"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                disabled={!document.fileUrl}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                  >
                    {deletingThis ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The document &quot;
                      {document.documentName}&quot; will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};