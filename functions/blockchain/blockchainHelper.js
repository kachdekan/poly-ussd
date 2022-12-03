const { Wallet, BigNumber, BigNumberish, Contract, utils } = require('ethers')
const { getProvider } = require('./provider')
const { DERIVATION_PATH } = require('../consts')
const { config } = require('./configs')
const { getContractByAddress, getContract, getCustomContract } = require('./contracts')

const createWallet = async (derivationPath) => {
  const path = derivationPath || DERIVATION_PATH
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
  const path = derivationPath || DERIVATION_PATH
  const wallet = Wallet.fromMnemonic(mnemonic, path)
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  }
}

const getBalances = async (
  address,
  tokenMap,
) => {
  const tokenAddrs = Object.keys(tokenMap)
  // TODO may be good to batch here if token list is really long
  const fetchPromises = []
  for (const tokenAddr of tokenAddrs) {
    // logger.debug(`Fetching ${t.id} balance`)
    if (tokenAddr === config.contractAddresses.MaticToken) {
      fetchPromises.push(getMaticBalance(address))
    } else {
      fetchPromises.push(getTokenBalance(address, tokenAddr))
    }
  }

  const newTokenAddrToValue = {}
  const tokenBalancesArr = await Promise.all(fetchPromises)
  tokenBalancesArr.forEach((bal) => (newTokenAddrToValue[bal.tokenAddress] = bal.value))
  return newTokenAddrToValue
}

// TODO Figure out why the balanceOf result is incorrect for MaticToken
// Contractkit works around this in the same way, must be a low-level issue
const getMaticBalance = async (address) => {
  const provider = getProvider()
  const balance = await provider.getBalance(address)
  return { tokenAddress: config.contractAddresses.MaticToken, value: utils.formatUnits(balance, 18) }
}

const getTokenBalance = async (address, tokenAddress) => {
  let contract
  contract = getContractByAddress(tokenAddress)
  if (!contract) throw new Error(`No contract found for token: ${tokenAddress}`)
  const decimals = await contract.decimals()
  const balance = await contract.balanceOf(address)
  return { tokenAddress, value: utils.formatUnits(balance, decimals) }
}

module.exports = {
  createWallet,
  generateWalletFromMnemonic,
  getBalances,
  getTokenBalance,
}