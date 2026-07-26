# Enterprise Campaign Management API Documentation

## Overview
Secure REST & Supabase client endpoints for managing the CreatorX Campaign Management platform across admin, brand, and creator workflows.

---

## 1. Campaign CRUD & Lifecycle API

### `GET /rest/v1/campaigns`
- **Query Parameters**: `status`, `brand_id`, `category_id`, `search`
- **Description**: List campaigns with optional status and text filters.
- **RLS Policy**: Public read for active/scheduled; Admin/Brand full read.

### `POST /rest/v1/campaigns`
- **Request Body**: `EnterpriseCampaign` object
- **Description**: Create new enterprise campaign. Initial status defaults to `draft` or `pending`.

### `PATCH /rest/v1/campaigns?id=eq.{campaign_id}`
- **Request Body**: Partial campaign updates (budget, rules, metadata).

### `DELETE /rest/v1/campaigns?id=eq.{campaign_id}`
- **Description**: Permanently soft/hard delete campaign record (Admin permission required).

---

## 2. Template API

### `GET /rest/v1/campaign_templates`
- **Description**: List available campaign blueprint templates.

### `POST /rest/v1/campaign_templates`
- **Description**: Save reusable campaign blueprint configuration JSON.

---

## 3. Rewards & Verification API

### `GET /rest/v1/campaign_verification_rules?campaign_id=eq.{id}`
- **Description**: Retrieve verification parameters (AI spam check, watch time, min views).

### `GET /rest/v1/campaign_rewards?campaign_id=eq.{id}`
- **Description**: Retrieve reward matrix, CPM rates, milestone bonuses, tier structures.

---

## 4. Leaderboard & Analytics API

### `GET /rest/v1/campaign_leaderboards?campaign_id=eq.{id}&timeframe=eq.{weekly|monthly|lifetime}`
- **Description**: Retrieve creator rankings, top viewed submissions, top earners.

---

## 5. Reports Generator API

### `POST /rpc/generate_campaign_report`
- **Params**: `report_type` ('summary'|'creator'|'finance'|'verification'), `format` ('csv'|'json'|'pdf')
- **Description**: Generates downloadable export files for campaign audits.
