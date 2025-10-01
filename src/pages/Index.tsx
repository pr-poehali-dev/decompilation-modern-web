import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface DecompileHistory {
  id: string;
  fileName: string;
  timestamp: Date;
  code: string;
}

export default function Index() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decompiledCode, setDecompiledCode] = useState<string>('');
  const [history, setHistory] = useState<DecompileHistory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith('.jar') && !file.name.endsWith('.class')) {
      toast({
        title: 'Неверный формат файла',
        description: 'Поддерживаются только .jar и .class файлы',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    
    const mockCode = `// Декомпилированный код: ${file.name}
public class ${file.name.replace(/\.(jar|class)$/, '')} {
    
    private String name;
    private int version;
    
    public ${file.name.replace(/\.(jar|class)$/, '')}() {
        this.name = "Example";
        this.version = 1;
    }
    
    public void initialize() {
        System.out.println("Initializing plugin...");
        loadConfiguration();
        registerEvents();
    }
    
    private void loadConfiguration() {
        // Загрузка конфигурации
    }
    
    private void registerEvents() {
        // Регистрация событий
    }
    
    public String getName() {
        return this.name;
    }
    
    public int getVersion() {
        return this.version;
    }
}`;

    setDecompiledCode(mockCode);
    
    const newHistoryItem: DecompileHistory = {
      id: Date.now().toString(),
      fileName: file.name,
      timestamp: new Date(),
      code: mockCode,
    };
    
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));

    toast({
      title: 'Декомпиляция завершена',
      description: `Файл ${file.name} успешно декомпилирован`,
    });
  }, [toast]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card
              className={`p-8 border-2 border-dashed transition-all duration-300 animate-fade-in ${
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
                  >
                    <Icon name="FileUp" size={18} />
                    Выбрать файл
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

            {decompiledCode && (
              <Card className="p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="FileCode" size={20} className="text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {selectedFile?.name || 'Декомпилированный код'}
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
                <div className="rounded-lg bg-code p-4 overflow-x-auto">
                  <pre className="text-sm text-code-foreground font-mono leading-relaxed">
                    {decompiledCode}
                  </pre>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="History" size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground">История декомпиляций</h3>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="FileX" size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">История пуста</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon name="FileCode" size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {item.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleTimeString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
