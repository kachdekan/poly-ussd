
const { menu } = require('../menu')
const { db } = require('../fbconfig')
const logger = require('firebase-functions/logger');


menu.state('spacesHome', {
  run: () => {
    menu.con('Spaces. Choose option:' +
            '\n1. My Spaces' +
            '\n2. Create Group Space' +
            '\n3. Create Personal Space' +
            '\n4. Join a Space' +
            '\n5. Fund a Space' +
            '\n0. Back 00. Home');
  },
  next: {
    "1": "mySpaces",
    "2": "newGroupSpace",
    //"3": "newPersonalSpace",
    //"4": "joinSpace",
    //"5": "fundSpaceFromHome",
    "0": "userMenu",
    "00": "userMenu"
  }
})

menu.state('mySpaces', {
  run: () => {
    const spaces = null
    if(spaces !== null){
      menu.con('My Spaces' +
            '\n1. Wrong Rende' +
            '\n2. Trip to Dar' +
            '\n3. Masomo' +
            '\n0. Back 00. Home');
    }else{
      
      menu.con('You dont have any spaces!' +
          '\n1. Create Group Space' +
          '\n2. Create Personal Space' +
          '\n3. Join a Space' +
          '\n0. Back 00. Home')
    }
  },

  next: {
    "1": "newGroupSpace",
    //"2": "newPersonalSpace",
    //"3": "joinSpace",
    "0": 'spacesHome',
    "00": 'userMenu',
  }
})

//Creating a group space ==> Rosca
menu.state('newGroupSpace', {
  run: () => {
    menu.con('Type of Group space:' +
            '\n1. Goal Saving Group' +
            '\n2. Rosca Savings Group' +
            '\n0. Back 00. Home');
  },
  next: {
    //"1": "newSavingsGroup",
    "2": "newRoscaGroup",
    "0": "userMenu",
    "00": "userMenu"
  }
})

menu.state('newRoscaGroup', {
  run: () => {
    menu.session.set('roscaDetails', {})
    menu.con('Enter a name for your ROSCA');
  },
  next: {
    "*[A-Za-z0-9]+": "potSize",
  }
})

menu.state('potSize', {
  run: () => {
    menu.session.set('roscaDetails', {name: menu.val})
    menu.con("Enter Pot amount in USDC")
  },
  next: {
    "*\\d+": "contribSchedule"
  }
})

menu.state('contribSchedule', {
  run: async () => {
    let roscaDetails = await menu.session.get('roscaDetails')
    roscaDetails = {...roscaDetails, goalAmount: menu.val}
    menu.session.set('roscaDetails', roscaDetails).then(() => {
      menu.session.set('invites', [])
      menu.con("Enter Pot Contribution Schedule" +
      "\n 1. Everday" +
      "\n 2. Weekly + Day" +
      "\n 3. Monthly + Day")
    })
    
  },
  next: {
    "*\\d+": () => {
      menu.con("Please enter as follows:" +
        "\nEverday or" +
        "\nWeekly + Monday? or" +
        "\nMonthly + Sunday")
    },
    "*\\w+\\ +\\+\\ +\\w+": 'inviteToGroup'
  }
})

menu.state('inviteToGroup', {
   run: async () => {
    
    let invites = await menu.session.get('invites')
    if(invites.length < 1){
      let roscaDetails = await menu.session.get('roscaDetails')
      roscaDetails = {...roscaDetails, schedule: menu.val}
      await menu.session.set('roscaDetails', roscaDetails)
      invites.push(menu.val)
      menu.session.set('invites', invites).then(() => {
         menu.con("Invite by phoneNumber: " + invites.length +
      "\n 00. Skip")
      })
    }else{
      invites.push(menu.val)
      menu.session.set('invites', invites).then(() => {
         menu.con("Invite by phoneNumber: " + invites.length +
      "\n 00. Done")
      })
    }

  },
  next: {
    "*[^00]": "inviteToGroup",
    "*^00": "createRosca"
  }
})

menu.state('createRosca', {
   run: async () => {
    const { customAlphabet} = await import('nanoid');
    const nanoid = customAlphabet('1234567890ABCDEF', 10)
    let roscaDetails = await menu.session.get('roscaDetails')
    let invites = await menu.session.get('invites')
    const authCode = nanoid()
    roscaDetails = {...roscaDetails, members: invites, authCode}
    logger.info(roscaDetails)
    menu.end("Rosca created successfully!" +
    "\nInvite Code: " + authCode
    )
  },
})

module.exports = {
  spacesMenuStates: menu.states
}