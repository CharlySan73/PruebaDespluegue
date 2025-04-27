document.addEventListener('DOMContentLoaded', () => {
    // Elementos comunes
    const errorMessage = document.getElementById('error-message');

    // Manejo de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/app';
                } else {
                    showError(data.error || 'Error al iniciar sesión');
                }
            } catch (error) {
                showError('Error de conexión');
            }
        });
    }

    // Manejo de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPassword) {
                showError('Las contraseñas no coinciden');
                return;
            }

            try {
                const response = await fetch('/api/registrar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registro exitoso. Por favor inicia sesión.');
                    window.location.href = '/index.html';
                } else {
                    showError(data.error || 'Error al registrarse');
                }
            } catch (error) {
                showError('Error de conexión');
            }
        });
    }

    // Mostrar error
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Mostrar información del usuario
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            usernameDisplay.textContent = `Bienvenido, ${user.username}`;
        } else {
            window.location.href = 'index.html';
        }
    }
});