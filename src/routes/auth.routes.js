const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// La ruta final será: /api/auth/login
router.post("/register", authController.register);

router.post("/login", authController.login);

module.exports = router;
