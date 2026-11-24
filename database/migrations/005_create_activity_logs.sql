-- ============================================================
-- NurtureNet Migration 005: activity_logs
-- Every web visit, app open, search query, and blocked attempt.
-- Partitioned by month for performance — this table grows fast.
-- Supports 30-day (basic) and 90-day (pro) retention.
-- ============================================================

BEGIN;

CREATE TYPE activity_type AS ENUM (
    'web_visit',        -- child visited a website
    'web_blocked',      -- website blocked by filter
    'app_open',         -- app launched on device
    'app_blocked',      -- app blocked by rules
    'search_query',     -- search term entered
    'search_flagged',   -- AI flagged a search as concerning
    'youtube_watch',    -- YouTube video watched
    'youtube_searched', -- YouTube search term
    'app_installed',    -- new app installed on device
    'app_uninstalled'   -- app removed
);

-- Partitioned parent table
CREATE TABLE activity_logs (
    id              BIGSERIAL,
    child_id        UUID            NOT NULL,  -- FK enforced at app layer (partitioned tables limit FKs)
    device_id       UUID            NOT NULL,
    activity_type   activity_type   NOT NULL,
    app_package     VARCHAR(200),
    app_name        VARCHAR(100),
    url             TEXT,                      -- visited/blocked URL (hashed for privacy in pro)
    url_domain      VARCHAR(200),              -- extracted domain for reporting
    search_term     TEXT,                      -- search query (encrypted at rest)
    category        VARCHAR(60),               -- content category that triggered block
    duration_secs   SMALLINT,                  -- how long app/site was used
    was_blocked     BOOLEAN         NOT NULL DEFAULT FALSE,
    threat_score    SMALLINT,                  -- AI threat score if search_flagged
    metadata        JSONB,                     -- flexible: video title, channel, etc.
    logged_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, logged_at)
) PARTITION BY RANGE (logged_at);

-- Create monthly partitions for 2 years ahead
-- In production, use pg_partman to auto-create future partitions
CREATE TABLE activity_logs_2027_01 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE activity_logs_2027_02 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE activity_logs_2027_03 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE activity_logs_2027_04 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE activity_logs_2027_05 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE activity_logs_2027_06 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
CREATE TABLE activity_logs_2027_07 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
CREATE TABLE activity_logs_2027_08 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
CREATE TABLE activity_logs_2027_09 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
CREATE TABLE activity_logs_2027_10 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
CREATE TABLE activity_logs_2027_11 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
CREATE TABLE activity_logs_2027_12 PARTITION OF activity_logs
    FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');
CREATE TABLE activity_logs_2028_01 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-01-01') TO ('2028-02-01');
CREATE TABLE activity_logs_2028_02 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-02-01') TO ('2028-03-01');
CREATE TABLE activity_logs_2028_03 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-03-01') TO ('2028-04-01');
CREATE TABLE activity_logs_2028_04 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-04-01') TO ('2028-05-01');
CREATE TABLE activity_logs_2028_05 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-05-01') TO ('2028-06-01');
CREATE TABLE activity_logs_2028_06 PARTITION OF activity_logs
    FOR VALUES FROM ('2028-06-01') TO ('2028-07-01');

-- Indexes on each partition (propagates to all partitions automatically)
CREATE INDEX idx_activity_child_date    ON activity_logs (child_id, logged_at DESC);
CREATE INDEX idx_activity_type          ON activity_logs (activity_type, logged_at DESC);
CREATE INDEX idx_activity_blocked       ON activity_logs (child_id, was_blocked, logged_at DESC)
    WHERE was_blocked = TRUE;
CREATE INDEX idx_activity_domain        ON activity_logs (url_domain) WHERE url_domain IS NOT NULL;

-- Data retention function: delete logs older than retention_days
-- Called nightly by pg_cron: basic=30 days, pro=90 days
CREATE OR REPLACE FUNCTION purge_old_activity_logs()
RETURNS void AS $$
BEGIN
    -- Delete free/basic plan logs older than 30 days
    DELETE FROM activity_logs al
    USING children c
    JOIN parents p ON p.id = c.parent_id
    WHERE al.child_id = c.id
      AND p.subscription_plan IN ('free', 'basic')
      AND al.logged_at < NOW() - INTERVAL '30 days';

    -- Delete pro plan logs older than 90 days
    DELETE FROM activity_logs al
    USING children c
    JOIN parents p ON p.id = c.parent_id
    WHERE al.child_id = c.id
      AND p.subscription_plan = 'pro'
      AND al.logged_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE activity_logs IS 'All child device activity — web, apps, searches. Partitioned monthly for performance.';
COMMENT ON COLUMN activity_logs.search_term IS 'Encrypted at rest using pgcrypto for NDPR compliance';
COMMENT ON COLUMN activity_logs.metadata IS 'Flexible JSONB: {"video_title":"...", "channel":"...", "duration_secs":120}';

COMMIT;
