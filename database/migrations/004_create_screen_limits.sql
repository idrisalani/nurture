-- ============================================================
-- NurtureNet Migration 004: screen_limits
-- Per-child screen time configuration.
-- Covers total daily limits, per-app limits, school hours lock,
-- bedtime lock, and weekend mode — matching Qustodio's feature set.
-- ============================================================

BEGIN;

CREATE TYPE screen_action AS ENUM ('block', 'warn', 'log_only');

-- Master per-child limit config (one row per child)
CREATE TABLE screen_limits (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id                UUID        NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,

    -- Daily total limits (in minutes, 0 = unlimited)
    weekday_limit_mins      SMALLINT    NOT NULL DEFAULT 120,   -- 2 hours weekdays
    weekend_limit_mins      SMALLINT    NOT NULL DEFAULT 180,   -- 3 hours weekends

    -- Warning threshold (percentage of limit)
    warn_at_percent         SMALLINT    NOT NULL DEFAULT 80,    -- warn at 80% used

    -- School hours lock (blanket block during school)
    school_lock_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
    school_lock_days        SMALLINT[]  NOT NULL DEFAULT '{1,2,3,4,5}',  -- Mon-Fri (ISO weekday)
    school_lock_start       TIME        NOT NULL DEFAULT '08:00',
    school_lock_end         TIME        NOT NULL DEFAULT '15:00',

    -- Bedtime lock
    bedtime_lock_enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
    bedtime_start           TIME        NOT NULL DEFAULT '21:00',
    bedtime_end             TIME        NOT NULL DEFAULT '06:00',
    bedtime_days            SMALLINT[]  NOT NULL DEFAULT '{1,2,3,4,5,6,7}',

    -- Internet pause (manual override by parent)
    internet_paused         BOOLEAN     NOT NULL DEFAULT FALSE,
    internet_paused_until   TIMESTAMPTZ,                        -- auto-resume at this time

    -- Action when limit is exceeded
    on_limit_reached        screen_action NOT NULL DEFAULT 'block',

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-app or per-category time limits (many rows per child)
CREATE TABLE app_limits (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id        UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    app_package     VARCHAR(200),                               -- e.g. com.google.youtube
    app_category    VARCHAR(60),                                -- e.g. 'social_media', 'gaming'
    daily_limit_mins SMALLINT       NOT NULL DEFAULT 60,
    action          screen_action   NOT NULL DEFAULT 'block',
    is_blocked      BOOLEAN         NOT NULL DEFAULT FALSE,     -- hard block regardless of time
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Either package OR category must be set, not both
    CONSTRAINT app_limits_target_check CHECK (
        (app_package IS NOT NULL AND app_category IS NULL) OR
        (app_package IS NULL AND app_category IS NOT NULL)
    )
);

-- Track daily screen time usage (reset at midnight per timezone)
CREATE TABLE screen_usage (
    id              BIGSERIAL       PRIMARY KEY,
    child_id        UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    device_id       UUID            NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    usage_date      DATE            NOT NULL DEFAULT CURRENT_DATE,
    app_package     VARCHAR(200)    NOT NULL,
    app_name        VARCHAR(100),
    minutes_used    SMALLINT        NOT NULL DEFAULT 0,
    last_synced_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- One row per child+device+date+app
    UNIQUE (child_id, device_id, usage_date, app_package)
);

-- Indexes
CREATE INDEX idx_screen_limits_child    ON screen_limits (child_id);
CREATE INDEX idx_app_limits_child       ON app_limits (child_id);
CREATE INDEX idx_app_limits_package     ON app_limits (app_package) WHERE app_package IS NOT NULL;
CREATE INDEX idx_screen_usage_child_date ON screen_usage (child_id, usage_date DESC);
CREATE INDEX idx_screen_usage_date      ON screen_usage (usage_date);

-- Auto-update timestamps
CREATE TRIGGER set_screen_limits_updated_at
    BEFORE UPDATE ON screen_limits
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE screen_limits              IS 'Master screen time config per child — one row per child';
COMMENT ON TABLE app_limits                 IS 'Per-app or per-category limits — multiple rows per child';
COMMENT ON TABLE screen_usage               IS 'Daily usage tracking — synced from child device every 5 min';
COMMENT ON COLUMN app_limits.is_blocked     IS 'TRUE = app is hard-blocked regardless of time limits';

COMMIT;
