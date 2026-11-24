-- ============================================================
-- NurtureNet Migration 013: subscriptions + payments
-- Nigerian-first billing — Paystack, Flutterwave, mobile money,
-- USSD. Prices in NGN. Supports card, bank transfer,
-- MTN MoMo, Airtel Money, Opay, Kuda.
-- ============================================================

BEGIN;

CREATE TYPE payment_provider AS ENUM (
    'paystack',         -- Primary: card + bank transfer + USSD
    'flutterwave',      -- Fallback: mobile money + wider Africa
    'manual',           -- Telco bundle or school B2B invoice
    'promo'             -- Free promo / NGO / school partnership
);

CREATE TYPE payment_method AS ENUM (
    'card',             -- Visa / Mastercard / Verve
    'bank_transfer',    -- Nigerian bank transfer
    'ussd',             -- USSD (*payment_code#) — no smartphone needed
    'mobile_money',     -- MTN MoMo, Airtel Money, Opay
    'qr_code',          -- QR payment
    'invoice'           -- B2B school/telco invoice
);

CREATE TYPE subscription_status AS ENUM (
    'active',
    'past_due',         -- payment failed, grace period
    'cancelled',
    'expired',
    'trial',
    'paused'
);

-- Active subscription per parent (one row per parent at a time)
CREATE TABLE subscriptions (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id           UUID                NOT NULL UNIQUE REFERENCES parents(id) ON DELETE CASCADE,
    plan                subscription_plan   NOT NULL DEFAULT 'free',
    status              subscription_status NOT NULL DEFAULT 'active',

    -- Billing
    provider            payment_provider,
    payment_method      payment_method,
    amount_ngn          INT,                        -- price in Naira (kobo stored as INT: 250000 = ₦2,500)
    amount_usd          DECIMAL(10,2),              -- for reporting only
    billing_cycle       VARCHAR(20)         DEFAULT 'monthly', -- monthly | annual

    -- Provider references
    provider_customer_id    TEXT,               -- Paystack/Flutterwave customer ID
    provider_sub_id         TEXT,               -- Paystack subscription code
    provider_plan_id        TEXT,               -- Paystack plan code

    -- Dates
    trial_ends_at       TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       TEXT,

    -- Grace period (3 days after payment failure before locking)
    grace_period_end    TIMESTAMPTZ,

    -- Referral / promo
    promo_code          VARCHAR(50),
    referred_by         UUID                REFERENCES parents(id),

    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Full payment transaction history
CREATE TABLE payment_transactions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id           UUID            NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    subscription_id     UUID            REFERENCES subscriptions(id),

    -- Transaction details
    provider            payment_provider NOT NULL,
    payment_method      payment_method,
    amount_ngn          INT             NOT NULL,       -- amount in kobo: 250000 = ₦2,500
    amount_usd          DECIMAL(10,2),
    currency            VARCHAR(3)      NOT NULL DEFAULT 'NGN',
    plan                subscription_plan NOT NULL,
    billing_cycle       VARCHAR(20),

    -- Provider references
    provider_ref        TEXT            UNIQUE,         -- Paystack reference / Flutterwave txRef
    provider_status     TEXT,                           -- raw provider status
    webhook_received_at TIMESTAMPTZ,

    -- Status
    status              VARCHAR(20)     NOT NULL DEFAULT 'pending', -- pending | success | failed | refunded
    failure_reason      TEXT,

    -- Receipt
    receipt_url         TEXT,
    invoice_number      VARCHAR(30)     UNIQUE,         -- NN-2027-0001

    -- Metadata
    metadata            JSONB           DEFAULT '{}',
    -- e.g. {"channel": "mobile_money", "bank": "MTN", "ussd_code": "*737*1*amount#"}

    initiated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- Pricing plans table (configurable without code deploy)
CREATE TABLE pricing_plans (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    plan            subscription_plan NOT NULL,
    billing_cycle   VARCHAR(20)     NOT NULL,           -- monthly | annual
    amount_ngn      INT             NOT NULL,           -- kobo: 250000 = ₦2,500
    amount_usd      DECIMAL(10,2)   NOT NULL,
    paystack_plan_code TEXT,                            -- from Paystack dashboard
    flutterwave_plan_code TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    display_name_en TEXT            NOT NULL,
    display_name_ha TEXT,
    display_name_yo TEXT,
    display_name_ig TEXT,
    display_name_pc TEXT,
    features        JSONB           DEFAULT '{}',       -- feature list for plan card UI
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Seed pricing plans (₦ prices as kobo)
INSERT INTO pricing_plans (plan, billing_cycle, amount_ngn, amount_usd,
    display_name_en, display_name_ha, display_name_yo, display_name_ig, display_name_pc, features)
VALUES
('free', 'monthly', 0, 0.00,
    'Free', 'Kyauta', 'Ọ̀fẹ́', 'Efu', 'Free',
    '{"children": 1, "languages": ["en"], "screen_time": true, "web_filter": "basic",
      "location": false, "prayer_mode": false, "exam_mode": false, "reports_days": 7}'
),
('basic', 'monthly', 250000, 1.67,
    'Basic', 'Asali', 'Ìpìlẹ̀', 'Ntọala', 'Basic',
    '{"children": 3, "languages": ["en","ha","yo","ig","pc"],
      "screen_time": true, "web_filter": "full", "location": true,
      "prayer_mode": true, "exam_mode": true, "sms_location": true,
      "reports_days": 30, "panic_button": true}'
),
('basic', 'annual', 2400000, 16.00,
    'Basic (Annual)', 'Asali (Shekara)', 'Ìpìlẹ̀ (Ọdun)', 'Ntọala (Afọ)', 'Basic (Year)',
    '{"children": 3, "languages": ["en","ha","yo","ig","pc"],
      "screen_time": true, "web_filter": "full", "location": true,
      "prayer_mode": true, "exam_mode": true, "sms_location": true,
      "reports_days": 30, "panic_button": true, "discount": "20%"}'
),
('pro', 'monthly', 500000, 3.33,
    'Pro', 'Pro', 'Pro', 'Pro', 'Pro',
    '{"children": -1, "languages": ["en","ha","yo","ig","pc"],
      "screen_time": true, "web_filter": "full_custom", "location": true,
      "location_history": true, "prayer_mode": true, "exam_mode": true,
      "sms_location": true, "reports_days": 90, "panic_button": true,
      "social_monitoring": true, "ai_threat_detection": true,
      "calls_messages": true, "whatsapp_support": true}'
),
('pro', 'annual', 4800000, 32.00,
    'Pro (Annual)', 'Pro (Shekara)', 'Pro (Ọdun)', 'Pro (Afọ)', 'Pro (Year)',
    '{"children": -1, "discount": "20%", "social_monitoring": true,
      "ai_threat_detection": true, "reports_days": 90}'
);

