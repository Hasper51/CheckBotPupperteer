// let add_points={
//   manage: 'Управление',
//   updates: 'Обновления'
// }
module.exports = {
   
  home: {
    switch: 'Статус работы',
    subscription: 'Купить подписку',
    check_subscription: 'Проверить подписку',
    settings: 'Редактировать дисциплины',
    //...add_points
  }, 
  // manage: {
  //   settings: 'Редактировать дисциплины',
  //   subscription: 'Подписка'
  // },
  //back: 'Назад',
  payment: {
    inline_keyboard:  [
      [
        {
          text: 'Тест 1 месяц - 1руб',
          callback_data: 'payment_1_1'
        }
      ],
      [
        {
          text: '1 месяц - 79руб',
          callback_data: 'payment_1_79'
        }
      ],
      [
        {
          text: '3 месяца - 219руб',
          callback_data: 'payment_3_219'
        }
      ],
      [
        {
          text: '6 месяцов - 429руб',
          callback_data: 'payment_6_429'
        }
      ],
      [
        {
          text: '12 месяцов - 799руб',
          callback_data: 'payment_12_799'
        }
      ]
    ]
  }

}



