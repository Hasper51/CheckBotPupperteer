const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config()
const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient(process.env.mongodb_url);
const puppeteer = require('puppeteer');
const ontime = require('ontime');
const kb = require('./keyboard-buttons');
const keyboard = require('./keyboard');
const scheduleFunc = require('./parce');
const remains_after_main = [];
let weekday;
let repeat_function_mode = false;
const bot = new TelegramBot(process.env.token, {
  polling: true
  // webHook: {
  //   port: process.env.port
  // }
});
//bot.setWebHook(`${process.env.url}/bot${process.env.token}`)




let person = {
    login: '',
    password: '',
    group: '',
    chat_id: '',
    disciplines: []
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
        await register(msg.message_id);
        console.log(person)
        person = {
          login: '',
          password: '',
          group: '',
          chat_id: '',
          disciplines: []
        }
        console.log("Завершено")
    }else{
        bot.sendMessage(msg.chat.id, "Сначала введите логин")
    }
    
    
})


async function register(message_id){
  console.log("register")
  const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox']})
  const page = await browser.newPage();
  try{
        await page.goto('https://lk.sut.ru/cabinet/')
  } catch (error){
        console.log(error.message)
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
        totalSearchResults.forEach((elem) => {
          let title = elem.textContent
          if(title=='Военная подготовка' || title=='Элективные дисциплины по физической культуре и спорту'){
              subjectsList.push(
                  {
                      title: title,
                      type: "Практические занятия",
                      status: true,
                      discipline_num: ''
                  }
              )
          }else{
              subjectsList.push(
                  {
                  title: title,
                  type: "Лекция",
                  status: true,
                  discipline_num: ''
                  }, 
                  {
                  title: title,
                  type: "Практические занятия",
                  status: true,
                  discipline_num: ''
                  }
              )
          }
        });

        subjectsList = subjectsList.slice((4))
        subjectsList.forEach((elem, index) => {
          elem.discipline_num = index
        })
        return subjectsList
    })
    
    person.disciplines = sub
    person.group=group

    
    
    
    
    await browser.close();
    
  } catch (error) {
    console.log(userId, "Повторите попытку! Не удалось загрузать ваши данные.")
    bot.editMessageText("Повторите попытку! Не удалось загрузать ваши данные.")
  }
  try {
    await addUser()
    await addSchedule(userId,person.group)
    bot.sendMessage(userId, "Принято! Ознакомиться с командами можно через меню.\n Вызов клавиатуры командой /keyboard")
    console.log(userId+': Зарегистрировался')
    console.log('addDisciplines')
  }catch(e) {
    console.error(e.message)
    if(e.code === 11000)
      bot.sendMessage(userId,"У вас уже есть зарегистрированный аккаунт")
  }finally{
    await mongoClient.close();
  }
   
  
}
bot.onText(/\/start/, msg => {
    const {id} = msg.chat;
    bot.sendMessage(id, `Привет, ${msg.from.first_name}!\nЗдесь можно добавить свои данные для автоматизации некоторых процессов в лк sut`)
    bot.sendMessage(id, `Чтобы отправить логин напишите:\n/login Ваш логин\nЗатем отправьте пароль командой:\n/pass Ваш пароль
`)
})
async function switchScript(chat_id) {
  try {
      await mongoClient.connect();
      const db = mongoClient.db("AutoCheckBotDatabase");
      const collection = db.collection("users");
      const oldStatus = await collection.findOne({ chat_id: chat_id}); 
      const newStatus = !oldStatus.active; 
      await collection.findOneAndUpdate({ chat_id: chat_id}, { $set: { active: newStatus } }); 
      return newStatus
  }catch(err) {
      console.log("Возникла ошибка");
      console.log(err);
  } finally {
      await mongoClient.close();
  }
}
async function addUser(){
    await mongoClient.connect();
    const db = mongoClient.db("AutoCheckBotDatabase");
    const collection = db.collection("users");
    await collection.insertOne({
      active: true,
      login: person.login,
      password: person.password,
      group: person.group,
      chat_id: person.chat_id,
      disciplines: person.disciplines
    }) 
}
async function addSchedule(chatId, group){
  try{
    await mongoClient.connect();
    const db = mongoClient.db("AutoCheckBotDatabase");
    const collection = db.collection("users");
    let schedule = await scheduleFunc('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', group)
    
    await collection.updateOne(
      {chat_id: chatId},
      {
        $set: {
          'schedule': schedule
          
          }
        
      }
    )
    
  }catch(e){
    console.error(e.message)
  }finally{
    await mongoClient.close();
  }
}
async function updateSchedule(){
  try{
    console.log("Updating schedule")
    await mongoClient.connect();
    const db = mongoClient.db("AutoCheckBotDatabase");
    const collection = db.collection("users");
    let groups = await collection.distinct("group")
    console.log(groups)
    for (let i = 0; i < groups.length; i++){
      let schedule = await scheduleFunc('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', groups[i])
      try {
        await collection.updateMany(
          {group: groups[i],},
          {
            $set: {
              'schedule': schedule
              
              }
            
          }
        )
      } catch (error) {
        console.log(error.message)
      }
      
    }
  }catch (e) {
    console.log(e.message)
  }finally{
    await mongoClient.close();
  }
}
async function getActiveStatus(chatId){
  await mongoClient.connect();
  const db = mongoClient.db("AutoCheckBotDatabase");
  const collection = db.collection("users");
  const results = await collection.find({ chat_id: chatId},{projection: { _id: 0, active:1 }}).toArray()
  return results[0].active
}
async function getChatIds(){
  await mongoClient.connect();
  const db = mongoClient.db("AutoCheckBotDatabase");
  const collection = db.collection("users");
  const results = await collection.find({},{projection: { _id: 0, chat_id:1 }}).toArray()
  return results
}
async function getDisciplines(chatId){
  return new Promise(async function(resolve, reject) {
    try{
      await mongoClient.connect();
      const db = mongoClient.db("AutoCheckBotDatabase");
      const collection = db.collection("users");
      const results = await collection.find({ chat_id: chatId},{projection: { _id: 0, disciplines:1}}).toArray()
      await mongoClient.close();
      //return results[0].disciplines
      resolve(results[0].disciplines)
    }catch(err){
      console.log(err.message)
      reject(err.message)
    }
  })
}

