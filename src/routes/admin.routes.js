const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Aplicamos ambos middlewares a todas las rutas de este archivo
router.use(verifyToken);
router.use(isAdmin);

// GET /api/admin/users
router.get("/users", adminController.getUsers);

// PATCH /api/admin/users/:id/action
router.patch("/users/:id/action", adminController.userAction);

module.exports = router;
