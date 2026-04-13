import React, { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
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
  Upload,
  FileText,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
  Save,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEntityUpdate, useEntityDelete } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity } from "@/product-types";
import type { StaffDocumentsEntityDocumentTypeEnum, IStaffDocumentsEntity } from "@/product-types";
import {
  type DocumentStatus,
  getDocumentStatus,
  getStatusBorderClass,
  isImageFile,
  DOCUMENT_TYPE_LABELS,
  getExpiryHintText,
} from "@/utils/documentUtils";

interface RequiredDocumentCardProps {
  docType: StaffDocumentsEntityDocumentTypeEnum;
  cardStatus: DocumentStatus;
  docs: IStaffDocumentsEntity[];
  isBusy: boolean;
  uploadingType: string | null;
  replacingDocId: string | null;
  loadingPreviewId: string | null;
  loadingDownloadId: string | null;
  onNewUpload: (docType: StaffDocumentsEntityDocumentTypeEnum, file: File, expiryDate?: string) => void;
  onReplaceUpload: (docId: string, docType: StaffDocumentsEntityDocumentTypeEnum, file: File, expiryDate?: string) => void;
  onViewDocument: (doc: IStaffDocumentsEntity) => void;
  onDownloadDocument: (doc: IStaffDocumentsEntity) => void;
  onDeleteDocument?: () => void;
}

