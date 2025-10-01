import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
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
          onClick={onToggleTheme}
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
  );
}
