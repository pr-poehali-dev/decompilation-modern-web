import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface DecompilerSettings {
  showLineNumbers: boolean;
  inlineSimpleMethods: boolean;
  removeComments: boolean;
  simplifyExpressions: boolean;
}

interface SettingsTabProps {
  settings: DecompilerSettings;
  onUpdateSettings: (settings: DecompilerSettings) => void;
}

export default function SettingsTab({ settings, onUpdateSettings }: SettingsTabProps) {
  return (
    <div className="animate-fade-in">
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
                onUpdateSettings({ ...settings, showLineNumbers: checked })
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
                onUpdateSettings({ ...settings, inlineSimpleMethods: checked })
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
                onUpdateSettings({ ...settings, removeComments: checked })
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
                onUpdateSettings({ ...settings, simplifyExpressions: checked })
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
    </div>
  );
}
