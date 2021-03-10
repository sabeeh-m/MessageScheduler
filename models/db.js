var mysql= require("mysql");
const {logger}= require("../util/logger")
const environment= require('../util/environment');

//
var connection = mysql.createConnection({

    host:environment.default.db_host,
    user: environment.default.db_user,
    password: environment.default.db_password,
    port:environment.default.db_port,
    database: environment.default.db_name
})
connection.connect(function(err) {
    if (err) {
     logger.error("Db Connection error "+err)
      return console.error('error: ' + err.message);
    }
  
    logger.info('Connected to the MySQL server.')
    console.log('Connected to the MySQL server.');
  });
module.exports=connection;