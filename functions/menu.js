const UssdMenu = require('ussd-builder');
const { isProviderSet, connectToProvider, getProvider } = require('./blockchain/provider');
const { decryptDataWtoken } = require('./utils/encryption')
const { Wallet } = require('ethers')
const { db } = require('./fbconfig');
const { setSigner, getSigner, isSignerSet } = require('./blockchain/signer');
const logger = require('firebase-functions/logger');

let menu = new UssdMenu()
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

menu.startState({
    next: {
      '': async () => {
        //check if user has an a wallet
        let hasAccount = false;
        let userData = null;
        await db.ref(menu.args.phoneNumber).once('value', (data) => {
          userData = data.val()
          if(userData !== null){
            hasAccount = userData.userDetails.userToken && userData.wallets ? true : false
          }else{
            hasAccount = false; 
          }
        });
        //functions.logger.info(ref.key === menu.args.phoneNumber);
        if(hasAccount){
            //Check connection to provider and retry to connect
            if(isProviderSet()){
              //create a signer
              if(!isSignerSet(menu.args.phoneNumber)){
                const provider = getProvider()
                const privateKey = await decryptDataWtoken(userData.activeWallet.enPrivateKey, userData.userDetails.userToken)
                const signer = new Wallet(privateKey, provider)
                setSigner(signer, menu.args.phoneNumber)
              }
              return 'userMenu';
            }else{
              await connectToProvider();
              return 'userMenu';
            }
          }
          else {
            return 'registerMenu';
          }
        }
    }
});

menu.state('userMenu', {
  run: () => {
    menu.con('Welcome. Choose option:' +
            '\n1. Balance' +
            '\n2. Deposit' +
            '\n3. Transfer' +
            '\n4. Spaces' +
            '\n5. My Account' +
            '\n6. Test Fn' +
            '\n7. Connect Provider');
  },
  next: {
    "1": "getBalance",
    //"2": "depositValue",
    //"3": "transferValue",
    "4": "spacesHome",
    "5": "myAccount",
    "6": "testfn",
    "7": "connect"
  }
})

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

menu.state('connect', {
  run: async () => {
    await connectToProvider();
    if(isProviderSet()){
      menu.end("Provider is Connected")
    }else{
      menu.end("Connection Failed")
    }
  }
})

module.exports = { menu }
