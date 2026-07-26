import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'oauth' | 'bio') => void;
}

export function InstagramVerificationMethodModal({ isOpen, onClose, onSelectMethod }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<'oauth' | 'bio'>('oauth');

  if (!isOpen) return null;

  const handleContinue = () => {
    onSelectMethod(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#16181e] p-6 shadow-2xl space-y-6">
        
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-text-muted transition hover:bg-white/10 hover:text-text-primary"
        >
          <Icon name="x" size={16} />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Choose Verification Method</h2>
        </div>

        {/* Method Cards Selection */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Card 1: Link Account (Recommended) */}
          <button
            type="button"
            onClick={() => setSelectedMethod('oauth')}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
              selectedMethod === 'oauth'
                ? 'border-rose-500/80 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/50'
                : 'border-white/10 bg-surface/40 hover:border-white/20 hover:bg-surface/80'
            }`}
          >
            {/* Top row: Recommended badge + Radio */}
            <div className="flex items-center justify-between w-full">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                Recommended
              </span>
              <div
                className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                  selectedMethod === 'oauth'
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {selectedMethod === 'oauth' && <Icon name="check" size={12} />}
              </div>
            </div>

            {/* Icon & Details */}
            <div className="mt-8 space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-text-primary">
                <Icon name="shield-check" size={18} />
              </div>
              <h3 className="font-bold text-sm text-text-primary">Link Account</h3>
              <p className="text-[11px] leading-relaxed text-text-secondary">
                Unlock exclusive campaigns and earn more.
              </p>
            </div>
          </button>

          {/* Card 2: Bio Verification */}
          <button
            type="button"
            onClick={() => setSelectedMethod('bio')}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
              selectedMethod === 'bio'
                ? 'border-rose-500/80 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/50'
                : 'border-white/10 bg-surface/40 hover:border-white/20 hover:bg-surface/80'
            }`}
          >
            {/* Top row: Radio */}
            <div className="flex items-center justify-end w-full">
              <div
                className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                  selectedMethod === 'bio'
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {selectedMethod === 'bio' && <Icon name="check" size={12} />}
              </div>
            </div>

            {/* Icon & Details */}
            <div className="mt-8 space-y-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-text-primary">
                <Icon name="link" size={18} />
              </div>
              <h3 className="font-bold text-sm text-text-primary">Bio Verification</h3>
              <p className="text-[11px] leading-relaxed text-text-secondary">
                Add code to your account bio to verify its ownership.
              </p>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <Button
          type="button"
          className="w-full h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg transition-transform active:scale-[0.98] hover:brightness-110 border-none"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
