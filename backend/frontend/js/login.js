// Importamos las funciones de validación
import { validarLogin } from './validaciones.js';
import { showRegistroForm } from './register.js';

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

        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            confirmButton: 'custom-swal-confirm',
            cancelButton: 'custom-swal-cancel',
            htmlContainer: 'custom-swal-html'
        },
        width: window.innerWidth < 600 ? '90%' : '50%',
        scrollbarPadding: false,

        didOpen: () => {
            // Listener para ir al registro
            const linkRegistro = document.getElementById('linkRegistro');
            const linkRecuperar = document.getElementById('linkRecuperar');

            const inputs = Swal.getPopup().querySelectorAll('input');
            const confirmBtn = Swal.getPopup().querySelector('.swal2-confirm');

            // Enfocar el primer input automáticamente
            if (inputs.length > 0) inputs[0].focus();

            // Permitir moverse entre campos presionando ENTER
            inputs.forEach((input, index) => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Evita el envío del formulario por defecto
                        // Si hay un campo siguiente, moverse a él
                        if (index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        } else {
                            // Si no hay más campos, simular clic en "Iniciar Sesión"
                            Swal.clickConfirm();
                        }
                    }
                });
            });

            if (linkRegistro) {
                linkRegistro.addEventListener('click', (e) => {
                    // evitar que se recargue la pagina
                    e.preventDefault();
                    // mostramos el formulario de registro
                    showRegistroForm();
                });
            }

            if (linkRecuperar) {
                linkRecuperar.addEventListener('click', async (e) => {
                    e.preventDefault();

                    let correoUsuario = "";

                    const { value: resultado } = await Swal.fire({
                        title: "Recuperar contraseña",
                        input: "email",
                        inputLabel: "Ingresa tu correo registrado",
                        inputPlaceholder: "usuario@correo.com",
                        showCancelButton: true,
                        confirmButtonText: "Enviar enlace",
                        cancelButtonText: "Cancelar",
                        preConfirm: async (correo) => {
                            if (!correo) {
                                Swal.showValidationMessage("Debes ingresar tu correo electrónico");
                                return false;
                            }
                            correoUsuario = correo;

                            try {
                                const res = await fetch("/api/auth/recover", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ correo }),
                                });
                                const data = await res.json();

                                if (data.status !== "success") {
                                    Swal.showValidationMessage(data.message || "No se pudo enviar el correo.");
                                    return false;
                                }

                                return data;
                            } catch (error) {
                                Swal.showValidationMessage("Error al conectar con el servidor.");
                                return false;
                            }
                        },
                    });

                    if (resultado && correoUsuario) {
                        Swal.fire({
                            icon: "info",
                            title: "Correo enviado",
                            html: `
                    <p>Se ha enviado un enlace para restablecer tu contraseña a:</p>
                    <p><b>${correoUsuario}</b></p>
                    <hr>
                    <p style="font-size: 0.95rem;">Por favor revisa también tu carpeta de 
                    <b>correo no deseado</b> o <b>spam</b> si no lo encuentras en tu bandeja de entrada.</p>
                `,
                            confirmButtonText: "Entendido",
                            confirmButtonColor: "#3085d6",
                        });
                    }
                });
            }


            // if (correo) {
            //     // Preguntar si quiere también SMS
            //     const smsConfirm = await Swal.fire({
            //         title: "¿Quieres también un SMS?",
            //         text: "Si registraste tu número telefónico, podemos enviarte un código por SMS.",
            //         icon: "question",
            //         showCancelButton: true,
            //         confirmButtonText: "Sí, enviar SMS",
            //         cancelButtonText: "Solo correo",
            //     });

            //     if (smsConfirm.isConfirmed) {
            //         try {
            //             const res = await fetch("/api/auth/recover-sms", {
            //                 method: "POST",
            //                 headers: { "Content-Type": "application/json" },
            //                 body: JSON.stringify({ correo }),
            //             });
            //             const data = await res.json();

            //             if (data.status === "success") {
            //                 Swal.fire("Enviado", "Se envió un SMS con instrucciones.", "success");
            //             } else {
            //                 Swal.fire("Error", data.message || "No se pudo enviar el SMS.", "error");
            //             }
            //         } catch (error) {
            //             Swal.fire("Error", "Error al conectar con el servidor.", "error");
            //         }
            //     } else {
            //         Swal.fire(" Enviado", "Revisa tu correo para restablecer tu contraseña.", "success");
            //     }
            // }
        },
        preConfirm: async () => {
            // Obtener valores del formulario
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            // const rolSeleccionado = document.getElementById('rol').value;

            // Validar inputs
            const valid = validarLogin({ correo: email, password });

            // Si la validación no es correcta, mostrar mensaje y no continuar
            if (!valid.ok) return Swal.showValidationMessage(valid.message);

            try {
                // Enviar datos al servidor (backend: NestJS)
                const res = await fetch('api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: email, password })
                });

                // Obtener respuesta en formato JSON
                const data = await res.json();

                // Mostrar mensaje según la respuesta
                if (res.ok && data.status === 'success') {
                    // Guardar token y rol en localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('rol', data.rol);
                    localStorage.setItem('uid', data.uid);

                    // Reiniciar contador de intentos fallidos
                    intentosFallidos = 0;

                    // Mostrar mensaje de éxito
                    Swal.fire({
                        icon: 'success',
                        title: 'Inicio de sesión correcto',
                        showConfirmButton: false,
                        timer: 1000,
                        timerProgressBar: true
                    });

                    // Redirigir según el rol después de un breve retraso
                    setTimeout(() => {
                        if (data.rol === 'admin')
                            window.location.href = 'pages/admin/HomeAdmin.html';
                        else if (data.rol === 'donador')
                            window.location.href = 'pages/donador/HomeDonador.html';
                        else if (data.rol === 'beneficiario')
                            window.location.href = 'pages/beneficiario/HomeBeneficiario.html';
                    }, 1000);
                }
                else {
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
                // console.error("Error al conectar con backend:", error);
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

export { btnLogin, showLoginForm };