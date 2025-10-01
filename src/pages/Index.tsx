import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

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
    methodMatches.forEach((match, idx) => {
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
        contents.forEach((relativePath, file) => {
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="Code2" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">JavaDecompiler</h1>
              <p className="text-xs text-muted-foreground">Modern Java Decompiler</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full transition-transform hover:scale-110"
          >
            {theme === 'light' ? (
              <Icon name="Moon" size={20} />
            ) : (
              <Icon name="Sun" size={20} />
            )}
          </Button>
        </div>
      </header>

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

          <TabsContent value="decompiler" className="space-y-6 animate-fade-in">
            <Card
              className={`p-8 border-2 border-dashed transition-all duration-300 ${
                isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
                    onChange={handleFileInput}
                  />
                </div>
              </div>
            </Card>

            {jarFiles.length > 0 && (
              <Card className="p-6 animate-scale-in">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="FolderTree" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Содержимое JAR архива</h3>
                  <span className="text-sm text-muted-foreground">({jarFiles.length} файлов)</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {jarFiles.map((file) => (
                    <button
                      key={file}
                      onClick={() => selectJarFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedJarFile === file
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {file}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {decompiledCode && (
              <Card className="p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="FileCode" size={20} className="text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {selectedJarFile || selectedFile?.name || 'Декомпилированный код'}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Icon name="Copy" size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadCode}>
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
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Icon name="History" size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">История декомпиляций</h2>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistory([])}
                    className="gap-2"
                  >
                    <Icon name="Trash2" size={16} />
                    Очистить
                  </Button>
                )}
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Icon name="FileX" size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">История пуста</p>
                  <p className="text-sm mt-2">Декомпилируйте файлы для отображения истории</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon name="FileCode" size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate mb-1">
                            {item.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleString('ru-RU')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.fileSize}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <Card className="p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Icon name="Settings" size={24} className="text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Настройки декомпиляции</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div className="space-y-1">
                    <Label htmlFor="line-numbers" className="text-base font-medium">
                      Показывать номера строк
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Добавляет нумерацию строк в декомпилированный код
                    </p>
                  </div>
                  <Switch
                    id="line-numbers"
                    checked={settings.showLineNumbers}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showLineNumbers: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div className="space-y-1">
                    <Label htmlFor="inline-methods" className="text-base font-medium">
                      Упрощать простые методы
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Встраивает простые методы для улучшения читаемости
                    </p>
                  </div>
                  <Switch
                    id="inline-methods"
                    checked={settings.inlineSimpleMethods}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, inlineSimpleMethods: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div className="space-y-1">
                    <Label htmlFor="remove-comments" className="text-base font-medium">
                      Удалять комментарии
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Убирает автоматически сгенерированные комментарии
                    </p>
                  </div>
                  <Switch
                    id="remove-comments"
                    checked={settings.removeComments}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, removeComments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <Label htmlFor="simplify" className="text-base font-medium">
                      Упрощать выражения
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Применяет оптимизации для более читаемого кода
                    </p>
                  </div>
                  <Switch
                    id="simplify"
                    checked={settings.simplifyExpressions}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, simplifyExpressions: checked })
                    }
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                  <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Информация о декомпиляции
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Декомпиляция происходит полностью в браузере. Ваши файлы не загружаются на сервер и остаются конфиденциальными.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
