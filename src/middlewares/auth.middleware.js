const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Intentamos obtener el token del Header O del Query string (?token=...)
    const authHeader = req.headers["authorization"];
    const token = (authHeader && authHeader.split(" ")[1]) || req.query.token;

    if (!token) {
        // Si no hay token, el backend lanza el 401 que estás viendo
        return res.status(401).json({ error: "No hay token de acceso" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({
            error: "Acceso restringido. Se requieren permisos de administrador.",
        });
    }
};

module.exports = { verifyToken, isAdmin };
