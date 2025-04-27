const nodemailer = require('nodemailer');
const db = require('./database');
const cron = require('node-cron');

// Configuración del transporte
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tableroappnotasyavisos@gmail.com',
        pass: 'trpw gvrc yqvr phun'
    }
});

function revisarRecordatorios() {
    const ahora = new Date();
    const haceUnMinuto = new Date(ahora.getTime() - 60 * 1000).toISOString();
    const ahoraISO = ahora.toISOString();

    console.log('🕐 Verificando notas entre', haceUnMinuto, 'y', ahoraISO);

    db.all(`
        SELECT notas.*, usuarios.email FROM notas
        JOIN usuarios ON notas.usuario_id = usuarios.id
        WHERE aviso_activo = 1
          AND fecha_recordatorio IS NOT NULL
          AND notificado = 0
          AND fecha_recordatorio BETWEEN ? AND ?
    `, [haceUnMinuto, ahoraISO], (err, notas) => {
        if (err) {
            console.error('❌ Error al consultar recordatorios:', err.message);
            return;
        }

        if (notas.length === 0) {
            console.log('🔍 No hay recordatorios pendientes por enviar.');
            return;
        }

        notas.forEach(nota => {
            console.log(`✉️ Enviando correo a ${nota.email} por nota: ${nota.titulo}`);

            const mailOptions = {
                from: 'Tablero de Notas <tableroappnotasyavisos@gmail.com>',
                to: nota.email,
                subject: `📌 Recordatorio: ${nota.titulo}`,
                text: `Hola, tienes un recordatorio:\n\nTítulo: ${nota.titulo}\nContenido: ${nota.contenido}\nFecha: ${nota.fecha_recordatorio}`,
                html: `
                    <p><strong>Hola,</strong></p>
                    <p>Tienes un recordatorio programado:</p>
                    <ul>
                        <li><strong>Título:</strong> ${nota.titulo}</li>
                        <li><strong>Contenido:</strong> ${nota.contenido}</li>
                        <li><strong>Fecha:</strong> ${new Date(nota.fecha_recordatorio).toLocaleString()}</li>
                    </ul>
                    <p style="color: #888;">– Tablero de Notas</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('❌ Error al enviar correo:', error.message);
                } else {
                    console.log(`✅ Correo enviado a ${nota.email}: ${info.response}`);

                    db.run('UPDATE notas SET notificado = 1 WHERE id = ?', [nota.id], (err) => {
                        if (err) {
                            console.error('⚠️ No se pudo marcar como notificado:', err.message);
                        } else {
                            console.log(`🟢 Nota ${nota.id} marcada como notificada.`);
                        }
                    });
                }
            });
        });
    });
}

cron.schedule('* * * * *', revisarRecordatorios);
console.log('⏰ Notificador programado para revisar cada minuto.');
revisarRecordatorios();
