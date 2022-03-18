const puppeteer = require('puppeteer');
const data = require('./data.json');
main();

async function main(){
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage();
  await page.goto('https://google.com')

  
  let login = data[i].login;
  let password = data[i].password;
  await page.waitForSelector('#users')
  await page.type('#users', login)
  await page.type('#parole', password)
  await page.click('#logButton')
  await page.waitForSelector('#heading1')
  await page.click('#heading1')

  await browser.close();
}
