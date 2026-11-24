-- ============================================================
-- NurtureNet Migration 006: locations + geofences
-- Real-time GPS tracking. Child device pushes every 15 seconds.
-- Latest location cached in Redis; historical stored here.
-- Geofences (saved places) with arrive/leave alerts.
-- ============================================================

BEGIN;

-- Location history (high-frequency, keep 7 days of pings)
CREATE TABLE location_pings (
    id              BIGSERIAL       PRIMARY KEY,
    child_id        UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    device_id       UUID            NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    latitude        DECIMAL(9,6)    NOT NULL,
    longitude       DECIMAL(9,6)    NOT NULL,
    accuracy_metres SMALLINT,                           -- GPS accuracy in metres
    speed_kmh       DECIMAL(5,2),                       -- for movement detection
    altitude_m      DECIMAL(7,2),
    address         TEXT,                               -- reverse-geocoded address (async)
    source          VARCHAR(20)     DEFAULT 'gps',      -- gps | network | sms_fallback
    battery_pct     SMALLINT,                           -- child device battery %
    recorded_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Keep only 7 days of raw pings (high volume)
-- Summarised daily tracks kept longer in location_daily_summary
CREATE INDEX idx_pings_child_time   ON location_pings (child_id, recorded_at DESC);
CREATE INDEX idx_pings_recorded     ON location_pings (recorded_at);

-- Daily movement summary (retained 90 days for pro, 30 for basic)
CREATE TABLE location_daily_summary (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id        UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    summary_date    DATE            NOT NULL,
    first_seen_lat  DECIMAL(9,6),
    first_seen_lng  DECIMAL(9,6),
    last_seen_lat   DECIMAL(9,6),
    last_seen_lng   DECIMAL(9,6),
    places_visited  JSONB,              -- [{"name":"School","arrived":"08:02","left":"14:45"}]
    total_distance_km DECIMAL(8,2),
    ping_count      INT             DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (child_id, summary_date)
);

-- Saved places / geofences (home, school, mosque, etc.)
CREATE TABLE saved_places (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID            NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name            VARCHAR(100)    NOT NULL,           -- "School", "Home", "Grandma's"
    name_ha         VARCHAR(100),                       -- Hausa translation
    name_yo         VARCHAR(100),                       -- Yoruba translation
    name_ig         VARCHAR(100),                       -- Igbo translation
    latitude        DECIMAL(9,6)    NOT NULL,
    longitude       DECIMAL(9,6)    NOT NULL,
    radius_metres   SMALLINT        NOT NULL DEFAULT 150,   -- geofence radius
    icon            VARCHAR(30)     DEFAULT '📍',       -- emoji icon
    alert_on_arrive BOOLEAN         NOT NULL DEFAULT TRUE,
    alert_on_leave  BOOLEAN         NOT NULL DEFAULT TRUE,
    active_hours_start TIME,                            -- only alert during these hours
    active_hours_end   TIME,
    apply_to_children  UUID[]        NOT NULL DEFAULT '{}', -- empty = all children
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_places_parent ON saved_places (parent_id, is_active);

-- Geofence event log (arrive/leave events)
CREATE TABLE geofence_events (
    id              BIGSERIAL       PRIMARY KEY,
    child_id        UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    place_id        UUID            NOT NULL REFERENCES saved_places(id) ON DELETE CASCADE,
    event_type      VARCHAR(10)     NOT NULL CHECK (event_type IN ('arrive', 'leave')),
    latitude        DECIMAL(9,6)    NOT NULL,
    longitude       DECIMAL(9,6)    NOT NULL,
    alert_sent      BOOLEAN         NOT NULL DEFAULT FALSE,
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_events_child  ON geofence_events (child_id, occurred_at DESC);
CREATE INDEX idx_geofence_events_place  ON geofence_events (place_id, occurred_at DESC);

-- Purge raw pings older than 7 days (run nightly)
CREATE OR REPLACE FUNCTION purge_old_pings()
RETURNS void AS $$
BEGIN
    DELETE FROM location_pings WHERE recorded_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_saved_places_updated_at
    BEFORE UPDATE ON saved_places
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE location_pings         IS 'Raw GPS pings from child devices every 15s. Latest also in Redis. Kept 7 days.';
COMMENT ON TABLE saved_places           IS 'Parent-defined geofences — school, home, mosque etc. Multilingual names.';
COMMENT ON TABLE geofence_events        IS 'Log of arrive/leave events for saved places';
COMMENT ON COLUMN location_pings.source IS 'gps=device GPS, network=cell-tower, sms_fallback=SMS LOCATE command response';

COMMIT;
