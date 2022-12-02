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

menu.states = {
  ...menu.states, 
  ...obMenuStates, 
  ...accMenuStates, 
}

menu.state('testfn', {
  run: async () => {
    functions.logger.info("Wallets");
    db.ref(menu.args.phoneNumber + '/wallets').once('value',  (wallets)=>{
      let walletList = []
      Object.values(wallets.val()).forEach((wallet,i) => 
        walletList= [...walletList, (i+1) +". "+ wallet.walletName.charAt(0).toUpperCase()+ wallet.walletName.slice(1)]
      )
      functions.logger.info(walletList)
      menu.con('My wallets \n' + walletList.join("\n") +
            '\n0. Back');
    })
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