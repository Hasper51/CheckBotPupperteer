const puppeteer = require('puppeteer');
const data = require('./data.json');

main();

async function main(){
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
    await page.waitForSelector('#users')
    await page.type('#users', login)
    await page.type('#parole', password)
    await page.click('#logButton')
    await page.waitForSelector('#heading1')
    await page.click('#heading1')
    await page.waitForSelector('#menu_li_6118')
    await page.click('#menu_li_6118')
    //вариант 1 проверено
    // const xp = '//span/a[text()="Начать занятие"]';
    // const el = await page.waitForXPath(xp);
    // await el.click();
    
    //вариант 2 нужно проверить
    const linkHandlers = await page.$x("//span/a[text()='Начать занятие']");

    if (linkHandlers.length > 0) {
      await linkHandlers[0].click();
    } else {
      console.log("Link not found")
    }
    
    await page.click('#logButton_do_enter');
    
  }
  await browser.close();
  console.timeEnd('FirstWay');
}
