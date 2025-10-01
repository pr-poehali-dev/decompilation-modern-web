import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import FileTree from '@/components/FileTree';

interface DecompilerTabProps {
  isDragging: boolean;
  isProcessing: boolean;
  jarFiles: string[];
  selectedJarFile: string;
  decompiledCode: string;
  selectedFile: File | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectJarFile: (fileName: string) => void;
  onCopyToClipboard: () => void;
  onDownloadCode: () => void;
}

export default function DecompilerTab({
  isDragging,
  isProcessing,
  jarFiles,
  selectedJarFile,
  decompiledCode,
  selectedFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  onSelectJarFile,
  onCopyToClipboard,
  onDownloadCode,
}: DecompilerTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {!decompiledCode && (
        <Card
          className={`p-8 border-2 border-dashed transition-all duration-300 ${
            isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon name="Upload" size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Загрузите файл для декомпиляции
              </h2>
              <p className="text-muted-foreground">
                Перетащите .jar или .class файл сюда или нажмите кнопку
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="FileUp" size={18} />
                    Выбрать файл
                  </>
                )}
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".jar,.class"
                className="hidden"
                onChange={onFileInput}
              />
            </div>
          </div>
        </Card>
      )}

      {jarFiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-4 lg:col-span-1 animate-scale-in">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <Icon name="FolderTree" size={18} className="text-primary" />
              <h3 className="font-semibold text-sm text-foreground">JAR архив</h3>
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              <FileTree
                files={jarFiles}
                selectedFile={selectedJarFile}
                onSelectFile={onSelectJarFile}
              />
            </div>
          </Card>

          <Card className="p-6 lg:col-span-3 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="FileCode" size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground truncate">
                  {selectedJarFile || 'Декомпилированный код'}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onCopyToClipboard}>
                  <Icon name="Copy" size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={onDownloadCode}>
                  <Icon name="Download" size={16} />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-code p-4 overflow-x-auto max-h-[700px] overflow-y-auto">
              <pre className="text-sm text-code-foreground font-mono leading-relaxed">
                {decompiledCode}
              </pre>
            </div>
          </Card>
        </div>
      )}

      {decompiledCode && jarFiles.length === 0 && (
        <Card className="p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="FileCode" size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">
                {selectedFile?.name || 'Декомпилированный код'}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Icon name="Upload" size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={onCopyToClipboard}>
                <Icon name="Copy" size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={onDownloadCode}>
                <Icon name="Download" size={16} />
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-code p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-code-foreground font-mono leading-relaxed">
              {decompiledCode}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
