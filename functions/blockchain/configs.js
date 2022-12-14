const deployed = require('../blockchain/Abis/Jsons/deployed.json')

const configPolygonMumbai = {
  jsonRpcUrlPrimary: 'https://rpc-mumbai.maticvigil.com', //'https://rpc-mumbai.matic.today',
  blockscoutUrl: 'https://mumbai.polygonscan.com/',
  apiBlockscountEndpoint: 'https://api-testnet.polygonscan.com/api',
  name: 'mumbai',
  chainId: 80001,
  contractAddresses: {
    StableToken: '0xE097d6B3100777DC31B34dC2c58fB524C2e76921', //USDC
    MaticToken: '0x0000000000000000000000000000000000001010',
    Spaces: deployed[80001][0].contracts.Spaces.address, //deployed[chainId][0].contracts.Spaces.address,
    RoscaSpace: '0x0000000000000000000000000000000000000000',
    PersonalSpace: '0x0000000000000000000000000000000000000000',
    GroupSpace: '0x0000000000000000000000000000000000000000',
  },
}

exports.config = Object.freeze(configPolygonMumbai)
