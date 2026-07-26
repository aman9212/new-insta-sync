import { useState } from 'react';
import type { RedirectRule } from '../../../../types/cms';

interface RedirectsModuleProps {
  redirects: RedirectRule[];
  onSaveRedirect: (rule: RedirectRule) => void;
  onDeleteRedirect: (id: string) => void;
  isSaving: boolean;
}

export function RedirectsModule({ redirects, onSaveRedirect, onDeleteRedirect, isSaving }: RedirectsModuleProps) {
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);

  const handleCreateNew = () => {
    setEditingRule({
      id: 'r_' + Date.now(),
      sourcePath: '/old-path',
      targetPath: '/new-path',
      statusCode: 301,
      isActive: true,
      hits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCurrent = () => {
    if (!editingRule) return;
    onSaveRedirect(editingRule);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">URL Redirect Manager</h2>
          <p className="text-xs text-white/50">Manage 301 Permanent, 302 Temporary, and custom 404 URL redirects with hit analytics.</p>
        </div>
        {!editingRule && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
          >
            + Add Redirect
          </button>
        )}
      </div>

      {editingRule ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Configure Redirect Rule</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70 mb-1">Source Path (e.g. /old-page)</label>
              <input
                type="text"
                required
                value={editingRule.sourcePath}
                onChange={(e) => setEditingRule({ ...editingRule, sourcePath: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Target Destination (e.g. /new-page or https://...)</label>
              <input
                type="text"
                required
                value={editingRule.targetPath}
                onChange={(e) => setEditingRule({ ...editingRule, targetPath: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70 mb-1">HTTP Status Code</label>
              <select
                value={editingRule.statusCode}
                onChange={(e) => setEditingRule({ ...editingRule, statusCode: Number(e.target.value) as 301 | 302 | 404 })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              >
                <option value={301}>301 Permanent Redirect</option>
                <option value={302}>302 Temporary Redirect</option>
                <option value={404}>404 Custom Not Found</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRule.isActive}
                  onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                  className="h-4 w-4 rounded accent-accent"
                />
                <span className="text-xs font-semibold text-white">Rule Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingRule(null)}
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
              Save Rule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {redirects.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase font-bold text-accent">{r.statusCode}</span>
                <div>
                  <p className="text-xs font-bold text-white">
                    {r.sourcePath} → <span className="text-accent">{r.targetPath}</span>
                  </p>
                  <p className="text-[10px] text-white/40">{r.hits} Redirect Hits Logged</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(r)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRedirect(r.id)}
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
