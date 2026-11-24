-- ============================================================
-- NurtureNet Migration 003: devices
-- Physical devices linked to child profiles.
-- One child can have multiple devices (phone + tablet).
-- Android-first MVP; iOS added in v1.1.
-- ============================================================

BEGIN;

CREATE TYPE device_platform AS ENUM ('android', 'ios', 'kindle');
CREATE TYPE device_status   AS ENUM ('active', 'inactive', 'blocked', 'pending');

CREATE TABLE devices (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id            UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    device_name         VARCHAR(100)    NOT NULL,               -- e.g. "Emeka's Tecno Spark"
    device_model        VARCHAR(100),                           -- "Tecno Spark 10C"
    platform            device_platform NOT NULL DEFAULT 'android',
    os_version          VARCHAR(20),                            -- "Android 13"
    fcm_token           TEXT,                                   -- Firebase push token (refreshes often)
    device_fingerprint  TEXT,                                   -- unique hardware ID for anti-spoof
    app_version         VARCHAR(20),                            -- NurtureNet app version on device
    status              device_status   NOT NULL DEFAULT 'pending',
    is_primary          BOOLEAN         NOT NULL DEFAULT FALSE,  -- primary device gets SMS fallback
    admin_enabled       BOOLEAN         NOT NULL DEFAULT FALSE,  -- Android Device Admin API enabled
    last_seen_at        TIMESTAMPTZ,
    last_ip             INET,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_devices_child_id   ON devices (child_id);
CREATE INDEX idx_devices_fcm_token  ON devices (fcm_token) WHERE fcm_token IS NOT NULL;
CREATE INDEX idx_devices_status     ON devices (status, child_id);
CREATE INDEX idx_devices_last_seen  ON devices (last_seen_at);

-- Auto-update timestamp
CREATE TRIGGER set_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Only one primary device per child
CREATE UNIQUE INDEX idx_devices_one_primary
    ON devices (child_id)
    WHERE is_primary = TRUE AND status = 'active';

COMMENT ON TABLE devices                        IS 'Physical devices registered to child profiles';
COMMENT ON COLUMN devices.fcm_token             IS 'Firebase Cloud Messaging token — refreshed by app on startup';
COMMENT ON COLUMN devices.admin_enabled         IS 'TRUE = Android Device Admin active, enables uninstall protection & hard app blocking';
COMMENT ON COLUMN devices.device_fingerprint    IS 'Hardware-derived ID to prevent token spoofing';

COMMIT;
