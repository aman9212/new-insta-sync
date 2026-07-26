# CreatorX Social Integration Architecture Overview

## Architecture Principles

1. **Zero Hardcoded Secrets**: All Client IDs, secrets, tokens, webhook keys, and scopes are stored encrypted per platform and configurable via `/admin/integrations`.
2. **Modular Platform Adapter Pattern**: Standardized `PlatformAdapter` interface supporting YouTube, Instagram, TikTok, Facebook, X (Twitter), LinkedIn, Twitch, Kick, Discord, Reddit, and Snapchat.
3. **Queue-Based Worker & Backoff**: Background sync queue with exponential backoff retries (1s, 5s, 25s, 125s) and rate-limit throttling.
4. **Auto-Verification & Fraud Guard**: Automated metric threshold evaluator with video fingerprint hashing, engagement ratio analysis, and bot velocity detection.
5. **Credential Audit Trail**: Immutable logging of all credential modifications (Admin ID, IP, user agent, timestamp, masked diffs).
