import React from "react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  OPTIONAL_DOCUMENT_CATEGORIES,
  type OptionalDocumentCategoryValue,
} from "@/utils/documentUtils";

interface OptionalDocumentUploadFormProps {
  isSubmitting: boolean;
  onSubmit: (data: {
    name: string;
    category: OptionalDocumentCategoryValue;
    file: File;
    expiryDate?: string;
  }) => void;
  onCancel: () => void;
}

export const OptionalDocumentUploadForm = ({
  isSubmitting,
  onSubmit,
  onCancel,
}: OptionalDocumentUploadFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<OptionalDocumentCategoryValue | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = name.trim() !== "" && file !== null && !isSubmitting;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
      e.target.value = "";
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !file) return;
    onSubmit({
      name: name.trim(),
      category: (category || "other") as OptionalDocumentCategoryValue,
      file,
      expiryDate: expiryDate ? format(expiryDate, "yyyy-MM-dd") : undefined,
    });
  }, [name, category, file, expiryDate, onSubmit]);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      {/* Document name */}
      <div className="space-y-1.5">
        <Label htmlFor="optional-doc-name" className="text-sm font-medium">
          Document Name
        </Label>
        <Input
          id="optional-doc-name"
          placeholder="e.g. First Aid Certificate"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
          disabled={isSubmitting}
        />
      </div>

      {/* Document category */}
      <div className="space-y-1.5">
        <Label htmlFor="optional-doc-category" className="text-sm font-medium">
          Document Category
        </Label>
        <Select
          value={category}
          onValueChange={(val) =>
            setCategory(val as OptionalDocumentCategoryValue)
          }
          disabled={isSubmitting}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {OPTIONAL_DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File upload */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">File</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileChange}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 0, height: 0 }}
        />
        {file ? (
          <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="h-7 w-7 p-0"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-11"
            disabled={isSubmitting}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        )}
      </div>

      {/* Expiry date picker */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-1">
          Expiry Date
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isSubmitting}
              className={cn(
                "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !expiryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {expiryDate ? format(expiryDate, "MMM dd, yyyy") : "Select expiry date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiryDate}
              onSelect={(date) => {
                setExpiryDate(date);
                setExpiryOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Optional — add if your document has an expiry date
        </p>
      </div>

      {/* Submit / Cancel */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 h-11"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};