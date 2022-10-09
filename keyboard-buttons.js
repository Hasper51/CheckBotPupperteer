// let add_points={
//   manage: 'Управление',
//   updates: 'Обновления'
// }
let base_cost = 49
let cost_3_month = Math.ceil(base_cost*3-base_cost*3*0.1)
let cost_6_month = Math.ceil(base_cost*6-base_cost*6*0.15)
let cost_12_month = Math.ceil(base_cost*12-base_cost*12*0.2)
module.exports = {
   
  home: {
    switch: '⚙️ Статус работы ⚙️',
    subscription: '💳 Купить подписку',
    check_subscription: '🔍 Проверить подписку',
    settings: '🛠 Редактировать дисциплины 🛠',
    //...add_points
  }, 
  // manage: {
  //   settings: 'Редактировать дисциплины',
  //   subscription: 'Подписка'
  // },
  //back: 'Назад',
  payment: {
    inline_keyboard:  [
      //[
      //  {
      //    text: 'Тест 1 месяц - 1руб',
      //    callback_data: 'payment_1_1'
      //  }
      //],
      [
        {
          text: `1 месяц - ${base_cost}руб`,
          callback_data: `payment_1_${base_cost}`
        }
      ],
      [
        {
          text: `3 месяца - ${cost_3_month}руб`,
          callback_data: `payment_3_${cost_3_month}`
        }
      ],
      [
        {
          text: `6 месяцов - ${cost_6_month}руб`,
          callback_data: `payment_6_${cost_6_month}`
        }
      ],
      [
        {
          text: `12 месяцов - ${cost_12_month}руб`,
          callback_data: `payment_12_${cost_12_month}`
        }
      ]
    ]
  }

}



