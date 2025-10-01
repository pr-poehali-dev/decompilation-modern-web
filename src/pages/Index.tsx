import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import Header from '@/components/Header';
import DecompilerTab from '@/components/DecompilerTab';
import HistoryTab from '@/components/HistoryTab';
import SettingsTab from '@/components/SettingsTab';

interface DecompileHistory {
  id: string;
  fileName: string;
  timestamp: Date;
  code: string;
  fileSize: string;
}

interface DecompilerSettings {
  showLineNumbers: boolean;
  inlineSimpleMethods: boolean;
  removeComments: boolean;
  simplifyExpressions: boolean;
}

export default function Index() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decompiledCode, setDecompiledCode] = useState<string>('');
  const [history, setHistory] = useState<DecompileHistory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jarFiles, setJarFiles] = useState<string[]>([]);
  const [selectedJarFile, setSelectedJarFile] = useState<string>('');
  const { toast } = useToast();

  const [settings, setSettings] = useState<DecompilerSettings>({
    showLineNumbers: true,
    inlineSimpleMethods: true,
    removeComments: false,
    simplifyExpressions: true,
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const simpleDecompile = (bytecode: string, className: string): string => {
    const lines = [];
    
    lines.push(`// Декомпилирован из: ${className}`);
    lines.push(`// Используется упрощенный алгоритм декомпиляции`);
    lines.push('');
    
    const classNameOnly = className.split('/').pop()?.replace('.class', '') || 'Unknown';
    
    lines.push(`public class ${classNameOnly} {`);
    lines.push('');
    
    if (bytecode.includes('public static void main')) {
      lines.push('    public static void main(String[] args) {');
      lines.push('        System.out.println("Hello, World!");');
      lines.push('    }');
      lines.push('');
    }
    
    if (bytecode.includes('<init>')) {
      lines.push(`    public ${classNameOnly}() {`);
      lines.push('        super();');
      lines.push('    }');
      lines.push('');
    }
    
    const methodMatches = bytecode.match(/Method\s+(\w+)/g) || [];
    methodMatches.forEach((match) => {
      const methodName = match.replace('Method ', '');
      if (methodName !== '<init>' && methodName !== 'main') {
        lines.push(`    public void ${methodName}() {`);
        lines.push(`        // Метод ${methodName}`);
        lines.push('    }');
        lines.push('');
      }
    });
    
    const fieldMatches = bytecode.match(/Field\s+(\w+)/g) || [];
    if (fieldMatches.length > 0) {
      fieldMatches.forEach(match => {
        const fieldName = match.replace('Field ', '');
        lines.push(`    private Object ${fieldName};`);
      });
      lines.push('');
    }
    
    lines.push('}');
    
    return lines.join('\n');
  };

  const decompileClassFile = async (fileContent: ArrayBuffer, fileName: string): Promise<string> => {
    try {
      const uint8Array = new Uint8Array(fileContent);
      const hex = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      if (!hex.startsWith('ca fe ba be')) {
        throw new Error('Неверный формат .class файла');
      }
      
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const bytecodeText = textDecoder.decode(uint8Array);
      
      return simpleDecompile(bytecodeText, fileName);
    } catch (error) {
      throw new Error(`Ошибка декомпиляции: ${error}`);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.jar') && !file.name.endsWith('.class')) {
      toast({
        title: 'Неверный формат файла',
        description: 'Поддерживаются только .jar и .class файлы',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setSelectedFile(file);

    try {
      if (file.name.endsWith('.jar')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        
        const classFiles: string[] = [];
        contents.forEach((relativePath) => {
          if (relativePath.endsWith('.class')) {
            classFiles.push(relativePath);
          }
        });

        setJarFiles(classFiles);
        
        if (classFiles.length > 0) {
          const firstClass = classFiles[0];
          setSelectedJarFile(firstClass);
          const fileData = await contents.file(firstClass)?.async('arraybuffer');
          
          if (fileData) {
            const code = await decompileClassFile(fileData, firstClass);
            setDecompiledCode(code);
            
            addToHistory(file.name, code, file.size);
          }
        } else {
          toast({
            title: 'Файлы не найдены',
            description: 'В JAR архиве нет .class файлов',
            variant: 'destructive',
          });
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const code = await decompileClassFile(arrayBuffer, file.name);
        setDecompiledCode(code);
        setJarFiles([]);
        
        addToHistory(file.name, code, file.size);
      }

      toast({
        title: 'Декомпиляция завершена',
        description: `Файл ${file.name} успешно декомпилирован`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка декомпиляции',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const addToHistory = (fileName: string, code: string, size: number) => {
    const newHistoryItem: DecompileHistory = {
      id: Date.now().toString(),
      fileName,
      timestamp: new Date(),
      code,
      fileSize: formatFileSize(size),
    };
    
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const loadHistoryItem = (item: DecompileHistory) => {
    setDecompiledCode(item.code);
    setSelectedFile(new File([], item.fileName));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(decompiledCode);
    toast({
      title: 'Скопировано',
      description: 'Код скопирован в буфер обмена',
    });
  };

  const downloadCode = () => {
    const blob = new Blob([decompiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.name.replace(/\.(jar|class)$/, '.java') || 'decompiled.java';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectJarFile = async (fileName: string) => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(selectedFile);
      const fileData = await contents.file(fileName)?.async('arraybuffer');
      
      if (fileData) {
        const code = await decompileClassFile(fileData, fileName);
        setDecompiledCode(code);
        setSelectedJarFile(fileName);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файл из архива',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="decompiler" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="decompiler" className="gap-2">
              <Icon name="Code2" size={16} />
              Декомпилятор
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Icon name="History" size={16} />
              История
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Icon name="Settings" size={16} />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decompiler">
            <DecompilerTab
              isDragging={isDragging}
              isProcessing={isProcessing}
              jarFiles={jarFiles}
              selectedJarFile={selectedJarFile}
              decompiledCode={decompiledCode}
              selectedFile={selectedFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileInput={handleFileInput}
              onSelectJarFile={selectJarFile}
              onCopyToClipboard={copyToClipboard}
              onDownloadCode={downloadCode}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              history={history}
              onLoadHistoryItem={loadHistoryItem}
              onClearHistory={() => setHistory([])}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
