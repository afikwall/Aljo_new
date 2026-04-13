import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useUser,
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
  useFileUpload,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  StaffProfilesEntity,
  StaffDocumentsEntity,
  GetSignedFileUrlAction,
  LoginPage,
  StaffMyProfilePage,
  type StaffDocumentsEntityDocumentTypeEnum,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Info,
  Clock,
  Shield,
  ChevronDown,
  FileText,
  Plus,
  Download,
} from "lucide-react";
import { getPageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { ComplianceProgressCard } from "@/components/ComplianceProgressCard";
import { RequiredDocumentCard } from "@/components/RequiredDocumentCard";
import { OptionalDocumentCard } from "@/components/OptionalDocumentCard";
import { OptionalDocumentUploadForm } from "@/components/OptionalDocumentUploadForm";
import type { OptionalDocumentCategoryValue } from "@/utils/documentUtils";
import {
  getRequiredDocTypesForRole,
  getCardStatus,
  isImageFile,
  filterRequiredDocuments,
  filterOptionalDocuments,
  DOCUMENT_TYPE_TO_CATEGORY,
  mapOptionalCategoryToDbCategory,
  STATUS_SORT_ORDER,
} from "@/utils/documentUtils";

// --- Component ---

export default function StaffMyDocumentsPage() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null;
  }

  return <StaffMyDocumentsContent />;
}

