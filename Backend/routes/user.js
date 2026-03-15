const express = require('express');
const { registerUser, loginUser,googleLogin} = require("../controllers/user.js");

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/google-login", googleLogin); // 👈 Add this

module.exports = router;
