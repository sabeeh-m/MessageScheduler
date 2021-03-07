const express= require("express");
const app= express();
const cron= require("node-cron");
const moment= require("moment")();
const mysql=require("mysql");
const fetch= require("node-fetch");
const connection= require('./models/db');
// const { json } = require("express");


console.time('test');
let now= moment.format();
console.log(now);
let query=mysql.format("select * from schedules where time = ? ",[now]);
connection.query(query,function(err,data){

    if(err){
        console.log(err)
    }
    else {
console.log(data);
        data.forEach(schedule=>{
            let numbers= schedule.recipents.split(",")
            // console.log(numbers);
            // debugger;
            let message=schedule.message
            numbers.forEach(number=>{
                let dnis=number;
                schedule_id=schedule.id
                let smsData= {schedule_id,dnis,message}
                sendMessage(smsData)

            })    
            

        })

        
 
        
        
      
      
    }
    
})
console.timeEnd('test');

// let query= mysql.format('insert into schedules (time,recipents,name) values (?,?,?)',[

//     '2021-03-06 16:14:00','01111234556,1212412421,124214124','schedule2' 
// ])
// connection.query(query,function(err,data){
// if(err){
//     console.log(err)
// }else {

//     console.log("done");

// }

// })
// cron.schedule('* * * * *',()=>{

//     console.log(moment().format())
// })
// console.log(moment().format())
// console.log(moment().toDate().getTime())


const sendMessage=  (smsdata)=>{

    fetch("http://kr8tif.lawaapp.com:1338/api",{

                method:"post",
                headers:{
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify(smsdata)

            }).then(res=>res.json()).then( async  (res)=>{
                //  console.log(res);
                //  let obj= {scheduleid:1,number:smsdata.dnis,message_id:res.message_id,status:data.status}
                 let url="http://kr8tif.lawaapp.com:1338/api?messageId="+res.message_id
                   
                   let msgData = await checkStatus(url)
                    console.log("---")
                    console.log(msgData)
                    console.log("---")
                   if(  msgData ){
                     
                     let {status,delivery_time}= msgData;
                     console.log(status)
                   
                    if(status!='DELIVRD'){
                      
                        // console.log(i) 
                        // console.log('status is not delivered')
                        let query=mysql.format("insert into sms_status(schedule_id,message_id,recipent,time_sent,status) values(?,?,?,?,?) ",
                        [smsdata.schedule_id,res.message_id,smsdata.dnis,delivery_time,status]
                        )
                        connection.query(
                        query,(err,data)=>{
                            if(err){
                                console.log(err)
                            }else{
                                console.log('query executed')
                            return   sendMessage(smsdata)

                            }

                        }
                            )

                    }
                    else{

                        let query=mysql.format("insert into sms_status(schedule_id,message_id,recipent,time_sent,status) values(?,?,?,?,?) ",
                    [smsdata.schedule_id,res.message_id,smsdata.dnis,delivery_time,status]
                    )
                    connection.query(
                    query,(err,data)=>{
                        if(err){
                            console.log(err)
                        }else{
                            console.log(status);
                        console.log("great Success!!")

                        }

                    }
                        )

                    }
                    

                 }
             
                
                 // forEach((resp)=>{
                //     
                  


                // })
            
            
            })
            .catch(err=>{

                console.log(err)
            })



}

const checkStatus= (url)=>{
    const p = new Promise((resolve,reject)=>{
         fetch(url).then(data=>data.json()).then( async msgData=>{
            // let statusArray=[]
            
          
            //  console.log(msgData)
            let {status}=msgData;
            while(status=='ACCEPTD'){
                console.log("accepted this time")
                console.log("status== " +status)   
                status = await statusAccepted(url)
                 
            }
        //  else{
            resolve(msgData)

         
         
         
            
        })
         .catch(err=>{
             console.log(err)
             reject(err);   
            })

         


    })
 
   
    return p;
}

const statusAccepted= (url)=>{
const p= new Promise((resolve,reject)=>{

    fetch(url)
    .then(data=>data.json())
    .then(data=>{

        resolve(data.status);
    }).catch(err=>{
        console.log(err)
        reject(err)
    })


})
    
return p;


}
// const statusRetrieved = (url)=>{

//     fetch(url)
//     .then(data=>data.JSON())
//     .then(data=>{

//           return data;

//     })


// }
app.listen(80,()=>{

    console.log("Server has started");
})