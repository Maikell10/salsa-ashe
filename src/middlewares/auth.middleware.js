const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Buscamos el token en los headers (Authorization: Bearer TOKEN)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ error: "Acceso denegado. No se proporcionó un token." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Guardamos la info del usuario en el objeto request para usarlo luego
        req.user = decoded;
        next(); // Continuar al siguiente paso
    } catch (err) {
        return res.status(403).json({ error: "Token inválido o expirado." });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res
            .status(403)
            .json({
                error: "Acceso restringido. Se requieren permisos de administrador.",
            });
    }
};

module.exports = { verifyToken, isAdmin };
