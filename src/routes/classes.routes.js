const express = require("express");
const router = express.Router();
const classesController = require("../controllers/classes.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Obtener lista de videos según nivel del alumno
router.get("/mis-clases", verifyToken, classesController.getMyClasses);

// Endpoint que el frontend usará en el <video src="...">
// Ejemplo: <video src="https://tu-api.com/api/classes/video/ID_DE_DRIVE">
router.get("/video/:driveId", verifyToken, classesController.streamVideo);

// Subir metadatos de video (Solo Admin)
router.post("/upload", [verifyToken, isAdmin], classesController.uploadVideo);

module.exports = router;
