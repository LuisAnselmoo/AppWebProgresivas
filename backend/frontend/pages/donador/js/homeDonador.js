import { headerMenu } from "./header.js";
import "./notificaciones.js";
import "./app.js";
import "../../js/app.js";

document.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const uid = localStorage.getItem("uid");
  const contenedor = document.getElementById("donacionesContainer");
  const noDonacionesMsg = document.getElementById("noDonacionesMsg");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  if (!uid) {
    Swal.fire("Error", "Usuario no autenticado", "error");
    return;
  }

  // Cargar donaciones del usuario
  async function cargarDonaciones() {
    try {
      const res = await fetch(`/api/solicitudDonacion/usuario/${uid}`);
      const data = await res.json();

      contenedor.innerHTML = "";

      if (data.status === "success" && data.data.length > 0) {
        noDonacionesMsg.style.display = "none";


        const donaciones = data.data.filter(
          (d) => d.estatusDonacion?.toLowerCase() === "pendiente"
        );

        if (donaciones.length === 0) {
          noDonacionesMsg.style.display = "block";
          btnPrev.style.display = "none";
          btnNext.style.display = "none";
          return;
        }

        donaciones.forEach((donacion) => {
          const card = document.createElement("div");
          card.classList.add("donacion-card");

          const fecha = new Date(donacion.fechaRegistro || Date.now()).toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          const productosHTML = Array.isArray(donacion.productos)
            ? donacion.productos.map((p) => `<li><strong>${p.nombre}</strong> - ${p.cantidad} ${p.unidad}</li>`).join("")
            : "<li>No se registraron productos</li>";

          card.innerHTML = `
            <div class="donacion-header">
              <h3>${donacion.nombreEmpresa || "Donación Individual"}</h3>
              <span class="estado ${donacion.estatusDonacion?.toLowerCase() || "pendiente"}">
                ${donacion.estatusDonacion || "Pendiente"}
              </span>
            </div>

            <div class="donacion-body">
              <h4>Detalles</h4>
              <p><strong>Modalidad:</strong> ${donacion.modalidad || "N/A"}</p>
              <p><strong>Fecha Programada:</strong> ${donacion.fechaRecoleccion || "N/A"}</p>
              <p><strong>Hora:</strong> ${donacion.horaRecoleccion || "N/A"}</p>
              <h4>Productos Donados</h4>
              <ul>${productosHTML}</ul>
            </div>

            <div class="donacion-footer">
              <span><strong>Registrada:</strong> ${fecha}</span>
            </div>
          `;

          contenedor.appendChild(card);
        });

        configurarCarrusel();
      } else {
        noDonacionesMsg.style.display = "block";
        btnPrev.style.display = "none";
        btnNext.style.display = "none";
      }
    } catch (error) {
      // console.error("Error al obtener donaciones:", error);
      Swal.fire("Error", "No se pudieron cargar las donaciones", "error");
    }
  }

  // Configurar carrusel visual
  function configurarCarrusel() {
    const cards = Array.from(contenedor.querySelectorAll(".donacion-card"));
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

  await cargarDonaciones();

  document.addEventListener("solicitudActualizadaRealtime", cargarDonaciones);
  document.addEventListener("solicitudNuevaRealtime", cargarDonaciones);
  document.addEventListener("solicitudEliminadaRealtime", cargarDonaciones);
});