const puppeteer = require('puppeteer');
const data = require('./data.json');
const ontime = require('ontime');

ontime({
  cycle: ['weekday 09:05:00', 'weekday 09:45:00', 'weekday 10:20:00', 'weekday 10:50:00', 'weekday 11:30:00', 'weekday 12:05:00', 'weekday 13:05:00', 'weekday 13:50:00', 'weekday 14:25:00', 'weekday 14:50:00', 'weekday 15:35:00', 'weekday 16:10:00', 'weekday 16:25:00', 'weekday 17:00:00', 'weekday 17:50:00', 'weekday 18:10:00', 'weekday 18:55:00', 'weekday 19:25:00','sat 09:05:00', 'sat 09:45:00', 'sat 10:20:00', 'sat 10:50:00', 'sat 11:30:00', 'sat 12:05:00', 'sat 13:05:00', 'sat 13:50:00', 'sat 14:25:00', 'sat 14:50:00', 'sat 15:35:00', 'sat 16:10:00', 'sat 16:25:00', 'sat 17:00:00', 'sat 17:50:00', 'sat 18:10:00', 'sat 18:55:00', 'sat 19:25:00'],
  log: true
}, function(ot){
  main();
  ot.done();
  return
})

main();
async function main(){
  console.time('FirstWay');
  const browser = await puppeteer.launch({headless:false})
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
    // try{
    //   const xp = '//span/a[text()="Начать занятие"]';
    //   const el = await page.waitForXPath(xp, {timeout: 300});
    //   await el.click();
    // }catch(e){
    //   console.log("Link not found")
    // }
    
    
    //вариант 2 нужно проверить
    
    const linkHandlers = await page.$x("//tr/td/span/a[text()='Начать занятие']");
    console.log(linkHandlers)

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
