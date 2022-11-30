const express = require('express');
const functions = require('firebase-functions');
const admin = require('firebase-admin')
const UssdMenu = require('ussd-builder');
const { encryptWallet } = require('./wallet/walletManager')
const { createWallet, generateWalletFromMnemonic } = require('./blockchain/blockchainHelper')
const { saltyPasscode } = require('./utils/encryption')

const app = express();
app.use(express.json());
app.use(express.urlencoded());

var serviceAccount = require("./poly-ussd-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://poly-ussd-default-rtdb.firebaseio.com"
});

let menu = new UssdMenu();
let db = admin.database();

let mnemonic = "";
let pincode = "";
const walletsListCache = {}

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
            '\n2. Import an Account' + 
            '\n3. Test Fn');
  },
  next: {
    '1': 'registration',
    '2': 'importation',
    '3': 'testfn',
  }
})

menu.state('testfn', {
  run: async () => {

    //const encryptedText = await encryptData("Hello world", "223344")
    //menu.end("Token:" + encryptedText)
    
    pincode = "223344"
    const wallet = await createWallet()
    encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
      db.ref(menu.args.phoneNumber + "@Dekan").child("wallets").push(
        encyrptedWallet
      )}).then(() => {
        menu.end("Creating an account for you")
      })
  },
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
    //Store name and number to db
    const name = menu.val.split(' ')
    db.ref(menu.args.phoneNumber + "@" + name[0]).child("userDetails").set({
      name: menu.val,
      phoneNo: menu.args.phoneNumber,
    }).then(()=>{
      menu.con(name[0] + " please enter a 6 (six) digit pin code:");
    })
    
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
      if(menu.val === pincode){
        //Create a user token
        saltyPasscode(menu.val).then((token) => {
          db.ref(menu.args.phoneNumber + "@Dekan").child("userDetails")
            .child("userToken").set(token)
        })
        return 'createWallet';
      }else
        return 'confirmPasscode';
  }}
})

menu.state('createWallet', {
  run: async () => {
    if(mnemonic.split(' ').length == 24){
      const wallet = await generateWalletFromMnemonic(mnemonic)
      encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
      db.ref(menu.args.phoneNumber + "@Dekan").child("wallets").push(
        encyrptedWallet
      )}).then(() => {
        menu.con("Account imported successfully!" + "\n0. Home")
      })
    }else{
      const wallet = await createWallet()
      encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
      db.ref(menu.args.phoneNumber + "@Dekan").child("wallets").push(
        encyrptedWallet
      )}).then(() => {
        menu.con("Account created successfully!" + "\n0. Home")
      })
    }
  },
  next: {
    "0": 'userMenu'
  }
})

//App
menu.state('userMenu', {
  run: () => {
    menu.con('Welcome. Choose option:' +
            '\n1. Balance' +
            '\n2. Deposit' +
            '\n3. Transfer' +
            '\n4. Spaces' +
            '\n5. My Account');
  },
  next: {

  }
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


exports.ussdpoly = functions.https.onRequest(app);