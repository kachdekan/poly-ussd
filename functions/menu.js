const UssdMenu = require('ussd-builder');
const { db } = require('./fbconfig')

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
            return 'userMenu';
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

module.exports = { menu }