async function updateDisciplinesStatus(chatId, num, status){
  try{
    await mongoClient.connect();
    const db = mongoClient.db("AutoCheckBotDatabase");
    const collection = db.collection("users");
    await collection.updateOne(
      {chat_id: chatId, 'disciplines.discipline_num': num},
      {
        $set: {
          "disciplines.$.status": status,
        }
      }
    )
  }catch(err){
    console.log(err.message)
  }finally{
    await mongoClient.close();
  }
}
async function getDataForScriptMain(){
  try {
    await mongoClient.connect();
    const db = mongoClient.db("AutoCheckBotDatabase");
    const collection = db.collection("users");
    if(remains_after_main.length==0){
      const res = await collection.find({active: true}).project({
        _id: 0,
        login: 1,
        password: 1,
        chat_id: 1,
        schedule: {$slice: [weekday,1]}
      }).toArray()
      return res
    }else{
      const res = await collection.find({active: true, chat_id:{$in: remains_after_main}}).project({
        _id: 0,
        login: 1,
        password: 1,
        chat_id: 1,
        schedule: {$slice: [weekday,1]}
      }).toArray()
      return res
    }
    
    
  } catch (error) {
    console.log(error.message)
  }finally {
    await mongoClient.close();
  }
}
async function editDisciplinesMenu(chatId){
  
  let res = await getDisciplines(chatId)
  let status_enabled = 'Включено ✅'
  let status_disabled = 'Отключено ❌'
  let counter = 0
  let Text = ``
  let keyBoardData = [];
  let disciplinesLength = res.length
  for (let j = 0; j < Math.floor(disciplinesLength/3);j++){
    let row = [];
    for (let i = 0; i < 3; i++) {
      Text+=`${counter+1}`+'. '
      Text+=`<b>${res[counter].title}</b>`+"\n"
      
      Text+=`<i>${res[counter].type}</i>`+"\n"
      
      Text+=res[counter].status?status_enabled+"\n\n":status_disabled+"\n\n"
      
      row.push({
          text: counter+1,
          callback_data: JSON.stringify({
            discipline_num: res[counter].discipline_num,
            status: res[counter].status
          })
      });
      counter++
      if (counter === disciplinesLength)break;
    }
    keyBoardData.push(row);
    if (counter === disciplinesLength)break;
  }
  
  return {Text, keyBoardData}
}



