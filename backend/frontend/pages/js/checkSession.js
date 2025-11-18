// js/checkSession.js
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario está logueado
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  // Si no hay token, redirigir al inicio
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
    // console.log('Usuario logueado:', payload);

    localStorage.setItem('userData', JSON.stringify(payload));
    localStorage.setItem('uid', payload.uid);
    localStorage.setItem('rol', payload.rol);

    // Verificación de expiración
    const ahora = Math.floor(Date.now() / 1000);
    // Si el token ha expirado, eliminar datos y redirigir
    if (payload.exp && payload.exp < ahora) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('userData');

      Swal.fire('Sesión expirada', 'Por favor, inicia sesión nuevamente.', 'warning')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    // Verificación de rol según ruta actual
    const path = window.location.pathname.toLowerCase();

    // Redirigir si el rol no coincide con la ruta
    if (path.includes('/admin') && rol !== 'admin') {
      Swal.fire('Acceso denegado', 'No tienes permisos de administrador', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    // Verificaciones para donador y beneficiario
    if (path.includes('/donador') && rol !== 'donador') {
      Swal.fire('Acceso denegado', 'No tienes permisos de donador', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

    // Verificación para beneficiario
    if (path.includes('/beneficiario') && rol !== 'beneficiario') {
      Swal.fire('Acceso denegado', 'No tienes permisos de beneficiario', 'error')
        .then(() => (window.location.href = '../../index.html'));
      return;
    }

  } catch (error) {
    // Si el token no es válido, eliminar datos y redirigir
    // console.error('Token inválido:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('userData');

    Swal.fire('Error', 'Token inválido. Inicia sesión nuevamente.', 'error')
      .then(() => window.location.href = '../../index.html');
  }
});
