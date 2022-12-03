const { menu } = require('../menu')
const { db } = require('../fbconfig')
const { isSignerSet } = require('../blockchain/signer')
const { isProviderSet, connectToProvider}  = require('../blockchain/provider')
const { getBalances } = require('../blockchain/blockchainHelper')
const logger = require('firebase-functions/logger')
const { NativeTokensByAddress } = require('./tokens')


menu.state("getBalance", {
  run: async () => {
    //change to used active wallet
    let balances = {}
    const wallet = (await db.ref(menu.args.phoneNumber + '/activeWallet').once('value')).val()
    
    if(isProviderSet()){
      if(isSignerSet(menu.args.phoneNumber)){
        balances = await getBalances(wallet.address, NativeTokensByAddress)
        logger.info(balances)
      }
      const tokenAddrs = Object.keys(NativeTokensByAddress)
      const totalBal = ((balances[tokenAddrs[1]]*1.0)+(balances[tokenAddrs[0]]*0.95)).toFixed(2)
      menu.end("\nTotal Bal: $" + totalBal +
          "\n--------" +
          "\nUSDC:  " + (balances[tokenAddrs[1]]* 1.0).toFixed(2) + 
          "\nMATIC: " + (balances[tokenAddrs[0]]* 1.0).toFixed(4) +
          "\n--------" +
          "\n≈ Ksh" + (totalBal*124.75).toFixed(2))
    }else {
      await connectToProvider()
      menu.end("Provider Not connected! Please try again. ")
    }
   
  },
  next: {
  }
})


module.exports = {
  walMenuStates: menu.states
}