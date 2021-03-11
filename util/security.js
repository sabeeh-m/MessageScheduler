const environment= require('../util/environment');


module.exports = function appSecurity(req, res, next) {

if(req.params.key && req.params.key===environment.default.secret_key){

    return next();
} else res.json({message:"Security Key either missing or incorrect"})




}