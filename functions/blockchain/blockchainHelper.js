const { Wallet, BigNumber, BigNumberish, Contract, utils } = require('ethers')
const { ETHEREUM_DERIVATION_PATH } = require('../consts')

const createWallet = async (derivationPath) => {
  const path = derivationPath || ETHEREUM_DERIVATION_PATH
  const entropy = utils.randomBytes(32)
  const mnemonic = utils.entropyToMnemonic(entropy)
  const wallet = Wallet.fromMnemonic(mnemonic, path)
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  }
}

const generateWalletFromMnemonic = async (mnemonic, derivationPath) => {
  const path = derivationPath || ETHEREUM_DERIVATION_PATH
  const wallet = Wallet.fromMnemonic(mnemonic, path)
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  }
}

module.exports = {
  createWallet,
  generateWalletFromMnemonic,
}