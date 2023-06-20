const express = require("express");
const bodyParser = require("body-parser").json;
const cors = require("cors");

const app = express();

app.use(bodyParser());
app.use(cors());

require("dotenv").config();

require("./config/mysql-db");

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("If you're seeing this then it means the VMS API is working");
});

app.get("/test", (req, res) => {
  res.send("I am testing");
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

const scannerRouter = require("./routes/scanner");
const loginRouter = require("./routes/login");

app.use("/api/scanner", scannerRouter);
app.use("/api/user", loginRouter);
