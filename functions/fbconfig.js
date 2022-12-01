const admin = require('firebase-admin')

var serviceAccount = require("./poly-ussd-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://poly-ussd-default-rtdb.firebaseio.com"
});

let db = admin.database();

module.exports = {
  db
}
