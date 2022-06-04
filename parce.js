const puppeteer = require('puppeteer');
const data = require('./data.json');
const fs = require('fs')
module.exports = schedule;
async function schedule(url, groupNumber) {
    const browser = await puppeteer.launch({headless:true, args: ['--no-sandbox'],executablePath: '/usr/bin/chromium-browser'});
    try{
    let startTime = Date.now();
   
    const page = await browser.newPage();
    //await page.setUserAgent(userAgent.toString());
    await page.goto(url, { waitUntil: 'networkidle2' });

    
    //await page.evaluate(val => document.querySelector('input[name="field-keywords"]').value = val, searchTerm);

    let link = await page.$(`a[data-nm='${groupNumber}']`);

    //console.log("link: "+link)
    await link.click();
    //await page.waitForSelector('#rasp-prev')
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    
    
    const result = await page.evaluate(() => {
        let data_mas = [];
        
        let subjects_length = document.querySelectorAll('.vt244').length;
        
        for (let i = 1; i <= 6; i++) {
            
            data_obj = {}
            for (let j = 0; j < subjects_length-1; j++) {
                let count = document.querySelectorAll(".vt283")[j].textContent
                let obj = document.querySelectorAll(`.rasp-day${i}`)[j]
                //let status = obj.querySelector('.vt240')==null  ? false : true
                if(obj.querySelector('.vt240')!==null){
                    let type = obj.querySelector('.vt243').textContent.replace(/\t|\n|[0-9]|[()]/g, '')
                    if(type=='Лабораторная работа')type = 'Практические занятия'
                    let title = obj.querySelector('.vt240').textContent.replace(/\t|\n|[0-9]|[()]/g, '').trimEnd()
                    data_obj[`${count}`] = {
                        title: title,
                        type: type,
                        status: true
                    }
                }else data_obj[`${count}`] = null
                //data_obj.type = obj.querySelector('.vt240')==null  ? '' : obj.querySelector('.vt240').textContent.replace(/\t|\n|[0-9]|[()]/g, '').trimEnd()
                
                //data_obj.type = obj.querySelector('.vt243').innerText;
                
                
                
            }
            data_mas.push(data_obj)
            
        }
        return data_mas
    });
    
    //console.log(result)
    data.active.forEach(elem => {
        if (elem.group==groupNumber){
            elem.disciplines=result
        }
    })
    fs.writeFileSync("data.json", JSON.stringify(data))
    
    console.log('Файл parce.js //// Time: ', (Date.now() - startTime) / 1000, 's');
    }catch(e){
        console.log(e)
    }finally{
        await browser.close();
    }
    
}

//schedule('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', 'ИСТ-032');