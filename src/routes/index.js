const express = require("express");
const router = express.Router();

// Importar las rutas específicas
const authRoutes = require("./auth.routes");
const classesRoutes = require("./classes.routes");
const adminRoutes = require("./admin.routes");

// Definir los prefijos para cada grupo de rutas
router.use("/auth", authRoutes);
router.use("/classes", classesRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
