const express = require("express");
const bodyParser = require("body-parser").json;
const cors = require("cors");

const app = express();

app.use(bodyParser());
app.use(cors());

require("dotenv").config();

require("./config/mysql-db");

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

const scannerRouter = require("./routes/scanner");

app.use("/api/scanner/", scannerRouter);