-- 007_stripe.sql
-- Stripe subscription fields on organizations.
-- stripe_subscription_status mirrors Stripe's subscription.status values:
--   active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_period_end  TIMESTAMPTZ;