export const RequiredDocumentCard = ({
  docType,
  cardStatus,
  docs,
  isBusy,
  uploadingType,
  replacingDocId,
  loadingPreviewId,
  loadingDownloadId,
  onNewUpload,
  onReplaceUpload,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}: RequiredDocumentCardProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { updateFunction } = useEntityUpdate(StaffDocumentsEntity);
  const { deleteFunction } = useEntityDelete(StaffDocumentsEntity);

  // Expiry date state for new upload
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>(undefined);
  const [newExpiryOpen, setNewExpiryOpen] = useState(false);

  // Expiry date state for replace (keyed by docId)
  const [replaceExpiryDates, setReplaceExpiryDates] = useState<Record<string, Date | undefined>>({});
  const [replaceExpiryOpen, setReplaceExpiryOpen] = useState<Record<string, boolean>>({});

  // Inline expiry editor state per existing doc (keyed by docId)
  const [inlineExpiryDates, setInlineExpiryDates] = useState<Record<string, Date | undefined>>(() => {
    const initial: Record<string, Date | undefined> = {};
    docs.forEach((doc) => {
      if (doc.id && doc.expiryDate) {
        try {
          initial[doc.id] = parseISO(doc.expiryDate);
        } catch {
          initial[doc.id] = undefined;
        }
      }
    });
    return initial;
  });
  const [inlineExpiryOpen, setInlineExpiryOpen] = useState<Record<string, boolean>>({});
  const [savingExpiryId, setSavingExpiryId] = useState<string | null>(null);

  // Delete state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);

  const label = DOCUMENT_TYPE_LABELS[docType];
  const hintText = getExpiryHintText(docType);

  const handleNewFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const expiryStr = newExpiryDate ? format(newExpiryDate, "yyyy-MM-dd") : undefined;
        onNewUpload(docType, file, expiryStr);
        setNewExpiryDate(undefined);
      }
      e.target.value = "";
    },
    [docType, onNewUpload, newExpiryDate]
  );

  const handleReplaceFileChange = useCallback(
    (docId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const expiryDate = replaceExpiryDates[docId];
        const expiryStr = expiryDate ? format(expiryDate, "yyyy-MM-dd") : undefined;
        onReplaceUpload(docId, docType, file, expiryStr);
        setReplaceExpiryDates((prev) => ({ ...prev, [docId]: undefined }));
      }
      e.target.value = "";
    },
    [docType, onReplaceUpload, replaceExpiryDates]
  );

  const setReplaceExpiry = useCallback((docId: string, date: Date | undefined) => {
    setReplaceExpiryDates((prev) => ({ ...prev, [docId]: date }));
  }, []);

  const setReplaceOpen = useCallback((docId: string, open: boolean) => {
    setReplaceExpiryOpen((prev) => ({ ...prev, [docId]: open }));
  }, []);

  const setInlineExpiry = useCallback((docId: string, date: Date | undefined) => {
    setInlineExpiryDates((prev) => ({ ...prev, [docId]: date }));
  }, []);

  const setInlineOpen = useCallback((docId: string, open: boolean) => {
    setInlineExpiryOpen((prev) => ({ ...prev, [docId]: open }));
  }, []);

  const handleSaveExpiryDate = useCallback(
    async (docId: string) => {
      setSavingExpiryId(docId);
      try {
        const selectedDate = inlineExpiryDates[docId];
        const expiryDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
        await updateFunction({
          id: docId,
          data: { expiryDate: expiryDate ?? undefined },
        });
        toast.success("Expiry date saved");
      } catch {
        toast.error("Failed to save expiry date");
      } finally {
        setSavingExpiryId(null);
      }
    },
    [inlineExpiryDates, updateFunction]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDeleteDocId) return;
    setDeletingDocId(confirmDeleteDocId);
    setConfirmDeleteDocId(null);
    try {
      await deleteFunction({ id: confirmDeleteDocId });
      toast.success("Document deleted successfully");
      onDeleteDocument?.();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  }, [confirmDeleteDocId, deleteFunction, onDeleteDocument]);

  return (
    <div className={cn("rounded-lg p-4 space-y-3", getStatusBorderClass(cardStatus))}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{label}</h4>
        <DocumentStatusBadge status={cardStatus} />
      </div>

      {/* Hidden file input for new uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleNewFileChange}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 0, height: 0 }}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmDeleteDocId} onOpenChange={(open) => { if (!open) setConfirmDeleteDocId(null); }}>
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

      {/* Uploaded documents list */}
      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((doc) => {
            const docStatus = getDocumentStatus(doc);
            const isReplacing = replacingDocId === doc.id;
            const showReplaceBtn =
              docStatus === "rejected" || docStatus === "expired";
            const replaceExpiry = replaceExpiryDates[doc.id ?? ""];
            const isReplaceOpen = replaceExpiryOpen[doc.id ?? ""] ?? false;
            const inlineExpiry = inlineExpiryDates[doc.id ?? ""];
            const isInlineOpen = inlineExpiryOpen[doc.id ?? ""] ?? false;
            const isSavingThis = savingExpiryId === doc.id;
            const isDeletingThis = deletingDocId === doc.id;

            return (
              <div key={doc.id} className="space-y-2">
                {/* File row */}
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  {/* Thumbnail / Icon */}
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

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doc.fileName || "Unnamed file"}
                    </p>
                    {docStatus === "approved" && doc.expiryDate && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Expires: {format(parseISO(doc.expiryDate), "MMM dd, yyyy")}
                      </p>
                    )}
                    {docStatus === "expired" && doc.expiryDate && (
                      <p className="text-xs text-chart-3 mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
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
                      onClick={() => setConfirmDeleteDocId(doc.id ?? "")}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isBusy || isDeletingThis}
                    >
                      {isDeletingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Inline expiry date editor — always visible for uploaded docs */}
                <div className="space-y-1.5 mt-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Expiry Date
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    {/* Date picker button */}
                    <Popover
                      open={isInlineOpen}
                      onOpenChange={(open) => setInlineOpen(doc.id ?? "", open)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={isBusy || isSavingThis}
                          className={cn(
                            "flex h-11 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            !inlineExpiry && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {inlineExpiry
                            ? format(inlineExpiry, "MMM dd, yyyy")
                            : "Select expiry date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={inlineExpiry}
                          onSelect={(date) => {
                            setInlineExpiry(doc.id ?? "", date);
                            setInlineOpen(doc.id ?? "", false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Save button */}
                    <Button
                      variant="outline"
                      onClick={() => handleSaveExpiryDate(doc.id ?? "")}
                      disabled={isBusy || isSavingThis}
                      className="h-11 shrink-0 px-4 text-sm"
                    >
                      {isSavingThis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="sr-only">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{hintText}</p>
                </div>

                {/* Rejection reason */}
                {docStatus === "rejected" && doc.rejectionReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">
                      {doc.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Replace section: expiry date + replace button */}
                {showReplaceBtn && (
                  <div className="rounded-lg border bg-background p-3 space-y-3">
                    {/* Expiry date for replace */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        New File Expiry Date
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Popover open={isReplaceOpen} onOpenChange={(open) => setReplaceOpen(doc.id ?? "", open)}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={isBusy || isReplacing}
                            className={cn(
                              "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                              !replaceExpiry && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {replaceExpiry ? format(replaceExpiry, "MMM dd, yyyy") : "Select expiry date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={replaceExpiry}
                            onSelect={(date) => {
                              setReplaceExpiry(doc.id ?? "", date);
                              setReplaceOpen(doc.id ?? "", false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">{hintText}</p>
                    </div>

                    {/* Replace file input + button */}
                    <input
                      ref={(el) => {
                        replaceInputRefs.current[doc.id ?? ""] = el;
                      }}
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={handleReplaceFileChange(doc.id ?? "")}
                      className="absolute opacity-0 pointer-events-none"
                      style={{ width: 0, height: 0 }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => replaceInputRefs.current[doc.id ?? ""]?.click()}
                      disabled={isBusy || isReplacing}
                      className="w-full h-11"
                    >
                      {isReplacing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Replacing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Choose Replacement File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state for missing */
        <div className="flex items-center justify-center rounded-lg border border-dashed bg-background p-4">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <p className="text-sm">No document uploaded yet</p>
          </div>
        </div>
      )}


      {/* Upload button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy || uploadingType === docType}
        variant={cardStatus === "missing" ? "default" : "outline"}
        className="w-full h-12 text-base"
      >
        {uploadingType === docType ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-5 w-5" />
            {docs.length > 0 ? "Upload New Version" : "Upload Document"}
          </>
        )}
      </Button>
    </div>
  );
};