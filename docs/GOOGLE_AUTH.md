# Google Auth

CreatorX uses Supabase OAuth:

- Provider: `google`
- Redirect path: `/auth/callback`
- Client redirect value: `${window.location.origin}/auth/callback`

Configure Google in Supabase Dashboard under Authentication Providers. Add allowed redirect URLs for local and production origins.

First login creates a profile and wallet through `handle_new_user`. If `onboarding_completed` is false, the app redirects to `/onboarding`. Public signup offers Creator and Brand only. Admin must be assigned manually by secure database administration.
