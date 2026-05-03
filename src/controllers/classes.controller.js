const pool = require("../db");
const { google } = require("googleapis");

const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEYS
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEYS)
    : require("../../salsayashe-58df38507a29.json");

const auth = new google.auth.GoogleAuth({
    credentials, // El archivo que descargas de Google Cloud
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

const getMyClasses = async (req, res) => {
    const { rank, isAdmin } = req.user; // Obtenemos isAdmin del token

    try {
        let query = "";
        let params = [];

        if (isAdmin) {
            // El admin ve TODOS los videos de todos los niveles
            query = `
                SELECT v.id, v.title, v.description, v.drive_id, v.genre, l.name as level_name
                FROM videos v
                JOIN levels l ON v.level_id = l.id
                ORDER BY l.rank_value ASC`;
        } else {
            // El alumno solo ve hasta su nivel
            query = `
                SELECT v.id, v.title, v.description, v.drive_id, v.genre, l.name as level_name
                FROM videos v
                JOIN levels l ON v.level_id = l.id
                WHERE l.rank_value <= $1
                ORDER BY l.rank_value ASC`;
            params = [rank];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener las clases." });
    }
};

const uploadVideo = async (req, res) => {
    const { title, description, drive_id, level_id } = req.body;

    try {
        await pool.query(
            "INSERT INTO videos (title, description, drive_id, level_id) VALUES ($1, $2, $3, $4)",
            [title, description, drive_id, level_id],
        );
        res.json({ message: "Video registrado exitosamente en el pensum." });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar el video." });
    }
};

// --- EL PROXY DE VIDEO ---
const streamVideo = async (req, res) => {
    const { driveId } = req.params;

    try {
        const response = await drive.files.get(
            { fileId: driveId, alt: "media" },
            { responseType: "stream" },
        );

        // 1. Verificamos si existe el header, si no, usamos un default seguro
        const contentType = response.headers["content-type"] || "video/mp4";
        res.setHeader("Content-Type", contentType);

        // 2. Manejo de errores en el stream
        response.data
            .on("error", (err) => {
                console.error("Error en el stream de Drive:", err);
                if (!res.headersSent)
                    res.status(500).send("Error en el stream");
            })
            .pipe(res);
    } catch (err) {
        // 3. Si llega aquí, es probable que Google Drive devolviera un 404 o 403
        console.error("Error al conectar con Google Drive:", err.message);
        res.status(err.code || 500).json({
            error: "Google Drive no encontró el archivo o no tenemos permiso.",
            details: err.message,
        });
    }
};

module.exports = { getMyClasses, uploadVideo, streamVideo };
