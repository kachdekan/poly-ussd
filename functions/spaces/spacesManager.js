const { utils } = require('ethers')
const { config } = require('../blockchain/configs')
const { smartContractCall } = require('../blockchain/blockchainHelper')
const { spacesIface, roscaIface } = require('../blockchain/contracts')
const { shortenAddress, areAddressesEqual } = require('../utils/addresses')
const logger = require('firebase-functions/logger')

//Write functions
async function createRosca(roscaDetails) {
  //Create inivite code
  const { customAlphabet } = await import('nanoid')
  const nanoid = customAlphabet('1234567890ABCDEF', 10)
  const authCode = nanoid()
  //Work on amount
  const occurance = roscaDetails.schedule.split(' ')
  const ctbAmount = utils
    .parseUnits((roscaDetails.goalAmount / roscaDetails.members.length).toFixed(6).toString(), 6)
    .toString()
  const goalAmount = utils.parseUnits((roscaDetails.goalAmount * 1).toFixed(6), 6).toString()
  const imageLink =
    'https://i.picsum.photos/id/876/300/200.jpg?hmac=8UujDKOEz1cEpCX6yfGDJQIj0kACqA--5nyTQhQtFic'
  try {
    let txData = {
      token: config.contractAddresses['StableToken'],
      roscaName: roscaDetails.name,
      imageLink,
      authCode,
      goalAmount,
      ctbAmount,
      ctbDay: occurance.length > 2 ? occurance[2] : 'Daily',
      ctbOccur: occurance[0],
      disbDay: occurance.length > 2 ? occurance[2] : 'Daily',
      disbOccur: occurance[0],
    }
    const txReceipt = await smartContractCall('Spaces', {
      method: 'createRosca',
      methodType: 'write',
      params: [Object.values(txData)],
    })
    return handleRoscaCreationResponce(txReceipt, authCode) //force authCode in
  } catch (e) {
    console.log(e)
  }
}

async function fundRoscaRound(amount, roscaAddr) {
  const fundAmount = utils.parseUnits((amount * 1).toFixed(6), 6).toString()
  const txReceipt = await smartContractCall('Rosca', {
    contractAddress: roscaAddr,
    approvalContract: 'StableToken',
    method: 'fundRound',
    methodType: 'write',
    params: [fundAmount],
  })
  if (txReceipt.status == 1 && txReceipt.confirmations == 1) {
    return true
  }
}

//Read Functions
async function getMySpaces() {
  const mySpaces = await smartContractCall('Spaces', {
    method: 'getMySpaces',
    methodType: 'read',
  })
  let menuList = []
  mySpaces.forEach((rosca, i) => {
    menuList.push(`${i + 1}. ${rosca.spaceName}`)
  })
  return { menuList, mySpaces }
}

async function getRoscaDetails(addr) {
  const roscaDetails = await smartContractCall('Rosca', {
    contractAddress: addr,
    method: 'getDetails',
    methodType: 'read',
  })
  const dueDate = new Date(roscaDetails.nxtDeadline.toString() * 1000)
  const details = {
    address: shortenAddress(roscaDetails.roscaAddress, true, true),
    totalBal: utils.formatUnits(roscaDetails.roscaBal.toString(), 6),
    activeMembers: roscaDetails.activeMembers.toString(),
    roundFor: shortenAddress(roscaDetails.creator, true),
    nxtDeadline: dueDate.toDateString(),
  }
  return `Addr: ${details.address}\nBal: ${details.totalBal} USDC\nMembers: ${details.activeMembers}\nPotter: ${details.roundFor}\nDeadline: ${details.nxtDeadline}`
}

async function getRoscaBalance(addr) {
  const balance = await smartContractCall('Rosca', {
    contractAddress: addr,
    method: 'getRoscaBalance',
    methodType: 'read',
  })
  return (utils.formatUnits(balance.toString(), 6) * 1).toFixed(2)
}

//Handling transactions
const handleRoscaCreationResponce = (txReceipt, authCode) => {
  const { data, topics } = txReceipt.logs.find(
    (el) => el.address === config.contractAddresses['Spaces'],
  )
  const results = spacesIface.parseLog({ data, topics })
  if (results) {
    const roscaDetails = {
      address: results.args.roscaAddress,
      roscaName: results.args[2][1],
      goalAmount: utils.formatUnits(results.args[2][4], 6),
      goalAmountPaid: 0,
      ctbDay: results.args[2][6],
      ctbOccur: results.args[2][7],
      authCode,
    }
    return roscaDetails
  }
}

module.exports = {
  createRosca,
  getMySpaces,
  getRoscaDetails,
  fundRoscaRound,
  getRoscaBalance,
}
