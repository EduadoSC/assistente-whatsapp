require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool(process.env.MYSQL_URL).promise();

module.exports = pool;