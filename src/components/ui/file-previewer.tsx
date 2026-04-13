import DocViewer, {
  DocViewerRenderers,
  IDocument,
} from '@cyntler/react-doc-viewer';

import '@cyntler/react-doc-viewer/dist/index.css';

import {
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const FILE_DATA_BLOCK_PATTERN = /api\/blocks\/fileDataBlock\/[^/]+\/redirect/;
function isFileDataBlockRedirectUrl(url: string): boolean {
  return FILE_DATA_BLOCK_PATTERN.test(url);
}

const getFileTypeIcon = (fileType?: string): LucideIcon => {
  const type = fileType?.toLowerCase();

  if (type?.startsWith('image/')) {
    return FileImageIcon;
  } else if (type?.startsWith('video/')) {
    return FileVideoIcon;
  } else if (type?.startsWith('audio/')) {
    return FileAudioIcon;
  } else if (
    type?.includes('zip') ||
    type?.includes('rar') ||
    type?.includes('tar') ||
    type?.includes('7z')
  ) {
    return FileArchiveIcon;
  } else if (
    type?.includes('pdf') ||
    type?.includes('text/') ||
    type?.includes('document')
  ) {
    return FileTextIcon;
  } else {
    return FileIcon;
  }
};

const NoRenderer = ({
  document,
  fileName,
}: {
  document: IDocument | undefined;
  fileName: string;
}) => {
  const IconComponent = useMemo(
    () => getFileTypeIcon(document?.fileType),
    [document?.fileType],
  );

  return (
    <div className="flex flex-col items-center gap-2 p-4 h-full justify-center">
      <IconComponent className="w-12 h-12 text-gray-500" />
      <p className="text-xs text-muted-foreground">{document?.fileType}</p>
    </div>
  );
};

export const FilePreviewer = ({ uri }: { uri: string }) => {
  if (isFileDataBlockRedirectUrl(uri)) {
    let tokenFromLocalStorage = localStorage.getItem('token');
    if ((window as any).appId) {
      const token = window.localStorage.getItem(
        `token-${(window as any).appId}`,
      );
      if (token) {
        tokenFromLocalStorage = token;
      }
    }

    if (tokenFromLocalStorage) {
      uri = `${uri}?token=${tokenFromLocalStorage}`;
    }
  }

  return (
    <div
      className={cn(
        'h-full w-full overflow-auto',
        '[&_#proxy-renderer]:!h-full',
        '[&_#pdf-renderer]:!bg-muted-accent [&_#pdf-renderer]:!h-full [&_#image-renderer]:!bg-muted-accent [&_#image-renderer]:!h-full',
        '[&_#pdf-controls]:!z-[9999] [&_#pdf-controls]:border-b [&_#pdf-controls]:!shadow-md [&_#pdf-controls]:!p-4 [&_#pdf-controls]:!gap-x-2 [&_#pdf-controls]:!bg-background/90',
        '[&_#pdf-pagination]:mr-auto [&_#pdf-pagination]:gap-x-2',
        '[&_svg_path]:fill-current [&_svg_polygon]:fill-current',
        '[&_#pdf-pagination-info]:!text-[hsl(var(--foreground))]',
        '[&_button]:!rounded-md [&_a]:!rounded-md [&_button]:!shadow-sm [&_a]:!shadow-sm [&_button]:!m-0 [&_a]:!m-0',
      )}
    >
      <DocViewer
        documents={[{ uri }]}
        prefetchMethod="GET"
        pluginRenderers={DocViewerRenderers}
        config={{
          header: {
            disableHeader: true,
          },
          noRenderer: {
            overrideComponent: NoRenderer,
          },
          pdfVerticalScrollByDefault: false,
        }}
        theme={{
          primary: 'hsl(var(--primary))',
          secondary: 'hsl(var(--secondary))',
          tertiary: 'hsl(var(--background))',
          textPrimary: 'hsl(var(--primary-foreground))',
          textSecondary: 'hsl(var(--secondary-foreground))',
          textTertiary: 'hsl(var(--foreground))',
          disableThemeScrollbar: false,
        }}
      />
    </div>
  );
};
