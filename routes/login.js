const express = require("express");
const { createSoldier, login, verifyOtp } = require("../controllers/login");
const router = express.Router();

router.post("/login", login);
router.post("/create-soldier", createSoldier);
router.post("/verify-otp", verifyOtp);

module.exports = router;
