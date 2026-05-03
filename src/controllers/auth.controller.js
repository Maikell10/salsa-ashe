const bcrypt = require("bcryptjs");
const pool = require("../db");

const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, level_id) VALUES ($1, $2, $3, $4) RETURNING id",
            [name, email, hashedPassword, 1], // 1 = Básico 1
        );
        res.json({
            message: "Usuario registrado. Espera aprobación del admin.",
            id: result.rows[0].id,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "El email ya existe o hubo un error." });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscamos al usuario y traemos la información de su nivel
        const result = await pool.query(
            `SELECT u.*, l.rank_value, l.name as level_name 
             FROM users u 
             LEFT JOIN levels l ON u.level_id = l.id 
             WHERE u.email = $1`,
            [email],
        );

        const user = result.rows[0];

        // 1. Verificar si existe
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // 2. Verificar si está aprobado por el admin
        if (!user.is_approved) {
            return res.status(403).json({
                error: "Tu cuenta aún no ha sido aprobada por el administrador.",
            });
        }

        // 3. Verificar contraseña
        const validPassword = await bcrypt.compare(
            password,
            user.password_hash,
        );
        if (!validPassword) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        // 4. Generar Token (Incluimos el rank_value para la lógica de videos)
        const token = jwt.sign(
            {
                id: user.id,
                isAdmin: user.is_admin,
                rank: user.rank_value,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" },
        );

        // 5. Responder con el token y data básica
        res.json({
            message: "Login exitoso",
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                isAdmin: user.is_admin,
                level: user.level_name,
                rank: user.rank_value,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Error en el servidor durante el login.",
        });
    }
};

module.exports = {
    register,
    login,
};
