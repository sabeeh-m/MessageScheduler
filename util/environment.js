require("dotenv").config();
module.exports.default={
secret_key:process.env.secret_key,
db_host:process.env.db_host,
db_user:process.env.user,
db_password:process.env.password,
db_name:process.env.db_name


}