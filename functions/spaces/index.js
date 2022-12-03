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
    //"2": "newGroupSpace",
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
    //"1": "newGroupSpace",
    //"2": "newPersonalSpace",
    //"3": "joinSpace",
    "0": 'spacesHome',
    "00": 'userMenu',
  }
})

//Creating a group space ==> Rosca


module.exports = {
  spacesMenuStates: menu.states
}