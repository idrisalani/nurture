const admin = require('firebase-admin');
const logger = require('./logger');

// Push notifications are optional: without Firebase credentials the API still runs and sendPush() logs and skips.
const { FIREBASE_PROJECT_ID: projectId, FIREBASE_PRIVATE_KEY: key, FIREBASE_CLIENT_EMAIL: clientEmail } = process.env;
if (!admin.apps.length && projectId && key && clientEmail) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, privateKey: key.replace(/\\n/g, '\n'), clientEmail }) });
} else if (!admin.apps.length) {
  logger.warn('Firebase credentials not set: push notifications are disabled.');
}
module.exports = admin.apps.length ? admin : { messaging: () => ({ send: async () => { throw new Error('Firebase is not configured'); } }) };
