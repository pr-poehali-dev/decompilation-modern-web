import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface DecompileHistory {
  id: string;
  fileName: string;
  timestamp: Date;
  code: string;
  fileSize: string;
}

interface HistoryTabProps {
  history: DecompileHistory[];
  onLoadHistoryItem: (item: DecompileHistory) => void;
  onClearHistory: () => void;
}

export default function HistoryTab({
  history,
  onLoadHistoryItem,
  onClearHistory,
}: HistoryTabProps) {
  return (
    <div className="animate-fade-in">
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
              onClick={onClearHistory}
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
                onClick={() => onLoadHistoryItem(item)}
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
    </div>
  );
}
