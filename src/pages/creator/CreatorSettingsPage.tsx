import { AccountSettings } from '../../components/ui/AccountSettings';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { useTheme } from '../../providers/ThemeProvider';

export function CreatorSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Creator settings</h1>
        <p className="mt-1 text-text-secondary">Manage your creator profile and account lifecycle.</p>
      </div>
      <AppearanceSettings />
      <AccountSettings />
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', desc: 'Clean white background', iconName: 'sun' },
    { id: 'dark', label: 'Dark', desc: 'Luxury dark gray (Default)', iconName: 'moon' },
    { id: 'amoled', label: 'AMOLED', desc: 'Pure black for OLED displays', iconName: 'eclipse' },
    { id: 'system', label: 'System', desc: 'Matches device preference', iconName: 'monitor' },
  ] as const;

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Appearance</h2>
        <p className="text-sm text-text-secondary mt-1">Customize the interface theme across your workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {themes.map((t) => {
          const isActive = theme === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 group
                ${isActive 
                  ? 'border-accent bg-accent/5 shadow-glow' 
                  : 'border-border bg-surface-hover hover:border-accent/40'
                }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 text-accent">
                  <Icon name="check-circle" size={16} />
                </div>
              )}
              
              <div className={`p-3 rounded-full mb-3 transition-colors ${isActive ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-secondary group-hover:text-text-primary'}`}>
                <Icon name={t.iconName} size={24} />
              </div>
              
              <span className={`font-semibold text-sm ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                {t.label}
              </span>
              <span className="text-[10px] text-text-secondary mt-1 text-center px-2">
                {t.desc}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
