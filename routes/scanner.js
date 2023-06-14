const express = require("express");
const {
  initiateScanner,
  storeSerialNumber,
  getUsers,
  sendNotif,
  getData,
} = require("../controllers/sanner");
const router = express.Router();

router.post("/initiate-scanner", initiateScanner);
router.post("/store-serial-number", storeSerialNumber);

router.get("/get-data", getData);

module.exports = router;
