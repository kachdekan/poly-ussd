const express = require('express');
const functions = require('firebase-functions');

const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.post('/ussd', (req, res) => {
    // Read the variables sent via POST from our API
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text,
    } = req.body;

    let response = '';
    const hasAccount = false;

    if (text == '') {
        // This is the first request. Note how we start the response with CON
        if (hasAccount){
          response = `CON Welcome to UssdPoly
            1. Balance
            2. Deposit
            3. Transfer
            4. Spaces
            5. My Account`;
        }else {
          response = `CON Welcome to UssdPoly
            1. Create an Account
            2. Use existing Account`;
        }
    } else if ( text == '1') {
        if (hasAccount){
        // Business logic for first level response
          response = `CON Your Current Balance is:
          $100.0000 (USxD)
          ≈ Ksh12675.00 
          1. Specific Token Balance`;
        }else {
          response = `CON Enter your name`;
        }
        
    } else if ( text == '2') {
        // Business logic for first level response
        // This is a terminal request. Note how we start the response with END
        if(hasAccount){
          response = `END Your phone number is ${phoneNumber}`;
        }else{
          response = `CON Enter your seed phrase, 8 words at a time!
          First 8?`;
        }
        
    } else if ( text == '1*1') {
        // This is a second level response where the user selected 1 in the first instance
        const LinkBalance = '10.001';
        // This is a terminal request. Note how we start the response with END
        response = `END Your LINK balance:
           ${LinkBalance} LINK
           ≈ Ksh 675.35`;
    } else if (text.slice(0,2) == "1*" && text.length > 5 && text.split(' ').length > 1 ) {
        const name = text.split('*')
        response = `END Your name is ${name[1]}`;
    } else if (text.split(' ').length == 8) {
      const fstEight = text.replace("2*", "");
      response = `CON ${fstEight}
      Second 8?`;
    } else if (text.split(' ').length + 1 == 16) {
      const fstEight = text.replace("2*", "");
      const sndEight = fstEight.replace("*", " ");
      response = `CON ${sndEight}
      Last 8?`;
    } else if (text.split(' ').length + 2 == 24) {
      const fstEight = text.replace("2*", "");
      const sndEight = fstEight.replace("*", " ");
      const lstEight = sndEight.replace("*", " ");
      response = `END Your mnemonic is:
      ${lstEight}`;
    }

    // Send the response back to the API
    res.set('Content-Type: text/plain');
    res.send(response);
});

exports.ussdpoly = functions.https.onRequest(app);