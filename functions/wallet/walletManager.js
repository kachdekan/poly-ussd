const { encryptData } = require('../utils/encryption')


async function encryptWallet(passcode, wallet) {
  const enPrivateKey = await encryptData(wallet.privateKey, passcode)
  const enMnemonic = await encryptData(wallet.mnemonic, passcode)
  const walletName = "wallet 1"//await getDefaultNewWalletName() 
  const newWallet = {
    walletName: walletName,
    address: wallet.address,
    enPrivateKey: enPrivateKey,
    enMnemonic: enMnemonic,
  }
  return newWallet
}

module.exports = { 
  encryptWallet
}