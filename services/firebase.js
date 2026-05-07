const admin = require("firebase-admin");

const credentials = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIALS, "base64").toString("utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

const db = admin.firestore();

module.exports = { db };