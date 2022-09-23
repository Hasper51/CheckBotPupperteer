const kb = require('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.switch],
    [kb.home.subscription, kb.home.check_subscription],
    [kb.home.settings],
    // [kb.home.updates],
    // [kb.home.manage]
  ],
  // manage: [
  //   [kb.manage.settings],
  //   [kb.manage.subscription,],
  //   [kb.back]
  // ]
  
}