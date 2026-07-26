# Creator Management ER Diagram

```mermaid
erDiagram
  profiles ||--o| creator_profiles : extends
  creator_profiles ||--|| creator_wallets : has
  creator_profiles ||--|| creator_levels : progresses
  creator_profiles ||--o{ creator_badges : earns
  creator_profiles ||--o{ creator_social_accounts : connects
  creator_profiles ||--o| creator_kyc : submits
  creator_profiles ||--o{ creator_notes : receives
  creator_profiles ||--o{ creator_flags : triggers
  creator_profiles ||--o{ creator_analytics : measures
  creator_profiles ||--o{ creator_history : records
  creator_profiles ||--o{ submissions : creates
  creator_profiles ||--o{ withdrawals : requests
  creator_profiles ||--o{ creator_referrals : referrer
  creator_profiles ||--o{ creator_referrals : referred
  profiles ||--o{ audit_logs : performs
  profiles ||--o{ creator_history : performs
  profiles ||--o{ creator_badges : awards
```

`creator_wallets` is the creator-management projection. The authoritative existing wallet balance remains synchronized in `wallets`, and adjustments are represented in immutable `wallet_transactions`. This preserves current finance and withdrawal integrations while adding locked, bonus, referral, and freeze controls.
