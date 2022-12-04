const { menu } = require('../menu')
const { db } = require('../fbconfig')
const logger = require('firebase-functions/logger')
const { createRosca, getMySpaces } = require('./spacesManager')

menu.state('spacesHome', {
  run: () => {
    menu.con(
      'Spaces. Choose option:' +
        '\n1. My Spaces' +
        '\n2. Create Group Space' +
        '\n3. Create Personal Space' +
        '\n4. Join a Space' +
        '\n5. Fund a Space' +
        '\n0. Back 00. Home',
    )
  },
  next: {
    1: 'mySpaces',
    2: 'newGroupSpace',
    //"3": "newPersonalSpace",
    //"4": "joinSpace",
    //"5": "fundSpaceFromHome",
    0: 'userMenu',
    '00': 'userMenu',
  },
})

menu.state('mySpaces', {
  run: async () => {
    const spaces = await getMySpaces()
    if (spaces.mySpaces.length > 1) {
      menu.session.set('spaces', spaces.mySpaces)
      menu.con('My Spaces \n' + spaces.menuList.join('\n') + '\n0. Back 00. Home')
    } else {
      return 'noSpaces'
    }
  },
  next: {
    '*[1-9]+': 'roscaHome',
    0: 'spacesHome',
    '00': 'userMenu',
  },
})

menu.state('noSpaces', {
  run: () => {
    menu.con(
      'You dont have any spaces!' +
        '\n1. Create Group Space' +
        '\n2. Create Personal Space' +
        '\n3. Join a Space' +
        '\n0. Back 00. Home',
    )
  },
  next: {
    1: 'newGroupSpace',
    //"2": "newPersonalSpace",
    //"3": "joinSpace",
    0: 'spacesHome',
    '00': 'userMenu',
  },
})

//Creating a group space ==> Rosca
menu.state('newGroupSpace', {
  run: () => {
    menu.con(
      'Type of Group space:' +
        '\n1. Goal Saving Group' +
        '\n2. Rosca Savings Group' +
        '\n0. Back 00. Home',
    )
  },
  next: {
    //"1": "newSavingsGroup",
    2: 'newRoscaGroup',
    0: 'userMenu',
    '00': 'userMenu',
  },
})

menu.state('newRoscaGroup', {
  run: () => {
    menu.session.set('roscaDetails', {})
    menu.con('Enter a name for your ROSCA')
  },
  next: {
    '*[A-Za-z0-9]+': 'potSize',
  },
})

menu.state('potSize', {
  run: () => {
    menu.session.set('roscaDetails', { name: menu.val })
    menu.con('Enter Pot amount in USDC')
  },
  next: {
    '*\\d+': 'contribSchedule',
  },
})

menu.state('contribSchedule', {
  run: async () => {
    let roscaDetails = await menu.session.get('roscaDetails')
    roscaDetails = { ...roscaDetails, goalAmount: menu.val }
    menu.session.set('roscaDetails', roscaDetails).then(() => {
      let invites = []
      menu.session.set('invites', invites)
      menu.con(
        'Enter Pot Contribution Schedule' +
          '\n 1. Everday' +
          '\n 2. Weekly + Day' +
          '\n 3. Monthly + Day',
      )
    })
  },
  next: {
    '*\\d+': () => {
      menu.con(
        'Please enter as follows:' +
          '\nEverday or' +
          '\nWeekly + Monday? or' +
          '\nMonthly + Sunday',
      )
    },
    '*\\w+\\ +\\+\\ +\\w+': 'inviteToGroup',
  },
})

menu.state('inviteToGroup', {
  run: () => {
    menu.session.get('invites').then(async (invites) => {
      if (invites.length < 1) {
        let roscaDetails = await menu.session.get('roscaDetails')
        roscaDetails = { ...roscaDetails, schedule: menu.val }
        await menu.session.set('roscaDetails', roscaDetails)
        invites.push(menu.val)
        menu.session.set('invites', invites).then(() => {
          menu.con('Invite by phoneNumber: ' + invites.length + '\n 00. Skip')
        })
      } else {
        invites.push(menu.val)
        menu.session.set('invites', invites).then(() => {
          menu.con('Invite by phoneNumber: ' + invites.length + '\n 00. Done')
        })
      }
    })
  },
  next: {
    '*[^00]': 'inviteToGroup',
    '*^00': 'createRosca',
  },
})

menu.state('createRosca', {
  run: async () => {
    let roscaDetails = await menu.session.get('roscaDetails')
    let invites = await menu.session.get('invites')
    invites[0] = menu.args.phoneNumber
    roscaDetails = { ...roscaDetails, members: invites }
    const results = await createRosca(roscaDetails)
    menu.end(results.roscaName + ' created successfully!' + '\nInvite Code: ' + results.authCode)
  },
})

//Rosca states

module.exports = {
  spacesMenuStates: menu.states,
}
