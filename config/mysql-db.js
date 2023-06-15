const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host:
    process.env.ENV == "DEV"
      ? process.env.DB_HOST_DEV
      : process.env.DB_HOST_PROD,
  user:
    process.env.ENV == "DEV"
      ? process.env.DB_USER_DEV
      : process.env.DB_USER_PROD,
  password:
    process.env.ENV == "DEV"
      ? process.env.DB_PASSWORD_DEV
      : process.env.DB_PASSWORD_PROD,
  database: process.env.ENV == "DEV" ? process.env.DB_DEV : process.env.DB_PROD,
});
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Connected to the database");
});

module.exports = connection;
