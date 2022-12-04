const { utils } = require('ethers')
const { config } = require('../blockchain/configs')
const { smartContractCall } = require('../blockchain/blockchainHelper')
const { spacesIface } = require('../blockchain/contracts')

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
}
