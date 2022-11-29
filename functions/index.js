const express = require('express');
const functions = require('firebase-functions');
const UssdMenu = require('ussd-builder');

const app = express();
app.use(express.json());
app.use(express.urlencoded());

let menu = new UssdMenu();

let mnemonic = "";
let pincode = "";

//Initial state
menu.startState({
    next: {
      '': () => {
        //check if user has an a wallet
        const hasAccount = false;
        if(hasAccount){
          return 'userMenu';
            }
          else {
            return 'registerMenu';
          }
        }
    }
});

//Onboarding
menu.state('registerMenu', {
  run: () => {
    menu.con('Welcome. Choose option:' +
            '\n1. Create an Account' +
            '\n2. Import an Account');
  },
  next: {
    '1': 'registration',
    '2': 'importation'
  }
})

menu.state('importation', {
  run: () => {
    mnemonic = "";
    menu.con("Enter your seed phrase, 8 words at a time!" + "\n First 8?");
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'nextEight'
  }
})

menu.state('nextEight', {
  run: () => {
    if (menu.val.split(' ').length == 8){
      mnemonic = menu.val;
      menu.con("Your seedphrase:" + "\n" + mnemonic + "\n Next 8?");
    }else {
      menu.con("You entered less words" + "\n Re-enter Next 8?");
    }
    
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'lastEight'
  }
})

menu.state('lastEight', {
  run: () => {
    if (menu.val.split(' ').length == 8){
      mnemonic = mnemonic +" "+ menu.val;
      menu.con("Your seedphrase:" + "\n" + mnemonic + "\n Last 8?");
    }else{
      menu.con("You entered less words" + "\n Re-enter Last 8?");
    }
    
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'displayMnemonic'
  }
})

menu.state('displayMnemonic', {
  run: () => {
    mnemonic = mnemonic +" "+ menu.val
    menu.con("Your seedphrase:" + 
            "\n" + mnemonic + 
            "\n1. Continue" + 
            "\n2. Re-enter phrase");
  },
  next: {
    '1': 'registration',
    '2': 'importation'
  }
})

menu.state('registration', {
  run: () => {
    menu.con("Enter your name (first and last name):");
  },
  next: {
    '*\\w+\\ +\\w+': 'setPasscode'
  }
})

menu.state('setPasscode', {
  run: () => {
    const name = menu.val.split(' ')
    menu.con(name[0] + " please enter a 6 (six) digit pin code:");
  },
  next: {
    '*\\d+': 'confirmPasscode'
  }
})

menu.state('confirmPasscode', {
  run: () => {
    pincode = menu.val
    menu.con("Re-enter code to confirm:");
  },
  next: {
    '*\\d+': () => {
      //const pincode = "223344"
      if(menu.val === pincode){
        return 'createWallet';
      }else
        return 'confirmPasscode';
  }}
})

menu.state('createWallet', {
  run: () => {
    if(mnemonic.split(' ').length == 24){
      menu.end("Creating an account for you with your Seedpharse");
    }else{
      menu.end("Creating an account for you" + "\n" + mnemonic);
    }
  },
  next: {

  }
})

//App
menu.state('userMenu', {
  run: () => {
    menu.con('Welcome. Choose option:' +
            '\n1. Balance' +
            '\n2. Deposit' +
            '\n3. Transfer' +
            '\n4. Space' +
            '\n5. My Account');
  },
  next: {

  }
}) 

menu.state('showBalance', {
    run: () => {
        // fetch balance
        const bal = "20.00"
        // use menu.end() to send response and terminate session
        menu.end('Your balance is GHC ' + bal);
    }
});

menu.state('buyAirtime', {
    run: () => {
        menu.con('Enter amount:');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'buyAirtime.amount'
    }
});

// nesting states
menu.state('buyAirtime.amount', {
    run: () => {
        // use menu.val to access user input value
        menu.end('Airtime bought successfully.');
    }
});

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

exports.ussdpoly = functions.https.onRequest(app);