// Importamos las funciones de validación
import { validarRegistro } from './validaciones.js';
import { showLoginForm } from './login.js';

// Cargar contenido HTML
async function loadHTML(file) {
    // Usamos fetch para hacer una peticion y obtener el archivo HTML
    const response = await fetch(file);
    // Devolvemos el texto del archivo
    return await response.text();
}

// Función para limpiar todos los inputs y selects
function limpiarFormulario(popup) {
    const campos = popup.querySelectorAll('input, select, textarea');
    campos.forEach(campo => {
        if (campo.tagName.toLowerCase() === 'select') {
            campo.selectedIndex = 0;
        } else if (campo.type === 'checkbox' || campo.type === 'radio') {
            campo.checked = false;
        } else {
            campo.value = '';
        }
    });
}

// Función para mostrar Registro
async function showRegistroForm() {
    // pedir tipo de usuario primero
    const { value: tipoUsuario } = await Swal.fire({
        title: 'Selecciona el tipo de usuario',
        input: 'select',
        inputOptions: {
            beneficiario: 'beneficiario',
            donador: 'donador'
        },
        inputPlaceholder: 'Elige una opción',
        confirmButtonText: 'Continuar',
        allowOutsideClick: false,
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
        width: '50%',
        scrollbarPadding: false,
    });

    // Si cancela, salimos
    if (!tipoUsuario) return;

    // cargar el formulario correspondiente según el tipo
    let formularioHTML = '';
    if (tipoUsuario === 'beneficiario') {
        formularioHTML = await loadHTML('forms/registroFormBeneficiario.html');
    } else if (tipoUsuario === 'donador') {
        formularioHTML = await loadHTML('forms/registroFormDonador.html');
    }

    // mostrar el formulario seleccionado
    await Swal.fire({
        title: `Registro de ${tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1)}`,
        html: formularioHTML,
        confirmButtonText: 'Registrarse',
        allowOutsideClick: false,
        // allowEscapeKey: false,
        showCancelButton: true,
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
            popup: `custom-swal-popup ${tipoUsuario}`,
            title: 'custom-swal-title',
            confirmButton: 'custom-swal-confirm',
            cancelButton: 'custom-swal-cancel',
            htmlContainer: 'custom-swal-html'
        },
        width: window.innerWidth < 600 ? '90%' : '50%',
        scrollbarPadding: false,
        didOpen: () => {
            const popup = Swal.getPopup();
            limpiarFormulario(popup);
            const linkLogin = popup.querySelector('#linkLogin');

            if (linkLogin) {
                linkLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    showLoginForm();
                });
            }

            const inputs = Swal.getPopup().querySelectorAll('input, select');
            const confirmBtn = popup.querySelector('#swal2-confirm');

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
            if (confirmBtn) {
                confirmBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') Swal.clickConfirm();
                });
            }


        },
        preConfirm: async () => {
            // Buscar los inputs dentro del popup
            const nombre = document.getElementById('nombre').value;
            const apellidoPaterno = document.getElementById('apellidoPaterno').value;
            const apellidoMaterno = document.getElementById('apellidoMaterno').value;
            const correo = document.getElementById('correo').value;
            const telefono = document.getElementById('telefono').value;
            const pass1 = document.getElementById('pass1').value;
            const pass2 = document.getElementById('pass2').value;

            // Validar inputs
            const valid = validarRegistro({ nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, pass2 });
            if (!valid.ok) return Swal.showValidationMessage(valid.message);

            // Crear objeto para enviar
            let formDatos = { nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, tipoUsuario };

            if (tipoUsuario === 'beneficiario') {
                formDatos.tipoBeneficiario = document.getElementById('tipoBeneficiario').value;
                formDatos.nombreBeneficiario = document.getElementById('nombreBeneficiario').value;
                formDatos.curpRfcBeneficiario = document.getElementById('curpRfcBeneficiario').value;

                // Dirección (IDs correctos)
                formDatos.calle = document.getElementById('calle').value;
                formDatos.numExterior = document.getElementById('numExterior').value;
                formDatos.numInterior = document.getElementById('numInterior').value;
                formDatos.colonia = document.getElementById('colonia').value;
                formDatos.codigoPostal = document.getElementById('codigoPostal').value;
                formDatos.municipio = document.getElementById('municipio').value;
                formDatos.estado = document.getElementById('estado').value;
                formDatos.referencias = document.getElementById('referencias').value;
            } else if (tipoUsuario === 'donador') {
                formDatos.tipoDonador = document.getElementById('tipoDonador').value;
                formDatos.nombreEmpresa = document.getElementById('nombreEmpresa').value;
                formDatos.rfcEmpresa = document.getElementById('rfcEmpresa').value;
                formDatos.nombreRepresentante = document.getElementById('nombreRepresentante').value;
                formDatos.cargoRepresentante = document.getElementById('cargoRepresentante').value;

                // Dirección (IDs correctos)
                formDatos.calle = document.getElementById('calle').value;
                formDatos.numExterior = document.getElementById('numExterior').value;
                formDatos.numInterior = document.getElementById('numInterior').value;
                formDatos.colonia = document.getElementById('colonia').value;
                formDatos.codigoPostal = document.getElementById('codigoPostal').value;
                formDatos.municipio = document.getElementById('municipio').value;
                formDatos.estado = document.getElementById('estado').value;
                formDatos.referencias = document.getElementById('referencias').value;

                // Campos opcionales
                formDatos.contactoAlterno = document.getElementById('contactoAlterno').value;
                formDatos.correoAlterno = document.getElementById('correoAlterno').value;
            }


            try {
                // Enviar datos al servidor (backend: NestJS)
                const res = await fetch('api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formDatos)
                });

                // Obtener respuesta en formato JSON
                const data = await res.json();

                // Mostrar mensaje según la respuesta
                if (data.status === "success") {
                    Swal.fire('¡Éxito!', data.message || 'Usuario registrado correctamente', 'success');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        html: data.message || 'Error al registrar usuario',
                    });
                }

                return data;
            } catch (error) {
                Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
                return;
            }
        }
    });
}

export { showRegistroForm }