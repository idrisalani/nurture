import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import { toHHMM } from '../utils/time';

export interface Span { start: number; end: number; }            // minutes since midnight; end < start wraps past midnight
export interface Rhythm {
  rest?: Span | null; school?: Span | null;
  prayers?: { min: number; label: string }[]; bufferMins?: number;
  extra?: (Span & { label: string })[];                          // Friday Jumu'ah, Sunday service
  now: number;
}
const pct = (m: number) => `${(Math.max(0, Math.min(1440, m)) / 1440) * 100}%` as const;
function spans(s: Span): Span[] { return s.end >= s.start ? [s] : [{ start: s.start, end: 1440 }, { start: 0, end: s.end }]; }

/** One 24-hour bar. It is the single place where a parent sees how bedtime, school, prayer and "now" fit together. */
export default function DayRhythm({ rest, school, prayers = [], bufferMins = 15, extra = [], now, labels }:
  Rhythm & { labels: { rest: string; school: string; prayer: string; now: string } }) {
  const { c } = useTheme();
  const summary = [rest ? `${labels.rest} ${toHHMM(rest.start)} to ${toHHMM(rest.end)}` : '', school ? `${labels.school} ${toHHMM(school.start)} to ${toHHMM(school.end)}` : '',
    prayers.length ? `${labels.prayer}: ${prayers.map(p => `${p.label} ${toHHMM(p.min)}`).join(', ')}` : ''].filter(Boolean).join('. ');
  return (
    <View accessible accessibilityLabel={summary || labels.now}>
      <View style={[s.bar, { backgroundColor: c.surfaceAlt }]}>
        {school ? spans(school).map((sp, i) => <View key={`s${i}`} style={[s.seg, { left: pct(sp.start), width: pct(sp.end - sp.start), backgroundColor: c.school }]} />) : null}
        {rest ? spans(rest).map((sp, i) => <View key={`r${i}`} style={[s.seg, { left: pct(sp.start), width: pct(sp.end - sp.start), backgroundColor: c.rest }]} />) : null}
        {extra.map((e, i) => spans(e).map((sp, j) => <View key={`e${i}${j}`} style={[s.seg, { left: pct(sp.start), width: pct(sp.end - sp.start), backgroundColor: c.warnFill, opacity: 0.55 }]} />))}
        {prayers.map((p, i) => (
          <View key={`p${i}`} style={[s.seg, { left: pct(p.min - bufferMins), width: pct(Math.max(bufferMins * 2, 14)), backgroundColor: c.warnFill }]} />
        ))}
        <View style={[s.now, { left: pct(now), backgroundColor: c.ink }]} />
      </View>
      <View style={s.ticks}>{['00', '06', '12', '18', '24'].map(h => <Txt key={h} v="caption" tone="muted">{h}</Txt>)}</View>
      <View style={s.legend}>
        {rest ? <Key color={c.rest} text={`${labels.rest} ${toHHMM(rest.start)}–${toHHMM(rest.end)}`} /> : null}
        {school ? <Key color={c.school} text={`${labels.school} ${toHHMM(school.start)}–${toHHMM(school.end)}`} /> : null}
        {prayers.length || extra.length ? <Key color={c.warnFill} text={labels.prayer} /> : null}
      </View>
    </View>
  );
}
function Key({ color, text }: { color: string; text: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: color }} /><Txt v="caption" tone="muted">{text}</Txt></View>;
}
const s = StyleSheet.create({
  bar: { height: 34, borderRadius: 10, overflow: 'hidden' },
  seg: { position: 'absolute', top: 0, bottom: 0 },
  now: { position: 'absolute', top: -2, bottom: -2, width: 3, borderRadius: 2 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 10 },
});
