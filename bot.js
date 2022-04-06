const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config()
const puppeteer = require('puppeteer');
const data = require('./data.json');
const ontime = require('ontime');
const Json = [];
const fs = require('fs')
const kb = require('./keyboard-buttons');
const disciplines = require('./disciplines.json');
const keyboard = require('./keyboard');
const schedule = require('./parce')
let weekday;

const bot = new TelegramBot(process.env.token, {
  webHook: {
    port: process.env.port
  }
});
bot.setWebHook(`${process.env.url}/bot${process.env.token}`)


let person = {
    login: '',
    password: '',
    group: '',
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
        bot.sendMessage(msg.chat.id, "Идет проверка...")
        person.password = match
        person.chat_id = userId
        await register();
        console.log(person)
        person = {
          login: '',
          password: '',
          group: '',
          chat_id: ''
        }
        console.log("Завершено")
    }else{
        bot.sendMessage(msg.chat.id, "Сначала введите логин")
    }
    
    
})

function addSchedule(){
  data.active.forEach((elem, index) => {
    try{
      schedule('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', elem.group)
    }catch(e){
      console.log("Не удалось загрузать расписание для: "+elem.group)
    }
  })
}

async function register(){
  console.log("register")
  const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox']})
  const page = await browser.newPage();
  try{
        await page.goto('https://lk.sut.ru/cabinet/')
  } catch (error){
        console.error(error)
        console.log("FAILED. Сайт долго отвечат на запрос.")
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
  }catch(error){
    console.log(person.chat_id+" :Неверный логин или пароль.")
    bot.sendMessage(userId, "Повторите попытку! Неверный логин или пароль.")
    return
  } 
  try{ 
    await page.waitForSelector("#logo")
    await page.click("#heading1 > h5:nth-child(1) > div:nth-child(1) > font:nth-child(2) > nobr:nth-child(1)")
    await page.waitForSelector("#menu_li_6118")
    await page.click('#menu_li_6118')
    await page.waitForSelector('a.style_gr:nth-child(1)')
    let group = await page.$eval('a.style_gr:nth-child(1) > b:nth-child(1)', el => el.innerText)
    await page.click('#menu_li_6119')
    await page.waitForSelector('.smalltab > thead:nth-child(1) > tr:nth-child(1)')
    let sub = await page.evaluate(() => {
        let subjectsList = [];
        let totalSearchResults = document.querySelectorAll('.smalltab > thead:nth-child(1) > tr:nth-child(1) > th');
        totalSearchResults.forEach(i => {
          let title = i.textContent
          if(title=='Военная подготовка' || title=='Элективные дисциплины по физической культуре и спорту'){
              subjectsList.push(
                  {
                      title: title,
                      type: "Практические занятия",
                      status: true
                  }
              )
          }else{
              subjectsList.push(
                  {
                  title: title,
                  type: "Лекция",
                  status: true
                  }, 
                  {
                  title: title,
                  type: "Практические занятия",
                  status: true
                  }
              )
          }
      });

        subjectsList = subjectsList.slice((4))
        return subjectsList
    })
    
    disciplines.push({
      chat_id: person.chat_id,
      disciplines: sub
    })
    fs.writeFileSync("disciplines.json", JSON.stringify(disciplines))

    person.group=group
    data.active.push(person)
    fs.writeFileSync("data.json", JSON.stringify(data))
    await schedule('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', group)
    
    bot.sendMessage(userId, "Принято! Ознакомиться с командами можно через меню.\n Вызов клавиатуры командой /keyboard")
    console.log(userId+': Зарегистрировался')
  } catch (error) {
    console.log("Повторите попытку! Неверный логин или пароль.")
    bot.sendMessage(userId, "Повторите попытку! Неверный логин или пароль.")
  }

  await browser.close();
}

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
        }
      })
    }
  })
})
//Отправка сервисных сообщений всем
bot.onText(/\/smessage/, (msg) => {
  const chatId = msg.chat.id
  if(chatId === 458784044 || chatId === 411038540){
    bot.sendMessage(chatId, "Напишите и отправьте сообщениие, оно будет разослано всем.\n Чтобы отменить рассылку отправьте «Отмена»");
    bot.once('message', (msg) => {
      if(msg.text.toLowerCase() =="отмена"){
        
      }else {
        data.active.concat(data.disabled).forEach((element) => {
          bot.sendMessage(element.chat_id, msg.text)
        })
      }
      
    })
    
  }
})






bot.on('callback_query', query => {
  const { chat, message_id, text } = query.message
  let data_l;
  let status_enabled = 'Включено ✅'
  let status_disabled = 'Отключено ❌'
  try {
    data_l = JSON.parse(query.data)
  }catch(e) {
    throw new Error(e.message)
  }
  
  let {userIndex, itemIndex} = data_l;
  
    
  try {
  let disciplineStatus = disciplines[userIndex].disciplines[itemIndex].status
  // if(disciplineStatus){
  //   disciplines[userIndex].disciplines[itemIndex].status=false;
  // }else{
  //   disciplines[userIndex].disciplines[itemIndex].status=true;
  // }
  disciplines[userIndex].disciplines[itemIndex].status = disciplineStatus==true?false:true;
  
  for(let i=0; i<data.active.length; i++){
    if(data.active[i].chat_id=== chat.id){
      data.active[i].disciplines.forEach(element => {
        for (let value of Object.values(element)) {
          if(value!==null){
            if (value.title == disciplines[userIndex].disciplines[itemIndex].title && value.type == disciplines[userIndex].disciplines[itemIndex].type){
              value.status = disciplines[userIndex].disciplines[itemIndex].status
              break
            }
          }
        }
      })
    }
  }
  
  fs.writeFileSync("data.json", JSON.stringify(data))
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
      bot.sendMessage(chatId,"https://telegra.ph/AutoCheckBot-Beta-10-04-18")
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
          `${item.title}\n${item.type}`, 
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
  cycle: ['weekday 09:00:00']
  
}, function(ot){
  addSchedule()
  ot.done();
  return
}),

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

async function main(){
  let date = new Date();
  let time = date.getHours();
  let timeConverter = {
    9:1,
    10:2,
    13:3,
    14:4,
    17:5,
    18:6
  }
  console.log("\x1b[37m", date.toString());
  console.time('FirstWay');
  const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox']})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/', { waitUntil: 'networkidle2' })
  page.on('dialog', async dialog => {
    await dialog.accept()
	});
  for (let i=0; i<data.active.length; i++) { 
    //Нужно проверить
    if(data.active[i].disciplines[weekday][timeConverter[time]]==null || data.active[i].disciplines[weekday][timeConverter[time]].status==false)continue
    
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
  
  const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox']})
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
