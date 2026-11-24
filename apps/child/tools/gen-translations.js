// DRAFT translations for the strings a child sees most (lock screen, status, SOS, pairing). Everything else falls back to English.
// They MUST be reviewed by native speakers before release. Run extract-i18n.js first.
const fs = require('fs');
const keys = require('./keys.json');
const T = {
 ha: { 'notif.title':'NurtureNet yana kunne','notif.body':'Iyayenka sun saita dokoki a wannan wayar. Taɓa don ganin su.',
  'lock.bedtime':'Lokacin barci','lock.school':'Lokacin makaranta','lock.prayer':'Lokacin sallah','lock.jumuah':'Sallar Jumma’a','lock.church':'Lokacin coci','lock.limit':'Lokacin yau ya ƙare','lock.paused':'An dakatar da wayar','lock.exam_study':'Lokacin karatu','lock.blocked_app':'Wannan manhaja a kashe take yanzu',
  'lock.until':'Za a dawo da ƙarfe {time}.','lock.until_parent':'Iyayenka za su kunna ta.','lock.why':'Iyayenka ne suka saita waɗannan dokoki. Za su iya canza su a manhajar NurtureNet.','lock.call':'Kira wani','lock.help':'Ina buƙatar taimako',
  'home.hi':'Sannu','home.open':'Wayarka a buɗe take.','home.status_open':'A buɗe','home.status_rest':'A hutu','home.sos':'Ina buƙatar taimako','home.sos_hold':'Ka danna ka riƙe','home.sos_note':'Riƙe wannan yana sanar da iyalinka inda kake.',
  'home.r_paused':'Iyayenka sun dakatar da wayar.','home.r_bedtime':'Lokacin barci ne.','home.r_school':'Lokacin makaranta ne.','home.r_prayer':'Lokacin sallah ne.','home.r_limit':'Lokacin amfani da waya na yau ya ƙare.',
  'sos.sent':'Taimako yana zuwa. An sanar da iyalinka inda kake.','sos.queued':'Babu intanet. Za a aika faɗakarwarka da zarar ka dawo kan intanet.','sos.no_loc':'Ba a samu wurinka ba. Kunna wuri, ko ka kira wani yanzu.',
  'pair.title':'Shigar da lambar','pair.cta':'Haɗa wannan wayar','pair.label':'Lambar lamba 6','pair.invalid':'Lambar tana da lamba 6. Duba ka sake gwadawa.','common.back':'Koma','common.offline':'Babu haɗin intanet. Duba hanyar sadarwarka ka sake gwadawa.',
  'welcome.title':'Sannu! Wannan wayar tana amfani da NurtureNet.','welcome.cta':'Ina da lamba daga iyayena','welcome.no_read':'NurtureNet ba ta karanta saƙonninka, hotunanka ko kalmomin sirrinka. Tana nuna sanarwa a koyaushe idan tana kunne.',
  'lang.title':'Harshe','rhythm.rest':'Barci','rhythm.school':'Makaranta','rhythm.prayer':'Sallah','rhythm.now':'Yanzu','units.h':'awa','units.min':'minti','home.sync':'Sabunta dokokina' },
 yo: { 'notif.title':'NurtureNet ń ṣiṣẹ́','notif.body':'Àwọn òbí rẹ ti ṣètò òfin fún fóònù yìí. Tẹ̀ láti wò ó.',
  'lock.bedtime':'Àkókò ìsùn','lock.school':'Àkókò ilé-ìwé','lock.prayer':'Àkókò àdúrà','lock.jumuah':'Jùmọ̀ọ́','lock.church':'Àkókò ìjọ́sìn','lock.limit':'Àkókò òní ti tán','lock.paused':'A ti dá fóònù dúró','lock.exam_study':'Àkókò ìkẹ́kọ̀ọ́','lock.blocked_app':'A ti pa ohun èlò yìí báyìí',
  'lock.until':'Yóò padà ní {time}.','lock.until_parent':'Òbí rẹ yóò tún un ṣí.','lock.why':'Àwọn òbí rẹ ló ṣètò àwọn òfin yìí. Wọ́n lè yí wọn padà nínú ohun èlò NurtureNet.','lock.call':'Pe ẹnìkan','lock.help':'Mo nílò ìrànlọ́wọ́',
  'home.hi':'Báwo','home.open':'Fóònù rẹ ṣí sílẹ̀.','home.status_open':'Ó ṣí','home.status_rest':'Ó ń sinmi','home.sos':'Mo nílò ìrànlọ́wọ́','home.sos_hold':'Tẹ̀ kí o dì í mú','home.sos_note':'Dídì èyí mú yóò sọ fún ẹbí rẹ ibi tí o wà.',
  'home.r_paused':'Òbí rẹ ti dá fóònù dúró.','home.r_bedtime':'Àkókò ìsùn nìyí.','home.r_school':'Àkókò ilé-ìwé nìyí.','home.r_prayer':'Àkókò àdúrà nìyí.','home.r_limit':'Àkókò fóònù òní ti tán.',
  'sos.sent':'Ìrànlọ́wọ́ ń bọ̀. A ti sọ fún ẹbí rẹ ibi tí o wà.','sos.queued':'Kò sí nẹ́tíwọ́kì. A ó fi ìkìlọ̀ rẹ ránṣẹ́ bí o bá ṣe padà sórí íńtánẹ́ẹ̀tì.','sos.no_loc':'A kò rí ibi tí o wà. Tan ibùdó, tàbí pe ẹnìkan báyìí.',
  'pair.title':'Tẹ kóòdù náà','pair.cta':'So fóònù yìí','pair.label':'Kóòdù oní nọ́mbà mẹ́fà','pair.invalid':'Kóòdù náà ní nọ́mbà mẹ́fà. Ṣàyẹ̀wò kí o tún gbìyànjú.','common.back':'Padà','common.offline':'Kò sí ìsopọ̀ ayélujára. Ṣàyẹ̀wò nẹ́tíwọ́kì rẹ kí o tún gbìyànjú.',
  'welcome.title':'Báwo! Fóònù yìí ń lo NurtureNet.','welcome.cta':'Mo ní kóòdù láti ọ̀dọ̀ òbí mi','welcome.no_read':'NurtureNet kì í ka àwọn ìránṣẹ́, fọ́tò tàbí ọ̀rọ̀ aṣínà rẹ. Ó máa ń fi ìkìlọ̀ hàn nígbà gbogbo tí ó bá ń ṣiṣẹ́.',
  'lang.title':'Èdè','rhythm.rest':'Ìsùn','rhythm.school':'Ilé-ìwé','rhythm.prayer':'Àdúrà','rhythm.now':'Báyìí','units.h':'wákàtí','units.min':'ìṣẹ́jú','home.sync':'Ṣe àtúnṣe àwọn òfin mi' },
 ig: { 'notif.title':'NurtureNet na-arụ ọrụ','notif.body':'Ndị mụrụ gị debara iwu maka ekwentị a. Pịa ka ị hụ ha.',
  'lock.bedtime':'Oge ụra','lock.school':'Oge ụlọakwụkwọ','lock.prayer':'Oge ekpere','lock.jumuah':'Jumu’ah','lock.church':'Oge ụka','lock.limit':'Oge taa agwụla','lock.paused':'Akwụsịrị ekwentị','lock.exam_study':'Oge ọmụmụ','lock.blocked_app':'Emechiri ngwa a ugbu a',
  'lock.until':'Ọ ga-alaghachi n’elekere {time}.','lock.until_parent':'Ndị mụrụ gị ga-emeghe ya.','lock.why':'Ndị mụrụ gị debara iwu ndị a. Ha nwere ike ịgbanwe ha na ngwa NurtureNet.','lock.call':'Kpọọ onye','lock.help':'Achọrọ m enyemaka',
  'home.hi':'Nnọọ','home.open':'Ekwentị gị meghere.','home.status_open':'Meghere','home.status_rest':'Na-ezumike','home.sos':'Achọrọ m enyemaka','home.sos_hold':'Pịa jide ya','home.sos_note':'Ijide nke a na-agwa ezinụlọ gị ebe ị nọ.',
  'home.r_paused':'Ndị mụrụ gị akwụsịla ekwentị.','home.r_bedtime':'Ọ bụ oge ụra.','home.r_school':'Ọ bụ oge ụlọakwụkwọ.','home.r_prayer':'Ọ bụ oge ekpere.','home.r_limit':'Oge ekwentị taa agwụla.',
  'sos.sent':'Enyemaka na-bịa. Agwala ezinụlọ gị ebe ị nọ.','sos.queued':'Enweghị netwọk. A ga-ezipụ ọkwa gị ozugbo ị lọghachiri n’ịntanetị.','sos.no_loc':'Achọtaghị ebe ị nọ. Kpọghee ebe, ma ọ bụ kpọọ onye ugbu a.',
  'pair.title':'Tinye koodu','pair.cta':'Jikọọ ekwentị a','pair.label':'Koodu nke nọmba isii','pair.invalid':'Koodu nwere nọmba isii. Lelee ma nwaa ọzọ.','common.back':'Laghachi','common.offline':'Enweghị njikọ ịntanetị. Lelee netwọk gị ma nwaa ọzọ.',
  'welcome.title':'Nnọọ! Ekwentị a na-eji NurtureNet.','welcome.cta':'Enwere m koodu sitere n’aka nne m ma ọ bụ nna m','welcome.no_read':'NurtureNet anaghị agụ ozi gị, foto gị ma ọ bụ okwuntughe gị. Ọ na-egosi ọkwa mgbe niile ọ na-arụ ọrụ.',
  'lang.title':'Asụsụ','rhythm.rest':'Ụra','rhythm.school':'Ụlọakwụkwọ','rhythm.prayer':'Ekpere','rhythm.now':'Ugbu a','units.h':'awa','units.min':'nkeji','home.sync':'Melite iwu m' },
 pc: { 'notif.title':'NurtureNet dey on','notif.body':'Your parent don set rules for this phone. Tap to see dem.',
  'lock.bedtime':'Time to sleep','lock.school':'School time','lock.prayer':'Prayer time','lock.jumuah':'Jumu’ah','lock.church':'Church time','lock.limit':'Today time don finish','lock.paused':'Phone don stop','lock.exam_study':'Time to read book','lock.blocked_app':'This app dey off for now',
  'lock.until':'E go come back by {time}.','lock.until_parent':'Your parent go put am back.','lock.why':'Your parent set these rules. Dem fit change dem for NurtureNet app.','lock.call':'Call somebody','lock.help':'I need help',
  'home.hi':'How far','home.open':'Your phone dey open.','home.status_open':'Open','home.status_rest':'E dey rest','home.sos':'I need help','home.sos_hold':'Press and hold','home.sos_note':'If you hold am, your family go know where you dey.',
  'home.r_paused':'Your parent don stop the phone.','home.r_bedtime':'Na sleep time.','home.r_school':'Na school time.','home.r_prayer':'Na prayer time.','home.r_limit':'Today phone time don finish.',
  'sos.sent':'Help dey come. Your family don know where you dey.','sos.queued':'No network. Your alert go send as network show.','sos.no_loc':'We no see where you dey. Put location on, or call somebody now.',
  'pair.title':'Put the code','pair.cta':'Link this phone','pair.label':'6-number code','pair.invalid':'The code get 6 numbers. Check am, then try again.','common.back':'Go back','common.offline':'No network. Check your network, then try again.',
  'welcome.title':'How far! This phone dey use NurtureNet.','welcome.cta':'I get code from my parent','welcome.no_read':'NurtureNet no dey read your message, photo or password. E dey always show notice when e dey on.',
  'lang.title':'Language','rhythm.rest':'Sleep','rhythm.school':'School','rhythm.prayer':'Prayer','rhythm.now':'Now','units.h':'hr','units.min':'min','home.sync':'Update my rules' },
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
