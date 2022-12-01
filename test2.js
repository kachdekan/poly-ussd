const UssdMenu = require('ussd-builder');

//Onboarding
let obMenu = new UssdMenu();

obMenu.state('registerMenu', {
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

obMenu.state('testfn', {
  run: async () => {
   console.log("Test Fin")
  },
})

obMenu.state('importation', {
  run: () => {
    importation = true;
    menu.con("Enter your seed phrase, 8 words at a time!" + "\n First 8?");
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'nextEight'
  }
})

obMenu.state('nextEight', {
  run: () => {
    console.log("Hello world")
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'lastEight'
  }
})

obMenu.state('lastEight', {
  run: () => {
    if (menu.val.split(' ').length == 8){
      console.log("Hello world")
    }else{
      menu.con("You entered less words" + "\n Re-enter Last 8?");
    }
    
  },
  next: {
    '*\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+\\ +\\w+': 'displayMnemonic'
  }
})

obMenu.state('displayMnemonic', {
  run: () => {
    console.log("Hello world")
  },
  next: {
    '1': 'registration',
    '2': 'importation'
  }
})

obMenu.state('registration', {
  run: () => {
    menu.con("Enter your name (first and last name):");
  },
  next: {
    '*\\w+\\ +\\w+': 'setPasscode'
  }
})

obMenu.state('setPasscode', {
  run: () => {
    //Store name and number to db
    console.log("Hello world")
    
  },
  next: {
    '*\\d+': 'confirmPasscode'
  }
})

obMenu.state('confirmPasscode', {
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

obMenu.state('createWallet', {
  run: async () => {
    console.log("Hello world")
  },
  next: {
    "0": 'userMenu'
  }
})

module.exports = {
  obMenuStates: obMenu.states
}