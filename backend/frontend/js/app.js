// Archivo principal de JavaScript para la aplicación frontend
import './login.js';
import './register.js'
import './navegacion.js';
import './header.js';

// Registro del Service Worker para soporte offline
if ('serviceWorker' in navigator) {
    // Esperar a que la página cargue completamente
    window.addEventListener('load', () => {
        // Registrar el Service Worker
        navigator.serviceWorker.register('/sw.js')
            // Manejar la promesa devuelta por el registro
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            //   Manejar errores en el registro
            .catch(err => console.error('Error al registrar SW:', err));
    });
}

// Verificar si ya hay un usuario logueado
function checkLogin() {
    // Obtener el token y rol del localStorage
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    // Si hay un token y rol, redirigir al usuario a la página correspondiente
    if (token && rol) {
        // Redirigir según el rol
        if (rol === 'admin') window.location.href = 'pages/admin/HomeAdmin.html';
        else if (rol === 'donador') window.location.href = 'pages/donador/HomeDonador.html';
        else if (rol === 'beneficiario') window.location.href = 'pages/beneficiario/HomeBeneficiario.html';
    }
}

// Actualizar el botón de "Iniciar Sesión" a "Mi Perfil" si el usuario ya está logueado
function updateLoginButton() {
    // Obtener el rol del localStorage
    const rol = localStorage.getItem('rol');
    const btnLogin = document.getElementById('btnLogin');

    // Si el rol existe, cambiar el texto y la acción del botón
    if (rol) {
        btnLogin.textContent = "Mi Perfil";
        // Redirigir según el rol al hacer clic en el botón
        btnLogin.onclick = () => {
            if (rol === 'admin') window.location.href = 'pages/admin/HomeAdmin.html';
            else if (rol === 'donador') window.location.href = 'pages/donador/HomeDonador.html';
            else if (rol === 'beneficiario') window.location.href = 'pages/beneficiario/HomeBeneficiario.html';
        };
    }
}

// Llamar a la función al cargar el script
checkLogin();
updateLoginButton();