// Scans src for t('key', 'English default') and writes src/i18n/en.json (nested). Fails if a key has two different defaults.
const fs = require('fs'), path = require('path');
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(f) && files.push(p); } })('src');
const re = /\bt\(\s*(?:'([a-z_]+(?:\.[a-z_0-9]+)+)')\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/g;
const flat = {}; const problems = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8'); let m;
  while ((m = re.exec(src))) {
    const key = m[1], val = (m[2] ?? m[3]).replace(/\\'/g, "'");
    if (flat[key] !== undefined && flat[key] !== val) problems.push(`${key}: "${flat[key]}" vs "${val}"`);
    flat[key] = val;
  }
}
const extra = { 'days.0': 'Sun', 'days.1': 'Mon', 'days.2': 'Tue', 'days.3': 'Wed', 'days.4': 'Thu', 'days.5': 'Fri', 'days.6': 'Sat', 'prayer.fajr': 'Fajr', 'prayer.dhuhr': 'Dhuhr', 'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib', 'prayer.isha': 'Isha' };
Object.assign(flat, extra);
const nest = {}; for (const k of Object.keys(flat).sort()) { const parts = k.split('.'); let o = nest; parts.slice(0, -1).forEach(p => o = o[p] = o[p] || {}); o[parts.at(-1)] = flat[k]; }
fs.writeFileSync('src/i18n/en.json', JSON.stringify(nest, null, 2) + '\n');
fs.writeFileSync('tools/keys.json', JSON.stringify(flat, null, 2));
console.log(Object.keys(flat).length, 'keys'); if (problems.length) { console.log('CONFLICTS:\n' + problems.join('\n')); process.exit(1); }
