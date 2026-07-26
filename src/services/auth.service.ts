import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

export interface OnboardingInput {
  role: Exclude<UserRole, 'admin'>;
  displayName: string;
  username: string;
  avatarUrl?: string;
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
}

export async function completeOnboarding(input: OnboardingInput) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error('Not signed in');

  const { error } = await supabase.rpc('complete_onboarding', {
    selected_role: input.role,
    display_name: input.displayName,
    username: input.username,
    avatar_url: input.avatarUrl || auth.user.user_metadata.avatar_url || null,
    brand_name: input.role === 'brand' ? input.brandName || null : null,
    website_url: input.role === 'brand' ? input.websiteUrl || null : null,
    brand_description: input.role === 'brand' ? input.brandDescription || null : null,
  });

  if (error) throw error;
}
