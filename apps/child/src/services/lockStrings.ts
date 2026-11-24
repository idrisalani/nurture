import { TFunction } from 'i18next';

/** Text the native lock screen and status notification show. Pushed to Android with the policy so it works offline. */
export function lockStrings(t: TFunction): Record<string, string> {
  return {
    title_bedtime: t('lock.bedtime', 'Time to sleep'), title_school: t('lock.school', 'School time'),
    title_prayer: t('lock.prayer', 'Prayer time'), title_jumuah: t('lock.jumuah', "Jumu'ah"), title_church: t('lock.church', 'Church time'),
    title_limit: t('lock.limit', "Today's time is used up"), title_paused: t('lock.paused', 'Phone is paused'),
    title_exam_study: t('lock.exam_study', 'Study time'), title_blocked_app: t('lock.blocked_app', 'This app is off right now'),
    until: t('lock.until', 'Back at {time}.'), until_parent: t('lock.until_parent', 'Your parent will turn it back on.'),
    why: t('lock.why', 'Your parent set these rules. They can change them in the NurtureNet app.'),
    call: t('lock.call', 'Call someone'), help: t('lock.help', 'I need help'),
    notif_title: t('notif.title', 'NurtureNet is on'), notif_body: t('notif.body', 'Your parent set rules for this phone. Tap to see them.'),
  };
}
