-- ============================================================
-- NurtureNet Migration 012: threat_logs  [AI LAYER]
-- Every AI threat scan result — web searches, social messages,
-- YouTube searches. Powered by Claude API with Nigerian NLP.
-- Results cached in Redis to avoid re-scanning same content.
-- ============================================================

BEGIN;

CREATE TYPE threat_category AS ENUM (
    'grooming',         -- adult attempting inappropriate contact with child
    'bullying',         -- cyberbullying / harassment
    'drugs',            -- drug references or solicitation
    'violence',         -- threats or violent content
    'self_harm',        -- self-harm or suicidal ideation
    'gambling',         -- gambling solicitation
    'radicalization',   -- extremist content
    'explicit_content', -- sexual/pornographic references
    'scam',             -- fraud / 419 / financial scam (common in Nigeria)
    'unknown'           -- flagged but category unclear
);

CREATE TYPE scan_source AS ENUM (
    'web_search',       -- search query on browser
    'youtube_search',   -- YouTube search term
    'social_message',   -- message on social platform
    'social_post',      -- public post/comment
    'app_chat',         -- in-app messaging
    'sms_content'       -- SMS monitoring (future)
);

CREATE TABLE threat_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id            UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    device_id           UUID            REFERENCES devices(id) ON DELETE SET NULL,

    -- Source of scanned content
    scan_source         scan_source     NOT NULL,
    platform            social_platform,        -- NULL if web search
    content_hash        VARCHAR(64)     NOT NULL UNIQUE, -- SHA-256 — dedup key for Redis

    -- Content (stored encrypted, purged after 30 days per NDPR)
    content_preview     TEXT,           -- first 100 chars, encrypted
    content_length      SMALLINT,       -- chars in original content

    -- Language detection result
    language_detected   language_code   NOT NULL DEFAULT 'en',
    language_confidence DECIMAL(4,3),   -- 0.000 to 1.000

    -- AI analysis result
    threat_score        SMALLINT        NOT NULL,   -- 0-100
    threat_categories   threat_category[],          -- one or more categories
    flagged_phrases     TEXT[]          DEFAULT '{}', -- specific phrases that triggered flag
    ai_model            VARCHAR(60)     NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    ai_response_ms      SMALLINT,                   -- API latency for monitoring
    ai_tokens_used      SMALLINT,                   -- for cost tracking

    -- Alert outcome
    alert_triggered     BOOLEAN         NOT NULL DEFAULT FALSE,
    alert_id            UUID,           -- FK to alerts.id if alert was sent
    parent_notified_at  TIMESTAMPTZ,

    -- Investigation
    reviewed_by_parent  BOOLEAN         NOT NULL DEFAULT FALSE,
    parent_marked_safe  BOOLEAN,        -- TRUE = parent dismissed as false positive
    parent_note         TEXT,           -- parent's comment on the threat

    -- Timestamps
    scanned_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    content_purge_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

-- AI model performance tracking (for monitoring & cost management)
CREATE TABLE ai_scan_stats (
    id              BIGSERIAL   PRIMARY KEY,
    scan_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
    model           VARCHAR(60) NOT NULL,
    total_scans     INT         NOT NULL DEFAULT 0,
    total_tokens    INT         NOT NULL DEFAULT 0,
    total_cost_usd  DECIMAL(10,6) NOT NULL DEFAULT 0,
    avg_latency_ms  SMALLINT,
    threats_found   INT         NOT NULL DEFAULT 0,
    alerts_sent     INT         NOT NULL DEFAULT 0,
    false_positives INT         NOT NULL DEFAULT 0,

    UNIQUE (scan_date, model)
);

-- Scheduled: purge encrypted content after 30 days (keep metadata)
CREATE OR REPLACE FUNCTION purge_threat_content()
RETURNS void AS $$
BEGIN
    UPDATE threat_logs
    SET content_preview = '[PURGED - NDPR COMPLIANCE]',
        flagged_phrases = '{}'
    WHERE content_purge_at <= NOW()
      AND content_preview != '[PURGED - NDPR COMPLIANCE]';
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_threat_child_date      ON threat_logs (child_id, scanned_at DESC);
CREATE INDEX idx_threat_score_high      ON threat_logs (child_id, threat_score DESC)
    WHERE threat_score >= 40;
CREATE INDEX idx_threat_unreviewed      ON threat_logs (child_id, alert_triggered)
    WHERE reviewed_by_parent = FALSE AND threat_score >= 70;
CREATE INDEX idx_threat_hash            ON threat_logs (content_hash);
CREATE INDEX idx_threat_purge           ON threat_logs (content_purge_at)
    WHERE content_preview != '[PURGED - NDPR COMPLIANCE]';
CREATE INDEX idx_scan_stats_date        ON ai_scan_stats (scan_date DESC, model);

COMMENT ON TABLE threat_logs        IS 'AI threat scan results — every flagged content item. Content purged after 30 days per NDPR.';
COMMENT ON TABLE ai_scan_stats      IS 'Daily AI API usage stats for cost monitoring and model performance tracking';
COMMENT ON COLUMN threat_logs.content_hash IS 'SHA-256 hash — also used as Redis cache key to avoid re-scanning identical content';
COMMENT ON COLUMN threat_logs.content_purge_at IS 'NDPR compliance: raw content deleted after 30 days, metadata kept for analytics';

COMMIT;
