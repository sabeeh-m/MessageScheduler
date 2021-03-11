const express= require("express");
const app= express();
const cron= require("node-cron");
const moment= require("moment");
const mysql=require("mysql");
const fetch= require("node-fetch");
const connection= require('./models/db');
const logger = require('./util/logger').logger;
const appSecurity = require("./util/security");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// scheduling taks to run every minute
cron.schedule('* * * * *', function() {
    let {startTime,endTime}=getCurrentTime();
    let query=mysql.format("select * from schedules where time between ? and ? ",[startTime,endTime]);
    connection.query(query,function(err,data){
        if(err){
            console.log(err)
            logger.error(err)
        }
        else {
            logger.info(data.length+ " schedules found to be executed at "+ startTime);
            console.log(data.length+ " schedules found to be executed at "+ startTime)
            data.forEach(schedule=>{          
                let numbers= schedule.recipents.split(",")
                let message=schedule.message
                logger.info(numbers.length + " Recipents found for schedule " +schedule.name)     
                numbers.forEach((number,i)=>{
                //    console.log(number)
                    let dnis=number;
                    schedule_id=schedule.id
                    let smsData= {schedule_id,dnis,message}
                     sendMessage(smsData,[])     
                   
                          
      })    
                      
                   })      
          
        }
        
    })
    


  });

///////


// cron.schedule('* * * * *',()=>{

