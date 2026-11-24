# NurtureNet Child (Android)

The app that runs on the child's phone. It links to a parent's account with a 6-digit code, enforces the rules the parent set (bedtime, school, prayer, Jumu'ah, church, exam study, daily limit, per-app rules), shares location, and lets the child send an SOS.

## How it works
- **Policy engine** (`src/engine`, plain TypeScript, 29 tests): turns the parent's config plus today's prayer times into a 7-day timeline of lock/allowlist segments. Priority: parent pause > bedtime > school > prayer (± buffer) > Jumu'ah > church > exam study > daily limit.
- **Native enforcer** (`modules/nurturenet-enforcer`, Kotlin Expo module): reads that timeline from SharedPreferences and enforces it **offline**. An accessibility service (window-change events only) shows a lock screen over blocked apps; a foreground service with a permanent "NurtureNet is on" notification ticks every 20 s and checks live UsageStats for the daily limit; a boot receiver restarts it.
- **Sync** (`src/services/sync.ts`): every 15 min and on app open: `GET /devices/config`, prayer times, push policy to native, post usage, heartbeat, flush queued SOS.
- **Transparency**: the app never hides its icon or notification, and the welcome and permission screens say plainly what it can and cannot see. It does not read messages, keystrokes or passwords.

## Run it
This uses custom native code, so it **does not run in Expo Go**.
```
npm install
npm test            # engine tests (TZ=Africa/Lagos)
npm run typecheck
export EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
npx expo prebuild --platform android
npx expo run:android          # or: eas build --profile development --platform android
```
Browser preview (no enforcement, demo native stub): `npm run web`.

## Backend requirements
- Apply migration `014_create_pairing_codes.sql` and the updated `devices` routes (see `backend_updates.zip`).
- **nginx must set `underscores_in_headers on;`** or the `device_id` / `child_id` headers are silently dropped and every call returns 401.
- The parent app creates the code under Settings > Link a phone (`POST /children/:id/pairing-code`).

## Honest limits (v1)
- Not yet built or run on a real device. Kotlin was compile-checked against Android API 33 with stubs, and the TypeScript and engine tests pass. Test on a Tecno/Infinix/Samsung device before any pilot; some vendors (Tecno, Infinix, Xiaomi) kill background services aggressively, so the battery step matters.
- A determined child can switch the accessibility service off in Settings. The app notices and shows a banner, and the parent sees the device stop reporting, but v1 has no device-admin protection.
- Parent pause/resume reaches the phone at the next sync (up to about 15 minutes). Push (FCM) is the next step.
- Web categories (adult, gambling) are not enforced on-device in v1.
- SOS needs a location fix; without one the child is told to call someone.
- Google Play requires an Accessibility API declaration and a Usage Access justification. The in-app disclosure screen is written for that, but you must file the declaration and a privacy policy.
- Hausa, Yoruba, Igbo and Pidgin strings (about half the app, covering the lock screen, status, SOS and pairing) are **drafts** and need native-speaker review. The rest falls back to English.

## Layout
```
App.tsx                      stage machine: boot > welcome > pair > permissions > home
src/screens                  Welcome, Pair, Permissions, Home
src/services                 sync, sos, tasks (background), permissions, lockStrings
src/engine                   decide, timeline, categories, tests
modules/nurturenet-enforcer  Kotlin + JS bridge
tools                        extract-i18n.js, gen-translations.js
```