bot.onText(/\/keyboard/, async msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, "Выберите пункт меню ", {
    reply_markup: {
      keyboard: keyboard.home
    }
  })
  
})
//Отправка сервисных сообщений всем
bot.onText(/\/smessage/, async(msg) => {
  const chatId = msg.chat.id
  
  if(chatId === 458784044 || chatId === 411038540){
    bot.sendMessage(chatId, "Напишите и отправьте сообщениие, оно будет разослано всем.\n Чтобы отменить рассылку отправьте «Отмена»");
    bot.once('message', (msg) => {
      if(msg.text.toLowerCase() =="отмена"){
        
      }else {
        let chatIds = getChatIds()
        chatIds.forEach((element) => {
          bot.sendMessage(element.chat_id, msg.text)
        })
      }
      
    })
    
  }
})






bot.on('callback_query', async query => {
  const { chat, message_id, text } = query.message
  console.log(query.data)
  switch(query.data){
    case 'switchStatus':
      let activeStatus = await switchScript(chat.id)
      let status_enabled = 'Включено ✅'
      let status_disabled = 'Отключено ❌'
      bot.editMessageText(`${text}`, {
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: { 
          inline_keyboard: [[
            {
              text: activeStatus?status_enabled:status_disabled,
              callback_data: 'switchStatus'
            }
          ]]
        }
      })
    default:
      try {
        data_l = JSON.parse(query.data)
      }catch(e) {
        throw new Error(e.message)
      }
        
      let {discipline_num, status} = data_l;
      await updateDisciplinesStatus(chat.id, discipline_num, !status)
      let {Text, keyBoardData} = await editDisciplinesMenu(chat.id)
      bot.editMessageText(Text, {
        message_id: message_id,
        chat_id: chat.id,
        parse_mode: "HTML",
        reply_markup:  {inline_keyboard:  keyBoardData} 
      })
      

  }
  
})


bot.on('message', async msg => {
  const chatId = msg.chat.id
  let status_enabled = 'Включено ✅'
  let status_disabled = 'Отключено ❌'
  switch(msg.text){
    case kb.home.switch:
      
      
      let button_status = await getActiveStatus(chatId);
      bot.sendMessage(chatId, "Текущий статус:" , 
      {
        reply_markup: {
          inline_keyboard: [
            [{
              text: button_status?status_enabled:status_disabled,
              callback_data: 'switchStatus'
              
            }]
          ]
        }
      })

      break
    case kb.home.updates:
      bot.sendMessage(chatId,"https://telegra.ph/AutoCheckBot-Beta-10-04-18")
      break
    case kb.home.manage:
      bot.sendMessage(chatId, "Выберите пункт меню ", {
        reply_markup: {
          keyboard: keyboard.manage
        }
      })
      break
    case kb.manage.settings:
      
      let {Text, keyBoardData} = await editDisciplinesMenu(chatId)
      
      
        
      bot.sendMessage(chatId, Text,
      {
        parse_mode: "HTML",
        reply_markup:  {inline_keyboard:  keyBoardData} 
      })
      
      
      break  
    case kb.back:
      bot.sendMessage(chatId, "Выберите пункт меню ", {
        reply_markup: {
          keyboard: keyboard.home
        }
      })
      break
  }
})
getWeekday();
ontime({
  cycle: ['weekday 08:00:00', 'sat 08:00:00']
  
}, function(ot){
  getWeekday();
  updateSchedule()
  ot.done();
  return
}),

