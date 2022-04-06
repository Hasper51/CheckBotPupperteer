const kb = require('./keyboard-buttons')

module.exports = {
  home: [
    [kb.home.switch_on, kb.home.switch_off],
    [kb.home.status],
    //[kb.home.manage],
    [kb.home.updates]
  ],
  manage: [
    [kb.back]
  ]
}