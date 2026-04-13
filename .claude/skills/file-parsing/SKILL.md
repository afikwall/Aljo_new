---
name: file-parsing
description: Parsing and previewing files in this project — CSV parsing, Excel/XLSX reading, PDF viewing, and file preview rendering (PDFs, Word docs, images, spreadsheets). Load this skill whenever the task involves reading uploaded files, parsing structured data from CSV or Excel, previewing a PDF, or showing a file preview to the user.
user-invocable: false
---

# File Parsing Skill

Use this skill when working with file parsing (CSV, Excel) or file preview functionality.

## When to Use

- User needs to parse CSV data
- User needs to parse Excel/XLSX files
- User wants to display file previews (PDFs, Word docs, Excel, images, etc.)
- User needs to process uploaded files on the frontend

---

## CSV Parsing with PapaParse

**ALWAYS use the `papaparse` package for CSV parsing. NEVER implement manual CSV parsing.**

```tsx
import Papa from 'papaparse';
```

### Parse CSV String

```tsx
const results = Papa.parse(csvString, {
  header: true, // First row as column names
  skipEmptyLines: true, // Ignore empty rows
  dynamicTyping: true, // Auto-convert numbers and booleans
});

// results.data = array of objects (when header: true)
// results.errors = array of any parse errors
// results.meta = metadata about the parse
```

### Parse CSV File (from file input)

```tsx
function handleFileUpload(file: File, onComplete: (rows: any[]) => void) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: (results) => {
      onComplete(results.data);
    },
    error: () => {
      toast.error('Failed to parse file');
    },
  });
}
```

### Convert Data to CSV

```tsx
const csvString = Papa.unparse(dataArray); // Array of objects -> CSV string
```

---

## Excel Parsing with XLSX (SheetJS)

**ALWAYS use the `xlsx` package for Excel file parsing. NEVER implement manual Excel parsing.**

```tsx
import * as XLSX from 'xlsx';
```

### Parse Excel File

```tsx
async function handleExcelUpload(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of objects (header row becomes keys)
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data;
}
```

### Get All Sheet Names

```tsx
const sheetNames = workbook.SheetNames; // ["Sheet1", "Sheet2", ...]
```

### Parse Specific Sheet

```tsx
const worksheet = workbook.Sheets['Sheet2'];
const data = XLSX.utils.sheet_to_json(worksheet);
```

---

## File Preview with FilePreviewer

For displaying file previews (PDFs, Word docs, Excel sheets, PowerPoints, images, CSVs, etc.), use the `FilePreviewer` component. It automatically handles different file types with appropriate viewers.

```tsx
import { FilePreviewer } from '@/components/ui/file-previewer';
```

### Preview from Entity Data

```tsx
function ContractPreview({ contractId }: { contractId: string }) {
  const { data: contract } = useEntityGetOne(ContractEntity, {
    id: contractId,
  });

  if (!contract?.fileUrl) {
    return <div>No file available</div>;
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>{contract.name}</CardTitle>
      </CardHeader>
      <CardContent className="h-[500px]">
        <FilePreviewer uri={contract.fileUrl} />
      </CardContent>
    </Card>
  );
}
```

### Preview with File Upload

```tsx
function UploadAndPreview() {
  const [fileUrl, setFileUrl] = useState('');
  const { uploadFunction } = useFileUpload();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadFunction(file);
      setFileUrl(url);
    }
  };

  return (
    <>
      <input type="file" onChange={handleUpload} />
      {fileUrl && (
        <div className="h-[600px] mt-4 border rounded">
          <FilePreviewer uri={fileUrl} />
        </div>
      )}
    </>
  );
}
```

### FilePreviewer Rules

- **DO** use `FilePreviewer` for generic document rendering (Word, Excel, PowerPoint, images, CSV)
- **DO** use `PdfViewer` for PDF files (see below)
- **DO** set a height on the container (`h-[500px]`, `h-[600px]`, etc.)
- **NEVER** use `<iframe>` for PDFs - use `PdfViewer`
- **NEVER** use `<img>` for non-image documents - use FilePreviewer
- **NEVER** use `<object>` for documents - use FilePreviewer
- **NEVER** try to render raw file content in a `<div>` - use FilePreviewer

---

## PDF Preview with PdfViewer

**For PDF files, use `PdfViewer` instead of `FilePreviewer`.** It provides page navigation, zoom, and optional field overlays.

```tsx
import { PdfViewer } from '@/components/ui/pdf-viewer';

// Basic PDF preview
<div className="h-[600px]">
  <PdfViewer file={pdfUrl} />
</div>

// With field overlays (fields require: name, x, y, page (0-indexed). Optional: width, height, label, type)
const fields = [
  { x: 27.6, y: 626.4, width: 213.48, height: 15.84, page: 0, name: 'member_email', type: 'text' },
  { x: 100, y: 200, width: 180, height: 40, page: 0, name: 'signature', type: 'text' },
];

<PdfViewer file={pdfUrl} fields={fields} showAll />
<PdfViewer file={pdfUrl} fields={fields} showFields={['member_email']} />
<PdfViewer file={pdfUrl} fields={fields} showAll showLabels />

// Listen for page changes (receives 1-based page number)
<PdfViewer file={pdfUrl} onPageChange={(page) => console.log('Now on page', page)} />
```

- Pass `showAll` to show all field overlays, or `showFields={['name1', 'name2']}` for specific ones. No overlays render by default.
- Pass `showLabels` to display field name labels above each overlay. Labels are hidden by default.
- Pass `showAnnotations` to render native PDF annotations (links, comments). Hidden by default.
- Pass `onPageChange` to receive a callback whenever the displayed page changes. The callback receives the 1-based page number.
- Container MUST have a defined height.

---

## Summary

| File Type     | Package            | Import                                                           |
| ------------- | ------------------ | ---------------------------------------------------------------- |
| PDF preview   | Built-in component | `import { PdfViewer } from "@/components/ui/pdf-viewer"`         |
| File preview  | Built-in component | `import { FilePreviewer } from "@/components/ui/file-previewer"` |
| CSV parsing   | `papaparse`        | `import Papa from "papaparse"`                                   |
| Excel parsing | `xlsx`             | `import * as XLSX from "xlsx"`                                   |
