var moment = require('moment');

// var currentDate = moment('2015-10-30');
// var futureMonth = moment(currentDate).add(1, 'M');
// var futureMonthEnd = moment(futureMonth).endOf('month');

// if(currentDate.date() != futureMonth.date() && futureMonth.isSame(futureMonthEnd.format('YYYY-MM-DD'))) {
//     futureMonth = futureMonth.add(1, 'd');
// }

// console.log(currentDate);
// console.log(futureMonth);

let createdDate = moment(new Date()).utc().format();
let expirationDate = moment(createdDate).add(6, 'month');
let sub_days = expirationDate.diff(createdDate, 'days')
console.log(typeof(sub_days))