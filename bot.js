const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const data = require('./data.json');
const ontime = require('ontime');
const CHAT_ID = require('./CHAT_ID.json')
const Json = [];
const fs = require('fs')
const kb = require('./keyboard-buttons');
const disciplines = require('./disciplines.json');
const keyboard = require('./keyboard');
let weekday;

//const token = '5129741970:AAHW4FjyT0I22ArMcaIZyMRgi_Tqx3oYeRc'
const token = '1003173362:AAHwMBjqn1Wm_TOMbDzELobJ2pSPcPgZVGk'

const dis = ["Теория информации, данные, знания",
"Инфокоммуникационные системы и сети",
"Объектно-ориентированное проектирование графического интерфейса",
"Социология",
"Экология"
]
const bot = new TelegramBot(token, {polling: true});
console.log(data.active)
let person = {
    login: '',
    password: '',
    chat_id: ''
}
let userId;
bot.onText(/\/login (.+)/, (msg, [source, match]) => {
    userId = msg.chat.id;
    person.login = match
    console.log(person)
    bot.sendMessage(msg.chat.id, "Теперь пароль")
})
bot.onText(/\/pass (.+)/, async (msg, [source, match]) => {
    if(person.login!=''){
        person.password = match
        person.chat_id = userId
        await register();
        console.log(person)
        person.login = '';
        person.password = '';
        console.log("Завершено")
    }else{
        bot.sendMessage(msg.chat.id, "Сначала введите логин")
    }
    
    
})


async function register(){
  console.log("register")
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage();
  try{
        await page.goto('https://lk.sut.ru/cabinet/')
  } catch (error){
        console.error(error)
        console.log("FAILED")
        bot.sendMessage(userId, "Повторите попытку позже! Сайт долго отвечат на запрос.")
        await browser.close();
        return
  }
  
  page.on('dialog', async dialog => {
    await dialog.dismiss()
	});
  let login = person.login;
  let password = person.password;
  await page.waitForSelector('#users')
  await page.type('#users', login)
  await page.type('#parole', password)
  await page.click('#logButton')
  try {
    await page.waitForSelector('#heading1', {timeout:5000})
    data.active.push(person)
    fs.writeFileSync("data.json", JSON.stringify(data))
    bot.sendMessage(userId, "Принято! Ознакомиться с командами можно через меню.")
    console.log(userId+': Зарегистрировалась')
  } catch (error) {
    console.log("The element didn't appear.")
    bot.sendMessage(userId, "Повторите попытку! Неверный логин или пароль.")
  }

  await browser.close();
}
bot.onText(/\/activate/, async msga => {
  CHAT_ID.push({first_name:msga.from.first_name,username:msga.from.username, chat_id:msga.from.id});
  console.log(msga);
  //await sendFunction();
})
bot.onText(/\/start/, msg => {
    const {id} = msg.chat;
    bot.sendMessage(id, `Привет, ${msg.from.first_name}!\nЗдесь можно добавить свои данные для автоматизации некоторых процессов в лк sut`)
    bot.sendMessage(id, `Чтобы отправить логин напишите:\n/login Ваш логин\nЗатем отправьте пароль командой:\n/pass Ваш пароль
`)
})

bot.onText(/\/keyboard/, msg => {
  const chatId = msg.chat.id
  
  data.active.concat(data.disabled).forEach((element) => {
    if(element.chat_id === chatId){
      bot.sendMessage(chatId, "Выберите пункт меню ", {
        reply_markup: {
          keyboard: keyboard.home_2
          //selective: 
        }
      })
    }
  })
})

