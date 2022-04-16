const puppeteer = require('puppeteer')
const disciplines = require('./disciplines.json')
const fs = require('fs')
const data = require('./data.json')
data.active.forEach(elem => {
    let login = elem.login
    let password = elem.password
    let chat_id = elem.chat_id
    getDisciplines(login, password, chat_id)
})
async function getDisciplines(Login, Password, chat_id) {
    const browser = await puppeteer.launch('chrome')
    const page = await browser.newPage()
    await page.goto('https://lk.sut.ru/cabinet/')

    await page.type('#users', Login)
    await page.type('#parole', Password)
    await page.click('#logButton')
    await page.waitForSelector("#logo")
    await page.click("#heading1 > h5:nth-child(1) > div:nth-child(1) > font:nth-child(2) > nobr:nth-child(1)")
    await page.waitForSelector("#menu_li_6118")
    await page.click('#menu_li_6118')
    await page.waitForSelector('a.style_gr:nth-child(1)')
    const group = await page.$eval('a.style_gr:nth-child(1) > b:nth-child(1)', el => el.textContent)
    await page.click('#menu_li_6119')
    await page.waitForSelector('.smalltab > thead:nth-child(1) > tr:nth-child(1)')
    const sub = await page.evaluate(() => {
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
        chat_id: chat_id,
        disciplines: sub
    })
    fs.writeFileSync("disciplines.json", JSON.stringify(disciplines))
      
    console.log(sub)
    console.log(group)
    

    await browser.close()
}


