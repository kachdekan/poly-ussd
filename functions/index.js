const express = require('express');
const functions = require('firebase-functions');
const { db } = require('./fbconfig')
const { menu } = require('./menu')

const app = express();
app.use(express.json());
app.use(express.urlencoded());

//Connect Provider
const { connectToProvider, isProviderSet, getProvider } = require('./blockchain/provider');
async function connectProvider() {
  await connectToProvider();
}
connectProvider()

//Add states from features
const { obMenuStates } = require('./essentials/onboarding');
const { accMenuStates } = require('./essentials/account');

menu.states = {
  ...menu.states, 
  ...obMenuStates, 
  ...accMenuStates, 
}

menu.state('testfn', {
  run: async () => {
    if(isProviderSet()){
      functions.logger.info(getProvider())
      menu.end("Provider Connected")
    }else {
      functions.logger.info(getProvider())
      menu.end("Provider Not connected")
    }
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