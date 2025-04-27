document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const tituloInput = document.getElementById('titulo');
    const contenidoInput = document.getElementById('contenido');
    const agregarBtn = document.getElementById('agregar-btn');
    const notasLista = document.getElementById('notas-lista');
    const activarAvisoCheckbox = document.getElementById('activar-aviso');
    const fechaAvisoContainer = document.getElementById('fecha-aviso-container');
    const fechaRecordatorioInput = document.getElementById('fecha-recordatorio');

    activarAvisoCheckbox.addEventListener('change', () => {
        fechaAvisoContainer.style.display = activarAvisoCheckbox.checked ? 'block' : 'none';
    });

    cargarNotas();

    // 🔄 ACTUALIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS
    setInterval(() => {
        console.log('🔄 Actualizando notas automáticamente...');
        cargarNotas();
    }, 30000);

    agregarBtn.addEventListener('click', agregarNota);

    async function cargarNotas() {
        try {
            const response = await fetch('/api/notas', { headers });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                return;
            }

            const notas = await response.json();
            mostrarNotas(notas);
        } catch (error) {
            console.error('Error al cargar notas:', error);
        }
    }

    function mostrarNotas(notas) {
        notasLista.innerHTML = '';

        if (notas.length === 0) {
            notasLista.innerHTML = '<p>No hay notas aún. Agrega tu primera nota!</p>';
            return;
        }

        const ahora = new Date();

        notas.forEach(nota => {
            const notaElement = document.createElement('div');
            notaElement.className = 'nota';

            let esAvisoProximo = false;
            if (nota.aviso_activo && nota.fecha_recordatorio) {
                const fechaAviso = new Date(nota.fecha_recordatorio);
                const diferencia = fechaAviso - ahora;
                const horasRestantes = diferencia / (1000 * 60 * 60);

                if (horasRestantes <= 24 && horasRestantes > 0) {
                    esAvisoProximo = true;
                    notaElement.classList.add('aviso-proximo');
                } else if (fechaAviso <= ahora) {
                    notaElement.classList.add('aviso-activo');
                }
            }

            let fechaRecordatorioHTML = '';
            if (nota.aviso_activo && nota.fecha_recordatorio) {
                const fechaAviso = new Date(nota.fecha_recordatorio);
                fechaRecordatorioHTML = `
                    <span class="fecha-recordatorio">
                        📅 Recordatorio: ${fechaAviso.toLocaleString()}
                        ${esAvisoProximo ? ' (Próximo!)' : ''}
                    </span>
                `;
            }

            notaElement.innerHTML = `
                <h3>${nota.titulo}</h3>
                <p>${nota.contenido}</p>
                ${fechaRecordatorioHTML}
                <small>Creada: ${new Date(nota.fecha_creacion).toLocaleString()}</small>
                <button class="eliminar-btn" data-id="${nota.id}">Eliminar</button>
            `;
            notasLista.appendChild(notaElement);
        });

        document.querySelectorAll('.eliminar-btn').forEach(btn => {
            btn.addEventListener('click', eliminarNota);
        });
    }

    async function agregarNota() {
        const titulo = tituloInput.value.trim();
        const contenido = contenidoInput.value.trim();
        const avisoActivo = activarAvisoCheckbox.checked;
        const fechaRecordatorio = avisoActivo ? fechaRecordatorioInput.value : null;

        if (!titulo || !contenido) {
            alert('Por favor completa todos los campos');
            return;
        }

        if (avisoActivo && !fechaRecordatorio) {
            alert('Por favor selecciona una fecha para el recordatorio');
            return;
        }

        try {
            const response = await fetch('/api/notas', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    titulo,
                    contenido,
                    fecha_recordatorio: fechaRecordatorio,
                    aviso_activo: avisoActivo
                }),
            });

            if (response.ok) {
                tituloInput.value = '';
                contenidoInput.value = '';
                activarAvisoCheckbox.checked = false;
                fechaAvisoContainer.style.display = 'none';
                fechaRecordatorioInput.value = '';
                cargarNotas();
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error al agregar nota:', error);
        }
    }

    async function eliminarNota(e) {
        const id = e.target.getAttribute('data-id');

        try {
            const response = await fetch(`/api/notas/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                cargarNotas();
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error al eliminar nota:', error);
        }
    }
});
