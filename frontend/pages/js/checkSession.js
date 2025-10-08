// js/checkSession.js
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token) {
    Swal.fire({
      title: 'Sesión expirada',
      text: 'Inicia sesión nuevamente',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      window.location.href = '../../index.html';
    });
    return;
  }

  try {
    // Decodifica el token para verificar que sea válido
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Usuario logueado:', payload);

    // Verificación de expiración
    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < ahora) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      Swal.fire('Sesión expirada', 'Por favor, inicia sesión nuevamente.', 'warning')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    // Verificación de rol según ruta actual
    const path = window.location.pathname.toLowerCase();

    if (path.includes('/admin') && rol !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos de administrador', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    if (path.includes('/donador') && rol !== 'donador') {
      Swal.fire('Acceso denegado', 'No tienes permisos de donador', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    if (path.includes('/beneficiario') && rol !== 'beneficiario') {
      Swal.fire('Acceso denegado', 'No tienes permisos de beneficiario', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

  } catch (error) {
    console.error('Token inválido:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    Swal.fire('Error', 'Token inválido. Inicia sesión nuevamente.', 'error')
      .then(() => window.location.href = '../../index.html');
  }
});
