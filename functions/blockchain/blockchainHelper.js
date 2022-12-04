const { Wallet, utils } = require('ethers')
const { getProvider } = require('./provider')
const { DERIVATION_PATH } = require('../consts')
const { config } = require('./configs')
const { getContractByAddress, getContract, getCustomContract } = require('./contracts')
const { sendTransaction, getCurrentNonce } = require('./transaction')
const axios = require('axios')

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

const getBalances = async (address, tokenMap) => {
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
  return {
    tokenAddress: config.contractAddresses.MaticToken,
    value: utils.formatUnits(balance, 18),
  }
}

const getTokenBalance = async (address, tokenAddress) => {
  let contract
  contract = getContractByAddress(tokenAddress)
  if (!contract) throw new Error(`No contract found for token: ${tokenAddress}`)
  const decimals = await contract.decimals()
  const balance = await contract.balanceOf(address)
  return { tokenAddress, value: utils.formatUnits(balance, decimals) }
}

const smartContractCall = async (contractName, args) => {
  const gasstation = await axios.get('https://gasstation-mumbai.matic.today/v2')
  const provider = getProvider()

  let contract = null
  if (args.contractAddress) {
    contract = getCustomContract(contractName, args.contractAddress)
  } else {
    contract = getContract(contractName)
  }

  //const nonce = await signer.getTransactionCount('pending')
  if (!contract) throw new Error(`No contract found for name: ${contractName}`)
  try {
    let txReceipt = null
    let unsignedTx = null
    let overrides = {}

    const feeEstimate = {
      maxPriorityFeePerGas: utils
        .parseUnits(gasstation.data.fast['maxPriorityFee'].toFixed(9).toString(), 'gwei')
        .toString(), // Recommended maxPriorityFeePerGas
      maxFeePerGas: utils
        .parseUnits(gasstation.data.fast['maxFee'].toFixed(9).toString(), 'gwei')
        .toString(),
      gasPrice: utils.parseUnits('1.55', 'gwei').toString(),
      gasLimit: utils.parseUnits('0.035', 'gwei').toString(),
      //feeToken: config.contractAddresses.StableToken,
    }

    if (args.methodType === 'read') {
      overrides = {}
    } else if (args.methodType === 'write') {
      const { maxPriorityFeePerGas, maxFeePerGas, gasLimit } = feeEstimate
      const nonce = await getCurrentNonce()
      overrides = {
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit,
        nonce,
        value: args.value ? utils.parseEther(args.value.toString()) : 0,
      }
    }

    if (args.params) {
      if (args.approvalContract) {
        const approvalContract = getContract(args.approvalContract)
        await approvalContract.approve(args.contractAddress, args.params[0])
      }
      unsignedTx = await contract.populateTransaction[args.method](...args.params, overrides)
      const limit = await provider.estimateGas({ ...unsignedTx, chainId: config.chainId, type: 2 })
      txReceipt = await sendTransaction({ ...unsignedTx, chainId: config.chainId }, limit)
    } else {
      txReceipt = await contract?.[args.method](overrides)
    }

    return txReceipt
  } catch (error) {
    throw error
  }
}

module.exports = {
  createWallet,
  generateWalletFromMnemonic,
  getBalances,
  getTokenBalance,
  smartContractCall,
}
