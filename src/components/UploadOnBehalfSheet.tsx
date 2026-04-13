import React from "react";
import { useState, useCallback, useMemo } from "react";
import {
  useEntityCreate,
  useFileUpload,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity } from "@/product-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENT_TYPE_LABELS } from "@/utils/documentUtils";
import { Upload, Loader2, Info, FileText } from "lucide-react";
import { toast } from "sonner";
import type { StaffDocumentsEntityDocumentTypeEnum } from "@/product-types";

const ALL_DOC_TYPES: StaffDocumentsEntityDocumentTypeEnum[] = [
  "government_id",
  "background_check",
  "tb_test",
  "covid_vaccination",
  "nursing_license",
  "cpr_certification",
];

interface UploadOnBehalfSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffProfileId: string;
  staffName: string;
  applicationId?: string;
  onSuccess: () => void;
  preselectedDocType?: StaffDocumentsEntityDocumentTypeEnum;
}

export const UploadOnBehalfSheet = ({
  open,
  onOpenChange,
  staffProfileId,
  staffName,
  applicationId,
  onSuccess,
  preselectedDocType,
}: UploadOnBehalfSheetProps) => {
  const user = useUser();
  const { createFunction, isLoading: creating } =
    useEntityCreate(StaffDocumentsEntity);
  const { uploadFunction, isLoading: uploading } = useFileUpload();

  const [docType, setDocType] = useState<StaffDocumentsEntityDocumentTypeEnum | "">(
    preselectedDocType || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");

  const isSubmitting = creating || uploading;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!docType || !file) {
      toast.error("Please select a document type and file.");
      return;
    }

    try {
      const fileUrl = await uploadFunction(file);

      await createFunction({
        data: {
          staffProfileId,
          documentType: docType,
          fileUrl,
          fileName: file.name,
          reviewStatus: "pending_review",
          isRequired: true,
          uploadedByEmail: user.email || undefined,
          uploadedForApplicationId: applicationId || undefined,
          expiryDate: expiryDate || undefined,
        },
      });

      toast.success("Document uploaded successfully!");
      setDocType(preselectedDocType || "");
      setFile(null);
      setExpiryDate("");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to upload document. Please try again.");
    }
  }, [
    docType,
    file,
    uploadFunction,
    createFunction,
    staffProfileId,
    user.email,
    applicationId,
    expiryDate,
    preselectedDocType,
    onSuccess,
    onOpenChange,
  ]);

  // Reset form when sheet opens with a preselected doc type
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen && preselectedDocType) {
        setDocType(preselectedDocType);
      }
      if (!newOpen) {
        setFile(null);
        setExpiryDate("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, preselectedDocType]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Upload Document on Behalf of {staffName}</SheetTitle>
          <SheetDescription>
            Upload a compliance document for this staff member
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto pb-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              You are uploading on behalf of{" "}
              <span className="font-semibold text-foreground">{staffName}</span>.
              This document will be marked as uploaded by admin.
            </p>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-2">
            <Label className="text-base">Document Type</Label>
            <Select
              value={docType}
              onValueChange={(v) =>
                setDocType(v as StaffDocumentsEntityDocumentTypeEnum)
              }
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                {ALL_DOC_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt}>
                    {DOCUMENT_TYPE_LABELS[dt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-base">File</Label>
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate flex-1">
                  {file.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to select a file
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                />
              </label>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label className="text-base">
              Expiry Date{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!docType || !file || isSubmitting}
            className="w-full h-12 text-base"
          >
            {isSubmitting ? (
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