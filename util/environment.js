require("dotenv").config();
module.exports.default={
secret_key:process.env.secret_key,
db_host:process.env.db_host,
db_user:process.env.db_username,
db_password:process.env.db_dbpassword,
db_name:process.env.db_name,
db_port:process.env.db_port


}