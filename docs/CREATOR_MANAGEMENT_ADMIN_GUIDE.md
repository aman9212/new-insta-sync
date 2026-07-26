# Creator Management Admin Guide

Open **Admin → Creators Management**. The workspace uses live Supabase data; if the project is not configured, it deliberately presents an unavailable state rather than synthetic records.

Use the dashboard for live creator, KYC, activity, participation, withdrawal, and leader metrics. Use **All Creators** to filter by every account state and search by name, username, or email. Selecting a row opens the full record.

In a creator record, administrators can edit every stored profile field, review KYC, change lifecycle state, add internal notes/warnings/flags, maintain social-account metrics, award arbitrary badges, set arbitrary level/rank/XP values, change creator-scoped permissions, and make journaled wallet adjustments. Status and KYC changes are immediate and auditable. Use suspension and banning only according to your organization’s policy.

The **Settings** view persists policy JSON in `creator_settings`. Configure age, allowed countries, default level, referral program, KYC policy, verification, wallet controls, and any organization-specific rules there. This keeps creator eligibility and rewards data-driven; it does not require a source-code release.

Before production release, apply migrations through the Supabase migration workflow, deploy `creator-admin`, set its required secrets, create private KYC storage, and test with distinct creator and admin accounts. Never use a service-role key in the browser.
