const { Pool } = require("pg");
const pool = new Pool({
  user: "me",
  host: "localhost",
  database: "api",
  password: "12345678",
  port: 5432,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Connection error", err));

module.exports = pool;
