-- ============================================================
-- NurtureNet — Development Seed Data
-- Realistic Nigerian test data for local development.
-- Run AFTER all 13 migrations.
-- Usage: psql -U nurture -d nurturenet -f seeds/dev_seed.sql
-- ============================================================

BEGIN;

-- ============================================================
-- TEST PARENTS
-- ============================================================
INSERT INTO parents (id, full_name, phone, email, password_hash, preferred_language, subscription_plan, is_verified)
VALUES
-- Yoruba-speaking parent (Lagos, Pro plan)
('a1000000-0000-0000-0000-000000000001',
 'Mrs. Adeyemi Folake',
 '+2348012345678',
 'folake.adeyemi@email.com',
 '$2b$12$HASHED_PASSWORD_HERE',     -- bcrypt hash of 'password123'
 'yo', 'pro', TRUE),

-- Hausa-speaking parent (Kano, Basic plan)
('a1000000-0000-0000-0000-000000000002',
 'Alhaji Musa Ibrahim',
 '+2348023456789',
 'musa.ibrahim@email.com',
 '$2b$12$HASHED_PASSWORD_HERE',
 'ha', 'basic', TRUE),

-- English-speaking parent (Abuja, Free plan)
('a1000000-0000-0000-0000-000000000003',
 'Mr. Chukwuemeka Obi',
 '+2348034567890',
 'emeka.obi@email.com',
 '$2b$12$HASHED_PASSWORD_HERE',
 'en', 'free', TRUE),

-- Igbo-speaking parent (Enugu, Pro plan)
('a1000000-0000-0000-0000-000000000004',
 'Mrs. Ngozi Eze',
 '+2348045678901',
 'ngozi.eze@email.com',
 '$2b$12$HASHED_PASSWORD_HERE',
 'ig', 'pro', TRUE),

-- Pidgin-speaking parent (Port Harcourt, Basic plan)
('a1000000-0000-0000-0000-000000000005',
 'Mr. Tamuno Briggs',
 '+2348056789012',
 NULL,                               -- phone-only registration
 '$2b$12$HASHED_PASSWORD_HERE',
 'pc', 'basic', TRUE);

-- ============================================================
-- TEST CHILDREN
-- ============================================================
INSERT INTO children (id, parent_id, full_name, date_of_birth, avatar_emoji)
VALUES
-- Mrs. Adeyemi's children (Yoruba, Lagos)
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'Emeka Adeyemi', '2012-03-15', '👦'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
 'Amara Adeyemi', '2016-07-22', '👧'),

-- Alhaji Ibrahim's children (Hausa, Kano)
('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
 'Fatima Ibrahim', '2013-11-08', '👧'),
('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002',
 'Abdullahi Ibrahim', '2010-05-20', '👦'),

-- Mr. Obi's child (English, Abuja)
('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003',
 'David Obi', '2014-09-01', '👦'),

-- Mrs. Eze's children (Igbo, Enugu)
('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004',
 'Chidi Eze', '2011-04-17', '👦'),
('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004',
 'Adaeze Eze', '2015-12-03', '👧');

-- ============================================================
-- TEST DEVICES
-- ============================================================
INSERT INTO devices (id, child_id, device_name, device_model, platform, status, is_primary, admin_enabled)
VALUES
('d1000000-0000-0000-0000-000000000001',
 'c1000000-0000-0000-0000-000000000001',
 'Emeka''s Phone', 'Tecno Spark 10C', 'android', 'active', TRUE, TRUE),

('d1000000-0000-0000-0000-000000000002',
 'c1000000-0000-0000-0000-000000000002',
 'Amara''s Tablet', 'Itel A56', 'android', 'active', TRUE, FALSE),

('d1000000-0000-0000-0000-000000000003',
 'c1000000-0000-0000-0000-000000000003',
 'Fatima''s Phone', 'Infinix Hot 30', 'android', 'active', TRUE, TRUE),

('d1000000-0000-0000-0000-000000000004',
 'c1000000-0000-0000-0000-000000000004',
 'Abdullahi''s Phone', 'Samsung A14', 'android', 'active', TRUE, TRUE),

('d1000000-0000-0000-0000-000000000005',
 'c1000000-0000-0000-0000-000000000005',
 'David''s Phone', 'Tecno Camon 20', 'android', 'active', TRUE, FALSE);

-- ============================================================
-- SCREEN LIMITS
-- ============================================================
INSERT INTO screen_limits (child_id, weekday_limit_mins, weekend_limit_mins,
    school_lock_enabled, bedtime_lock_enabled, bedtime_start)
VALUES
('c1000000-0000-0000-0000-000000000001', 120, 180, TRUE, TRUE, '21:00'),
('c1000000-0000-0000-0000-000000000002', 90,  150, TRUE, TRUE, '20:00'),
('c1000000-0000-0000-0000-000000000003', 120, 180, TRUE, TRUE, '21:00'),
('c1000000-0000-0000-0000-000000000004', 180, 240, TRUE, TRUE, '22:00'),
('c1000000-0000-0000-0000-000000000005', 120, 180, FALSE, TRUE, '21:00');

