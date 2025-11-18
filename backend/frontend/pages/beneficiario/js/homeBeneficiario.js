import { headerMenu } from "./header.js";
import "./notificaciones.js";
import "./app.js";
import "../../js/app.js";

document.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const uid = localStorage.getItem("uid");
  const contenedor = document.getElementById("solicitudesContainer");
  const noSolicitudesMsg = document.getElementById("noSolicitudesMsg");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  if (!uid) {
    Swal.fire("Error", "Usuario no autenticado", "error");
    return;
  }

  //Cargar solicitudes del usuario
  async function cargarSolicitudes() {
    try {
      const res = await fetch(`/api/solicitudAlimento/usuario/${uid}`);
      const data = await res.json();

      contenedor.innerHTML = "";

      if (data.status === "success" && data.data.length > 0) {
        noSolicitudesMsg.style.display = "none";

        //Filtrar solo las solicitudes pendientes
        const pendientes = data.data.filter(
          (s) => s.estatusSolicitud?.toLowerCase() === "pendiente"
        );

        if (pendientes.length === 0) {
          noSolicitudesMsg.style.display = "block";
          btnPrev.style.display = "none";
          btnNext.style.display = "none";
          return;
        }

        pendientes.forEach((solicitud) => {
          const card = document.createElement("div");
          card.classList.add("solicitud-card");

          const fecha = new Date(solicitud.fechaRegistro).toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          card.innerHTML = `
      <div class="solicitud-header">
        <h3>${solicitud.nombreBeneficiario || solicitud.nombre}</h3>
        <span class="estado pendiente">Pendiente</span>
      </div>

      <div class="solicitud-body">
        <h4>Información</h4>
        <p><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidoPaterno || ""} ${solicitud.apellidoMaterno || ""}</p>
        <p><strong>Correo:</strong> ${solicitud.correo}</p>
        <p><strong>Teléfono:</strong> ${solicitud.telefono || "No especificado"}</p>
        <h4>Detalle</h4>
        <p><strong>Alimentos:</strong> ${solicitud.tipoAlimentos?.join(", ") || "No especificado"}</p>
        <p><strong>Cantidad:</strong> ${solicitud.cantidad || "N/A"}</p>
        <p><strong>Frecuencia:</strong> ${solicitud.frecuencia || "N/A"}</p>
      </div>

      <div class="solicitud-footer">
        <span><strong>Registrado:</strong> ${fecha}</span>
      </div>
    `;
          contenedor.appendChild(card);
        });

        configurarCarrusel();
      } else {
        noSolicitudesMsg.style.display = "block";
        btnPrev.style.display = "none";
        btnNext.style.display = "none";
      }
    } catch (err) {
      console.error("Error al obtener solicitudes:", err);
      Swal.fire("Error", "No se pudieron cargar las solicitudes", "error");
    }
  }

  //Carrusel visual
  function configurarCarrusel() {
    const cards = Array.from(contenedor.querySelectorAll(".solicitud-card"));
    let current = 0;

    if (cards.length < 3) {
      btnPrev.style.display = "none";
      btnNext.style.display = "none";
      contenedor.style.display = "flex";
      contenedor.style.justifyContent = "center";
      contenedor.style.alignItems = "flex-start";
      contenedor.style.gap = "2rem";
      contenedor.style.flexWrap = "wrap";
      cards.forEach((card) => {
        card.style.position = "static";
        card.style.opacity = "1";
        card.style.transform = "none";
      });
      return;
    }

    btnPrev.style.display = "flex";
    btnNext.style.display = "flex";

    function updateCarousel() {
      const total = cards.length;
      cards.forEach((card, i) => {
        card.classList.remove("active", "left", "right", "hidden");
        const prev = (current - 1 + total) % total;
        const next = (current + 1) % total;
        if (i === current) card.classList.add("active");
        else if (i === prev) card.classList.add("left");
        else if (i === next) card.classList.add("right");
        else card.classList.add("hidden");
      });
    }

    btnNext.onclick = () => {
      current = (current + 1) % cards.length;
      updateCarousel();
    };
    btnPrev.onclick = () => {
      current = (current - 1 + cards.length) % cards.length;
      updateCarousel();
    };

    contenedor.onwheel = (e) => {
      if (cards.length < 2) return;
      e.preventDefault();
      if (e.deltaY > 0) btnNext.click();
      else btnPrev.click();
    };

    updateCarousel();
  }
  //Cargar inicialmente
  await cargarSolicitudes();

  //Actualizar en tiempo real desde notificaciones.js
  document.addEventListener("solicitudActualizadaRealtime", cargarSolicitudes);
  document.addEventListener("solicitudNuevaRealtime", cargarSolicitudes);
  document.addEventListener("solicitudEliminadaRealtime", cargarSolicitudes);
});
