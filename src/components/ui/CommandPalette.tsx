import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useTheme } from '../../providers/ThemeProvider';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  const allCommands = [
    { id: 'light', title: 'Switch to Light Theme', iconName: 'sun', action: () => setTheme('light') },
    { id: 'dark', title: 'Switch to Dark Theme', iconName: 'moon', action: () => setTheme('dark') },
    { id: 'amoled', title: 'Switch to AMOLED Theme', iconName: 'eclipse', action: () => setTheme('amoled') },
    { id: 'system', title: 'Use System Theme', iconName: 'monitor', action: () => setTheme('system') },
  ];

  const filteredCommands = query
    ? allCommands.filter((cmd) => cmd.title.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[2000]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-[2010] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-xl bg-surface/90 backdrop-blur-2xl border border-border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Icon name="search" size={20} className="text-text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-text-primary text-base placeholder-text-muted outline-none"
                />
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-surface-elevated text-text-muted text-[10px] font-mono rounded border border-border">ESC</kbd>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No commands found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Appearance
                    </div>
                    {filteredCommands.map((cmd) => {
                      const isActiveTheme = theme === cmd.id;
                      
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            setOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors group
                            ${isActiveTheme ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon name={cmd.iconName} size={18} className={isActiveTheme ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'} />
                            <span className="text-sm font-medium">{cmd.title}</span>
                          </div>
                          {isActiveTheme && (
                            <span className="text-xs font-semibold">Active</span>
                          )}
                          {!isActiveTheme && (
                            <Icon name="arrow-right" size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted -translate-x-2 group-hover:translate-x-0 duration-200" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
