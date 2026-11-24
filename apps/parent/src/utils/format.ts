import { TFunction } from 'i18next';
/** 135 -> "2 h 15 min" (units are translated) */
export function duration(mins: number, t: TFunction): string {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  const hs = t('units.h', 'h'), ms = t('units.min', 'min');
  if (h && m) return `${h} ${hs} ${m} ${ms}`;
  if (h) return `${h} ${hs}`;
  return `${m} ${ms}`;
}
export function timeAgo(iso: string | null | undefined, t: TFunction): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return t('time.just_now', 'just now');
  if (mins < 60) return t('time.min_ago', '{{n}} min ago', { n: mins });
  const h = Math.round(mins / 60);
  if (h < 24) return t('time.h_ago', '{{n}} h ago', { n: h });
  return t('time.d_ago', '{{n}} d ago', { n: Math.round(h / 24) });
}
