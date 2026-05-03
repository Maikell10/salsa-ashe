const pool = require("../db");

const getUsers = async (req, res) => {
    try {
        // Traemos a todos los usuarios que NO sean admin para gestionarlos
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.is_approved, u.is_blocked, u.level_id, l.name as level_name 
             FROM users u 
             LEFT JOIN levels l ON u.level_id = l.id 
             WHERE u.is_admin = FALSE 
             ORDER BY u.created_at DESC`,
        );

        // Importante: devolvemos siempre result.rows (que es el array)
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener la lista de alumnos" });
    }
};

const userAction = async (req, res) => {
    const { id } = req.params;
    const { action, levelId } = req.body;

    try {
        let query = "";
        let params = [id];

        switch (action) {
            case "approve":
                query =
                    "UPDATE users SET is_approved = TRUE, is_blocked = FALSE, level_id = $2 WHERE id = $1";
                params.push(levelId || 1); // Básico 1 por defecto
                break;
            case "block":
                query = "UPDATE users SET is_blocked = TRUE WHERE id = $1";
                break;
            case "unblock":
                query = "UPDATE users SET is_blocked = FALSE WHERE id = $1";
                break;
            case "update_level":
                query = "UPDATE users SET level_id = $2 WHERE id = $1";
                params.push(levelId);
                break;
            default:
                return res.status(400).json({ error: "Acción no válida" });
        }

        await pool.query(query, params);
        res.json({ message: `Usuario actualizado con éxito: ${action}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar el usuario" });
    }
};

module.exports = { getUsers, userAction };