//Main function that takes smsdata as a parameter which is an object made from values retrieved from db.
const sendMessage=  (smsdata,arrData=[])=>{
   messageRequest(smsdata)
  .then(res=>res.json())
  .then(res=> processResponse(smsdata,arrData,res))
  .catch(err=>{
            console.log('request failed')
            logger.error(err)
            console.log(err)
            })        
}
//Function to check status of a sent message and returns a promise that consists of message id and its status.
const checkStatus= (url)=>{
    const p = new Promise((resolve,reject)=>{
         fetch(url).
         then(data=>data.json())
         .then( msgData=>{
           resolve(msgData)
        })
         .catch(err=>{
            console.log("check status error")
            console.log(err)
             reject(err);   
            })
           })
    return p;
}
// This function makes the initial fetch request to endpoint to send message, it takes smsdata as a parameter which consists
// the number(dnis) and message(retrieved from db)
const messageRequest= (smsdata)=>{
    const p=new Promise((resolve,reject)=>{
        fetch("http://kr8tif.lawaapp.com:1338/api",{

            method:"post",
            headers:{
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(smsdata)

        }).then(data=>resolve(data)).catch(err=>reject(err))





    })
    return p;
}
// this function sends the same request(same message_id param) to endpoint to check if 'ACCEPTD' status has changed, as soon as it has,
// it reutrns the new status which is then used in processResponse function. 
const statusAccepted= (url)=>{
const p= new Promise((resolve,reject)=>{
    fetch(url)
    .then(data=>data.json())
    .then(data=>{
          resolve(data.status);
    }).catch(err=>{
        console.log("status accepted error")
        console.log(err)
        reject(err)
    })
})    
return p;
}
// This function returns time range of current and next munute, rounded to 0 seconds, to use in initial query to check if a shcedule is to be run at the start of current minute
function getCurrentTime (){
let startTime=moment().format();
var endTime= moment().add(1,'minutes').format();    
let index=startTime.indexOf("+")
startTime =startTime.substring(0,index-3).replace("T"," ");
var endTime= endTime.substring(0,index-3).replace("T"," ");
return {startTime,endTime};
}
//This function checks the status of a sent message and then compares the status to decide the course of action: As soon as a number is
//successfully sent a message, it logs all entries which consist of statusses and time of all the attempts to send message to a particular
//number to db at once. 
const processResponse = async (smsdata,arrData=[],res)=>{
                let url="http://kr8tif.lawaapp.com:1338/api?messageId="+res.message_id
                let msgData = await checkStatus(url)
                if(  msgData ){
                     let {status,delivery_time}= msgData;
                       while(status=='ACCEPTD'){
                       let currData=[smsdata.schedule_id.toString(),res.message_id,smsdata.dnis,delivery_time,status]
                       arrData=[...arrData,currData]
                      status = await statusAccepted(url);
                      console.log(status)
                    }                   
                    if(status!='DELIVRD' ){                   
                        let currData=[smsdata.schedule_id.toString(),res.message_id,smsdata.dnis,delivery_time,status]
                        arrData=[...arrData,currData]
                        return   sendMessage(smsdata,arrData)    
                    }
                    else{
                        let currData=[smsdata.schedule_id.toString(),res.message_id,smsdata.dnis,delivery_time,status]
                        arrData=[...arrData,currData]
                        let query="insert into sms_status(schedule_id,message_id,recipent,time_sent,status) values ? "
                        connection.query(
                        query,[arrData],(err,data)=>{
                        if(err){
                            console.log(err)
                        }else{
                           console.log("Message successfully Delivered for schhdedule id: "+smsdata.schedule_id+" to recipent "+smsdata.dnis )
                           logger.info("Message successfully Delivered for schhdedule id: "+smsdata.schedule_id+" to recipent "+smsdata.dnis )
                           // console.log("great Success!!")
                        }
                    }
                        )
                    }
                 }
                }




 // ***********start of endpoints****************************8               
//route to retrieve schedule lists
app.get("/schedules/:key",appSecurity,(req,res)=>{
 console.log( Object.keys(req.query).length);
let itemsPerPage=9999999999999999;
let start=0;
let startDate="19700101";
let endDate="20991212";

// checks to see if req.query has any keys with values
if(!Object.keys(req.query).length==0  ){
//checks to see if pagenumber exists in url and is valid, and then changes values of start as per pagenumber accordingly
     if( req.query.pagenumber!="" && req.query.pagenumber!=0 && !isNaN(req.query.pagenumber)){
        console.log("pagenumber "+req.query.pagenumber)
        pageNumber=
        itemsPerPage=10;
        start=req.query.pagenumber*itemsPerPage-0;
        console.log("start "+start)
         }
//checks to see if from and to exist in url to change the time range in query          
if(req.query.from && req.query.to){
    startDate =moment().format(req.query.from);
    endDate =moment().format(req.query.to);
  }  
}
//query is formed here as per the values
query= mysql.format("select * from schedules where time between ? AND ? limit ?,?",[startDate,endDate,start,itemsPerPage])
    console.log(query);
connection.query(query,(err,data)=>{

if(err){
    res.json(err)
}else{
    let schedules=[]
//schedules are looped to through to get total count of  recipents in each schedule
    data.forEach(schedule=>{
        let {time,name,message}=schedule
        // console.log(schedule)
        let scheduleObj= {time,name,message,totalRecipents:schedule.recipents.length};
        schedules=[...schedules,scheduleObj]   
    })
    // console.log(schedules);
    res.json(schedules);
}
})
})
// route to check sms statuses
app.get("/smsstatus/:key",appSecurity,(req,res)=>{
    console.log( Object.keys(req.query).length);
   let itemsPerPage=9999999999999999;
   let start=0;
   let startDate="19700101";
   let endDate="20991212";
   let query=""
// Check to see if req.query has any keys with values
   if(!Object.keys(req.query).length==0  ){
//check to see if pagenumber query parametere is passed     
       if( req.query.pagenumber!="" && req.query.pagenumber!=0 && !isNaN(req.query.pagenumber)){
           console.log("pagenumber "+req.query.pagenumber)
           pageNumber=
           itemsPerPage=10;
           start=req.query.pagenumber*itemsPerPage-0;
    }
   
   
// Check to see if from and to date exist in url
   if(req.query.from && req.query.to){
        startDate=moment().format(req.query.from);
        endDate=moment().format(req.query.to);
       }  
 }
 //checks to see if status query parameter is passed in the url and then sets query accordingly
   if(req.query.status){
    status=req.query.status
    query=mysql.format("select * from sms_status where status = ? And time_sent between ? And ? limit ?,?",
    [status,startDate,endDate,start,itemsPerPage]
    )


}else{

    query=mysql.format("select * from sms_status where time_sent between ? And ? limit ?,?",
    [startDate,endDate,start,itemsPerPage]
    )
    console.log(query)

}
   
   connection.query(query,(err,data)=>{
   
   if(err){
       res.json(err)
   }else{
             
        console.log(data);
       res.json(data);
   }
   
   
   
   })
   
   
   })
//route to add new schedule
app.post("/newschedule/:key",appSecurity,(req,res)=>{
let {name,time,message,recipents}=req.body;
let query=mysql.format("insert into schedules (time,recipents,name,message) values (?,?,?,?)",[time,recipents,name,message]);
connection.query(query,(err,data)=>{
    if(err){
        logger.error(err)
        res.json(err)
    }else{
        res.json({message:"schedule added"})
        console.log("done");
    }
})
})

//Setting the server to listen to the default port of the os.
app.listen(3000,()=>{

    console.log("Server has started at port 3000");
})