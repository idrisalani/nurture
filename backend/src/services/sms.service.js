const axios = require('axios');

const SMS_MESSAGES = {
  otp: {
    en: (otp) => `Your NurtureNet verification code is ${otp}. Valid for 10 minutes.`,
    ha: (otp) => `Lambar tabbatarwa ta NurtureNet ita ce ${otp}. Tana aiki har minti 10.`,
    yo: (otp) => `Kóòdù ìmúdájú NurtureNet rẹ ni ${otp}. Wí fún ìṣẹ́jú 10.`,
    ig: (otp) => `Koodu nkwado NurtureNet gị bụ ${otp}. Dị maka nkeji iri.`,
    pc: (otp) => `Your NurtureNet code na ${otp}. E go work for 10 minutes.`,
  },
  panic: (childName, mapsUrl) => `🆘 SOS ALERT: ${childName} needs help! Location: ${mapsUrl}`,
};

exports.sendOtp = async (phone, otp, lang = 'en') => {
  const message = (SMS_MESSAGES.otp[lang] || SMS_MESSAGES.otp.en)(otp);
  return sendSms(phone, message);
};

exports.sendPanicSms = async (phone, childName, mapsUrl) => {
  return sendSms(phone, SMS_MESSAGES.panic(childName, mapsUrl));
};

async function sendSms(to, sms) {
  if (!process.env.TERMII_API_KEY) {
    console.log(`[SMS MOCK] To: ${to}, Message: ${sms}`);
    return { status: 'mock' };
  }
  const resp = await axios.post('https://api.ng.termii.com/api/sms/send', {
    to, from: process.env.TERMII_SENDER_ID || 'NurtureNet',
    sms, type: 'plain', api_key: process.env.TERMII_API_KEY, channel: 'generic',
  });
  return resp.data;
}
