const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account-key.json");

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vmscanner-cf24b-default-rtdb.firebaseio.com",
});

module.exports = firebaseAdmin;
