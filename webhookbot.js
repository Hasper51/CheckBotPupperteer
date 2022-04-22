import https from 'https'
import express from 'express'
import fs from 'fs'
import 'env.ts'

const app = express();


const server = https.createServer({
    key: fs.readFileSync('path/to/server.key'),
    cert: fs.readFileSync('path/to/server.cert')
}, app);

const url =  'https://localhost:3000'
const token = '1003173362:AAHwMBjqn1Wm_TOMbDzELobJ2pSPcPgZVGk'

const options = {
        webHook: {
            port: 3000
        }
    };
    
const bot = new TelegramBot(token, options);
bot.setWebHook(`${url}/bot${token}`);

// const rthw = /bot${token};


// app.post(rthw ,(req: Request, res: Response) =>{
// telegrambot.processUpdate(req.body);
// res.sendStatus(200);
// });

// server.listen(3000, () => {
//     console.log('Local server on!');
// })