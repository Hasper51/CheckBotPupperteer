const TelegramBot = require('node-telegram-bot-api');
const Json = require('./data.json')
const fs = require('fs')
const debug = require('./helpers')
const puppeteer = require('puppeteer');
const token = '5129741970:AAHW4FjyT0I22ArMcaIZyMRgi_Tqx3oYeRc'
//const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, {polling: true});


let person = {
    login: '',
    password: ''
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
        await main();
        console.log(person)
        person.login = '';
        person.password = '';
        console.log("Завершено")
    }else{
        bot.sendMessage(msg.chat.id, "Сначала введите логин")
    }
    
    
})


async function main(){
  console.log("MAIN")
  const browser = await puppeteer.launch({headless:false})
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
    console.log('#heading1')
    Json.push(person)
    fs.writeFileSync("data.json", JSON.stringify(Json))
    bot.sendMessage(userId, "Принято!")
  } catch (error) {
    console.log("The element didn't appear.")
    bot.sendMessage(userId, "Повторите попытку! Неверный логин или пароль.")
  }

  await browser.close();
}

bot.onText(/\/start/, msg => {
    const {id} = msg.chat
    bot.sendMessage(id, `Привет, ${msg.from.first_name}!
Здесь можно добавить свои данные для автоматизации некоторых процессов в лк sut`,)
    bot.sendMessage(id, 
`Чтобы отправить логин и пароль напишите:
/login Ваш логин
/pass Ваш пароль
`)
})

