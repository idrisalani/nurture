-- ============================================================
-- NurtureNet Migration 010: exam_modes  [AFRICA EXCLUSIVE]
-- One-tap WAEC / JAMB / NECO / NABTEB exam season mode.
-- Blocks social media & gaming, allows only educational apps.
-- Pre-loaded Nigerian exam calendar auto-suggests activation.
-- ============================================================

BEGIN;

CREATE TYPE exam_body AS ENUM (
    'WAEC',     -- West African Examinations Council (May-June)
    'JAMB',     -- Joint Admissions and Matriculation Board (March-April)
    'NECO',     -- National Examinations Council (June-August)
    'NABTEB',   -- National Business and Technical Examinations Board
    'GCE',      -- General Certificate of Education (Oct-Nov)
    'CUSTOM'    -- Parent-defined exam period
);

-- Per-child exam mode configuration
CREATE TABLE exam_modes (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id                UUID        NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    exam_body               exam_body   NOT NULL DEFAULT 'WAEC',
    exam_year               SMALLINT    NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::SMALLINT,
    custom_name             VARCHAR(100),                   -- for CUSTOM type

    -- Activation window
    start_date              DATE        NOT NULL,
    end_date                DATE        NOT NULL,
    is_active               BOOLEAN     NOT NULL DEFAULT FALSE,

    -- What to block
    block_social_media      BOOLEAN     NOT NULL DEFAULT TRUE,
    block_gaming            BOOLEAN     NOT NULL DEFAULT TRUE,
    block_entertainment     BOOLEAN     NOT NULL DEFAULT TRUE,  -- YouTube, TikTok, etc.
    block_messaging         BOOLEAN     NOT NULL DEFAULT FALSE, -- WhatsApp: parent decides

    -- Allowed apps (whitelist)
    allowed_app_packages    TEXT[]      DEFAULT '{}',
    -- Default whitelist includes: uLesson, Passnownow, Khan Academy,
    -- Google Classroom, Quran apps, Bible apps, Calculator, Clock

    -- Study hours (stricter lock during study time)
    study_hours_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
    study_start             TIME        DEFAULT '08:00',
    study_end               TIME        DEFAULT '20:00',

    -- Reminders
    reminder_days_before    SMALLINT    NOT NULL DEFAULT 7, -- remind parent N days before start
    reminder_sent           BOOLEAN     NOT NULL DEFAULT FALSE,
    activated_at            TIMESTAMPTZ,
    deactivated_at          TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT exam_date_order CHECK (start_date <= end_date),
    UNIQUE (child_id, exam_body, exam_year)             -- one config per exam per year per child
);

-- Nigerian exam calendar — updated annually by NurtureNet team
-- This powers the "suggested exam dates" in the app UI
CREATE TABLE nigerian_exam_calendar (
    id              SERIAL      PRIMARY KEY,
    exam_year       SMALLINT    NOT NULL,
    exam_body       exam_body   NOT NULL,
    exam_name       TEXT        NOT NULL,           -- "WAEC SSCE (May/June)"
    typical_start   VARCHAR(20) NOT NULL,           -- "May 1" — approximate
    typical_end     VARCHAR(20) NOT NULL,           -- "June 15" — approximate
    start_date      DATE,                           -- exact date when confirmed
    end_date        DATE,                           -- exact date when confirmed
    is_confirmed    BOOLEAN     NOT NULL DEFAULT FALSE,
    notes_en        TEXT,
    notes_ha        TEXT,
    notes_yo        TEXT,
    notes_ig        TEXT,
    display_order   SMALLINT    DEFAULT 0,

    UNIQUE (exam_year, exam_name)   -- JAMB has two sittings (UTME and Direct Entry)
);

-- Pre-seed 2027 exam calendar (approximate — updated when official dates released)
INSERT INTO nigerian_exam_calendar
    (exam_year, exam_body, exam_name, typical_start, typical_end, is_confirmed, notes_en, display_order)
VALUES
(2027, 'WAEC',   'WAEC SSCE (May/June 2027)',   'May 3',    'June 18', FALSE,
    'Register at www.waec.org.ng. Results released ~August.', 1),
(2027, 'JAMB',   'JAMB UTME 2027',              'March 15', 'April 5', FALSE,
    'Register at portal.jamb.org.ng. 4 subjects tested.', 2),
(2027, 'NECO',   'NECO SSCE 2027',              'June 20',  'August 1', FALSE,
    'Register at neco.gov.ng. Similar to WAEC format.', 3),
(2027, 'NABTEB', 'NABTEB NBE/NAC 2027',         'May 10',   'May 30', FALSE,
    'Technical and business education exams.', 4),
(2027, 'GCE',    'WAEC GCE (Oct/Nov 2027)',      'October 5','November 20', FALSE,
    'Second-sitting option for WAEC. Register at waec.org.ng.', 5),
(2027, 'JAMB',   'JAMB DE 2027',                'March 20', 'March 25', FALSE,
    'Direct Entry for candidates with OND/NCE/Diploma.', 6);

-- Allowed apps whitelist for exam mode — curated by NurtureNet
-- These are auto-added to allowed_app_packages when exam mode activates
CREATE TABLE exam_mode_whitelist (
    id              SERIAL          PRIMARY KEY,
    app_package     VARCHAR(200)    NOT NULL UNIQUE,
    app_name        VARCHAR(100)    NOT NULL,
    category        VARCHAR(60)     NOT NULL,   -- 'education', 'quran', 'bible', 'utility'
    is_default      BOOLEAN         NOT NULL DEFAULT TRUE,  -- auto-added to all exam modes
    icon_url        TEXT,
    notes           TEXT
);

INSERT INTO exam_mode_whitelist (app_package, app_name, category, is_default) VALUES
('ng.com.ulesson',              'uLesson',              'education', TRUE),
('com.passnownow.student',      'Passnownow',           'education', TRUE),
('org.khanacademy.android',     'Khan Academy',         'education', TRUE),
('com.google.android.apps.classroom', 'Google Classroom', 'education', TRUE),
('com.duolingo',                'Duolingo',             'education', FALSE),
('com.android.calculator2',     'Calculator',           'utility',   TRUE),
('com.google.android.deskclock','Clock / Alarm',        'utility',   TRUE),
('com.quran.labs.androidquran', 'Quran for Android',   'quran',     TRUE),
('com.greentech.quran',         'Al-Quran (Iqra)',     'quran',     FALSE),
('com.sirma.mobile.bible.android', 'YouVersion Bible', 'bible',     TRUE),
('com.lifechurch.youversionbibleapp', 'Bible App',     'bible',     FALSE),
('com.grammarly.android.keyboard', 'Grammarly',        'education', FALSE);

-- Indexes
CREATE INDEX idx_exam_modes_child       ON exam_modes (child_id);
CREATE INDEX idx_exam_modes_active      ON exam_modes (is_active, start_date, end_date)
    WHERE is_active = TRUE;
CREATE INDEX idx_exam_calendar_year     ON nigerian_exam_calendar (exam_year, display_order);

CREATE TRIGGER set_exam_modes_updated_at
    BEFORE UPDATE ON exam_modes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE exam_modes              IS '[AFRICA EXCLUSIVE] WAEC/JAMB/NECO exam season mode per child';
COMMENT ON TABLE nigerian_exam_calendar  IS 'Official and approximate Nigerian exam dates — updated annually by NurtureNet';
COMMENT ON TABLE exam_mode_whitelist     IS 'Pre-approved apps that stay accessible during exam mode (uLesson, Quran, etc.)';

COMMIT;
