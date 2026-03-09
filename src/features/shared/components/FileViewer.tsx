import { Button } from '@/components/ui/button';
import { FileText, Image, Download, Eye, Trash2, ExternalLink } from 'lucide-react';
import { getFileType } from '../services/storageService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FileViewerProps {
  url: string;
  fileName: string;
  onDelete?: () => void;
  showDelete?: boolean;
  compact?: boolean;
}

export function FileViewer({ url, fileName, onDelete, showDelete = false, compact = true }: FileViewerProps) {
  const fileType = getFileType(fileName);

  const getIcon = () => {
    if (fileType === 'image') return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const renderPreview = () => {
    if (fileType === 'image') {
      return (
        <img
          src={url}
          alt={fileName}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }
    if (fileType === 'pdf') {
      return (
        <div className="space-y-3">
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-[70vh] rounded-lg border"
            title={fileName}
            allow="fullscreen"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          This file type cannot be previewed in the browser.
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>
    );
  };

  if (!compact) {
    return renderPreview();
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded">
          {getIcon()}
        </div>
        <span className="text-sm font-medium truncate max-w-[200px]">
          {fileName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{fileName}</DialogTitle>
            </DialogHeader>
            {renderPreview()}
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(url, '_blank')}
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        {showDelete && onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
