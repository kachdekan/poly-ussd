const UssdMenu = require('ussd-builder');
const { obMenuStates } = require('./test2')
const { menu } = require('./functions/menu')

//console.log(obMenuStates)

//let menu = new UssdMenu();
let menu2 = new UssdMenu();

menu2.state('userMenu', {
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
  }
})
//menu.states = {...menu.states, ...menu2.states, ...obMenuStates}

menu.startState({
    next: {
      '': async () => {
        //check if user has an a wallet
        let hasAccount = false;
        if(hasAccount){
            return 'userMenu';
          }
          else {
            return 'registerMenu';
          }
        }
    }
});

menu.state('registerMenu', {
  run: () => {
    menu.session.set('mnemonic', " ")
    menu.con('Welcome. Choose option:' +
            '\n1. Create an Account' +
            '\n2. Import an Account' + 
            '\n3. Test Fn');
  },
  next: {
    "1": "userMenu"
  }
})


console.log(menu.states)