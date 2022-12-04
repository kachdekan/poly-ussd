const { menu } = require('../menu')
const { db } = require('../fbconfig')
const logger = require('firebase-functions/logger')
const { getRoscaDetails, fundRoscaRound, getRoscaBalance } = require('./spacesManager')

menu.state('roscaHome', {
  run: () => {
    menu.session.get('spaces').then((rosca) => {
      menu.session.set('rosca', rosca[menu.val - 1])
      menu.con(
        rosca[menu.val - 1].spaceName +
          '. Choose option:' +
          '\n1. Balance' +
          '\n2. Fund Round' +
          '\n3. Withdraw Funds' +
          '\n4. Invite Members' +
          '\n5. More Details' +
          '\n0. Back 00. Home',
      )
    })
  },
  next: {
    1: 'getRoscaBalance',
    2: 'fundRoscaRound',
    //"3": "newPersonalSpace",
    //"4": "joinSpace",
    5: 'roscaDetails',
    0: 'mySpaces',
    '00': 'userMenu',
  },
})

menu.state('getRoscaBalance', {
  run: async () => {
    const rosca = await menu.session.get('rosca')
    const totalBal = await getRoscaBalance(rosca['spaceAddress'])
    menu.con(
      rosca.spaceName +
        "'s Total Bal: " +
        '\n$ ' +
        totalBal +
        '\n≈ Ksh ' +
        (totalBal * 124.75).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        '\n0. Back 00. Home',
    )
  },
  next: {
    0: 'roscaHome',
    '00': 'mySpaces',
  },
})

menu.state('roscaDetails', {
  run: async () => {
    const rosca = await menu.session.get('rosca')
    const details = await getRoscaDetails(rosca['spaceAddress'])
    menu.con(rosca.spaceName + ' details: \n' + details + '\n0. Back 00. Home')
  },
  next: {
    0: 'roscaHome',
    '00': 'mySpaces',
  },
})

menu.state('fundRoscaRound', {
  run: () => {
    menu.con('Enter Amount (USDC):')
  },
  next: {
    '*\\d+': 'fundRound',
  },
})

menu.state('fundRound', {
  run: async () => {
    const rosca = await menu.session.get('rosca')
    const results = await fundRoscaRound(menu.val, rosca['spaceAddress'])
    if (results) {
      menu.con('Round successfully funded!' + '\n0. Back 00. Home')
    } else {
      menu.end('Transaction Failed!')
    }
  },
  next: {
    0: 'roscaHome',
    '00': 'mySpaces',
  },
})

module.exports = {
  roscaMenuStates: menu.states,
}