-- Promo codes / referral codes
CREATE TABLE promo_codes (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) NOT NULL UNIQUE,
    description     TEXT,
    discount_pct    SMALLINT,                   -- percentage off
    discount_ngn    INT,                         -- fixed amount off in kobo
    free_months     SMALLINT,                    -- free months
    max_uses        INT,
    uses_count      INT         NOT NULL DEFAULT 0,
    valid_from      DATE        NOT NULL DEFAULT CURRENT_DATE,
    valid_until     DATE,
    applies_to_plan subscription_plan,          -- NULL = any plan
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- School / EdTech B2B partnerships (bulk subscriptions)
CREATE TABLE partner_agreements (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name    TEXT        NOT NULL,        -- "uLesson", "Federal Government Schools"
    partner_type    VARCHAR(30) NOT NULL,        -- 'school', 'edtech', 'telco', 'ngo'
    contact_email   TEXT,
    contact_phone   TEXT,
    seats_purchased INT         NOT NULL DEFAULT 0,
    seats_used      INT         NOT NULL DEFAULT 0,
    plan            subscription_plan NOT NULL DEFAULT 'pro',
    amount_ngn      INT,                         -- custom bulk pricing
    valid_until     DATE,
    notes           TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_status   ON subscriptions (status, current_period_end);
CREATE INDEX idx_subscriptions_expiring ON subscriptions (current_period_end)
    WHERE status = 'active';
CREATE INDEX idx_payments_parent        ON payment_transactions (parent_id, initiated_at DESC);
CREATE INDEX idx_payments_status        ON payment_transactions (status, initiated_at DESC);
CREATE INDEX idx_payments_provider_ref  ON payment_transactions (provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX idx_pricing_active         ON pricing_plans (plan, billing_cycle) WHERE is_active = TRUE;

CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Sync subscription plan on parent row when subscription changes
CREATE OR REPLACE FUNCTION sync_parent_plan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE parents
    SET subscription_plan = NEW.plan,
        updated_at = NOW()
    WHERE id = NEW.parent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_plan_on_subscription_change
    AFTER INSERT OR UPDATE OF plan, status ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION sync_parent_plan();

COMMENT ON TABLE subscriptions          IS 'Active subscription per parent. Syncs plan to parents table automatically.';
COMMENT ON TABLE payment_transactions   IS 'Full payment history — Paystack + Flutterwave webhooks write here.';
COMMENT ON TABLE pricing_plans          IS 'Configurable pricing — change prices without code deploy.';
COMMENT ON COLUMN payment_transactions.amount_ngn IS 'Stored in kobo (smallest NGN unit). 250000 kobo = ₦2,500.';
COMMENT ON TABLE partner_agreements     IS 'B2B school and telco partnership bulk subscriptions';

COMMIT;
