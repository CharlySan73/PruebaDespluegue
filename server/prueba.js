const db = require('./database');
db.all('SELECT id, titulo, fecha_recordatorio, notificado FROM notas', (err, rows) => {
    if (err) console.error(err.message);
    else console.table(rows);
});
