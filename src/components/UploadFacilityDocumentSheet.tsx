import React from "react";
import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useFileUpload } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import type { FacilityDocumentsEntityDocumentTypeEnum } from "@/product-types";
import {
  FACILITY_DOCUMENT_TYPE_OPTIONS,
  ACCEPTED_FILE_TYPES,
} from "@/utils/facilityDocumentUtils";

interface UploadFacilityDocumentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  userEmail: string;
  onUpload: (data: {
    facilityId: string;
    documentName: string;
    documentType: FacilityDocumentsEntityDocumentTypeEnum;
    fileUrl: string;
    fileName: string;
    uploadedByEmail: string;
    uploadedAt: string;
    expiryDate?: string;
    notes?: string;
  }) => Promise<void>;
}

export const UploadFacilityDocumentSheet = ({
  open,
  onOpenChange,
  facilityId,
  userEmail,
  onUpload,
}: UploadFacilityDocumentSheetProps) => {
  const isMobile = useIsMobile();
  const { uploadFunction, isLoading: isUploading } = useFileUpload();

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] =
    useState<FacilityDocumentsEntityDocumentTypeEnum | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setDocumentName("");
    setDocumentType("");
    setSelectedFile(null);
    setExpiryDate("");
    setNotes("");
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setSelectedFile(file);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!documentName.trim()) {
      toast.error("Document name is required");
      return;
    }
    if (!documentType) {
      toast.error("Document type is required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file to S3
      const fileUrl = await uploadFunction(selectedFile);
      if (!fileUrl) {
        toast.error("File upload failed");
        return;
      }

      // Create the document record
      await onUpload({
        facilityId,
        documentName: documentName.trim(),
        documentType: documentType as FacilityDocumentsEntityDocumentTypeEnum,
        fileUrl,
        fileName: selectedFile.name,
        uploadedByEmail: userEmail,
        uploadedAt: new Date().toISOString(),
        ...(expiryDate ? { expiryDate } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      toast.success("Document uploaded successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    documentName,
    documentType,
    selectedFile,
    facilityId,
    userEmail,
    expiryDate,
    notes,
    uploadFunction,
    onUpload,
    resetForm,
    onOpenChange,
  ]);

  const isLoading = isUploading || isSubmitting;
  const canSubmit =
    documentName.trim() && documentType && selectedFile && !isLoading;

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!isLoading) {
          onOpenChange(value);
          if (!value) resetForm();
        }
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[85vh]" : ""}
      >
        <SheetHeader>
          <SheetTitle>Upload Document</SheetTitle>
          <SheetDescription>
            Upload a facility document such as a contract, insurance certificate, or
            license.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6 px-1">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="doc-name">
              Document Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Annual Insurance Certificate 2025"
              disabled={isLoading}
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="doc-type">
              Document Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={documentType}
              onValueChange={(value) =>
                setDocumentType(
                  value as FacilityDocumentsEntityDocumentTypeEnum
                )
              }
              disabled={isLoading}
            >
              <SelectTrigger id="doc-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <Label htmlFor="doc-file">
              File <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-file"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              disabled={isLoading}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="doc-expiry">Expiry Date (Optional)</Label>
            <Input
              id="doc-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="doc-notes">Notes (Optional)</Label>
            <Textarea
              id="doc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this document..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};