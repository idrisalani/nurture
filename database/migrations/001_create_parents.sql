-- ============================================================
-- NurtureNet Migration 001: parents
-- The root account for every family. Stores auth credentials,
-- language preference, and subscription tier.
-- ============================================================

BEGIN;

-- Supported languages enum
CREATE TYPE language_code AS ENUM ('en', 'ha', 'yo', 'ig', 'pc');

-- Subscription tiers enum
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'pro');

CREATE TABLE parents (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(120)    NOT NULL,
    email               VARCHAR(255)    UNIQUE,                    -- optional; phone is primary
    phone               VARCHAR(20)     NOT NULL UNIQUE,           -- Nigerian format +234...
    password_hash       TEXT            NOT NULL,
    preferred_language  language_code   NOT NULL DEFAULT 'en',
    subscription_plan   subscription_plan NOT NULL DEFAULT 'free',
    is_verified         BOOLEAN         NOT NULL DEFAULT FALSE,    -- phone OTP verified
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parents_phone   ON parents (phone);
CREATE INDEX idx_parents_email   ON parents (email) WHERE email IS NOT NULL;
CREATE INDEX idx_parents_plan    ON parents (subscription_plan);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Audit log table (NDPR compliance)
CREATE TABLE audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    table_name  VARCHAR(60)     NOT NULL,
    record_id   UUID            NOT NULL,
    action      VARCHAR(10)     NOT NULL,   -- INSERT, UPDATE, DELETE
    changed_by  UUID,                       -- parent_id if known
    old_data    JSONB,
    new_data    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_created_at   ON audit_logs (created_at);

COMMENT ON TABLE parents              IS 'Primary parent/guardian accounts';
COMMENT ON COLUMN parents.phone       IS 'Primary identifier. E.164 format: +2348012345678';
COMMENT ON COLUMN parents.preferred_language IS 'UI language: en=English, ha=Hausa, yo=Yoruba, ig=Igbo, pc=Nigerian Pidgin';

COMMIT;
