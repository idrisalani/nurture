# NurtureNet parent app (redesigned UI)

React Native 0.76 / Expo SDK 52 / TypeScript. Same backend API as before; only the frontend changed.

## Run it
```bash
npm install
cp .env.example .env        # set EXPO_PUBLIC_API_URL (and optionally EXPO_PUBLIC_SMS_LOCATE_NUMBER)
npx expo start              # press a for Android, or scan the QR code with Expo Go
npx expo start --web        # browser preview (map shows a placeholder)
npx tsc --noEmit            # type-check
```

## What changed
| Area | Before | Now |
|---|---|---|
| Look | Green header band, emoji icons, UPPERCASE labels | Indigo and chalk palette, title on the page, Ionicons, sentence case |
| Colour meaning | Green everywhere | Green means safe only. Ochre means attention (prayer, bedtime). Red means danger only |
| Type | System font | Noto Sans, which fully covers Hausa (ɓ ɗ ƙ), Yorùbá and Igbo (ẹ ọ ṣ ị ụ and tone marks) and ₦ |
| Home | Number tiles | A plain sentence ("Amara has used 1 h 25 min of 2 h today"), a meter, and the **Day rhythm** strip showing bedtime, school, prayer windows and now |
| Navigation | Prayer, Exam and SOS screens could not be reached | Everything reachable from Home or Settings |
| Forms | Empty-field alerts | Inline errors, +234 prefix, numbers normalised to +234… |
| Screen time | Bedtime times not saved | Steppers for limits and bedtime, all fields saved |
| Dark mode | None | Light, dark, or follow the phone |
| Language | Hard-coded English in many places | Every string goes through `t()`, with a language picker on the sign-in screen |

## Structure
```
src/theme      tokens (colours, type, radii) and ThemeProvider
src/ui         shared components (Screen, Row/Group, Button, Field, Meter, DayRhythm, ChildMap, Toast ...)
src/screens    one file per screen
src/navigation root stack + bottom tabs (Home, Limits, Location, Reports, Settings)
src/store      Redux slices (auth, children, locale, alerts)
src/i18n       en, ha, yo, ig, pc
tools          extract-i18n.js (rebuilds en.json from the code), gen-translations.js
```
Add a string by writing `t('screen.key', 'English text')`, then run `node tools/extract-i18n.js`.

## Translations need review
`ha`, `yo`, `ig` and `pc` contain about 80 draft translations of the most visible strings (navigation, sign-in, Home, Limits). Everything else falls back to English. **Have native speakers review these before release.** Drafts live in `tools/gen-translations.js`.

## Known gaps
Frontend:
- The child-side app does not exist yet. The parent side of linking (one-time code, linked phones list) is built and needs the backend update below.
- Android map needs `GOOGLE_MAPS_API_KEY` in `.env` (read by `app.config.js`). The browser preview shows a placeholder.
- Charts are simple View bars, with no chart library.
- Not yet built: routine presets, custom blocked websites, threat log, monthly reports and PDF export, location history, payment history and cancel.

Backend update (files in `backend_updates/`, copy over the backend and run migration 014):
- `PUT /screentime/:id` now saves `school_lock_start` and `school_lock_end`.
- `POST /panic/trigger-parent` lets a parent send SOS using the child's last known location.
- `POST /children/:id/pairing-code`, `GET /children/:id/devices` and `POST /devices/pair` implement phone linking.
