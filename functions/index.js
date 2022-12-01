const express = require('express');
const functions = require('firebase-functions');
const { db } = require('./fbconfig')
const { menu } = require('./menu')

const app = express();
app.use(express.json());
app.use(express.urlencoded());

//Add states from features
const { obMenuStates } = require('./essentials/onboarding');
const { accMenuStates } = require('./essentials/account')
const { walMenuStates } = require('./wallet')

menu.states = {
  ...menu.states, 
  ...obMenuStates, 
  ...accMenuStates, 
  ...walMenuStates
}

menu.state('testfn', {
  run: async () => {
    functions.logger.info("Mnemonic");
    const mnemonic = await menu.session.get('mnemonic');
    functions.logger.info(mnemonic.split(' ').length == 24);
    //const encryptedText = await encryptData("Hello world", "223344")
    //menu.end("Token:" + encryptedText)
    const ref = db.ref(menu.args.phoneNumber);
    ref.once('value', (data) => {
    // do some stuff once
      functions.logger.info(data.val())
      menu.end(data.val().userDetails.name)
    });
  },
})

app.post('/ussd', (req, res) => {
    // Read the variables sent via POST from our API
    let args = {
        phoneNumber: req.body.phoneNumber,
        sessionId: req.body.sessionId,
        serviceCode: req.body.serviceCode,
        //Operator: req.body.networkCode || req.body.Operator,
        text: req.body.text
    };
    menu.run(args, response => {
        res.send(response);
    });
});

//exports.menu
exports.ussdpoly = functions.https.onRequest(app);