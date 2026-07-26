import { useState } from 'react';

interface ImportExportModuleProps {
  onExport: () => string;
  onImport: (jsonStr: string) => boolean;
}

export function ImportExportModule({ onExport, onImport }: ImportExportModuleProps) {
  const [importJson, setImportJson] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = () => {
    const jsonStr = onExport();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creatorx-theme-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'Theme JSON downloaded successfully!' });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;
    const ok = onImport(importJson);
    if (ok) {
      setStatusMsg({ type: 'success', text: 'Theme imported and applied live!' });
      setImportJson('');
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to import. Invalid JSON payload.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-text-primary">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-text-primary">Theme Import & Export</h2>
        <p className="text-xs text-text-secondary">Backup your theme configuration or restore themes across environments.</p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            statusMsg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h3 className="text-sm font-bold text-text-primary">Export Theme Configuration</h3>
        <p className="text-xs text-text-secondary">Download complete theme JSON file containing color palettes, typography, glass, and preset tokens.</p>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-md"
        >
          Export Theme JSON
        </button>
      </div>

      <form onSubmit={handleImportSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h3 className="text-sm font-bold text-text-primary">Import Theme Configuration</h3>
        <p className="text-xs text-text-secondary">Paste theme JSON below to validate and apply changes instantly.</p>
        <textarea
          rows={6}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="Paste JSON content here..."
          className="w-full font-mono rounded-xl border border-border bg-surface-elevated p-3 text-xs text-text-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md"
        >
          Validate & Import Theme
        </button>
      </form>
    </div>
  );
}
