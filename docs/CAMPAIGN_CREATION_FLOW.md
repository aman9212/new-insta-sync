# Campaign Creation Wizard Flow Mapping

## Wizard Step 1: Campaign Identity
- **UI Field**: Campaign name
  - **TypeScript Type**: `string`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `name`
  - **Database Type**: `text`
  - **Required/Optional**: Required
  - **Validation Rule**: Length between 3 and 160 characters
- **UI Field**: Campaign type
  - **TypeScript Type**: `string`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `campaign_type`
  - **Database Type**: `public.campaign_type` (enum: `'logo' | 'music' | 'clipping' | 'ugc'`)
  - **Required/Optional**: Required
  - **Validation Rule**: Must match enum values exactly
- **UI Field**: Description
  - **TypeScript Type**: `string`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `description`
  - **Database Type**: `text`
  - **Required/Optional**: Required
  - **Validation Rule**: Minimum length 1 character, max length 2000 characters

## Wizard Step 2: Target Platforms
- **UI Field**: Platforms Checkboxes (Instagram, TikTok, YouTube)
  - **TypeScript Type**: `SocialPlatform[]`
  - **Database Table**: `public.campaign_platforms`
  - **Database Column**: `platform`
  - **Database Type**: `public.social_platform` (enum: `'instagram' | 'tiktok' | 'youtube'`)
  - **Required/Optional**: Required (at least one platform must be checked)
  - **Validation Rule**: Must match platform enum values

## Wizard Step 3: Budget & Payout Config
- **UI Field**: Total budget USD
  - **TypeScript Type**: `number`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `total_budget_cents`
  - **Database Type**: `bigint` (cents unit)
  - **Required/Optional**: Required
  - **Validation Rule**: Must be greater than or equal to 0
- **UI Field**: Rate per million USD
  - **TypeScript Type**: `number`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `rate_per_million_cents`
  - **Database Type**: `bigint` (cents unit)
  - **Required/Optional**: Required
  - **Validation Rule**: Must be greater than or equal to 0
- **UI Field**: Post cap USD
  - **TypeScript Type**: `number | null`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `cap_per_post_cents`
  - **Database Type**: `bigint | null` (cents unit)
  - **Required/Optional**: Optional
  - **Validation Rule**: If set, must be greater than or equal to 0
- **UI Field**: Creator cap USD
  - **TypeScript Type**: `number | null`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `cap_per_creator_cents`
  - **Database Type**: `bigint | null` (cents unit)
  - **Required/Optional**: Optional
  - **Validation Rule**: If set, must be greater than or equal to 0

## Wizard Step 4: Submission Settings
- **UI Field**: Minimum duration seconds
  - **TypeScript Type**: `number`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `minimum_duration_seconds`
  - **Database Type**: `integer`
  - **Required/Optional**: Optional (defaults to 0)
  - **Validation Rule**: Must be greater than or equal to 0
- **UI Field**: Requirements (newline separated)
  - **TypeScript Type**: `string[]`
  - **Database Table**: `public.campaigns`
  - **Database Column**: `requirements`
  - **Database Type**: `text[]`
  - **Required/Optional**: Required
  - **Validation Rule**: Cleaned and sanitized text arrays

## Wizard Step 5: Review & Save
- **Visual Display**: Renders Summary of all collected fields for final confirmation before submitting draft creation to the server.
