-- ============================================================
-- NurtureNet Migration 009: prayer_schedules  [AFRICA EXCLUSIVE]
-- Auto-lock child devices during Islamic Salah times or
-- Christian Sunday service. No other parental control app
-- in the world offers this feature.
-- Prayer times fetched from Aladhan.com API, cached in Redis.
-- ============================================================

BEGIN;

CREATE TYPE prayer_calculation AS ENUM (
    'Muslim_World_League',      -- Global standard
    'Egyptian',                 -- Egyptian General Authority
    'Karachi',                  -- University of Islamic Sciences, Karachi
    'ISNA',                     -- Islamic Society of North America
    'Gulf',                     -- Gulf Region
    'Algeria',                  -- Algeria
    'Kuwait',                   -- Kuwait
    'Qatar',                    -- Qatar
    'Singapore',                -- Singapore
    'Turkey',                   -- Turkey
    'Tehran'                    -- Institute of Geophysics, Tehran
);

CREATE TYPE prayer_name AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah');
CREATE TYPE service_type AS ENUM ('islamic', 'christian', 'both');

CREATE TABLE prayer_schedules (
    id                      UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id                UUID                NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
    service_type            service_type        NOT NULL DEFAULT 'islamic',
    is_enabled              BOOLEAN             NOT NULL DEFAULT FALSE,

    -- Islamic prayer settings
    city                    VARCHAR(100),                   -- e.g. "Kano", "Lagos"
    state                   VARCHAR(60),                    -- e.g. "Kano State"
    country                 VARCHAR(60)         DEFAULT 'Nigeria',
    latitude                DECIMAL(9,6),                   -- for precise calculation
    longitude               DECIMAL(9,6),
    calculation_method      prayer_calculation  DEFAULT 'Muslim_World_League',
    locked_prayers          prayer_name[]       NOT NULL DEFAULT '{fajr,dhuhr,asr,maghrib,isha}',
    lock_buffer_mins        SMALLINT            NOT NULL DEFAULT 15, -- lock 15 mins before & after
    include_jumuah          BOOLEAN             NOT NULL DEFAULT TRUE,  -- extra lock on Fridays
    jumuah_start            TIME                DEFAULT '12:30',
    jumuah_end              TIME                DEFAULT '14:00',

    -- Christian service settings
    christian_lock_enabled  BOOLEAN             NOT NULL DEFAULT FALSE,
    christian_days          SMALLINT[]          DEFAULT '{7}',  -- 7 = Sunday
    christian_start         TIME                DEFAULT '09:00',
    christian_end           TIME                DEFAULT '13:00',

    -- Override: child can request unlock (parent gets notified)
    allow_child_request     BOOLEAN             NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Nigerian cities with pre-loaded coordinates for Aladhan API
-- Parents just pick their city — no need to enter coordinates
CREATE TABLE nigerian_cities (
    id          SERIAL          PRIMARY KEY,
    city        VARCHAR(100)    NOT NULL,
    state       VARCHAR(60)     NOT NULL,
    latitude    DECIMAL(9,6)    NOT NULL,
    longitude   DECIMAL(9,6)    NOT NULL,
    region      VARCHAR(20)     NOT NULL,    -- north, south_west, south_east, south_south
    is_popular  BOOLEAN         NOT NULL DEFAULT FALSE  -- show at top of picker
);

-- Pre-seed major Nigerian cities
INSERT INTO nigerian_cities (city, state, latitude, longitude, region, is_popular) VALUES
('Lagos',        'Lagos State',          6.5244,  3.3792,  'south_west',  TRUE),
('Abuja',        'FCT',                  9.0765,  7.3986,  'north',       TRUE),
('Kano',         'Kano State',          12.0022, 8.5920,   'north',       TRUE),
('Ibadan',       'Oyo State',            7.3775,  3.9470,  'south_west',  TRUE),
('Kaduna',       'Kaduna State',        10.5105,  7.4165,  'north',       TRUE),
('Port Harcourt','Rivers State',         4.8156,  7.0498,  'south_south', TRUE),
('Benin City',   'Edo State',            6.3350,  5.6218,  'south_south', TRUE),
('Maiduguri',    'Borno State',         11.8311, 13.1510,  'north',       TRUE),
('Zaria',        'Kaduna State',        11.0956,  7.7197,  'north',       FALSE),
('Aba',          'Abia State',           5.1066,  7.3667,  'south_east',  FALSE),
('Jos',          'Plateau State',        9.8965,  8.8583,  'north',       FALSE),
('Ilorin',       'Kwara State',          8.4966,  4.5421,  'north',       FALSE),
('Onitsha',      'Anambra State',        6.1455,  6.7866,  'south_east',  FALSE),
('Warri',        'Delta State',          5.5167,  5.7500,  'south_south', FALSE),
('Sokoto',       'Sokoto State',        13.0522,  5.2326,  'north',       FALSE),
('Enugu',        'Enugu State',          6.4584,  7.5464,  'south_east',  FALSE),
('Abeokuta',     'Ogun State',           7.1557,  3.3456,  'south_west',  FALSE),
('Owerri',       'Imo State',            5.4836,  7.0333,  'south_east',  FALSE),
('Calabar',      'Cross River State',    4.9517,  8.3220,  'south_south', FALSE),
('Akure',        'Ondo State',           7.2526,  5.1936,  'south_west',  FALSE),
('Bauchi',       'Bauchi State',        10.3158,  9.8442,  'north',       FALSE),
('Makurdi',      'Benue State',          7.7296,  8.5391,  'north',       FALSE),
('Damaturu',     'Yobe State',          11.7479, 11.9688,  'north',       FALSE),
('Gusau',        'Zamfara State',       12.1704,  6.6635,  'north',       FALSE),
('Lafia',        'Nasarawa State',       8.4921,  8.5144,  'north',       FALSE);

-- Prayer time cache log (to know what's cached in Redis)
-- Redis key: prayer:{city_slug}:{date} TTL: 24hrs
CREATE TABLE prayer_cache_log (
    id          BIGSERIAL   PRIMARY KEY,
    city        VARCHAR(100) NOT NULL,
    cache_date  DATE        NOT NULL,
    fajr        TIME        NOT NULL,
    dhuhr       TIME        NOT NULL,
    asr         TIME        NOT NULL,
    maghrib     TIME        NOT NULL,
    isha        TIME        NOT NULL,
    sunrise     TIME        NOT NULL,
    cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (city, cache_date)
);

-- Indexes
CREATE INDEX idx_prayer_child       ON prayer_schedules (child_id);
CREATE INDEX idx_prayer_enabled     ON prayer_schedules (is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX idx_cities_region      ON nigerian_cities (region, is_popular DESC);
CREATE INDEX idx_cities_name        ON nigerian_cities (city);
CREATE INDEX idx_prayer_cache_date  ON prayer_cache_log (city, cache_date);

CREATE TRIGGER set_prayer_updated_at
    BEFORE UPDATE ON prayer_schedules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE prayer_schedules   IS '[AFRICA EXCLUSIVE] Auto-lock devices during Islamic Salah or Christian service times';
COMMENT ON TABLE nigerian_cities    IS 'Pre-loaded Nigerian cities for prayer time city picker — no coordinates needed from user';
COMMENT ON TABLE prayer_cache_log   IS 'Mirrors Redis prayer time cache for auditing and fallback';
COMMENT ON COLUMN prayer_schedules.lock_buffer_mins IS 'Lock device 15 mins before and keep locked 15 mins after prayer ends';

COMMIT;
