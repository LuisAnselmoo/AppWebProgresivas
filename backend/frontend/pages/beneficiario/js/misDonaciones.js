import { headerMenu } from "./header.js";
import "../../js/app.js";
import "./notificaciones.js";
import "./app.js";
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();
  const uid = localStorage.getItem("uid");
  const contenedor = document.getElementById("donacionesContainer");

  if (!uid) return Swal.fire("Error", "Usuario no autenticado", "error");

  // Configuración de Socket.IO
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

  socket.on("connect", () => socket.emit("registrarUsuario", { uid }));
  socket.on("nuevaSolicitud", (d) => d.tipo === "beneficiario" && cargarListas());
  socket.on("solicitudActualizada", (d) => d.tipo === "beneficiario" && cargarListas());
  socket.on("entregaActualizada", (d) => d.tipo === "beneficiario" && cargarListas());

  await cargarListas();

  // Carga general
  async function cargarListas() {
    contenedor.innerHTML = `
      <section class="bloque-donaciones">
        <h3 class="subtitulo">Donaciones pendientes de aceptar</h3>
        <div id="donacionesPendientes" class="donaciones-lista"></div>
      </section>

      <section class="bloque-donaciones">
        <h3 class="subtitulo">Solicitudes y donaciones aprobadas</h3>
        <div id="aprobadas" class="donaciones-lista"></div>
      </section>
    `;

    await Promise.all([cargarPendientes(), cargarAprobadas()]);
  }

  // Donaciones pendientes
  async function cargarPendientes() {
    const res = await fetch(`/api/beneficiario/donaciones-asignadas/${uid}`);
    const data = await res.json();
    const lista = document.getElementById("donacionesPendientes");

    if (data.status !== "success" || data.data.length === 0)
      return (lista.innerHTML = `<p class="sin-items">No tienes donaciones pendientes.</p>`);

    lista.innerHTML = data.data
      .map(
        (d) => `
      <div class="donacion-card pendiente">
        <div class="donacion-header">
          <i class="fa-solid fa-hand-holding-heart icon-header"></i>
          <h3>${d.nombreEmpresa || "Donador"} te ha asignado una donación</h3>
        </div>

        <div class="donacion-detalles">
          <p><strong>Modalidad:</strong> ${d.modalidad || "Directa"}</p>
          <p><strong>Fecha asignación:</strong> ${
            d.fechaCreacion
              ? new Date(d.fechaCreacion).toLocaleDateString("es-MX")
              : "-"
          }</p>
          <p><strong>Estatus actual:</strong> <span class="estado-pendiente">Pendiente</span></p>
        </div>

        <div class="productos-box">
          <h4><i class="fa-solid fa-box-open"></i> Productos incluidos</h4>
          ${
            Array.isArray(d.productos) && d.productos.length
              ? `<ul class="lista-productos">
                  ${d.productos
                    .map(
                      (p) => `
                      <li>
                        <i class="fa-solid fa-leaf icono-prod"></i>
                        <span class="prod-nombre">${p.nombre || "Producto"}</span>
                        <span class="prod-cant">(${p.cantidad || 1} ${p.unidad || ""})</span>
                      </li>`
                    )
                    .join("")}
                 </ul>`
              : "<p class='sin-items'>Sin productos registrados.</p>"
          }
        </div>

        <div class="acciones">
          <button class="btn-aceptar" data-id="${d.id}">
            <i class="fa-solid fa-check"></i> Aceptar
          </button>
          <button class="btn-rechazar" data-id="${d.id}">
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
        </div>
      </div>`
      )
      .join("");
  }

  // Donaciones y solicitudes aprobadas
  async function cargarAprobadas() {
    const [donRes, solRes] = await Promise.all([
      fetch(`/api/beneficiario/donaciones-aprobadas/${uid}`),
      fetch(`/api/beneficiario/solicitudes-aprobadas/${uid}`),
    ]);

    const donaciones = (await donRes.json()).data || [];
    const solicitudes = (await solRes.json()).data || [];
    const todas = [...donaciones, ...solicitudes];
    const lista = document.getElementById("aprobadas");

    if (todas.length === 0)
      return (lista.innerHTML = `<p class="sin-items">No tienes donaciones o solicitudes aprobadas aún.</p>`);

    lista.innerHTML = todas
      .map((d) => {
        const estadoGlobal = d.estatusEntrega || "en curso";
        const estadoBenef = d.estatusEntregaBeneficiario || "pendiente";
        const estadoDonador = d.estatusEntregaDonador || "pendiente";

        let estadoTexto = "";
        let clase = "";

        switch (estadoGlobal) {
          case "finalizada":
            estadoTexto = "Finalizada";
            clase = "estado-recibida";
            break;
          case "cancelada":
            estadoTexto = "Cancelada";
            clase = "estado-no-recibida";
            break;
          default:
            estadoTexto = "En curso";
            clase = "estado-pendiente";
        }

        const listaProductos = d.productos || [];
        const productosHTML =
          listaProductos.length > 0
            ? `<ul class="lista-productos">
                ${listaProductos
                  .map(
                    (p) => `
                    <li>
                      <i class="fa-solid fa-leaf icono-prod"></i>
                      <span class="prod-nombre">${p.nombre || "Producto"}</span>
                      <span class="prod-cant">(${p.cantidad || 1} ${p.unidad || ""})</span>
                    </li>`
                  )
                  .join("")}
               </ul>`
            : `<p class="sin-items">Sin productos registrados.</p>`;

        return `
          <div class="donacion-card aprobada">
            <div class="donacion-header">
              <i class="fa-solid fa-hand-holding-heart icon-header"></i>
              <h3>${
                d.tipo === "solicitud"
                  ? "Solicitud aprobada"
                  : d.nombreEmpresa || "Donación aprobada"
              }</h3>
            </div>

            <div class="donacion-detalles">
              <p><strong>Tipo:</strong> ${
                d.tipo === "solicitud" ? "Solicitud" : "Donación"
              }</p>
              <p><strong>Estatus global:</strong> <span class="${clase}">${estadoTexto}</span></p>
              <p><strong>Donador:</strong> ${estadoDonador}</p>
              <p><strong>Tú:</strong> ${estadoBenef}</p>
            </div>

            <div class="productos-box">
              <h4><i class="fa-solid fa-carrot"></i> Productos</h4>
              ${productosHTML}
            </div>

            ${
              estadoGlobal === "en curso" &&
              (d.estatusEntregaDonador === "entregada" ||
                d.estatusEntregaDonador?.toLowerCase() === "entregada")
                ? `<div class="acciones">
                    <button class="btn-aceptar"
                      data-id="${d.id}"
                      data-tipo="${d.tipo}"
                      data-recepcion="true"
                      ${
                        !d.estatusEntregaBeneficiario ||
                        d.estatusEntregaBeneficiario === "pendiente"
                          ? ""
                          : "disabled"
                      }>
                      <i class="fa-solid fa-check"></i> Recibí
                    </button>
                    <button class="btn-rechazar"
                      data-id="${d.id}"
                      data-tipo="${d.tipo}"
                      data-recepcion="false"
                      ${
                        !d.estatusEntregaBeneficiario ||
                        d.estatusEntregaBeneficiario === "pendiente"
                          ? ""
                          : "disabled"
                      }>
                      <i class="fa-solid fa-xmark"></i> No recibí
                    </button>
                  </div>`
                : ""
            }
          </div>`;
      })
      .join("");
  }

  // Acciones de botones
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const tipo = btn.dataset.tipo;

    // Aceptar donación pendiente
    if (btn.classList.contains("btn-aceptar") && !btn.dataset.recepcion) {
      const { isConfirmed, value: comentario } = await Swal.fire({
        title: "¿Aceptar esta donación?",
        input: "text",
        inputPlaceholder: "Comentario (opcional)",
        showCancelButton: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await fetch(`/api/beneficiario/aceptar-donacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceptar: true, comentarios: comentario }),
      });

      Swal.fire("Donación aceptada", "Se ha actualizado correctamente.", "success");
      cargarListas();
      return;
    }

    // Rechazar donación pendiente
    if (btn.classList.contains("btn-rechazar") && !btn.dataset.recepcion) {
      const { isConfirmed, value: comentario } = await Swal.fire({
        title: "¿Rechazar esta donación?",
        input: "text",
        inputPlaceholder: "Motivo o comentario (opcional)",
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await fetch(`/api/beneficiario/aceptar-donacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceptar: false, comentarios: comentario }),
      });

      Swal.fire("Donación rechazada", "Se ha actualizado correctamente.", "success");
      cargarListas();
      return;
    }

    // Confirmar recepción física
    if (btn.dataset.recepcion) {
      const recibida = btn.dataset.recepcion === "true";
      const { value: comentario, isConfirmed } = await Swal.fire({
        title: recibida ? "¿Confirmas que recibiste esta entrega?" : "¿No recibiste la entrega?",
        input: "text",
        inputPlaceholder: "Comentario (opcional)",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await fetch(`/api/beneficiario/confirmar-recepcion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recibida, comentarios: comentario, tipo }),
      });

      Swal.fire("Actualizado", "Estado actualizado correctamente", "success");
      cargarListas();
    }
  });
});
