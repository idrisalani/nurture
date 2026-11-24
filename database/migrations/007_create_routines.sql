-- ============================================================
-- NurtureNet Migration 007: routines
-- Custom scheduled rules — study time, bedtime, mealtime,
-- weekend mode. Matches Qustodio's "custom routines" feature.
-- Each routine defines a time window + what action to take.
-- ============================================================

BEGIN;

CREATE TYPE routine_action AS ENUM (
    'block_all',            -- block all internet/apps
    'block_social',         -- block social media only
    'block_gaming',         -- block games only
    'block_categories',     -- block specific categories (see blocked_categories)
    'allow_only',           -- only allow apps in allowed_app_ids
    'educational_only'      -- only allow educational apps + Quranic apps
);

CREATE TABLE routines (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id            UUID            NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    name                VARCHAR(100)    NOT NULL,       -- e.g. "Study Time", "Salah Break"
    name_ha             VARCHAR(100),                   -- Hausa
    name_yo             VARCHAR(100),                   -- Yoruba
    name_ig             VARCHAR(100),                   -- Igbo
    name_pc             VARCHAR(100),                   -- Pidgin
    icon                VARCHAR(10)     DEFAULT '📅',   -- emoji
    action              routine_action  NOT NULL DEFAULT 'block_social',
    days_of_week        SMALLINT[]      NOT NULL,       -- ISO: 1=Mon … 7=Sun
    start_time          TIME            NOT NULL,
    end_time            TIME            NOT NULL,
    blocked_categories  TEXT[]          DEFAULT '{}',   -- used when action = block_categories
    allowed_app_ids     TEXT[]          DEFAULT '{}',   -- package names for allow_only
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    color               VARCHAR(7)      DEFAULT '#1D9E75', -- hex color for UI display
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Validate time range
    CONSTRAINT routine_time_order CHECK (start_time < end_time),

    -- At least one day must be selected
    CONSTRAINT routine_has_days CHECK (array_length(days_of_week, 1) > 0)
);

-- Preset routines table — pre-built suggestions parents can one-tap apply
CREATE TABLE routine_presets (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_key          VARCHAR(60)     NOT NULL UNIQUE,    -- e.g. 'waec_study', 'friday_prayers'
    name_en             VARCHAR(100)    NOT NULL,
    name_ha             VARCHAR(100),
    name_yo             VARCHAR(100),
    name_ig             VARCHAR(100),
    name_pc             VARCHAR(100),
    description_en      TEXT,
    icon                VARCHAR(10),
    action              routine_action  NOT NULL,
    days_of_week        SMALLINT[]      NOT NULL,
    start_time          TIME            NOT NULL,
    end_time            TIME            NOT NULL,
    blocked_categories  TEXT[]          DEFAULT '{}',
    allowed_app_ids     TEXT[]          DEFAULT '{}',
    is_africa_specific  BOOLEAN         NOT NULL DEFAULT FALSE,  -- Prayer, WAEC, etc.
    display_order       SMALLINT        NOT NULL DEFAULT 0
);

-- Seed preset routines that show in the app's suggestion carousel
INSERT INTO routine_presets
    (preset_key, name_en, name_ha, name_yo, name_ig, name_pc, description_en, icon,
     action, days_of_week, start_time, end_time, is_africa_specific, display_order)
VALUES
-- School hours
('school_hours', 'School Hours', 'Lokacin Makaranta', 'Àkókò Ilé-ẹ̀kọ́', 'Oge Ulo Akwukwo',
 'School Time', 'Block all apps during school hours', '🏫',
 'block_all', '{1,2,3,4,5}', '08:00', '15:00', FALSE, 1),

-- Bedtime
('bedtime', 'Bedtime', 'Lokacin Barci', 'Àkókò Oorun', 'Oge Ura',
 'Sleep Time', 'No screens after 9pm', '🌙',
 'block_all', '{1,2,3,4,5,6,7}', '21:00', '06:00', FALSE, 2),

-- Study time
('study_time', 'Study Time', 'Lokacin Karatu', 'Àkókò Ẹ̀kọ́', 'Oge Mmuta',
 'Study Time', 'Educational apps only during study hours', '📚',
 'educational_only', '{1,2,3,4,5}', '16:00', '19:00', FALSE, 3),

-- Friday prayers (Jumu'ah) — Africa exclusive
('friday_jumuah', 'Friday Prayers', 'Sallah Jumma''ah', 'Adura Ọjọ Jimọ', 'Ihe Ofufe Friday',
 'Friday Prayer', 'Lock during Jumu''ah prayer time', '🕌',
 'block_all', '{5}', '12:30', '14:30', TRUE, 4),

-- Daily prayers (Salah) — Africa exclusive
('daily_salah', 'Prayer Times', 'Lokacin Sallah', 'Àkókò Adura', 'Oge Ekpere',
 'Prayer Times', 'Block during Islamic prayer times', '🙏',
 'block_all', '{1,2,3,4,5,6,7}', '05:00', '05:30', TRUE, 5),

-- WAEC Study mode — Africa exclusive
('waec_study', 'WAEC Prep Mode', 'Shirye-shiryen WAEC', 'Ìmúrasílẹ̀ WAEC', 'Nkwado WAEC',
 'WAEC Prep', 'Exam prep: educational apps only, no social media', '📝',
 'educational_only', '{1,2,3,4,5,6,7}', '07:00', '22:00', TRUE, 6),

-- Mealtime
('mealtime', 'Mealtime', 'Lokacin Abinci', 'Àkókò Jíjẹ', 'Oge Oriri',
 'Mealtime', 'No phones during family meals', '🍽️',
 'block_all', '{1,2,3,4,5,6,7}', '19:00', '20:00', FALSE, 7),

-- Sunday church — Africa exclusive
('sunday_church', 'Sunday Service', 'Coci Lahadi', 'Ijọsìn Ọjọ Àìkú', 'Sunday Service',
 'Sunday Service', 'Lock during church service hours', '⛪',
 'block_all', '{7}', '09:00', '13:00', TRUE, 8);

-- Indexes
CREATE INDEX idx_routines_child_active ON routines (child_id, is_active);
CREATE INDEX idx_routines_days         ON routines USING GIN (days_of_week);
CREATE INDEX idx_presets_africa        ON routine_presets (is_africa_specific, display_order);

CREATE TRIGGER set_routines_updated_at
    BEFORE UPDATE ON routines
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE routines           IS 'Custom scheduled rules per child — study, bedtime, prayer, meals';
COMMENT ON TABLE routine_presets    IS 'Pre-built routine suggestions shown in app. Africa-specific ones highlighted.';
COMMENT ON COLUMN routines.name_ha  IS 'Hausa translation of routine name — displayed when parent language = ha';

COMMIT;
