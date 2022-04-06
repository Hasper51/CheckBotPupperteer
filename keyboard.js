const kb = require('./keyboard-buttons')

module.exports = {
  home_1: [
    [kb.home_1.switch],
    // [kb.home_1.switch_on, kb.home.switch_off],
    // [kb.home_1.status],
    //[kb.home_1.manage],
    [kb.home_1.updates]
  ],
  home_2: [
    [kb.home_2.switch],
    // [kb.home_2.switch_on, kb.home.switch_off],
    // [kb.home_2.status],
    //[kb.home_2.manage],
    [kb.home_2.updates]
  ],
  manage: [
    [kb.back]
  ]
}