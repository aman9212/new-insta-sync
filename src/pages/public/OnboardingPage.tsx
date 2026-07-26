import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { completeOnboarding } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

type SelectableRole = Exclude<UserRole, 'admin'>;

interface RoleCardData {
  role: SelectableRole;
  title: string;
  description: string;
  iconName: string;
  features: { iconName: string; text: string }[];
  gradient: string;
  accentColor: string;
}

const roleCards: RoleCardData[] = [
  {
    role: 'creator',
    title: 'Creator',
    description: 'Create content, grow your audience, and earn from brand campaigns.',
    iconName: 'video',
    features: [
      { iconName: 'star', text: 'Discover campaigns' },
      { iconName: 'video', text: 'Submit content' },
      { iconName: 'eye', text: 'Track verified views' },
      { iconName: 'dollar-sign', text: 'Earn from approved campaigns' },
    ],
    gradient: 'from-violet-500/20 to-indigo-500/10',
    accentColor: 'border-violet-500/60 shadow-violet-500/20',
  },
  {
    role: 'brand',
    title: 'Brand',
    description: 'Launch campaigns, connect with creators, and measure real results.',
    iconName: 'megaphone',
    features: [
      { iconName: 'layout-dashboard', text: 'Create campaigns' },
      { iconName: 'dollar-sign', text: 'Manage campaign budgets' },
      { iconName: 'users', text: 'Review creator submissions' },
      { iconName: 'bar-chart', text: 'Track campaign performance' },
    ],
    gradient: 'from-emerald-500/20 to-teal-500/10',
    accentColor: 'border-emerald-500/60 shadow-emerald-500/20',
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { configured, loading: authLoading, user, profile, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If not configured, redirect to landing
  if (!configured) return <Navigate to="/" replace />;

  // If still loading auth, show spinner
  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span>Loading session…</span>
        </div>
      </main>
    );
  }

  // If no user, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // If onboarding is already complete, redirect to dashboard
  if (profile?.onboarding_completed) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  async function handleContinue() {
    if (!selectedRole || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({
        role: selectedRole,
        displayName: user!.user_metadata?.full_name || user!.user_metadata?.name || user!.email?.split('@')[0] || 'User',
        username: `user-${user!.id.slice(0, 8)}`,
      });
      await refreshProfile();
      navigate(`/${selectedRole}/dashboard`, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6">
      <div className="w-full max-w-2xl">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
            <Icon name="star" size={24} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Choose how you'll use CreatorX
          </h1>
          <p className="mt-2 text-text-secondary">
            Signed in as <span className="text-text-primary font-medium">{user.email}</span>
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {roleCards.map((card) => {
            const isSelected = selectedRole === card.role;
            return (
              <button
                key={card.role}
                type="button"
                onClick={() => setSelectedRole(card.role)}
                disabled={submitting}
                className={`
                  group relative overflow-hidden rounded-2xl border-2 p-6 text-left
                  transition-all duration-300 ease-out
                  ${isSelected
                    ? `${card.accentColor} bg-gradient-to-br ${card.gradient} shadow-lg scale-[1.02]`
                    : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover'
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
                id={`onboarding-role-${card.role}`}
              >
                {/* Selection indicator */}
                <div className={`
                  absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full
                  border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-accent bg-accent'
                    : 'border-border-strong bg-transparent'
                  }
                `}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div className={`
                  mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                  transition-colors duration-200
                  ${isSelected
                    ? 'bg-white/10 text-text-primary'
                    : 'bg-surface-elevated text-text-muted group-hover:text-text-secondary'
                  }
                `}>
                  <Icon name={card.iconName} size={28} />
                </div>

                {/* Title & Description */}
                <h2 className={`
                  text-xl font-semibold uppercase tracking-wide
                  ${isSelected ? 'text-text-primary' : 'text-text-primary'}
                `}>
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                  {card.description}
                </p>

                {/* Features */}
                <ul className="mt-4 space-y-2.5">
                  {card.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <span className={`
                        shrink-0 transition-colors duration-200
                        ${isSelected ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}
                      `}>
                        <Icon name={feature.iconName} size={16} />
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-danger hover:text-danger/80 transition-colors"
            >
              <Icon name="refresh" size={12} />
              Dismiss and retry
            </button>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8">
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedRole || submitting}
            loading={submitting}
            onClick={handleContinue}
            id="onboarding-continue"
          >
            {selectedRole
              ? `Continue as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              : 'Select a role to continue'
            }
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          By continuing, you accept the CreatorX marketplace terms and payout policies.
        </p>
      </div>
    </main>
  );
}
