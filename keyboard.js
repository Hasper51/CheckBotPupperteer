const kb = require('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.switch],
    [kb.home.updates],
    [kb.home.manage]
  ],
  manage: [
    [kb.manage.settings],
    [kb.manage.subscription,],
    [kb.back]
  ]
  
}