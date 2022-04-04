const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const data = require('./data.json');
const ontime = require('ontime');
const Json = [];
const fs = require('fs')
const token = '5129741970:AAHW4FjyT0I22ArMcaIZyMRgi_Tqx3oYeRc'
const CHAT_ID = require('./chat_id.json')

const bot = new TelegramBot(token, {polling: true});

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
    data.push(person)
    fs.writeFileSync("data.json", JSON.stringify(data))
    bot.sendMessage(userId, "Принято!")
  } catch (error) {
    console.log("The element didn't appear.")
    bot.sendMessage(userId, "Повторите попытку! Неверный логин или пароль.")
  }

  await browser.close();
}
bot.onText(/\/activate/, async msga => {
  CHAT_ID.push({first_name:msga.from.first_name,username:msga.from.username, chat_id:msga.from.id});
  console.log(CHAT_ID);
  //await sendFunction();
})
bot.onText(/\/start/, msg => {
    const {id} = msg.chat;
    bot.sendMessage(id, `Привет, ${msg.from.first_name}!
Здесь можно добавить свои данные для автоматизации некоторых процессов в лк sut`)
    bot.sendMessage(id, 
`Чтобы отправить логин напишите:
/login Ваш логин
Затем отправьте пароль командой:
/pass Ваш пароль
`)
})






ontime({
  cycle: ['weekday 09:05:00', 'weekday 10:50:00', 'weekday 13:05:00', 'weekday 14:50:00', 'weekday 16:25:00', 'weekday 18:10:00','sat 09:05:00', 'sat 10:50:00', 'sat 13:05:00', 'sat 14:50:00', 'sat 16:25:00', 'sat 18:10:00']
  
}, function(ot){
  main();
  ot.done();
  return
}),
ontime({
  cycle: ['weekday 09:45:00', 'weekday 10:20:00', 'weekday 11:30:00', 'weekday 12:05:00', 'weekday 13:50:00', 'weekday 14:25:00', 'weekday 15:35:00', 'weekday 16:10:00', 'weekday 17:00:00', 'weekday 17:50:00', 'weekday 18:55:00', 'weekday 19:25:00', 'sat 09:45:00', 'sat 10:20:00', 'sat 11:30:00', 'sat 12:05:00', 'sat 13:50:00', 'sat 14:25:00', 'sat 15:35:00', 'sat 16:10:00', 'sat 17:00:00', 'sat 17:50:00', 'sat 18:55:00', 'sat 19:25:00']
  
}, function(oto){
  secondary();
  oto.done();
  return
}),
ontime({
  cycle: ['weekday 10:30:00', 'weekday 12:15:00', 'weekday 14:30:00', 'weekday 16:15:00', 'weekday 17:55:00', 'weekday 19:25:00', 'weekday 17:15:20','sut 10:30:00', 'sut 12:15:00', 'sut 14:30:00', 'sut 16:15:00', 'sut 17:55:00', 'sut 19:25:00']
  
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

async function main(){
  date = new Date();
  console.log(date.toString());
  console.time('FirstWay');
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/')
  page.on('dialog', async dialog => {
    await dialog.accept()
	});
  for (let i=0; i<data.length; i++) {
    let login = data[i].login;
    let password = data[i].password;
    let chat_id = data[i].chat_id;
    await page.waitForSelector('#users')
    await page.type('#users', login)
    await page.type('#parole', password)
    await page.click('#logButton')
    await page.waitForSelector('#heading1')
    await page.click('#heading1')
    await page.waitForSelector('#menu_li_6118')
    await page.click('#menu_li_6118')
    await page.waitForSelector('#bak')
    //вариант 1 проверено
    try{
      const xp = '//span/a[text()="Начать занятие"]';
      const el = await page.waitForXPath(xp, {timeout: 300});
      await el.click();
      console.log(login+": НАЖАТО!")
      bot.sendMessage(chat_id, "Занятие началось в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
    }catch(e){
      console.log(login+": Link not found")
      bot.sendMessage(chat_id, "Кнопка начать занятие не найдена в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
      Json.push({login:login, password:password, chat_id:chat_id});
      
    }
    
    
    //вариант 2 нужно проверить
    
    // const linkHandlers = await page.$x("//tr/td/span/a[text()='Начать занятие']");
    // console.log(linkHandlers)

    // if (linkHandlers.length > 0) {
    //   await linkHandlers[0].click();
    // } else {
    //   console.log(login+": Link not found")
    // }
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.log(Json)
  console.timeEnd('FirstWay');
}

async function secondary(){
  date = new Date();
  console.log(date.toString());
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
    await page.waitForSelector('#users')
    await page.type('#users', login)
    await page.type('#parole', password)
    await page.click('#logButton')
    await page.waitForSelector('#heading1')
    await page.click('#heading1')
    await page.waitForSelector('#menu_li_6118')
    await page.click('#menu_li_6118')
    await page.waitForSelector('#bak')
    //вариант 1 проверено
    try{
      const xp = '//span/a[text()="Начать занятие"]';
      const el = await page.waitForXPath(xp, {timeout: 300});
      await el.click();
      console.log(login+": -----НАЖАТО!-----")
      bot.sendMessage(chat_id, "Занятие началось в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
      Json.splice(i,1)
      
    }catch(e){
      console.log(login+": Link not found")
      bot.sendMessage(chat_id, "Кнопка начать занятие не найдена в "+date.toLocaleTimeString('ru-RU', {hour12:false}))
    }
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.timeEnd('FirstWay');
}
