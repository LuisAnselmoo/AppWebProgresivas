// Importamos las funciones de validación
import { validarLogin, validarRegistro } from './validaciones.js';

// Variables para control de intentos y bloqueo
// Contador de intentos fallidos
let intentosFallidos = 0;
// Estado de bloqueo
let bloqueoActivo = false;

// Cargar contenido HTML
async function loadHTML(file) {
    // Usamos fetch para hacer una peticion y obtener el archivo HTML
    const response = await fetch(file);
    // Devolvemos el texto del archivo
    return await response.text();
}

// Función para mostrar Login
async function showLoginForm() {
    // Verificar si el bloqueo está activo
    if (bloqueoActivo) {
        Swal.fire('Bloqueado', 'Debes esperar 1 minuto antes de intentar nuevamente', 'warning');
        return;
    }

    // Cargar el formulario de login
    const loginForm = await loadHTML('forms/loginForm.html');

    await Swal.fire({
        title: 'Iniciar Sesión',
        html: loginForm,
        confirmButtonText: 'Iniciar Sesión',
        allowOutsideClick: false, // para evitar cierre accidental haciendo clic fuera
        // allowEscapeKey: false, // para evitar cierre accidental con Escape
        showCancelButton: true,
        didOpen: () => {
            // Listener para ir al registro
            const popup = Swal.getPopup(); // Obtener el popup actual
            const linkRegistro = document.getElementById('linkRegistro');
            const inputs = Swal.getPopup().querySelectorAll('input, select'); // Todos los inputs y selects
            const confirmBtn = popup.querySelector('.swal2-confirm'); // Botón de confirmar

            // Enfocar el primer input automáticamente
            if (inputs.length > 0) inputs[0].focus();

            // Manejar navegación con Enter
            inputs.forEach((input, index) => {
                // Escuchar evento keydown en cada input
                input.addEventListener('keydown', (e) => {
                    // Si se presiona Enter
                    if (e.key === 'Enter') {
                        // Prevenir el comportamiento por defecto (evitar submit)
                        e.preventDefault();

                        // Si es un <select>, abrirlo o moverse al siguiente
                        if (input.tagName.toLowerCase() === 'select') {
                            // Si no está abierto, abrirlo
                            if (!input.classList.contains('open')) {
                                input.classList.add('open');
                                input.size = Math.min(input.options.length, 4); // abre una vista tipo lista
                            } else {
                                input.classList.remove('open');
                                input.size = 0; // lo cierra
                                // pasa al siguiente
                                if (index < inputs.length - 1) {
                                    inputs[index + 1].focus();
                                } else {
                                    // Iluminar botón de confirmar y mover el foco
                                    confirmBtn.focus();
                                    confirmBtn.classList.add('active-btn');
                                    setTimeout(() => confirmBtn.classList.remove('active-btn'), 500);
                                }
                            }
                            return;
                        }

                        // Si no es select, moverse al siguiente campo
                        if (index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        } else {
                            confirmBtn.focus();
                            confirmBtn.classList.add('active-btn');
                            setTimeout(() => confirmBtn.classList.remove('active-btn'), 500);
                        }
                    }
                });
            });

            // 🔹 Si el usuario presiona Enter en el botón de confirmar, simular clic
            confirmBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') Swal.clickConfirm();
            });

            if (linkRegistro) {
                linkRegistro.addEventListener('click', (e) => {
                    // evitar que se recargue la pagina
                    e.preventDefault();
                    // mostramos el formulario de registro
                    showRegistroForm();
                });
            }
        },
        preConfirm: async () => {
            // Obtener valores del formulario
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rolSeleccionado = document.getElementById('rol').value;

            // Validar inputs
            const valid = validarLogin({ correo: email, password });

            // Si la validación no es correcta, mostrar mensaje y no continuar
            if (!valid.ok) return Swal.showValidationMessage(valid.message);

            try {
                // Enviar datos al servidor (backend: NestJS)
                const res = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: email, password, rolSeleccionado })
                });

                // Obtener respuesta en formato JSON
                const data = await res.json();

                // Mostrar mensaje según la respuesta
                if (res.ok && data.status === 'success') {
                    // Guardar token y rol en localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('rol', data.rol);

                    // Reiniciar contador de intentos fallidos
                    intentosFallidos = 0;

                    Swal.fire('¡Éxito!', 'Inicio de sesión correcto', 'success').then(() => {
                        if (data.rol === 'admin') window.location.href = 'pages/admin/index.html';
                        else if (data.rol === 'donador') window.location.href = 'pages/donador/index.html';
                        else if (data.rol === 'beneficiario') window.location.href = 'pages/beneficiario/index.html';
                    });

                } else {
                    // Incrementar contador de intentos fallidos
                    intentosFallidos++;

                    // si ya son 3 intentos fallidos, activar bloqueo
                    if (intentosFallidos >= 3) {
                        bloqueoActivo = true;
                        Swal.fire('Bloqueado', 'Has fallado 3 veces. Intenta de nuevo en 1 minuto', 'warning');
                        setTimeout(() => {
                            bloqueoActivo = false;
                            intentosFallidos = 0;
                        }, 60000); // 1 minuto
                    } else {
                        Swal.fire('Error', data.message || 'Usuario o contraseña incorrectos', 'error');
                    }
                }

                return data;
            } catch (error) {
                console.error("Error al conectar con backend:", error);
                Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
                return;
            }

        }
    });
}

