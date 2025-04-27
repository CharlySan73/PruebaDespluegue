const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { registrarUsuario, loginUsuario, verificarToken } = require('./auth');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../cliente')));

// Registro de usuario
app.post('/api/registrar', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const resultado = await registrarUsuario(username, email, password);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const resultado = await loginUsuario(username, password);
        res.json(resultado);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.use('/api/notas', verificarToken);

// Obtener notas
app.get('/api/notas', (req, res) => {
    db.all(
        'SELECT * FROM notas WHERE usuario_id = ? ORDER BY fecha_recordatorio IS NULL, fecha_recordatorio ASC',
        [req.userId],
        (err, notas) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(notas);
        }
    );
});

// Agregar nota
app.post('/api/notas', (req, res) => {
    const { titulo, contenido, fecha_recordatorio, aviso_activo } = req.body;
    const id = uuidv4();
    const isoFecha = fecha_recordatorio ? new Date(fecha_recordatorio).toISOString() : null;

    db.run(
        'INSERT INTO notas (id, titulo, contenido, fecha_recordatorio, aviso_activo, usuario_id, notificado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, titulo, contenido, isoFecha, aviso_activo ? 1 : 0, req.userId, 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id,
                titulo,
                contenido,
                fecha_creacion: new Date().toISOString(),
                fecha_recordatorio: isoFecha,
                aviso_activo,
                usuario_id: req.userId,
                notificado: 0
            });
        }
    );
});

// Eliminar nota
app.delete('/api/notas/:id', (req, res) => {
    db.run(
        'DELETE FROM notas WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Nota no encontrada' });
            res.status(204).end();
        }
    );
});

// Ruta principal
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/app.html'));
});

// Activar notificador
require('./notificador');

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
