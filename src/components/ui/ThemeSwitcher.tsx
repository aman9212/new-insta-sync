import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useTheme, type Theme } from '../../providers/ThemeProvider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: Theme; label: string; iconName: string }[] = [
    { id: 'light', label: 'Light', iconName: 'sun' },
    { id: 'dark', label: 'Dark', iconName: 'moon' },
    { id: 'amoled', label: 'AMOLED', iconName: 'eclipse' },
    { id: 'system', label: 'System', iconName: 'monitor' },
  ];

  const currentIconName = theme === 'system' ? 'monitor' : themes.find((t) => t.id === theme)?.iconName || 'moon';

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-glass backdrop-blur-xl border border-border text-text-secondary hover:text-accent hover:border-accent/40 shadow-sm transition-colors group overflow-hidden"
        aria-label="Toggle theme"
      >
        {/* Glow hover effect */}
        <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full" />
        
        {/* Soft rotating icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10"
        >
          <Icon name={currentIconName} size={18} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-12 mt-2 w-44 rounded-2xl glass-strong border border-border-strong shadow-[var(--shadow-xl),var(--shadow-drop-3d),inset_0_1px_1px_var(--color-bezel)] overflow-hidden z-[1000] p-1.5"
          >
            <div className="flex flex-col gap-1">
              {themes.map((t) => {
                const isActive = theme === t.id;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group
                      ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                  >
                    {/* Active Background Ripple */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTheme"
                        className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-xl"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    <span className="relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Icon name={t.iconName} size={16} />
                    </span>
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
