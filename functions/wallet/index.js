const { menu } = require('../menu')
const { db } = require('../fbconfig')


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

module.exports = {
  walMenuStates: menu.states
}