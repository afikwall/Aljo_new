import { useState, useCallback, useMemo } from "react";
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityDelete,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityDocumentsEntity } from "@/product-types";
import type { FacilityDocumentsEntityDocumentTypeEnum } from "@/product-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { FacilityDocumentCard } from "@/components/FacilityDocumentCard";
import { UploadFacilityDocumentSheet } from "@/components/UploadFacilityDocumentSheet";

interface FacilityDocumentsTabProps {
  facilityId: string;
}

export const FacilityDocumentsTab = ({
  facilityId,
}: FacilityDocumentsTabProps) => {
  const user = useUser();
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  const {
    data: documents,
    isLoading,
    refetch,
  } = useEntityGetAll(
    FacilityDocumentsEntity,
    { facilityId },
    { enabled: !!facilityId }
  );

  const { createFunction, isLoading: isCreating } =
    useEntityCreate(FacilityDocumentsEntity);
  const { deleteFunction, isLoading: isDeleting } =
    useEntityDelete(FacilityDocumentsEntity);

  const sortedDocuments = useMemo(() => {
    if (!documents) return [];
    return [...documents].sort((a, b) => {
      const dateA = a.uploadedAt || a.createdAt || "";
      const dateB = b.uploadedAt || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });
  }, [documents]);

  const handleUpload = useCallback(
    async (data: {
      facilityId: string;
      documentName: string;
      documentType: FacilityDocumentsEntityDocumentTypeEnum;
      fileUrl: string;
      fileName: string;
      uploadedByEmail: string;
      uploadedAt: string;
      expiryDate?: string;
      notes?: string;
    }) => {
      await createFunction({ data });
      refetch();
    },
    [createFunction, refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteFunction({ id });
        toast.success("Document deleted");
        refetch();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete document");
      }
    },
    [deleteFunction, refetch]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with upload button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Facility Documents</h3>
        <Button size="sm" onClick={() => setUploadSheetOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Upload Document
        </Button>
      </div>

      {/* Document list or empty state */}
      {sortedDocuments.length === 0 ? (
        <div className="border border-dashed rounded-lg min-h-[200px] flex flex-col items-center justify-center p-6 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-bold text-base">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload contracts, insurance, and other facility documents
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setUploadSheetOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDocuments.map((doc) => (
            <FacilityDocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Upload Sheet */}
      <UploadFacilityDocumentSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        facilityId={facilityId}
        userEmail={user?.email || ""}
        onUpload={handleUpload}
      />
    </div>
  );
};