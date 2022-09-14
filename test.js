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
async function run() {
  try {
      await mongoClient.connect();
      const db = mongoClient.db("AutoCheckBotDatabase");
      const collection = db.collection("users");
      // let groups = await collection.distinct("group")
      // console.log(groups)
      // for (let i = 0; i < groups.length; i++){
      //   let schedule = await scheduleFunc('https://www.sut.ru/studentu/raspisanie/raspisanie-zanyatiy-studentov-ochnoy-i-vecherney-form-obucheniya', groups[i])
      //   console.log(schedule);
      //   collection.updateMany(
      //     {group: groups[i],},
      //     {
      //       $set: {
      //         'schedule': schedule
              
      //         }
            
      //     },false,true
      //   )
      // }
      //------------Изменение статуса предмета------------
      // await collection.updateOne(
      //   {chat_id: chat_id},
      //   {
      //     $set: {
      //       'disciplines.$[el].status': false,
      //       'schedule.$[el].$[el].status': false 
      //     }
      //   },
      //   {
      //     arrayFilters: [{
      //         "el.title": discipline, 
      //         "el.type": type
            
      //     }]
      //   }
      // )
       
      //----------Изменение статуса работы бота --------------
      // const oldStatus = await collection.findOne({ chat_id: chat_id}); 
      // const newStatus = !oldStatus.active; 
      // await collection.findOneAndUpdate({ chat_id: chat_id}, { $set: { active: newStatus } }); 
      // let res = await collection.find().toArray();
      // console.log(res)
      
      
      
      // const results = await collection.find({ chat_id: 458784044},{projection: { _id: 0, chat_id:1 }}).toArray()
      // if(results.length > 0)console.log("Завершено");
      
      
      // const results = await collection.find({ chat_id: chat_id},{projection: { _id: 0, active:1 }}).toArray()
      // console.log(results[0].active)
      
      
    // let a = 0
    // const res = await collection.find({active: true}).project({
    //     _id: 0,
    //     login: 1,
    //     password: 1,
    //     chat_id: 1,
    //     schedule: {$slice: [a,1]}
    // }).toArray()
    // console.log(res[7])

    let remains_after_main = [ 878048633, 803368333, 411038540 ]
    
    let res = await getDataForScriptMain()
    console.log(res)
    for (let i=0; i<res.length; i++) { 
        
        // if(res[i].schedule[weekday][timeConverter[time]]==null || res[i].schedule[weekday][timeConverter[time]].status==false)
        let current_discipline = res[i].schedule[0][1]
        
        if(current_discipline==null)continue
        else{
            let discipline_index = res[i].disciplines.findIndex(function(item, index){
                
                if(item.title == current_discipline.title){
                if(item.type == current_discipline.type)
                
                    return index
                }
            })
            console.log(discipline_index)
            if(res[i].disciplines[discipline_index]==false)continue
        }
        console.log("CODE")
        
        
    }
    // const res = await collection.find({active: true}).project({
    //     _id: 0,
    //     login: 1,
    //     password: 1,
    //     chat_id: 1,
    //     schedule: {

    //         $slice: [0,1]
        
    //     }
    //   }).toArray()
    
  }catch(err) {
      console.log(err);
      console.log("Ошибка подключения к БД");
  } finally {
      await mongoClient.close();
      console.log("Подключение закрыто");
  }
}
run();



