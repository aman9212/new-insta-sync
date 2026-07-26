import { useState } from 'react';
import type { ThemeState } from '../../../../types/theme';

interface CustomCssModuleProps {
  theme: ThemeState;
  onUpdateCustomCSS: (css: string) => void;
}

export function CustomCssModule({ theme, onUpdateCustomCSS }: CustomCssModuleProps) {
  const [cssCode, setCssCode] = useState(theme.customCSS || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCustomCSS(cssCode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Custom CSS Stylesheet</h2>
          <p className="text-xs text-white/50">Inject custom CSS rules live into the global stylesheet engine.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Inject CSS Overrides
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Custom CSS injected live!
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-white/70 mb-2">CSS Rules Editor</label>
        <textarea
          rows={14}
          value={cssCode}
          onChange={(e) => setCssCode(e.target.value)}
          placeholder={`/* Custom CSS Overrides */\n.custom-badge {\n  background: rgba(139, 92, 246, 0.2);\n  border: 1px solid rgba(139, 92, 246, 0.4);\n}`}
          className="w-full font-mono rounded-2xl border border-white/10 bg-[#080a13] p-4 text-xs text-white leading-relaxed focus:outline-none focus:border-accent"
        />
      </div>
    </form>
  );
}
