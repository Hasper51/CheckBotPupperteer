const MongoClient = require("mongodb").MongoClient;

const scheduleFunc = require('./parce')



const url = "mongodb://localhost:27017/";
const mongoClient = new MongoClient(url);
const chat_id = 458784044;
const discipline = "Теория информации, данные, знания"
const type = 'Практические занятия'
async function getDataForScriptMain(){
    try {
      await mongoClient.connect();
      const db = mongoClient.db("AutoCheckBotDatabase");
      const collection = db.collection("users");
      
        const res = await collection.find({active: true}).project({
          _id: 0,
          login: 1,
          password: 1,
          chat_id: 1,
          disciplines: 1,
          schedule: {$slice: [1,1]}
        }).toArray()
        return res
    } catch (error) {
      console.log(error.message)
    }finally {
      await mongoClient.close();
    }
}




