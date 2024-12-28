const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
// to read file .env
dotenv.config();
// function create access token
 const getAccessToken = async (payload) => {
// create token via payload 
    const token =  jwt.sign(payload,process.env.SECRET_KEY)
    return token;
}
module.exports = {getAccessToken}