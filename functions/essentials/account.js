const { menu } = require('../menu')
const { db } = require('../fbconfig')

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

module.exports = {
  accMenuStates: menu.states
}