// Función para mostrar Registro
async function showRegistroForm() {
    // Cargar el formulario de registro
    const registroForm = await loadHTML('forms/registroForm.html');

    await Swal.fire({
        title: 'Registro',
        html: registroForm,
        confirmButtonText: 'Registrarse',
        allowOutsideClick: false,
        // allowEscapeKey: false,
        showCancelButton: true,
        didOpen: () => {
            // Listener para volver al login
            const linkLogin = document.getElementById('linkLogin');
            const popup = Swal.getPopup();
            const inputs = Swal.getPopup().querySelectorAll('input, select');
            const confirmBtn = popup.querySelector('.swal2-confirm');

            // Enfocar el primer input automáticamente
            if (inputs.length > 0) inputs[0].focus();

            // Manejar navegación con Enter
            inputs.forEach((input, index) => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();

                        // Si es un select, abrirlo o moverse al siguiente
                        if (input.tagName.toLowerCase() === 'select') {
                            if (!input.classList.contains('open')) {
                                input.classList.add('open');
                                input.size = Math.min(input.options.length, 4); // abre una vista tipo lista
                            } else {
                                input.classList.remove('open');
                                input.size = 0; // lo cierra
                                // pasa al siguiente
                                if (index < inputs.length - 1) {
                                    inputs[index + 1].focus();
                                } else {
                                    // Iluminar botón de confirmar y mover el foco
                                    confirmBtn.focus();
                                    confirmBtn.classList.add('active-btn');
                                    setTimeout(() => confirmBtn.classList.remove('active-btn'), 500);
                                }
                            }
                            return;
                        }

                        // Si no es select, moverse al siguiente campo
                        if (index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        } else {
                            confirmBtn.focus();
                            confirmBtn.classList.add('active-btn');
                            setTimeout(() => confirmBtn.classList.remove('active-btn'), 500);
                        }
                    }
                });
            });

            // Si el usuario presiona Enter en el botón de confirmar, simular clic
            confirmBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') Swal.clickConfirm();
            });

            if (linkLogin) {
                linkLogin.addEventListener('click', (e) => {
                    // evitar que se recargue la pagina
                    e.preventDefault();
                    // mostramos el formulario de login
                    showLoginForm();
                });
            }
        },
        preConfirm: async () => {
            // Obtener valores del formulario
            const nombre = document.getElementById('nombre').value;
            const apellidoPaterno = document.getElementById('apellidoPaterno').value;
            const apellidoMaterno = document.getElementById('apellidoMaterno').value;
            const correo = document.getElementById('correo').value;
            const telefono = document.getElementById('telefono').value;
            const pass1 = document.getElementById('pass1').value;
            const pass2 = document.getElementById('pass2').value;
            const tipoUsuario = document.getElementById('tipoUsuario').value;

            // Validar inputs
            const valid = validarRegistro({ nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, pass2 });

            // Si la validación no es correcta, mostrar mensaje y no continuar
            if (!valid.ok) return Swal.showValidationMessage(valid.message);

            try {
                // Enviar datos al servidor (backend: NestJS)
                const res = await fetch('http://localhost:3000/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, tipoUsuario })
                });

                // Obtener respuesta en formato JSON
                const data = await res.json();

                // Mostrar mensaje según la respuesta
                if (res.ok) {
                    Swal.fire('¡Éxito!', 'Usuario registrado correctamente', 'success');
                } else {
                    Swal.fire('Error', data.message || 'Error al registrar usuario', 'error');
                }

                return data;
            } catch (error) {
                Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
                return;
            }
        }
    });
}

// Inicializar con login
const btnLogin = document.getElementById('btnLogin');

// Mostrar formulario de login al hacer clic en el botón
btnLogin.addEventListener('click', showLoginForm);

export { btnLogin };