import React from "react";
import { useRef, useState, useCallback } from "react";
import { useFileUpload } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  photoUrl?: string;
  initials: string;
  isEditMode: boolean;
  onPhotoUploaded: (url: string) => void;
}

export const ProfilePhotoUpload = ({
  photoUrl,
  initials,
  isEditMode,
  onPhotoUploaded,
}: ProfilePhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFunction, isLoading: isUploading } = useFileUpload();
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (isEditMode && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [isEditMode, isUploading]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);

      try {
        const url = await uploadFunction(file);
        onPhotoUploaded(url);
        setLocalPreview(null);
        URL.revokeObjectURL(previewUrl);
      } catch {
        toast.error("Failed to upload photo");
        setLocalPreview(null);
        URL.revokeObjectURL(previewUrl);
      }

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFunction, onPhotoUploaded],
  );

  const displayUrl = localPreview || photoUrl;

  return (
    <div className="relative inline-block">
      <div
        onClick={handleClick}
        className={cn(
          "relative rounded-full",
          isEditMode && "cursor-pointer group",
        )}
      >
        <Avatar className="h-32 w-32">
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay during loading */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40">
            <Loader2 className="h-8 w-8 animate-spin text-background" />
          </div>
        )}

        {/* Camera badge in edit mode (not uploading) */}
        {isEditMode && !isUploading && (
          <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110">
            <Camera className="h-4 w-4" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};