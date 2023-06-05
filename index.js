const express = require("express");
const bodyParser = require("body-parser").json;
const cors = require("cors");

const app = express();

app.use(bodyParser());
app.use(cors());

require("dotenv").config();

require("./config/postgreSql-db");

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

const scannerRouter = require("./routes/scanner");

app.use("/api/scanner/", scannerRouter);
