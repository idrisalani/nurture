-- ============================================================
-- NurtureNet Migration 002: children
-- Child profiles linked to a parent account.
-- One parent can have multiple children (free: 1, basic: 3, pro: unlimited)
-- ============================================================

BEGIN;

CREATE TABLE children (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID            NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    full_name       VARCHAR(120)    NOT NULL,
    date_of_birth   DATE,
    avatar_emoji    VARCHAR(10)     DEFAULT '👦',              -- fallback when no photo
    avatar_url      TEXT,                                      -- Cloudinary/S3 URL
    pin             VARCHAR(6),                                -- child unlock PIN (hashed)
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Age is computed on read (a stored column cannot depend on today's date in PostgreSQL)
CREATE OR REPLACE FUNCTION child_age(dob DATE) RETURNS SMALLINT AS $$
    SELECT EXTRACT(YEAR FROM AGE(dob))::SMALLINT;
$$ LANGUAGE SQL STABLE;

-- Indexes
CREATE INDEX idx_children_parent_id ON children (parent_id);
CREATE INDEX idx_children_active    ON children (parent_id, is_active);

-- Auto-update timestamp
CREATE TRIGGER set_children_updated_at
    BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Enforce plan limits at DB level via constraint check function
-- (app layer also enforces, but DB is the safety net)
CREATE OR REPLACE FUNCTION check_child_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count   INT;
    parent_plan     subscription_plan;
    max_allowed     INT;
BEGIN
    SELECT COUNT(*), p.subscription_plan
    INTO current_count, parent_plan
    FROM children c
    JOIN parents p ON p.id = NEW.parent_id
    WHERE c.parent_id = NEW.parent_id AND c.is_active = TRUE
    GROUP BY p.subscription_plan;

    max_allowed := CASE parent_plan
        WHEN 'free'  THEN 1
        WHEN 'basic' THEN 3
        WHEN 'pro'   THEN 999
    END;

    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Child limit reached for plan %. Upgrade to add more children.', parent_plan;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_child_limit
    BEFORE INSERT ON children
    FOR EACH ROW EXECUTE FUNCTION check_child_limit();

COMMENT ON TABLE children                  IS 'Child profiles under a parent account';
COMMENT ON FUNCTION child_age(DATE)     IS 'Age in whole years from a date of birth; use child_age(date_of_birth) in queries';
COMMENT ON COLUMN children.pin             IS 'Hashed 4-6 digit PIN — child enters to request time extension';

COMMIT;
