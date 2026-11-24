-- ============================================================
-- NurtureNet — Master Schema Runner
-- Run this file to execute all 13 migrations in order.
-- Usage: psql -U nurture -d nurturenet -f schema/run_all.sql
-- ============================================================

\echo '================================================'
\echo ' NurtureNet Database Migration Runner'
\echo ' Running all 13 migrations...'
\echo '================================================'

\echo '[001] Creating parents table + audit_logs...'
\ir ../migrations/001_create_parents.sql

\echo '[002] Creating children table...'
\ir ../migrations/002_create_children.sql

\echo '[003] Creating devices table...'
\ir ../migrations/003_create_devices.sql

\echo '[004] Creating screen_limits + app_limits + screen_usage...'
\ir ../migrations/004_create_screen_limits.sql

\echo '[005] Creating activity_logs (partitioned)...'
\ir ../migrations/005_create_activity_logs.sql

\echo '[006] Creating location_pings + saved_places + geofence_events...'
\ir ../migrations/006_create_locations.sql

\echo '[007] Creating routines + routine_presets (with Nigeria seeds)...'
\ir ../migrations/007_create_routines.sql

\echo '[008] Creating alerts + alert_preferences...'
\ir ../migrations/008_create_alerts.sql

\echo '[009] Creating prayer_schedules + nigerian_cities [AFRICA]...'
\ir ../migrations/009_create_prayer_schedules.sql

\echo '[010] Creating exam_modes + nigerian_exam_calendar [AFRICA]...'
\ir ../migrations/010_create_exam_modes.sql

\echo '[011] Creating social_logs (partitioned) + nigerian_threat_keywords [AFRICA]...'
\ir ../migrations/011_create_social_logs.sql

\echo '[012] Creating threat_logs + ai_scan_stats [AI]...'
\ir ../migrations/012_create_threat_logs.sql

\echo '[013] Creating subscriptions + payments + pricing_plans (₦ seeded)...'
\ir ../migrations/013_create_subscriptions.sql

\echo '================================================'
\echo ' All 13 migrations completed successfully!'
\echo ''
\echo ' Tables created:'
\echo '   Core:     parents, children, devices'
\echo '   Features: screen_limits, app_limits, screen_usage'
\echo '             activity_logs (partitioned)'
\echo '             location_pings, saved_places, geofence_events'
\echo '             routines, routine_presets'
\echo '             alerts, alert_preferences'
\echo '   Africa+:  prayer_schedules, nigerian_cities'
\echo '             exam_modes, nigerian_exam_calendar'
\echo '             exam_mode_whitelist'
\echo '   AI:       social_logs (partitioned)'
\echo '             nigerian_threat_keywords'
\echo '             threat_logs, ai_scan_stats'
\echo '   Billing:  subscriptions, payment_transactions'
\echo '             pricing_plans, promo_codes'
\echo '             partner_agreements'
\echo ''
\echo ' Seeded data:'
\echo '   - 25 Nigerian cities (for prayer time picker)'
\echo '   - 8 routine presets (incl. Salah, Jumu'"'"'ah, WAEC, church)'
\echo '   - 2027 Nigerian exam calendar (WAEC, JAMB, NECO, NABTEB, GCE)'
\echo '   - 12 exam mode whitelisted apps (uLesson, Quran, Bible etc.)'
\echo '   - Nigerian threat keyword library (Pidgin, Yoruba, Hausa, Igbo)'
\echo '   - 5 pricing plans in NGN (Free, Basic, Basic Annual, Pro, Pro Annual)'
\echo '================================================'
