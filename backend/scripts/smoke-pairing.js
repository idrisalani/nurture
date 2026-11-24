// End-to-end check of the parent -> child pairing flow against a running API.
//   node scripts/smoke-pairing.js https://nurturenet-api-mul4.onrender.com
// With no Termii key the API only logs the OTP ("[SMS MOCK]"). Read it from the Render logs and type it when asked,
// or set OTP=123456 / OTP_LOG=/path/to/server.log to read it from a local log file.
const fs = require('fs'); const readline = require('readline');
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '') + '/api/v1';
const phone = '+23480' + String(Math.floor(10000000 + Math.random() * 89999999));
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); return cond; };
const call = async (method, path, body, headers = {}) => {
  const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {} return { status: r.status, data };
};
const ask = q => new Promise(res => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); res(a.trim()); }); });
const otpFor = async () => {
  if (process.env.OTP) return process.env.OTP;
  if (process.env.OTP_LOG) { await new Promise(r => setTimeout(r, 500)); const m = [...fs.readFileSync(process.env.OTP_LOG, 'utf8').matchAll(new RegExp(`To: \\${phone}, Message: .*? (\\d{6})`, 'g'))].pop(); if (m) return m[1]; }
  return ask(`Enter the OTP for ${phone} (find "[SMS MOCK]" in the Render logs): `);
};

(async () => {
  console.log('API:', base, '\nTest parent:', phone);
  const wake = await call('GET', '/../../health').catch(() => null);
  let r = await call('POST', '/auth/register', { phone, full_name: 'Smoke Test', password: 'smoke123', preferred_language: 'en' });
  if (!ok('register parent', r.status === 201, JSON.stringify(r))) return done();
  r = await call('POST', '/auth/verify-otp', { phone, otp: await otpFor() });
  if (!ok('verify OTP', r.status === 200, JSON.stringify(r))) return done();
  r = await call('POST', '/auth/login', { phone, password: 'smoke123' });
  if (!ok('login', r.status === 200 && r.data.accessToken, JSON.stringify(r))) return done();
  const A = { authorization: 'Bearer ' + r.data.accessToken };
  r = await call('POST', '/children', { full_name: 'Amara Test', avatar_emoji: '👧' }, A);
  if (!ok('add child', r.status === 201 && r.data.id, JSON.stringify(r))) return done();
  const child = r.data.id;
  r = await call('POST', `/children/${child}/pairing-code`, null, A);
  if (!ok('make pairing code', r.status === 201 && /^\d{6}$/.test(r.data.code), JSON.stringify(r))) return done();
  const code = r.data.code;
  r = await call('POST', '/devices/pair', { code: '000000', device_name: 'Test phone', platform: 'android' });
  ok('wrong code is rejected', r.status >= 400 && r.status < 500, JSON.stringify(r));
  r = await call('POST', '/devices/pair', { code, device_name: 'Test phone', device_model: 'Tecno Spark', platform: 'android', os_version: '13', app_version: '1.0.0' });
  if (!ok('child phone pairs with the code', r.status === 201 && r.data.device_id && r.data.child_id === child, JSON.stringify(r))) return done();
  const D = { device_id: r.data.device_id, child_id: r.data.child_id };
  r = await call('POST', '/devices/pair', { code, device_name: 'Second phone', platform: 'android' });
  ok('code works only once', r.status >= 400 && r.status < 500, JSON.stringify(r));
  r = await call('GET', '/devices/config', null, D);
  ok('child phone gets its rules', r.status === 200 && r.data.child?.id === child && 'limits' in r.data, JSON.stringify(r).slice(0, 200));
  r = await call('GET', '/devices/config', null, { device_id: D.device_id, child_id: '00000000-0000-4000-8000-000000000000' });
  ok('wrong child id is refused', r.status === 401 || r.status === 403, JSON.stringify(r));
  r = await call('POST', '/devices/heartbeat', { app_version: '1.0.0' }, D);
  ok('heartbeat', r.status === 200, JSON.stringify(r));
  r = await call('GET', `/children/${child}/devices`, null, A);
  ok('parent sees the linked phone', r.status === 200 && JSON.stringify(r.data).includes('Test phone'), JSON.stringify(r).slice(0, 200));
  done();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
function done() { console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
