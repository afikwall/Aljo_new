import React from "react";
import { useRef, useCallback } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
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
  FileText,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEntityDelete } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity } from "@/product-types";
import type { IStaffDocumentsEntity } from "@/product-types";
import {
  getDocumentStatus,
  getStatusBorderClass,
  isImageFile,
  getDocumentDisplayName,
} from "@/utils/documentUtils";

interface OptionalDocumentCardProps {
  doc: IStaffDocumentsEntity;
  isBusy: boolean;
  replacingDocId: string | null;
  loadingPreviewId: string | null;
  loadingDownloadId: string | null;
  onReplaceUpload: (docId: string, file: File) => void;
  onViewDocument: (doc: IStaffDocumentsEntity) => void;
  onDownloadDocument: (doc: IStaffDocumentsEntity) => void;
  onDeleteDocument?: () => void;
}

export const OptionalDocumentCard = ({
  doc,
  isBusy,
  replacingDocId,
  loadingPreviewId,
  loadingDownloadId,
  onReplaceUpload,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}: OptionalDocumentCardProps) => {
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const { deleteFunction } = useEntityDelete(StaffDocumentsEntity);

  const docStatus = getDocumentStatus(doc);
  const isReplacing = replacingDocId === doc.id;
  const showReplaceBtn = docStatus === "rejected" || docStatus === "expired";
  const displayName = getDocumentDisplayName(doc);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReplaceFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onReplaceUpload(doc.id, file);
      }
      e.target.value = "";
    },
    [doc.id, onReplaceUpload]
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setConfirmDelete(false);
    try {
      await deleteFunction({ id: doc.id ?? "" });
      toast.success("Document deleted successfully");
      onDeleteDocument?.();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  }, [doc.id, deleteFunction, onDeleteDocument]);

  return (
    <div className={cn("rounded-lg p-4 space-y-3", getStatusBorderClass(docStatus))}>
      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{displayName}</h4>
        <DocumentStatusBadge status={docStatus} />
      </div>

      {/* Document file info */}
      <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
        {isImageFile(doc.fileUrl, doc.fileName) ? (
          <img
            src={doc.fileUrl}
            alt={doc.fileName || "Document"}
            className="h-10 w-10 rounded object-cover border shrink-0"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted border shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {doc.fileName || "Unnamed file"}
          </p>
          {docStatus === "approved" && doc.expiryDate && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires: {format(parseISO(doc.expiryDate), "MMM dd, yyyy")}
            </p>
          )}
          {docStatus === "expired" && doc.expiryDate && (
            <p className="text-xs text-chart-3 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expired: {format(parseISO(doc.expiryDate), "MMM dd, yyyy")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {doc.fileUrl && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDocument(doc)}
                className="h-8 w-8 p-0"
                disabled={loadingPreviewId === doc.id}
              >
                {loadingPreviewId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownloadDocument(doc)}
                className="h-8 w-8 p-0"
                disabled={loadingDownloadId === doc.id}
              >
                {loadingDownloadId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isBusy || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
          {showReplaceBtn && (
            <>
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleReplaceFileChange}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => replaceInputRef.current?.click()}
                disabled={isBusy || isReplacing}
                className="h-8"
              >
                {isReplacing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                {isReplacing ? "" : "Replace"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {docStatus === "rejected" && doc.rejectionReason && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{doc.rejectionReason}</p>
        </div>
      )}
    </div>
  );
};