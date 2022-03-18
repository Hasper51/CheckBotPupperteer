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
bot.onText(/\/login (.+)/, (msg, [source, match]) => {
    person.login = match
    console.log(person)
    bot.sendMessage(msg.chat.id, "Теперь пароль")
    bot.onText(/\/pass (.+)/, async (msg, [source, match]) => {
        person.password = match
        await main();
        console.log(person)
        Json.push(person)
        fs.writeFileSync("data.json", JSON.stringify(Json))
        person.login = '';
        person.password = '';
        bot.sendMessage(msg.chat.id, "Принято!")
    })
})



async function main(){
  console.log("MAIN")
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage();
  await page.goto('https://lk.sut.ru/cabinet/')

  let login = person.login;
  let password = person.password;
  await page.waitForSelector('#users')
  await page.type('#users', login)
  await page.type('#parole', password)
  await page.click('#logButton')
  try {
    await page.waitForSelector('#heading1')
    console.log('#heading1')
    // ...
  } catch (error) {
    console.log("The element didn't appear.")
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

