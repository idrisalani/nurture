// Reads app.json and injects the Google Maps key from the environment, so the key never lives in git.
const base = require('./app.json');
module.exports = () => {
  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  const expo = base.expo;
  return { ...base, expo: { ...expo, android: { ...expo.android, config: { ...(expo.android && expo.android.config), googleMaps: { apiKey: key } } } } };
};
