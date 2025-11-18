// cerrarSesion.js
// cierre de sesión del usuario
document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar el botón de cerrar sesión
  const btnLogout = document.getElementById('btnLogout');

  // Agregar evento de clic al botón
  if (btnLogout) {
    // Usar SweetAlert2 para la confirmación
    btnLogout.addEventListener('click', () => {
      Swal.fire({
        title: 'Cerrar sesión',
        text: '¿Seguro que deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        // Si el usuario confirma, cerrar sesión
        if (result.isConfirmed) {
          // Eliminar datos de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          // Redirigir al usuario a la página principal
          Swal.fire('Sesión cerrada', 'Has cerrado sesión correctamente', 'success').then(() => {
            window.location.href = '../../index.html';
          });
        }
      });
    });
  }
});