bot.on('callback_query', query => {
  const { chat, message_id, text } = query.message
  let data;
  let status_enabled = 'Включено ✅'
  let status_disabled = 'Отключено ❌'
  try {
    data = JSON.parse(query.data)
  }catch(e) {
    throw new Error(e.message)
  }
  console.log(query)
  let {userIndex, itemIndex} = data;
  
    
  try {
  let disciplineStatus = disciplines[userIndex].disciplines[itemIndex].status
  if(disciplineStatus){
    disciplines[userIndex].disciplines[itemIndex].status=false;
  }else{
    disciplines[userIndex].disciplines[itemIndex].status=true;
  }
  disciplines[userIndex].disciplines[itemIndex].status = disciplineStatus==true?false:true;
  fs.writeFileSync("disciplines.json", JSON.stringify(disciplines))
  
  bot.editMessageText(`${text}`, {
    chat_id: chat.id,
    message_id: message_id,
    reply_markup: { 
      inline_keyboard: [[
        {
          text: !disciplineStatus?status_enabled:status_disabled,
          callback_data: JSON.stringify({
            userIndex: userIndex,
            itemIndex: itemIndex
            
          })   
        }
      ]]
    }
  })
  }catch(e){
    throw new Error("Error writing")
  }
})


bot.on('message', msg => {
  const chatId = msg.chat.id

  switch(msg.text){
    case kb.home_1.switch:
      
      for(let i = 0; i <data.disabled.length; i++){
        if(data.disabled[i].chat_id === chatId){
          data.active.push(data.disabled[i])
          data.disabled.splice(i, 1)
          fs.writeFileSync("data.json", JSON.stringify(data))
          console.log(msg.from.first_name+" : скрипт включен")
          bot.sendMessage(chatId, "Включено")
          
          break
        }
      }
      
      bot.sendMessage(chatId,"Выберите пункт меню:", {
        reply_markup: {keyboard: keyboard.home_2}
      })
      break
    case kb.home_2.switch:
      for(let i = 0; i <data.active.length; i++){
        if(data.active[i].chat_id === chatId){
          data.disabled.push(data.active[i])
          data.active.splice(i, 1)
          fs.writeFileSync("data.json", JSON.stringify(data))
          console.log(msg.from.first_name+" : скрипт отключен")
          bot.sendMessage(chatId, "Отключено")
          break
        }
      }
      bot.sendMessage(chatId,"Выберите пункт меню:", {
        reply_markup: {keyboard: keyboard.home_1}
      })
      break
    case kb.home_2.updates:
      bot.sendMessage(chatId,"https://telegra.ph/AutoCheckBot-Beta-20-04-07")
      break
    case kb.home_2.manage:
      bot.sendMessage(chatId, "Выберите пункт меню ", {
        reply_markup: {
          keyboard: keyboard.manage
        }
      })
      break
    case kb.manage.settings:
      let index = disciplines.findIndex(id => id.chat_id == chatId)
      let status_enabled = 'Включено ✅'
      let status_disabled = 'Отключено ❌'
      disciplines[index].disciplines.forEach((item, i) => {
        let button_status = item.status
        bot.sendMessage(chatId, 
          `${item.title}\n${item.type=='lecture'?"Лекция":"Практика"}`, 
        {
          reply_markup: {
            inline_keyboard: [
              [{
                text: button_status?status_enabled:status_disabled,
                callback_data: JSON.stringify({
                  userIndex: index,
                  itemIndex: i
                }) 
              }]
            ]
          }
        })
      })
      
      break  
    case kb.back:
      bot.sendMessage(chatId, "Выберите пункт меню ", {
        reply_markup: {
          keyboard: keyboard.home_2
        }
      })
      break
  }
})



ontime({
  cycle: ['weekday 09:05:00', 'weekday 10:50:00', 'weekday 13:05:00', 'weekday 14:50:00', 'weekday 16:25:00', 'weekday 18:10:00','sat 09:05:00', 'sat 10:50:00', 'sat 13:05:00', 'sat 14:50:00', 'sat 16:25:00', 'sat 18:10:00']
  
}, function(ot){
  getWeekday();
  main();
  ot.done();
  return
}),
ontime({
  cycle: ['weekday 09:45:00', 'weekday 11:30:00', 'weekday 13:50:00', 'weekday 15:35:00', 'weekday 17:00:00', 'weekday 18:55:00', 'sat 09:45:00', 'sat 11:30:00', 'sat 13:50:00', 'sat 15:35:00', 'sat 17:00:00', 'sat 18:55:00']
  
}, function(oto){
  secondary();
  oto.done();
  return
}),
ontime({
  cycle: ['weekday 10:30:00', 'weekday 12:15:00', 'weekday 14:30:00', 'weekday 16:15:00', 'weekday 17:55:00', 'weekday 19:25:00','sat 10:30:00', 'sat 12:15:00', 'sat 14:30:00', 'sat 16:15:00', 'sat 17:55:00', 'sat 19:25:00']
  
}, async function(ott){
  await secondary()
  await clear()
  ott.done();
  return
})

