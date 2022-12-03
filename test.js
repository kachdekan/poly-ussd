const {config} = require('./functions/blockchain/configs')
const {decryptDataWpasscode} = require('./functions/utils/encryption')
const { getBalances } = require('./functions/blockchain/blockchainHelper')
const { Wallet } = require('ethers')
const { NativeTokensByAddress } = require('./functions/wallet/tokens')
const { connectToProvider, getProvider } = require('./functions/blockchain/provider')
const { setSigner } = require('./functions/blockchain/signer')
const { db } = require('./functions/fbconfig')


const walletList = {
  "0": {
    name: "wallet 1",
    address: "0x8E912eE99bfaECAe8364Ba6604612FfDfE46afd2",
    enMnemonic: "U2FsdGVkX19pRcfLXsX3ZL++voZ6+uY3FrNqpFBgEyvm8rY2RUeEqqzbKdXA/KmChgURsVH4n+d8+JpWrxRHXqEeK+XEMOti2AsMONNk7J/dyrw+/337X3mk0OJSRMjuY1LB4mlhgC29qOlzQmawnmw5D1e6Yb2iccVvEaopwXGf62qM+D5m4QEUtWfaTFXfCGqkGpvirvdHxWVrESAkt2iqgKFUk4WVG/wGKV47RJU=",
    enPrivateKey: "U2FsdGVkX1+EgFlNnfFa2zHYk6oRsJYfph2nsyIRcgrEjEpn4+QzEN9UM63nDngb7qwDZW/bDT0fRB6m1dQkMInmb/Vl8yvxXVo5nXfH0whQj9bsUP1oyx7JZrl3bUpz",
  },
  "1": {
    name: "wallet 2",
    address: "0x678219eyuwye637398",
    enPrivateKey: "du7866789ywq783yw792377878",
  },
  "2": {
    name: "wallet 3",
    address: "0x78uwi87yuwqyw7789",
    enPrivateKey: "uiwe766789ywq783yw792377878",
  },
}

async function runThis() {
  
  //await connectToProvider()
  //const decrypted = await decryptDataWpasscode(walletList[0].enPrivateKey, "223344")
  //Set signer
  //const provider = getProvider()
  const address = "0x8E912eE99bfaECAe8364Ba6604612FfDfE46afd2"
  const privateKey = "0x20a67adf6750c75ead6e91a6df269a250d301123723d743a8d65c3a57a7b1fa7"
  //const wallet = Wallet.fromMnemonic(mnemonic, CELO_DERIVATION_PATH)
  //const wallet = new Wallet(privateKey, provider)
  //setSigner(wallet)

  //const balances = await getBalances(address, NativeTokensByAddress)
  const balances = {
    "LINK": "0.23637",
    "USDC": "50" 
  }
  //const totalBal = ((balances["USDC"]*1.0)+(balances["LINK"]*0.95)).toFixed(2)
  //console.log((totalBal*124.76).toLocaleString(undefined, {maximumFractionDigits:2}))
  let thisToken = ""
  //await db.ref('+254712345678/userDetails/userToken').once('value', (token) => {console.log( token.val())})
  //console.log(thisToken)
  
  console.log(authCode)
}

const privateKey = "0x20a67adf6750c75ead6e91a6df269a250d301123723d743a8d65c3a57a7b1fa7"
const mnemonic =  "quick someone refuse shrimp wash spike strong despair license faint random cup belt luxury tuna special link rude mesh slight picnic trim meat maid"
//const wallet = new Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0")
const walletFp = new Wallet(privateKey)
const signer = {}

function setSignet(user){
  signer[user] = walletFp
}

var expression = new RegExp("\\w");
const num = "0"
if(expression.test(num)){
  console.log(num)
}
//setSignet("+25471234567")
//console.log(signer["+25471234567"]._signingKey())
runThis()
//console.log(wallet)

