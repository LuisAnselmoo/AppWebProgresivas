export function headerMenu() {
  const perfilIcon = document.getElementById("perfilIcon");
  const perfilDropdown = document.getElementById("perfilDropdown");
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const perfilMenu = document.getElementById("perfilMenu");
  const mainLinks = document.getElementById("mainLinks");

  // Crear contenedor para opciones de perfil móviles
  let mobileProfileLinks = null;

  // Dropdown normal
  if (perfilIcon && perfilDropdown) {
    perfilDropdown.style.display = "none";

    perfilIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      perfilDropdown.style.display =
        perfilDropdown.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!perfilDropdown.contains(e.target) && !perfilIcon.contains(e.target)) {
        perfilDropdown.style.display = "none";
      }
    });
  }

  // Menú hamburguesa 
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("active");
      menuToggle.classList.toggle("open");

      const icon = menuToggle.querySelector("i");
      if (icon.classList.contains("fa-bars")) {
        icon.classList.replace("fa-bars", "fa-xmark");
      } else {
        icon.classList.replace("fa-xmark", "fa-bars");
      }

      // Si el menú está activo (abierto)
      if (navMenu.classList.contains("active")) {
        // Oculta el botón de perfil
        perfilMenu.classList.add("hide");

        // Crea las opciones de perfil dentro del menú si no existen
        if (!mobileProfileLinks) {
          mobileProfileLinks = document.createElement("ul");
          mobileProfileLinks.classList.add("extra-links");

          mobileProfileLinks.innerHTML = `
            <li><a href="miCuenta.html">Mi Perfil</a></li>
            <li><a href="#" id="verMensajesMobile">Mensajes</a></li>
            <li><a href="#" id="btnLogoutMobile">Cerrar sesión</a></li>
          `;

          navMenu.appendChild(mobileProfileLinks);

          // Aquí añadimos el mismo evento que al botón de escritorio
          const verMensajesMobile = document.getElementById("verMensajesMobile");
          if (verMensajesMobile) {
            verMensajesMobile.addEventListener("click", (e) => {
              e.preventDefault();
              menuToggle.click(); 
              document.getElementById("verMensajes")?.click(); 
            });
          }

          // Cerrar sesión en móvil
          const btnLogoutMobile = document.getElementById("btnLogoutMobile");
          if (btnLogoutMobile) {
            btnLogoutMobile.addEventListener("click", (e) => {
              e.preventDefault();
              menuToggle.click();
              document.getElementById("btnLogout")?.click(); 
            });
          }
        }
      } else {
        // Cierra el menú 
        perfilMenu.classList.remove("hide");

        // Elimina las opciones agregadas dentro del menú
        if (mobileProfileLinks) {
          mobileProfileLinks.remove();
          mobileProfileLinks = null;
        }
      }
    });

    // Cerrar al hacer clic fuera (móvil)
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove("active");
        menuToggle.classList.remove("open");
        perfilMenu.classList.remove("hide");

        const icon = menuToggle.querySelector("i");
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

        if (mobileProfileLinks) {
          mobileProfileLinks.remove();
          mobileProfileLinks = null;
        }
      }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove("active");
        menuToggle.classList.remove("open");
        perfilMenu.classList.remove("hide");

        const icon = menuToggle.querySelector("i");
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

        if (mobileProfileLinks) {
          mobileProfileLinks.remove();
          mobileProfileLinks = null;
        }
      }
    });
  }
}
