const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const SECRET_KEY = 'tu_clave_secreta_super_segura';

// Registrar nuevo usuario
async function registrarUsuario(username, email, password) {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO usuarios (id, username, email, password) VALUES (?, ?, ?, ?)',
            [id, username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('El usuario o email ya existe'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({ id, username, email });
                }
            }
        );
    });
}

// Iniciar sesión
async function loginUsuario(username, password) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM usuarios WHERE username = ?',
            [username],
            async (err, user) => {
                if (err) return reject(err);
                if (!user) return reject(new Error('Usuario no encontrado'));
                
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return reject(new Error('Contraseña incorrecta'));
                
                // Generar token JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username },
                    SECRET_KEY,
                    { expiresIn: '2h' }
                );
                
                resolve({ 
                    token,
                    user: { id: user.id, username: user.username, email: user.email }
                });
            }
        );
    });
}

// Middleware para verificar token
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        
        req.userId = decoded.id;
        next();
    });
}

module.exports = { registrarUsuario, loginUsuario, verificarToken };