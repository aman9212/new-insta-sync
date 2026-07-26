# View Tracking

Edge Function: `supabase/functions/sync-submission-views`

Provider interface:

```ts
interface ViewProvider {
  supports(url: string): boolean
  normalizeUrl(url: string): string
  extractExternalId(url: string): string | null
  fetchMetrics(input): Promise<{ totalViews: number; fetchedAt: string } | { limitation: string; fetchedAt: string }>
}
```

YouTube uses the official YouTube Data API and reads `YOUTUBE_API_KEY` server-side.

Instagram and TikTok do not scrape pages and do not fake metrics. They return typed provider limitations until approved API access and account authorization are configured.

The worker records `view_snapshots`, calls the server-side earnings function, updates sync timestamps, and writes audit logs for provider limitations.
