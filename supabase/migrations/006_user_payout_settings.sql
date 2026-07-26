-- Add payout and locale fields to profiles
alter table public.profiles
add column currency text default 'USD - US Dollar ($)',
add column country text,
add column timezone text;

-- Add Solana address for Privy wallet integration
alter table public.wallets
add column solana_address text;
