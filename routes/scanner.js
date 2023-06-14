const express = require("express");
const {
  initiateScanner,
  storeSerialNumber,
  getUsers,
  sendNotif,
} = require("../controllers/sanner");
const router = express.Router();

router.post("/initiate-scanner", initiateScanner);
router.post("/store-serial-number", storeSerialNumber);

module.exports = router;