function StaffMyDocumentsContent() {
  const user = useUser();

  // --- Data fetching ---
  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email }
  );
  const staffProfile = staffProfiles?.[0];

  const {
    data: staffDocuments,
    isLoading: loadingDocuments,
    refetch: refetchDocuments,
  } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  const { createFunction, isLoading: isCreating } =
    useEntityCreate(StaffDocumentsEntity);
  const { updateFunction, isLoading: isUpdating } =
    useEntityUpdate(StaffDocumentsEntity);
  const { uploadFunction, isLoading: isUploading } = useFileUpload();
  const { executeFunction: getSignedUrl } = useExecuteAction(
    GetSignedFileUrlAction
  );

  // --- UI State ---
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    blobUrl: string;
    signedUrl: string;
    name: string;
    isImage: boolean;
  } | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [loadingDownloadId, setLoadingDownloadId] = useState<string | null>(
    null
  );
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploadingOptional, setIsUploadingOptional] = useState(false);

  // --- Computed data ---
  const requiredDocTypes = useMemo(() => {
    return getRequiredDocTypesForRole(staffProfile?.roleType);
  }, [staffProfile?.roleType]);

  // Separate required and optional documents
  const requiredDocs = useMemo(() => {
    return staffDocuments ? filterRequiredDocuments(staffDocuments) : [];
  }, [staffDocuments]);

  const optionalDocs = useMemo(() => {
    return staffDocuments ? filterOptionalDocuments(staffDocuments) : [];
  }, [staffDocuments]);

  // Group required documents by type
  const documentsByType = useMemo(() => {
    const map: Record<
      string,
      Array<typeof StaffDocumentsEntity["instanceType"]>
    > = {};
    for (const doc of requiredDocs) {
      if (doc.documentType) {
        if (!map[doc.documentType]) {
          map[doc.documentType] = [];
        }
        map[doc.documentType].push(doc);
      }
    }
    return map;
  }, [requiredDocs]);

  // Build checklist items sorted by status priority
  const checklistItems = useMemo(() => {
    return requiredDocTypes
      .map((docType) => {
        const docs = documentsByType[docType] || [];
        const cardStatus = getCardStatus(docs);
        return {
          docType,
          cardStatus,
          docs,
          sortOrder: STATUS_SORT_ORDER[cardStatus],
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [requiredDocTypes, documentsByType]);

  // Progress counting - only required documents
  const approvedCount = useMemo(
    () =>
      checklistItems.filter((item) => item.cardStatus === "approved").length,
    [checklistItems]
  );
  const totalRequired = requiredDocTypes.length;

  const isBusy = isCreating || isUpdating || isUploading;

  // --- Required doc handlers ---
  const handleNewUpload = useCallback(
    async (docType: StaffDocumentsEntityDocumentTypeEnum, file: File, expiryDate?: string) => {
      if (!staffProfile?.id) return;
      setUploadingType(docType);
      try {
        const fileUrl = await uploadFunction(file);
        await createFunction({
          data: {
            staffProfileId: staffProfile.id,
            documentType: docType,
            fileUrl,
            fileName: file.name,
            reviewStatus: "pending_review",
            isRequired: true,
            documentCategory: DOCUMENT_TYPE_TO_CATEGORY[docType],
            ...(expiryDate ? { expiryDate } : {}),
          },
        });
        await refetchDocuments();
        toast.success("Document uploaded successfully");
      } catch {
        toast.error("Failed to upload document. Please try again.");
      } finally {
        setUploadingType(null);
      }
    },
    [staffProfile?.id, uploadFunction, createFunction, refetchDocuments]
  );

  const handleReplaceUpload = useCallback(
    async (
      docId: string,
      docType: StaffDocumentsEntityDocumentTypeEnum,
      file: File,
      expiryDate?: string
    ) => {
      setReplacingDocId(docId);
      try {
        const fileUrl = await uploadFunction(file);
        await updateFunction({
          id: docId,
          data: {
            fileUrl,
            fileName: file.name,
            reviewStatus: "pending_review",
            rejectionReason: "",
            ...(expiryDate ? { expiryDate } : {}),
          },
        });
        await refetchDocuments();
        toast.success("Document replaced successfully");
      } catch {
        toast.error("Failed to replace document. Please try again.");
      } finally {
        setReplacingDocId(null);
      }
    },
    [uploadFunction, updateFunction, refetchDocuments]
  );

  // --- Optional doc handlers ---
  const handleOptionalUpload = useCallback(
    async (data: {
      name: string;
      category: OptionalDocumentCategoryValue;
      file: File;
      expiryDate?: string;
    }) => {
      if (!staffProfile?.id) return;
      setIsUploadingOptional(true);
      try {
        const fileUrl = await uploadFunction(data.file);
        await createFunction({
          data: {
            staffProfileId: staffProfile.id,
            fileUrl,
            fileName: data.file.name,
            reviewStatus: "pending_review",
            isRequired: false,
            customDocumentName: data.name,
            documentCategory: mapOptionalCategoryToDbCategory(data.category),
            ...(data.expiryDate ? { expiryDate: data.expiryDate } : {}),
          },
        });
        await refetchDocuments();
        toast.success("Optional document uploaded successfully");
        setShowUploadForm(false);
      } catch {
        toast.error("Failed to upload document. Please try again.");
      } finally {
        setIsUploadingOptional(false);
      }
    },
    [staffProfile?.id, uploadFunction, createFunction, refetchDocuments]
  );

  const handleOptionalReplace = useCallback(
    async (docId: string, file: File) => {
      setReplacingDocId(docId);
      try {
        const fileUrl = await uploadFunction(file);
        await updateFunction({
          id: docId,
          data: {
            fileUrl,
            fileName: file.name,
            reviewStatus: "pending_review",
            rejectionReason: "",
          },
        });
        await refetchDocuments();
        toast.success("Document replaced successfully");
      } catch {
        toast.error("Failed to replace document. Please try again.");
      } finally {
        setReplacingDocId(null);
      }
    },
    [uploadFunction, updateFunction, refetchDocuments]
  );

  // --- View / Download handlers ---
  const handleViewDocument = useCallback(
    async (doc: typeof StaffDocumentsEntity["instanceType"]) => {
      if (!doc.fileUrl) return;
      setLoadingPreviewId(doc.id);
      try {
        const result = await getSignedUrl({ fileUrl: doc.fileUrl });
        if (result?.signedUrl) {
          const response = await fetch(result.signedUrl, {
            credentials: "include",
          });
          if (!response.ok) {
            toast.error("Failed to load document preview");
            return;
          }
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPreviewFile({
            blobUrl,
            signedUrl: result.signedUrl,
            name: doc.fileName || "Document",
            isImage: isImageFile(doc.fileUrl, doc.fileName),
          });
        } else {
          toast.error("Failed to load document preview");
        }
      } catch {
        toast.error("Failed to load document preview");
      } finally {
        setLoadingPreviewId(null);
      }
    },
    [getSignedUrl]
  );

  const handleDownloadDocument = useCallback(
    async (doc: typeof StaffDocumentsEntity["instanceType"]) => {
      if (!doc.fileUrl) return;
      setLoadingDownloadId(doc.id);
      try {
        const result = await getSignedUrl({ fileUrl: doc.fileUrl });
        if (result?.signedUrl) {
          const anchor = document.createElement("a");
          anchor.href = result.signedUrl;
          anchor.download = doc.fileName || "document";
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        } else {
          toast.error("Failed to download document");
        }
      } catch {
        toast.error("Failed to download document");
      } finally {
        setLoadingDownloadId(null);
      }
    },
    [getSignedUrl]
  );

  // --- Loading state ---
  if (loadingProfile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  // --- No profile state ---
  if (!staffProfile) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center justify-center text-center min-h-[180px] space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-base">
                    Profile Not Set Up Yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please complete your staff profile before uploading
                    documents.
                  </p>
                </div>
                <Button asChild className="w-full h-12 text-base mt-2">
                  <Link to={getPageUrl(StaffMyProfilePage)}>
                    Go to My Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          Track and upload your compliance documents
        </p>
      </div>

      {/* Compliance Progress Card */}
      <ComplianceProgressCard
        approvedCount={approvedCount}
        totalRequired={totalRequired}
      />

      {/* Required Documents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <RequiredDocumentCard
                  key={item.docType}
                  docType={item.docType}
                  cardStatus={item.cardStatus}
                  docs={item.docs}
                  isBusy={isBusy}
                  uploadingType={uploadingType}
                  replacingDocId={replacingDocId}
                  loadingPreviewId={loadingPreviewId}
                  loadingDownloadId={loadingDownloadId}
                  onNewUpload={handleNewUpload}
                  onReplaceUpload={handleReplaceUpload}
                  onViewDocument={handleViewDocument}
                  onDownloadDocument={handleDownloadDocument}
                  onDeleteDocument={refetchDocuments}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional Documents Section (Collapsible) */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setOptionalExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Additional Documents{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (Optional)
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload any additional certifications or documents that may help
                your application
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground shrink-0 ml-2 transition-transform duration-200",
                optionalExpanded && "rotate-180"
              )}
            />
          </button>
        </CardHeader>

        {optionalExpanded && (
          <CardContent className="space-y-4">
            {/* Existing optional documents */}
            {loadingDocuments ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : optionalDocs.length > 0 ? (
              <div className="space-y-3">
                {optionalDocs.map((doc) => (
                  <OptionalDocumentCard
                    key={doc.id}
                    doc={doc}
                    isBusy={isBusy}
                    replacingDocId={replacingDocId}
                    loadingPreviewId={loadingPreviewId}
                    loadingDownloadId={loadingDownloadId}
                    onReplaceUpload={handleOptionalReplace}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onDeleteDocument={refetchDocuments}
                  />
                ))}
              </div>
            ) : !showUploadForm ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No additional documents uploaded yet.
                </p>
              </div>
            ) : null}

            {/* Upload form or upload button */}
            {showUploadForm ? (
              <OptionalDocumentUploadForm
                isSubmitting={isUploadingOptional}
                onSubmit={handleOptionalUpload}
                onCancel={() => setShowUploadForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowUploadForm(true)}
                className="w-full h-12"
                disabled={isBusy}
              >
                <Plus className="mr-2 h-5 w-5" />
                Upload Optional Document
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Bottom Note */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Documents are reviewed by the ALJO team, usually within 1-2
              business days.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding review banner */}
      {staffProfile.onboardingStatus === "pending_review" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary">
                Your documents are under review. You&apos;ll be notified when
                approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) {
            if (previewFile?.blobUrl) {
              URL.revokeObjectURL(previewFile.blobUrl);
            }
            setPreviewFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.isImage ? (
                <div className="flex items-center justify-center">
                  <img
                    src={previewFile.blobUrl}
                    alt={previewFile.name}
                    className="max-h-[70vh] w-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={previewFile.blobUrl}
                  title={previewFile.name}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh" }}
                />
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={previewFile.signedUrl}
                    download={previewFile.name}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}