-- ============================================================
-- PRAYER SCHEDULES (Hausa family in Kano — Islamic)
-- ============================================================
INSERT INTO prayer_schedules (child_id, service_type, is_enabled,
    city, state, calculation_method, locked_prayers, include_jumuah)
VALUES
('c1000000-0000-0000-0000-000000000003',
 'islamic', TRUE, 'Kano', 'Kano State',
 'Muslim_World_League', '{fajr,dhuhr,asr,maghrib,isha}', TRUE),

('c1000000-0000-0000-0000-000000000004',
 'islamic', TRUE, 'Kano', 'Kano State',
 'Muslim_World_League', '{fajr,dhuhr,asr,maghrib,isha}', TRUE);

-- ============================================================
-- EXAM MODES (Abdullahi — WAEC candidate 2027)
-- ============================================================
INSERT INTO exam_modes (child_id, exam_body, exam_year, start_date, end_date,
    is_active, block_social_media, block_gaming)
VALUES
('c1000000-0000-0000-0000-000000000004',
 'WAEC', 2027, '2027-05-03', '2027-06-18',
 FALSE, TRUE, TRUE);

-- ============================================================
-- SAVED PLACES
-- ============================================================
INSERT INTO saved_places (parent_id, name, name_yo, latitude, longitude,
    radius_metres, icon, alert_on_arrive, alert_on_leave)
VALUES
-- Mrs. Adeyemi's places (Lagos)
('a1000000-0000-0000-0000-000000000001',
 'Home', 'Ilé', 6.5244, 3.3792, 100, '🏠', FALSE, TRUE),
('a1000000-0000-0000-0000-000000000001',
 'School', 'Ilé-ẹ̀kọ́', 6.5100, 3.3600, 150, '🏫', TRUE, TRUE),
('a1000000-0000-0000-0000-000000000001',
 'Church', 'Ṣọ́ọ̀sì', 6.5300, 3.3900, 100, '⛪', TRUE, FALSE),

-- Alhaji Ibrahim's places (Kano)
('a1000000-0000-0000-0000-000000000002',
 'Home', 'Gida', 12.0022, 8.5920, 100, '🏠', FALSE, TRUE),
('a1000000-0000-0000-0000-000000000002',
 'School', 'Makaranta', 12.0100, 8.5800, 150, '🏫', TRUE, TRUE),
('a1000000-0000-0000-0000-000000000002',
 'Mosque', 'Masallaci', 11.9950, 8.5950, 80, '🕌', TRUE, FALSE);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
INSERT INTO subscriptions (parent_id, plan, status, provider, payment_method,
    amount_ngn, billing_cycle, current_period_start, current_period_end)
VALUES
('a1000000-0000-0000-0000-000000000001',
 'pro', 'active', 'paystack', 'card',
 500000, 'monthly', NOW(), NOW() + INTERVAL '1 month'),

('a1000000-0000-0000-0000-000000000002',
 'basic', 'active', 'paystack', 'mobile_money',
 250000, 'monthly', NOW(), NOW() + INTERVAL '1 month'),

('a1000000-0000-0000-0000-000000000003',
 'free', 'active', NULL, NULL,
 0, 'monthly', NOW(), NULL),

('a1000000-0000-0000-0000-000000000004',
 'pro', 'active', 'flutterwave', 'bank_transfer',
 500000, 'monthly', NOW(), NOW() + INTERVAL '1 month'),

('a1000000-0000-0000-0000-000000000005',
 'basic', 'active', 'paystack', 'ussd',
 250000, 'monthly', NOW(), NOW() + INTERVAL '1 month');

-- ============================================================
-- SAMPLE ALERTS
-- ============================================================
INSERT INTO alerts (parent_id, child_id, alert_type, severity,
    title_en, title_yo, title_ha,
    body_en, body_yo, body_ha,
    push_sent, metadata)
VALUES
('a1000000-0000-0000-0000-000000000001',
 'c1000000-0000-0000-0000-000000000001',
 'screen_time_exceeded', 'warning',
 'Screen Time Limit Reached',
 'Àkókò Iboju Ti Parí',
 'Lokacin Allon Ya Ƙare',
 'Emeka has used all 2 hours of screen time for today.',
 'Emeka ti lo gbogbo wakati 2 akoko iboju fun oni.',
 'Emeka ya yi amfani da dukkan awanni 2 na lokacin allon yau.',
 TRUE,
 '{"minutes_used": 120, "limit": 120, "app": "com.google.youtube"}'
),
('a1000000-0000-0000-0000-000000000002',
 'c1000000-0000-0000-0000-000000000003',
 'geofence_arrive', 'info',
 'Fatima Arrived at School',
 NULL,
 'Fatima Ta Isa Makaranta',
 'Fatima has arrived at School.',
 NULL,
 'Fatima ta isa makaranta a 8:03 AM.',
 TRUE,
 '{"place_name": "School", "lat": 12.0100, "lng": 8.5800, "time": "08:03"}'
);

COMMIT;

\echo '✅ Dev seed data loaded successfully!'
\echo '   5 test parents | 7 children | 5 devices'
\echo '   Prayer schedules: Kano family (Hausa)'
\echo '   Exam mode: Abdullahi Ibrahim (WAEC 2027)'
\echo '   Saved places: Lagos + Kano families'
\echo '   Sample alerts in Yoruba + Hausa'
