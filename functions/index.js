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
let sessions = {};
menu.sessionConfig({
    start: (sessionId, callback) => {
        if(!(sessionId in sessions)) sessions[sessionId] = {};
        callback();
    },
    end: (sessionId, callback) => {
        delete sessions[sessionId];
        callback();
    },
    set: (sessionId, key, value, callback) => {
        sessions[sessionId][key] = value;
        callback();
    },
    get: (sessionId, key, callback) => {
        let value = sessions[sessionId][key];
        callback(null, value);
    }
});

//let mnemonic = "";
let pincode = "";
let importation = false;
//Initial state
menu.startState({
    next: {
      '': async () => {
        //check if user has an a wallet
        let hasAccount = false;
        await db.ref(menu.args.phoneNumber).once('value', (data) => {
          userData = data.val()
          if(userData !== null){
            hasAccount = userData.userDetails.userToken && userData.wallets ? true : false
          }else{
            hasAccount = false; 
          }
        });
        functions.logger.info(hasAccount)
        //functions.logger.info(ref.key === menu.args.phoneNumber);
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
    menu.session.set('mnemonic', " ")
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
    /*pincode = "223344" https://poly-ussd-default-rtdb.firebaseio.com/%2B254712345678%40Dekan
    const mnemonic = "quick someone refuse shrimp wash spike strong despair license faint random cup belt luxury tuna special link rude mesh slight picnic trim meat maid"
    const wallet = await generateWalletFromMnemonic(mnemonic)
    encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
        menu.end(encyrptedWallet.address)
      })*/
  },
})

menu.state('importation', {
  run: () => {
    importation = true;
    menu.con("Enter your seed phrase, 8 words at a time!" + "\n First 8?");
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'nextEight'
  }
})

menu.state('nextEight', {
  run: () => {
    if (menu.val.split(' ').length == 8){
      let mnemonic = menu.val;
      menu.session.set('mnemonic', mnemonic)
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
      menu.session.get('mnemonic').then((mnemonic) => {
        let newMnemonic = mnemonic +" "+ menu.val;
        menu.session.set('mnemonic', newMnemonic)
        menu.con("Your seedphrase:" + "\n" + newMnemonic + "\n Last 8?");
      })
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
    menu.session.get('mnemonic').then((mnemonic) => {
        let newMnemonic = mnemonic +" "+ menu.val;
        menu.session.set('mnemonic', newMnemonic)
        menu.con("Your seedphrase:" + 
            "\n" + newMnemonic + 
            "\n1. Continue" + 
            "\n2. Re-enter phrase");
      })
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
    db.ref(menu.args.phoneNumber).child("userDetails").set({
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
          db.ref(menu.args.phoneNumber).child("userDetails").child("userToken").set(token)
        })
        return 'createWallet';
      }else
        return 'confirmPasscode';
  }}
})

menu.state('createWallet', {
  run: async () => {
    const mnemonic = await menu.session.get('mnemonic');
    if(mnemonic.split(' ').length == 24){
      const wallet = await generateWalletFromMnemonic(mnemonic)
      encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
      db.ref(menu.args.phoneNumber).child("wallets").push(
        encyrptedWallet
      )}).then(() => {
        menu.con("Account imported successfully!" + "\n0. Home")
      })
    }else{
      const wallet = await createWallet()
      encryptWallet(pincode, wallet).then((encyrptedWallet)=>{
      db.ref(menu.args.phoneNumber).child("wallets").push(
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
            '\n5. My Account' +
            '\n6. Test Fn');
  },
  next: {
    //"1": "getBalance",
    //"2": "depositValue",
    //"3": "transferValue",
    //"4": "spacesHome",
    "5": "myAccount",
    "6": "testfn",
  }
})

menu.state("myAccount", {
  run: () => {
    db.ref(menu.args.phoneNumber + '/userDetails').once('value',  (userDetails)=>{
      const name = userDetails.val().name.split(" ") 
      menu.con(name[0] + '. Choose option:' +
            '\n1. Mini Statement' +
            '\n2. Wallets' +
            '\n3. Add wallet' +
            '\n4. Change PIN' +
            '\n5. Invite a Friend' +
            '\n0. Back');
    })
   
  },
  next: {
    "0": "userMenu",
    "2": "myWallets",
  }
})

menu.state("myWallets", {
  run: () => {
    db.ref(menu.args.phoneNumber + '/wallets').once('value',  (wallets)=>{
      const walletAddrs = wallets.val().map(wallet => wallet.address)
      functions.logger.info(walletAddrs)
      menu.con('My wallets' +
            '\n1. 0x676...7867' +
            '\n2. 0x676...7867' +
            '\n0. Back');
    })
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