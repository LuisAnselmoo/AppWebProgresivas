// Archivo de navegación para manejar el desplazamiento suave entre secciones
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos todos los enlaces internos (los que tienen href con #)
    const enlaces = document.querySelectorAll('a[href^="#"]');

    // Agregamos un evento de clic a cada enlace
    enlaces.forEach(enlace => {
        // agregar evento de clic al enlace
        enlace.addEventListener('click', e => {
            // evitar el comportamiento predeterminado del enlace
            e.preventDefault(); 

            // obtener el id del elemento objetivo
            const targetId = enlace.getAttribute('href').substring(1);
            // seleccionar el elemento objetivo
            const targetElement = document.getElementById(targetId);

            // si el elemento existe, desplazarse hacia él
            if (targetElement) {
                // desplazamiento suave
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});