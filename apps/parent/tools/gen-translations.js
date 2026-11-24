// DRAFT translations for the highest-traffic strings. Every other key falls back to English (fallbackLng: 'en').
// These need review by native speakers before release.
const fs = require('fs');
const keys = require('./keys.json');
const T = {
 ha: { 'home.used_of':'Amfanin {{name}} a yau: {{used}} cikin {{limit}}.','home.left':'Saura {{left}}.','home.pause_sub':'Yanke intanet yanzu, na lokacin da ka zaɓa','home.pause_30':'mintuna 30','home.pause_60':'awa 1','home.pause_120':'awa 2','home.pause_until':'Sai na kunna','home.prayer_on':'A kunne a {{city}}','home.online_rules':'Dokoki suna aiki','home.paused':'An dakatar da intanet','nav.home':'Gida','nav.limits':'Iyaka','nav.location':'Wuri','nav.reports':'Rahotanni','nav.settings':'Saituna','nav.alerts':'Faɗakarwa',
  'common.save':'Ajiye','common.cancel':'Soke','common.back':'Koma','common.remove':'Cire','common.try_again':'Hakan bai yi aiki ba. Sake gwadawa.','common.offline':'Babu haɗin intanet. Duba hanyar sadarwarka ka sake gwadawa.',
  'auth.login_title':'Barka da dawowa','auth.phone':'Lambar waya','auth.password':'Kalmar sirri','auth.login_cta':'Shiga','auth.no_account':'Ƙirƙiri asusu','auth.register_title':'Ƙirƙiri asusunka','auth.register_cta':'Ƙirƙiri asusu','auth.have_account':'Ina da asusu tuni','auth.full_name':'Sunanka','auth.otp_title':'Tabbatar da wayarka','auth.otp_cta':'Tabbatar',
  'home.morning':'Ina kwana','home.afternoon':'Ina wuni','home.evening':'Barka da yamma','home.pause':'Dakatar da intanet','home.resume':'Kunna intanet','home.prayer':'Lokutan sallah','home.exam':'Yanayin jarrabawa','home.filter':'Tace abun ciki','home.sos':'Lambobin gaggawa da SOS','home.add_child':'Ƙara yaro','home.off':'A kashe','home.on':'A kunne','home.rhythm':'Tsarin yau','home.empty_title':'Ƙara ɗanka na farko','home.tip':'Shawara ta yau','home.limit_reached':'An kai iyakar yau.',
  'limits.title':'Lokacin waya','limits.weekday':'Ranakun makaranta','limits.weekend':'Ƙarshen mako','limits.bedtime':'Kulle lokacin kwanciya',
  'loc.title':'Wuri','rep.title':'Rahotanni','settings.title':'Saituna','settings.logout':'Fita','lang.title':'Harshe','appearance.title':'Kamanni','appearance.auto':'Bi wayata','appearance.light':'Haske','appearance.dark':'Duhu','plans.title':'Tsare-tsare','alerts.title':'Faɗakarwa',
  'rhythm.rest':'Kwanciya','rhythm.school':'Makaranta','rhythm.prayer':'Sallah','rhythm.now':'Yanzu','units.h':'awa','units.min':'minti',
  'time.just_now':'yanzu-yanzu','time.min_ago':'mintuna {{n}} da suka wuce','time.h_ago':'awa {{n}} da suka wuce','time.d_ago':'kwana {{n}} da suka wuce',
  'days.0':'Lah','days.1':'Lit','days.2':'Tal','days.3':'Lar','days.4':'Alh','days.5':'Jum','days.6':'Asa' },
 yo: { 'home.used_of':'Lílò {{name}} lónìí: {{used}} nínú {{limit}}.','home.left':'{{left}} ló kù.','home.pause_sub':'Gé ìwọlé kúrò báyìí, fún àkókò tí o yàn','home.pause_30':'ìṣẹ́jú 30','home.pause_60':'wákàtí 1','home.pause_120':'wákàtí 2','home.pause_until':'Títí èmi yóò fi tún ṣí i','home.prayer_on':'Ó wà ní títàn fún {{city}}','home.online_rules':'Àwọn òfin ń ṣiṣẹ́','home.paused':'A ti dá íńtánẹ́ẹ̀tì dúró','nav.home':'Ilé','nav.limits':'Ìdíwọ̀n','nav.location':'Ibùdó','nav.reports':'Ìròyìn','nav.settings':'Ètò','nav.alerts':'Ìkìlọ̀',
  'common.save':'Fi pamọ́','common.cancel':'Fagilé','common.back':'Padà','common.remove':'Yọ kúrò','common.try_again':'Kò ṣiṣẹ́. Gbìyànjú lẹ́ẹ̀kan sí i.','common.offline':'Kò sí ìsopọ̀ ayélujára. Ṣàyẹ̀wò nẹ́tíwọ́kì rẹ kí o tún gbìyànjú.',
  'auth.login_title':'Káàbọ̀ padà','auth.phone':'Nọ́mbà fóònù','auth.password':'Ọ̀rọ̀ aṣínà','auth.login_cta':'Wọlé','auth.no_account':'Ṣẹ̀dá àkọọ́lẹ̀','auth.register_title':'Ṣẹ̀dá àkọọ́lẹ̀ rẹ','auth.register_cta':'Ṣẹ̀dá àkọọ́lẹ̀','auth.have_account':'Mo ti ní àkọọ́lẹ̀','auth.full_name':'Orúkọ rẹ','auth.otp_title':'Jẹ́rìí fóònù rẹ','auth.otp_cta':'Jẹ́rìísí',
  'home.morning':'Káàárọ̀','home.afternoon':'Káàsán','home.evening':'Ẹ kú ìrọ̀lẹ́','home.pause':'Dá íńtánẹ́ẹ̀tì dúró','home.resume':'Tún íńtánẹ́ẹ̀tì ṣí','home.prayer':'Àkókò àdúrà','home.exam':'Ipò ìdánwò','home.filter':'Àlẹ̀mọ́ àkóónú','home.sos':'Àwọn olùbásọ̀rọ̀ pàjáwìrì àti SOS','home.add_child':'Fi ọmọ kún','home.off':'Ó wà ní títì','home.on':'Ó wà ní títàn','home.rhythm':'Ètò òní','home.empty_title':'Fi ọmọ rẹ àkọ́kọ́ kún','home.tip':'Ìmọ̀ràn òní','home.limit_reached':'Ìdíwọ̀n òní ti pé.',
  'limits.title':'Àkókò orí fóònù','limits.weekday':'Ọjọ́ ilé-ìwé','limits.weekend':'Òpin ọ̀sẹ̀','limits.bedtime':'Ìtìpa àkókò ìsùn',
  'loc.title':'Ibùdó','rep.title':'Ìròyìn','settings.title':'Ètò','settings.logout':'Jáde','lang.title':'Èdè','appearance.title':'Ìrísí','appearance.auto':'Tẹ̀lé fóònù mi','appearance.light':'Ìmọ́lẹ̀','appearance.dark':'Òkùnkùn','plans.title':'Àwọn ìpèsè','alerts.title':'Ìkìlọ̀',
  'rhythm.rest':'Ìsùn','rhythm.school':'Ilé-ìwé','rhythm.prayer':'Àdúrà','rhythm.now':'Báyìí','units.h':'wákàtí','units.min':'ìṣẹ́jú',
  'time.just_now':'ní ìsinsin yìí','time.min_ago':'ìṣẹ́jú {{n}} sẹ́yìn','time.h_ago':'wákàtí {{n}} sẹ́yìn','time.d_ago':'ọjọ́ {{n}} sẹ́yìn',
  'days.0':'Àìk','days.1':'Ajé','days.2':'Ìsg','days.3':'Ọjr','days.4':'Ọjb','days.5':'Ẹtì','days.6':'Àbm' },
 ig: { 'home.used_of':'{{name}} ejirila {{used}} n’ime {{limit}} taa.','home.left':'{{left}} fọdụrụ.','home.pause_sub':'Bepụ ịntanetị ugbu a, ruo oge ị họọrọ','home.pause_30':'nkeji 30','home.pause_60':'awa 1','home.pause_120':'awa 2','home.pause_until':'Ruo mgbe m ga-eji kpọghee ya','home.prayer_on':'Mepere maka {{city}}','home.online_rules':'Iwu na-arụ ọrụ','home.paused':'Kwụsịrị ịntanetị','nav.home':'Ụlọ','nav.limits':'Oke','nav.location':'Ebe','nav.reports':'Akụkọ','nav.settings':'Nhazi','nav.alerts':'Ọkwa',
  'common.save':'Chekwaa','common.cancel':'Kagbuo','common.back':'Laghachi','common.remove':'Wepụ','common.try_again':'Ọ rụghị ọrụ. Nwaa ọzọ.','common.offline':'Enweghị njikọ ịntanetị. Lelee netwọk gị ma nwaa ọzọ.',
  'auth.login_title':'Nnọọ ọzọ','auth.phone':'Nọmba ekwentị','auth.password':'Okwuntughe','auth.login_cta':'Banye','auth.no_account':'Mepụta akaụntụ','auth.register_title':'Mepụta akaụntụ gị','auth.register_cta':'Mepụta akaụntụ','auth.have_account':'Enwere m akaụntụ','auth.full_name':'Aha gị','auth.otp_title':'Kwenye ekwentị gị','auth.otp_cta':'Kwenye',
  'home.morning':'Ụtụtụ ọma','home.afternoon':'Ehihie ọma','home.evening':'Mgbede ọma','home.pause':'Kwụsị ịntanetị','home.resume':'Kpọghee ịntanetị','home.prayer':'Oge ekpere','home.exam':'Ọnọdụ ule','home.filter':'Nzacha ọdịnaya','home.sos':'Ndị kpọrọ maka mberede na SOS','home.add_child':'Tinye nwa','home.off':'Emechiri','home.on':'Mepere','home.rhythm':'Usoro taa','home.empty_title':'Tinye nwa gị mbụ','home.tip':'Ndụmọdụ taa','home.limit_reached':'Oke taa ruru.',
  'limits.title':'Oge ekwentị','limits.weekday':'Ụbọchị ụlọakwụkwọ','limits.weekend':'Ngwụcha izu','limits.bedtime':'Mkpọchi oge ụra',
  'loc.title':'Ebe','rep.title':'Akụkọ','settings.title':'Nhazi','settings.logout':'Pụọ','lang.title':'Asụsụ','appearance.title':'Ọdịdị','appearance.auto':'Soro ekwentị m','appearance.light':'Ọkụ','appearance.dark':'Ọchịchịrị','plans.title':'Atụmatụ','alerts.title':'Ọkwa',
  'rhythm.rest':'Ụra','rhythm.school':'Ụlọakwụkwọ','rhythm.prayer':'Ekpere','rhythm.now':'Ugbu a','units.h':'awa','units.min':'nkeji',
  'time.just_now':'ugbu a','time.min_ago':'nkeji {{n}} gara aga','time.h_ago':'awa {{n}} gara aga','time.d_ago':'ụbọchị {{n}} gara aga',
  'days.0':'Sọn','days.1':'Mọn','days.2':'Tiu','days.3':'Wen','days.4':'Tọọ','days.5':'Fraị','days.6':'Sat' },
 pc: { 'home.used_of':'{{name}} don use {{used}} for {{limit}} today.','home.left':'{{left}} remain.','home.pause_sub':'Cut internet now, for as long as you want','home.pause_until':'Until I put am back','home.online_rules':'Rules dey work','home.paused':'Internet don stop','nav.home':'Home','nav.limits':'Limit','nav.location':'Where e dey','nav.reports':'Report','nav.settings':'Setting','nav.alerts':'Alert',
  'common.save':'Save','common.cancel':'Cancel','common.back':'Go back','common.remove':'Comot','common.try_again':'E no work. Try again.','common.offline':'No network. Check your network, then try again.',
  'auth.login_title':'Welcome back','auth.phone':'Phone number','auth.password':'Password','auth.login_cta':'Enter','auth.no_account':'Open account','auth.register_title':'Open your account','auth.register_cta':'Open account','auth.have_account':'I don get account','auth.full_name':'Your name','auth.otp_title':'Confirm your phone','auth.otp_cta':'Confirm',
  'home.pause':'Stop internet','home.resume':'Put internet back','home.prayer':'Prayer time','home.exam':'Exam mode','home.sos':'Emergency people and SOS','home.add_child':'Add pikin','home.rhythm':'Today plan','home.empty_title':'Add your first pikin','home.tip':'Tip for today','home.limit_reached':'Today limit don finish.',
  'limits.weekday':'School days','limits.weekend':'Weekend','limits.bedtime':'Sleep time lock',
  'loc.title':'Where e dey','rep.title':'Report','settings.title':'Setting','settings.logout':'Comot','appearance.title':'How e look','appearance.auto':'Follow my phone','plans.title':'Plans','alerts.title':'Alert',
  'rhythm.rest':'Sleep','units.h':'hr','time.h_ago':'{{n}} hr ago','time.d_ago':'{{n}} day ago' },
};
for (const [lang, tbl] of Object.entries(T)) {
  const nest = {};
  for (const [k, v] of Object.entries(tbl)) {
    if (!(k in keys)) throw new Error(`${lang}: unknown key ${k}`);
    const parts = k.split('.'); let o = nest; parts.slice(0, -1).forEach(p => o = o[p] = o[p] || {}); o[parts.at(-1)] = v;
  }
  fs.writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(nest, null, 2) + '\n');
  console.log(lang, Object.keys(tbl).length, 'of', Object.keys(keys).length, 'keys translated');
}