function clear(){
  Json.splice(0, Json.length)
  console.log('cleared')
  
}

function getWeekday(){
  weekday = new Date().getDay()-1;
}
//getWeekday();
//main();
async function main(){
  let date = new Date();
  let time = date.getHours();
  console.log("\x1b[37m", date.toString());
  console.time('FirstWay');
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/')
  page.on('dialog', async dialog => {
    await dialog.accept()
	});
  for (let i=0; i<data.active.length; i++) { 
    
    if(!data.active[i].disciplines[weekday][time])continue
    
    let login = data.active[i].login;
    let password = data.active[i].password;
    let chat_id = data.active[i].chat_id;
    try {
      await page.waitForSelector('#users')
      await page.type('#users', login)
      await page.type('#parole', password)
      await page.click('#logButton')
      await page.waitForSelector('#heading1')
      await page.click('#heading1')
      await page.waitForSelector('#menu_li_6118')
      await page.click('#menu_li_6118')
    // await page.waitForSelector('#bak').catch(error =>{
    //   console.log(error)
    // })
    }catch(error){
      console.log("\x1b[33m", error)
    }  
    
    //вариант 1 проверено
    try{
      const xp = '//span/a[text()="Начать занятие"]';
      const el = await page.waitForXPath(xp, {timeout: 500});
      await el.click();
      console.log("\x1b[32m", login+": НАЖАТО!")
      bot.sendMessage(chat_id, "Занятие началось в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
    }catch(e){
      console.log("\x1b[31m", login+": Link not found")
      //bot.sendMessage(chat_id, "Кнопка начать занятие не найдена в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
      Json.push({login:login, password:password, chat_id:chat_id});
      
    }
    
    
    //вариант 2 нужно проверить
    
    // const linkHandlers = await page.$x("//*[@id='rightpanel']/div/table/tbody/tr[2]/td[2]/b/text()='Теория информации, данные, знания'");
    // console.log(linkHandlers)
    
    // if (linkHandlers.length > 0) {
    //   await linkHandlers[0].click();
    // } else {
    //   console.log(login+": Link not found")
    // }
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.log("\x1b[37m")
  console.timeEnd('FirstWay');
}

async function secondary(){
  let date = new Date();
  console.log("\x1b[37m", date.toString());
  console.time('FirstWay');
  
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/')
  page.on('dialog', async dialog => {
    await dialog.accept()
	});
  for (let i=0; i<Json.length; i++) {
    let login = Json[i].login;
    let password = Json[i].password;
    let chat_id = Json[i].chat_id;
    try{
      await page.waitForSelector('#users')
      await page.type('#users', login)
      await page.type('#parole', password)
      await page.click('#logButton')
      await page.waitForSelector('#heading1')
      await page.click('#heading1')
      await page.waitForSelector('#menu_li_6118')
      await page.click('#menu_li_6118')
    // await page.waitForSelector('#bak').catch(error =>{
    //   console.log(error)
      
    // })
    }catch(error){
      console.log("\x1b[33m", error)
    }
    //вариант 1 проверено
    try{
      const xp = '//span/a[text()="Начать занятие"]';
      const el = await page.waitForXPath(xp, {timeout: 400});
      await el.click();
      console.log("\x1b[32m", login+": НАЖАТО!")
      bot.sendMessage(chat_id, "Занятие началось в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
      Json.splice(i,1)
      
    }catch(e){
      console.log("\x1b[31m", login+": Link not found")
      //bot.sendMessage(chat_id, "Кнопка начать занятие не найдена в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
    }
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.log("\x1b[37m")
  console.timeEnd('FirstWay');
}
