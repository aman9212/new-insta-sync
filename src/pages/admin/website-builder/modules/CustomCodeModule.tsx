import { useState } from 'react';
import type { CustomCodeSnippet, CustomCodeLocation, CustomCodeType } from '../../../../types/cms';

interface CustomCodeModuleProps {
  customCode: CustomCodeSnippet[];
  onSaveCustomCode: (snippet: CustomCodeSnippet) => void;
  onDeleteCustomCode: (id: string) => void;
  isSaving: boolean;
}

export function CustomCodeModule({ customCode, onSaveCustomCode, onDeleteCustomCode, isSaving }: CustomCodeModuleProps) {
  const [editingCode, setEditingCode] = useState<CustomCodeSnippet | null>(null);

  const handleCreateNew = () => {
    setEditingCode({
      id: 'cc_' + Date.now(),
      name: 'Custom Script',
      location: 'head',
      codeType: 'javascript',
      codeContent: '// Enter script code here',
      isEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCurrent = () => {
    if (!editingCode) return;
    onSaveCustomCode(editingCode);
    setEditingCode(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Custom Code & Tracking Snippets</h2>
          <p className="text-xs text-white/50">Safely inject Google Analytics, GTM, Meta Pixel, Microsoft Clarity, Custom CSS, and JS scripts.</p>
        </div>
        {!editingCode && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
          >
            + Add Code Snippet
          </button>
        )}
      </div>

      {editingCode ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Configure Snippet</h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Snippet Name</label>
              <input
                type="text"
                required
                value={editingCode.name}
                onChange={(e) => setEditingCode({ ...editingCode, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-white/70 mb-1">Injection Location</label>
              <select
                value={editingCode.location}
                onChange={(e) => setEditingCode({ ...editingCode, location: e.target.value as CustomCodeLocation })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="head">&lt;head&gt; Section</option>
                <option value="body_start">Body Start (&lt;body&gt;)</option>
                <option value="body_end">Body End (&lt;/body&gt;)</option>
                <option value="footer">Footer Script</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/70 mb-1">Code Type</label>
              <select
                value={editingCode.codeType}
                onChange={(e) => setEditingCode({ ...editingCode, codeType: e.target.value as CustomCodeType })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value="analytics">Analytics & Pixel</option>
                <option value="javascript">JavaScript</option>
                <option value="css">Custom CSS</option>
                <option value="html">HTML Fragment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Code Content</label>
            <textarea
              rows={8}
              value={editingCode.codeContent}
              onChange={(e) => setEditingCode({ ...editingCode, codeContent: e.target.value })}
              className="w-full font-mono rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white leading-relaxed"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={editingCode.isEnabled}
              onChange={(e) => setEditingCode({ ...editingCode, isEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-accent"
            />
            <span className="text-xs font-semibold text-white">Snippet Enabled</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingCode(null)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveCurrent}
              className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white"
            >
              Save Snippet
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {customCode.map((cc) => (
            <div key={cc.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] uppercase font-bold text-accent">{cc.location}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{cc.name}</h4>
                  <p className="text-[10px] text-white/40">{cc.codeType} • {cc.isEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCode(cc)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCustomCode(cc.id)}
                  className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