ontime({
  cycle: ['weekday 09:05:00', 'weekday 10:50:00', 'weekday 13:05:00', 'weekday 14:50:00', 'weekday 16:25:00', 'weekday 18:10:00','sat 09:05:00', 'sat 10:50:00', 'sat 13:05:00', 'sat 14:50:00', 'sat 16:25:00', 'sat 18:10:00']
  
}, function(ot){
  repeat_function_mode=false
  main();
  ot.done();
  return
}),
ontime({
  cycle: ['weekday 09:45:00', 'weekday 11:30:00', 'weekday 13:50:00', 'weekday 15:35:00', 'weekday 17:00:00', 'weekday 18:55:00', 'sat 09:45:00', 'sat 11:30:00', 'sat 13:50:00', 'sat 15:35:00', 'sat 17:00:00', 'sat 18:55:00']
  
}, function(oto){
  repeat_function_mode=true
  main();
  oto.done();
  return
}),
ontime({
  cycle: ['weekday 10:30:00', 'weekday 12:15:00', 'weekday 14:30:00', 'weekday 16:15:00', 'weekday 17:55:00', 'weekday 19:25:00','sat 10:30:00', 'sat 12:15:00', 'sat 14:30:00', 'sat 16:15:00', 'sat 17:55:00', 'sat 19:25:00']
  
}, async function(ott){
  repeat_function_mode=true
  await main()
  clear()
  ott.done();
  return
})

function clear(){
  remains_after_main.splice(0, remains_after_main.length)
  console.log('cleared')
  
}

function getWeekday(){
  weekday = new Date().getDay()-1;
}
// updateSchedule()
// getWeekday()
// main()

async function main(){
try {
  let date = new Date();
  
  let time = date.getHours();
  let timeConverter = {
    9:0,
    10:1,
    13:2,
    14:3,
    17:4,
    18:5
  }
  
  console.log("\x1b[37m", date.toString());
  console.time('FirstWay');
  const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox']})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/', { waitUntil: 'networkidle2' })
  page.on('dialog', async dialog => {
    await dialog.accept()
	});
  let res = await getDataForScriptMain()
  console.log(res)
  for (let i=0; i<res.length; i++) { 
    if(!repeat_function_mode){
      if(res[i].schedule[0][timeConverter[time]]==null || res[i].schedule[0][timeConverter[time]].status==false)
      continue
    }
    let login = res[i].login;
    let password = res[i].password;
    let chat_id = res[i].chat_id;
    try {
      await page.waitForSelector('#users')
      await page.type('#users', login)
      await page.type('#parole', password)
      await page.click('#logButton')
      await page.waitForSelector('#heading1')
      await page.click('#heading1')
      await page.waitForSelector('#menu_li_6118')
      await page.click('#menu_li_6118')
      try{
        const xp = '//span/a[text()="Начать занятие"]';
        const el = await page.waitForXPath(xp, {timeout: 500});
        await el.click();
        console.log("\x1b[32m", login+": НАЖАТО!")
        bot.sendMessage(chat_id, "Занятие началось в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
        if(repeat_function_mode) remains_after_main.splice(i,1)
      }catch(e){
        console.log("\x1b[31m", login+": Link not found")
        //bot.sendMessage(chat_id, "Кнопка начать занятие не найдена в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
        if(!repeat_function_mode) remains_after_main.push(chat_id)
      }
    }catch(error){
      console.log("\x1b[33m", error)
    }  
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.log("\x1b[37m")
  console.timeEnd('FirstWay');
  console.log(remains_after_main)
} catch (error) {
    console.log("\x1b[33m", error)
}
}


