-- ============================================================
-- NurtureNet Migration 008: alerts
-- Every notification sent to a parent — screen time exceeded,
-- blocked site attempt, panic SOS, geofence event, AI threat.
-- Alert messages stored in ALL 5 LANGUAGES in the same row —
-- parent device renders in their preferred language.
-- ============================================================

BEGIN;

CREATE TYPE alert_type AS ENUM (
    -- Screen time alerts
    'screen_time_warning',      -- child at 80% of daily limit
    'screen_time_exceeded',     -- child hit daily limit, device locked
    'app_blocked',              -- specific app was blocked

    -- Content alerts
    'web_blocked',              -- website blocked by content filter
    'search_flagged',           -- AI flagged a dangerous search term
    'app_installed',            -- new app installed on child's device

    -- Location alerts
    'geofence_arrive',          -- child arrived at saved place
    'geofence_leave',           -- child left saved place
    'location_offline',         -- child device GPS lost for >30 mins

    -- Safety alerts
    'panic_sos',                -- child triggered panic button
    'ai_threat_detected',       -- AI detected grooming/bullying in message

    -- Device alerts
    'device_offline',           -- child device not seen for >2 hours
    'admin_disabled',           -- someone disabled Device Admin (uninstall attempt)

    -- Routine alerts
    'routine_activated',        -- a scheduled routine started
    'routine_violated',         -- child bypassed a routine

    -- System alerts
    'subscription_expiring',    -- subscription expires in 3 days
    'exam_mode_reminder'        -- exam starts soon
);

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE alerts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID            NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_id        UUID            REFERENCES children(id) ON DELETE SET NULL,
    device_id       UUID            REFERENCES devices(id) ON DELETE SET NULL,
    alert_type      alert_type      NOT NULL,
    severity        alert_severity  NOT NULL DEFAULT 'info',

    -- Message in all 5 languages (populated at creation time)
    -- Parent app renders the one matching preferred_language
    title_en        TEXT            NOT NULL,
    title_ha        TEXT,
    title_yo        TEXT,
    title_ig        TEXT,
    title_pc        TEXT,

    body_en         TEXT            NOT NULL,
    body_ha         TEXT,
    body_yo         TEXT,
    body_ig         TEXT,
    body_pc         TEXT,

    -- Context data (type-specific)
    metadata        JSONB           DEFAULT '{}',
    -- Examples:
    -- screen_time_exceeded: {"minutes_used": 120, "limit": 120, "app": "com.google.youtube"}
    -- geofence_arrive: {"place_name": "School", "place_id": "uuid", "lat": 6.5, "lng": 3.3}
    -- panic_sos: {"lat": 6.5, "lng": 3.3, "maps_url": "https://..."}
    -- ai_threat: {"score": 85, "category": "grooming", "platform": "whatsapp"}

    -- Delivery status
    push_sent       BOOLEAN         NOT NULL DEFAULT FALSE,
    sms_sent        BOOLEAN         NOT NULL DEFAULT FALSE,  -- SMS fallback for critical
    push_sent_at    TIMESTAMPTZ,
    sms_sent_at     TIMESTAMPTZ,

    -- Parent interaction
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    is_actioned     BOOLEAN         NOT NULL DEFAULT FALSE,  -- parent took action
    actioned_at     TIMESTAMPTZ,

    -- Deduplication — don't spam same alert within window
    dedup_key       VARCHAR(200)    UNIQUE,     -- e.g. "screen_time_exceeded:child_uuid:2027-01-15"

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_parent_unread   ON alerts (parent_id, is_read, created_at DESC)
    WHERE is_read = FALSE;
CREATE INDEX idx_alerts_parent_date     ON alerts (parent_id, created_at DESC);
CREATE INDEX idx_alerts_child           ON alerts (child_id, created_at DESC) WHERE child_id IS NOT NULL;
CREATE INDEX idx_alerts_severity        ON alerts (parent_id, severity, is_read);
CREATE INDEX idx_alerts_type            ON alerts (alert_type, created_at DESC);
CREATE INDEX idx_alerts_dedup           ON alerts (dedup_key) WHERE dedup_key IS NOT NULL;

-- Alert preferences per parent (which alerts they want, and how)
CREATE TABLE alert_preferences (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID            NOT NULL UNIQUE REFERENCES parents(id) ON DELETE CASCADE,

    -- Which types to receive (default: all)
    enabled_types   alert_type[]    DEFAULT NULL,           -- NULL = all types enabled

    -- Delivery preferences
    push_enabled    BOOLEAN         NOT NULL DEFAULT TRUE,
    sms_enabled     BOOLEAN         NOT NULL DEFAULT FALSE,  -- SMS costs money, opt-in
    email_enabled   BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Quiet hours (no push during sleep)
    quiet_hours_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    quiet_start     TIME            NOT NULL DEFAULT '22:00',
    quiet_end       TIME            NOT NULL DEFAULT '06:00',

    -- Critical alerts override quiet hours
    critical_override BOOLEAN       NOT NULL DEFAULT TRUE,

    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_alert_prefs_updated_at
    BEFORE UPDATE ON alert_preferences
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE alerts IS 'All alerts sent to parents. Messages stored in all 5 languages — parent app chooses which to display.';
COMMENT ON COLUMN alerts.dedup_key IS 'Prevents duplicate alerts. e.g. screen_time_exceeded:childId:date ensures one alert per child per day per type.';
COMMENT ON COLUMN alerts.metadata IS 'Type-specific context data as JSONB — location coords, threat scores, app names, etc.';

COMMIT;
