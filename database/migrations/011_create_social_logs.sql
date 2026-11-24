-- ============================================================
-- NurtureNet Migration 011: social_logs
-- Monitoring of WhatsApp, Instagram, TikTok, YouTube, X/Twitter,
-- and African platforms (Audiomack, Boomplay, Nairaland).
-- Keyword matching + AI threat scoring.
-- Partitioned by month — high volume table.
-- ============================================================

BEGIN;

CREATE TYPE social_platform AS ENUM (
    -- Global platforms
    'whatsapp',
    'instagram',
    'tiktok',
    'youtube',
    'twitter_x',
    'snapchat',
    'facebook',
    'telegram',

    -- African / Nigerian platforms  [AFRICA EXCLUSIVE monitoring]
    'audiomack',        -- Popular Nigerian music streaming
    'boomplay',         -- African music platform
    'nairaland',        -- Nigeria's largest forum
    'afrobeats_radio',  -- Online radio
    'showmax',          -- African streaming (DSTV)

    -- Other
    'sms',
    'phone_calls',
    'other'
);

CREATE TYPE social_event_type AS ENUM (
    'message_sent',
    'message_received',
    'search',
    'video_watched',
    'post_liked',
    'comment_posted',
    'new_contact',
    'call_made',
    'call_received',
    'content_downloaded'
);

-- Social monitoring events (partitioned by month)
CREATE TABLE social_logs (
    id                  BIGSERIAL,
    child_id            UUID            NOT NULL,
    device_id           UUID            NOT NULL,
    platform            social_platform NOT NULL,
    event_type          social_event_type NOT NULL,

    -- Content analysis
    content_preview     TEXT,               -- first 200 chars (hashed for privacy after scan)
    content_hash        VARCHAR(64),        -- SHA-256 of full content — for dedup
    matched_keywords    TEXT[]  DEFAULT '{}',  -- keywords that triggered flag
    language_detected   language_code,      -- which language the content was in

    -- AI threat analysis
    threat_score        SMALLINT,           -- 0-100, NULL if not scanned
    threat_categories   TEXT[]  DEFAULT '{}', -- ['grooming', 'bullying', 'drugs']
    ai_scanned          BOOLEAN DEFAULT FALSE,
    ai_scanned_at       TIMESTAMPTZ,

    -- Contact info (hashed — never store real phone numbers in logs)
    contact_hash        VARCHAR(64),        -- SHA-256 of contact identifier
    is_unknown_contact  BOOLEAN DEFAULT FALSE,  -- contact not in child's original phonebook

    -- Alert status
    alert_triggered     BOOLEAN DEFAULT FALSE,
    alert_id            UUID,               -- FK to alerts table

    -- Nigerian platform specific
    content_type        VARCHAR(30),        -- 'song', 'video', 'post', 'comment', 'thread'
    content_url         TEXT,               -- URL if applicable
    content_title       TEXT,               -- song/video/post title

    logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, logged_at)
) PARTITION BY RANGE (logged_at);

-- Monthly partitions (2 years)
CREATE TABLE social_logs_2027_01 PARTITION OF social_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE social_logs_2027_02 PARTITION OF social_logs FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE social_logs_2027_03 PARTITION OF social_logs FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE social_logs_2027_04 PARTITION OF social_logs FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE social_logs_2027_05 PARTITION OF social_logs FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE social_logs_2027_06 PARTITION OF social_logs FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
CREATE TABLE social_logs_2027_07 PARTITION OF social_logs FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
CREATE TABLE social_logs_2027_08 PARTITION OF social_logs FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
CREATE TABLE social_logs_2027_09 PARTITION OF social_logs FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
CREATE TABLE social_logs_2027_10 PARTITION OF social_logs FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
CREATE TABLE social_logs_2027_11 PARTITION OF social_logs FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
CREATE TABLE social_logs_2027_12 PARTITION OF social_logs FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

-- Keyword watchlists — triggers social monitoring alert
CREATE TABLE social_keywords (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID        NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    keyword         TEXT        NOT NULL,
    language        language_code,              -- NULL = applies to all languages
    is_regex        BOOLEAN     NOT NULL DEFAULT FALSE,
    severity        alert_severity NOT NULL DEFAULT 'warning',
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global Nigerian slang keyword library (maintained by NurtureNet)
-- These are SHARED across all users — not parent-specific
CREATE TABLE nigerian_threat_keywords (
    id              SERIAL      PRIMARY KEY,
    keyword         TEXT        NOT NULL,
    language        language_code NOT NULL,
    category        VARCHAR(60) NOT NULL,   -- grooming, drugs, violence, bullying, self_harm
    severity        alert_severity NOT NULL,
    is_regex        BOOLEAN     NOT NULL DEFAULT FALSE,
    notes           TEXT,                   -- explanation for content team
    added_at        DATE        NOT NULL DEFAULT CURRENT_DATE,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Sample Nigerian threat keywords (team will expand this library)
INSERT INTO nigerian_threat_keywords (keyword, language, category, severity) VALUES
-- Pidgin drug references
('igbo',            'pc', 'drugs',    'warning'),  -- marijuana in Pidgin context
('loud',            'pc', 'drugs',    'warning'),  -- marijuana slang
('shayo',           'pc', 'drugs',    'warning'),  -- alcohol/drunk in Pidgin
('codeine',         'en', 'drugs',    'critical'),
('skuchies',        'pc', 'drugs',    'warning'),

-- Pidgin violence/threat
('go wound you',    'pc', 'violence', 'warning'),
('dem go beat you', 'pc', 'violence', 'warning'),

-- Hausa terms
('magani',          'ha', 'drugs',    'warning'),  -- medicine/drugs

-- Yoruba terms
('oti',             'yo', 'drugs',    'warning'),  -- alcohol in Yoruba context

-- Grooming patterns (English)
('keep secret',     'en', 'grooming', 'critical'),
('don''t tell',     'en', 'grooming', 'critical'),
('special friend',  'en', 'grooming', 'critical'),
('meet me alone',   'en', 'grooming', 'critical');

-- Indexes
CREATE INDEX idx_social_logs_child_date ON social_logs (child_id, logged_at DESC);
CREATE INDEX idx_social_logs_platform   ON social_logs (platform, logged_at DESC);
CREATE INDEX idx_social_logs_flagged    ON social_logs (child_id, threat_score, logged_at DESC)
    WHERE threat_score > 40;
CREATE INDEX idx_social_logs_unscanned  ON social_logs (ai_scanned, logged_at)
    WHERE ai_scanned = FALSE AND content_preview IS NOT NULL;
CREATE INDEX idx_keywords_parent        ON social_keywords (parent_id, is_active);
CREATE INDEX idx_threat_keywords_lang   ON nigerian_threat_keywords (language, category, is_active);

COMMENT ON TABLE social_logs                IS 'Social platform monitoring events. Partitioned monthly.';
COMMENT ON TABLE nigerian_threat_keywords   IS '[AFRICA EXCLUSIVE] Curated library of Nigerian slang threat keywords across 5 languages';
COMMENT ON COLUMN social_logs.content_hash  IS 'SHA-256 of content — allows dedup of NLP scans without storing raw content long-term';
COMMENT ON COLUMN social_logs.contact_hash  IS 'Hashed contact ID — privacy-safe way to track suspicious contacts without storing phone numbers';

COMMIT;
