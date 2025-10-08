document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      Swal.fire({
        title: 'Cerrar sesión',
        text: '¿Seguro que deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          // Eliminar datos de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          Swal.fire('Sesión cerrada', 'Has cerrado sesión correctamente', 'success').then(() => {
            window.location.href = '../../index.html';
          });
        }
      });
    });
  }
});
