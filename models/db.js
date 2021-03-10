var mysql= require("mysql");
const environment= require('../util/environment');
var connection = mysql.createConnection({

    host: environment.default.db_host,
    user: environment.default.db_user,
    password: environment.default.db_password,
    port:environment.default.db_port,
    database: environment.default.db_name
})

module.exports=connection;