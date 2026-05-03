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
    const { rank } = req.user; // Obtenido del JWT en el middleware

    try {
        // Traemos videos donde el rango sea menor o igual al del usuario
        const result = await pool.query(
            `SELECT v.id, v.title, v.description, v.drive_id, l.name as level_name
             FROM videos v
             JOIN levels l ON v.level_id = l.id
             WHERE l.rank_value <= $1
             ORDER BY l.rank_value ASC`,
            [rank],
        );

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
        // Pedimos el video a Google Drive como un stream
        const response = await drive.files.get(
            { fileId: driveId, alt: "media" },
            { responseType: "stream" },
        );

        // Pasamos los headers de Google a nuestra respuesta (tipo de video, etc)
        res.setHeader("Content-Type", response.headers["content-type"]);

        // Enviamos el stream directamente al cliente
        response.data
            .on("error", (err) => {
                console.error("Error en el stream de Drive:", err);
                res.status(500).end();
            })
            .pipe(res);
    } catch (err) {
        console.error(err);
        res.status(404).json({
            error: "Video no encontrado o error en el servidor.",
        });
    }
};

module.exports = { getMyClasses, uploadVideo, streamVideo };
