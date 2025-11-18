import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { headerMenu } from "./header.js";
import "./app.js";
import "../../js/app.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const contenedor = document.getElementById("asignacionesContainer");

  // Cargar asignaciones sin asignar
  async function cargarAsignaciones() {
    try {
      const res = await fetch("/api/admin/asignaciones/sin-asignar");
      const data = await res.json();
      const { beneficiarios, donadores } = data.data;

      // Helper para renderizar productos de forma bonita
      const renderProductos = (lista = []) => {
        if (!lista.length)
          return "<p class='sin-productos'>Sin productos registrados.</p>";

        return `
          <div class="productos-container">
            ${lista
            .map(
              (p, i) => `
              <div class="producto-item">
                <span class="badge">${i + 1}</span>
                <h5>${p.nombre || p || "Producto"}</h5>
                <p>${p.categoria || ""} ${p.cantidad ? `- ${p.cantidad} ${p.unidad || ""}` : ""
                }</p>
              </div>`
            )
            .join("")}
          </div>`;
      };

      // Render principal
      contenedor.innerHTML = `
        <h2 class="titulo-seccion">Solicitudes sin asignar</h2>

        <section>
          <h3>Beneficiarios sin donador asignado</h3>
          ${beneficiarios.length
          ? beneficiarios
            .map(
              (b) => `
              <div class="asignacion-card" data-tipo="beneficiario">
                <h4>${b.nombre || "Beneficiario"} ${b.apellidoPaterno || ""
                }</h4>
                <p><strong>Frecuencia:</strong> ${b.frecuencia || "-"}</p>
                <p><strong>Urgencia:</strong> ${b.urgencia || "-"}</p>
                <h5 class="subtitulo-productos">Productos solicitados:</h5>
                ${renderProductos(b.tipoAlimentos || b.productos || [])}
                <button class="btn-asignar" data-tipo="beneficiario" data-id="${b.id
                }">
                  <i class="fa-solid fa-link"></i> Asignar Donador
                </button>
              </div>`
            )
            .join("")
          : "<p class='sin-solicitudes'>No hay solicitudes sin asignar.</p>"
        }
        </section>

        <section>
          <h3>Donadores sin beneficiario asignado</h3>
          ${donadores.length
          ? donadores
            .map(
              (d) => `
              <div class="asignacion-card" data-tipo="donador">
                <h4>${d.nombre || "Donador"} ${d.apellidoPaterno || ""}</h4>
                <p><strong>Modalidad:</strong> ${d.modalidad || "-"}</p>
                <h5 class="subtitulo-productos">Productos disponibles:</h5>
                ${renderProductos(d.productos || [])}
                <button class="btn-asignar" data-tipo="donador" data-id="${d.id}">
                  <i class="fa-solid fa-link"></i> Asignar Beneficiario
                </button>
              </div>`
            )
            .join("")
          : "<p class='sin-solicitudes'>No hay donaciones sin asignar.</p>"
        }
        </section>
      `;
    } catch (err) {
      // console.error(err);
      contenedor.innerHTML = `<p class='sin-solicitudes'>Error al cargar las asignaciones.</p>`;
    }
  }

  await cargarAsignaciones();

  // Asignar beneficiario ↔ donador
  contenedor.addEventListener("click", async (e) => {
    if (!e.target.closest(".btn-asignar")) return;

    const boton = e.target.closest(".btn-asignar");
    const tipo = boton.dataset.tipo;
    const id = boton.dataset.id;

    const listaUrl =
      tipo === "beneficiario"
        ? "/api/verDonadores/usuarios"
        : "/api/verBeneficiarios/usuarios";

    const res = await fetch(listaUrl);
    const lista = (await res.json()).data || [];

    const opciones = lista
      .map(
        (u) =>
          `<option value="${u.id}">${u.nombre || u.nombreEmpresa || "Usuario"}</option>`
      )
      .join("");

    const { value: seleccionado } = await Swal.fire({
      title:
        tipo === "beneficiario" ? "Asignar Donador" : "Asignar Beneficiario",
      html: `<select id="asignarSelect" class="swal2-select">${opciones}</select>`,
      showCancelButton: true,
      confirmButtonText: "Asignar",
      preConfirm: () => document.getElementById("asignarSelect").value,
    });

    if (!seleccionado) return;

    const resp = await fetch("/api/admin/asignaciones/asignar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, solicitudId: id, destinoId: seleccionado }),
    });

    const json = await resp.json();
    if (json.status === "success") {
      Swal.fire("Éxito", json.message, "success");
      cargarAsignaciones();
    } else {
      Swal.fire("Error", json.message, "error");
    }
  });

  // Socket.IO para actualizaciones en tiempo real
  // const socket = io("http://localhost:3000", { transports: ["websocket"] });
  // chat.js o socket.js

  // Detectar si estamos en producción o desarrollo
  const backendURL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ecomarket-app-875050427327.us-central1.run.app";

  // Importante: usar wss:// en producción automáticamente
  const socket = io(backendURL, {
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () =>
    console.log(" Asignaciones conectadas en tiempo real")
  );
  socket.on("solicitudesActualizadas", () => cargarAsignaciones());
});
