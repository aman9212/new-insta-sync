# Campaign Field Mapping

This document provides a field-by-field mapping between the Brand Campaign Creation Wizard (UI/TypeScript) and the PostgreSQL Database columns.

| UI Field Name | TypeScript Property | Database Table | Database Column | Database Type | Required/Optional | Validation Rules & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Campaign name** | `name` | `public.campaigns` | `name` | `text` | Required | String length between 3 and 160 characters |
| **Campaign type** | `campaign_type` | `public.campaigns` | `campaign_type` | `public.campaign_type` | Required | Must be one of the enum values: `'logo'`, `'music'`, `'clipping'`, `'ugc'` |
| **Description / Brief** | `description` | `public.campaigns` | `description` | `text` | Required | Cannot be empty |
| **Total budget USD** | `total_budget_cents` | `public.campaigns` | `total_budget_cents` | `bigint` (cents) | Required | Must be greater than or equal to 0 |
| **Rate per million views USD** | `rate_per_million_cents` | `public.campaigns` | `rate_per_million_cents` | `bigint` (cents) | Required | Must be greater than or equal to 0 |
| **Post cap USD** | `cap_per_post_cents` | `public.campaigns` | `cap_per_post_cents` | `bigint` (cents) | Optional | Must be null or greater than or equal to 0 |
| **Creator cap USD** | `cap_per_creator_cents` | `public.campaigns` | `cap_per_creator_cents` | `bigint` (cents) | Optional | Must be null or greater than or equal to 0 |
| **Minimum video duration** | `minimum_duration_seconds` | `public.campaigns` | `minimum_duration_seconds` | `integer` | Optional | Must be null or greater than or equal to 0 |
| **Content Requirements** | `requirements` | `public.campaigns` | `requirements` | `text[]` | Required | Array of text strings (lines) |
| **Target Platforms** | `platforms` | `public.campaign_platforms` | `platform` | `public.social_platform` | Required | Set of active values from: `'instagram'`, `'tiktok'`, `'youtube'` |
