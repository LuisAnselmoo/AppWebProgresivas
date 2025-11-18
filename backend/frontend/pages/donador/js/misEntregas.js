import { headerMenu } from "./header.js";
import "../../js/app.js";
import "./notificaciones.js";
import "./app.js";
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();

  const uid = localStorage.getItem("uid");
  const contenedorSolicitudes = document.getElementById("solicitudesAsignadas");
  const contenedorDonaciones = document.getElementById("donacionesAprobadas");

  if (!uid) return Swal.fire("Error", "Usuario no autenticado", "error");

  // const socket = io("http://localhost:3000", { transports: ["websocket"] });

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
  socket.on("solicitudActualizada", (d) => d.tipo === "donador" && cargarListas());
  socket.on("nuevaSolicitud", (d) => d.tipo === "donador" && cargarListas());

  await cargarListas();

  async function cargarListas() {
    contenedorSolicitudes.innerHTML = `<p class="cargando">Cargando solicitudes...</p>`;
    contenedorDonaciones.innerHTML = `<p class="cargando">Cargando donaciones...</p>`;
    await Promise.all([cargarSolicitudes(), cargarDonaciones()]);
  }

  // Solicitudes pendientes
  async function cargarSolicitudes() {
    const res = await fetch(`/api/donador/solicitudes-asignadas/${uid}`);
    const data = await res.json();

    if (data.status !== "success" || data.data.length === 0)
      return (contenedorSolicitudes.innerHTML = `<p class="sin-items">No tienes solicitudes pendientes.</p>`);

    contenedorSolicitudes.innerHTML = data.data
      .map(
        (s) => `
        <div class="donacion-card">
          <div class="donacion-header">
            <i class="fa-solid fa-basket-shopping icon-header"></i>
            <h3>Solicitud de ${s.nombreBeneficiario || "Beneficiario"}</h3>
          </div>
          <p><strong>Fecha solicitud:</strong> ${s.fechaRegistro ? new Date(s.fechaRegistro).toLocaleDateString("es-MX") : "-"
          }</p>
          <p><strong>Estatus:</strong> <span class="estado-pendiente">${s.estatusSolicitud}</span></p>
          <div class="productos-box">
            <h4><i class="fa-solid fa-utensils"></i> Alimentos solicitados</h4>
            <ul class="lista-productos">
              ${s.productos
            .map(
              (p) =>
                `<li><i class="fa-solid fa-leaf icono-prod"></i>
                      <span class="prod-nombre">${p.nombre}</span>
                      <span class="prod-cant">(${p.cantidad} ${p.unidad})</span></li>`
            )
            .join("")}
            </ul>
          </div>
          <div class="acciones">
            <button class="btn-aceptar" data-id="${s.id}" data-tipo="aprobar">
              <i class="fa-solid fa-check"></i> Aprobar
            </button>
            <button class="btn-rechazar" data-id="${s.id}" data-tipo="rechazar">
              <i class="fa-solid fa-xmark"></i> Rechazar
            </button>
          </div>
        </div>`
      )
      .join("");
  }

  // Donaciones / solicitudes en curso
  async function cargarDonaciones() {
    const res = await fetch(`/api/donador/donaciones-aprobadas/${uid}`);
    const data = await res.json();

    if (data.status !== "success" || data.data.length === 0)
      return (contenedorDonaciones.innerHTML = `<p class="sin-items">Aún no tienes entregas activas.</p>`);

    contenedorDonaciones.innerHTML = data.data
      .map((d) => {
        const estadoGlobal = d.estatusEntrega || "en curso";
        const estadoDonador = d.estatusEntregaDonador || "pendiente";
        const estadoBeneficiario = d.estatusEntregaBeneficiario || "pendiente";

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
          case "en curso":
          default:
            estadoTexto = "En curso";
            clase = "estado-pendiente";
            break;
        }

        return `
        <div class="donacion-card aprobada">
          <div class="donacion-header">
            <i class="fa-solid fa-hand-holding-heart icon-header"></i>
            <h3>${d.tipo === "solicitud" ? "Solicitud aprobada" : "Donación aprobada"}</h3>
          </div>
          <p><strong>Beneficiario:</strong> ${d.beneficiarioAsignadoNombre || "No especificado"}</p>
          <p><strong>Estatus global:</strong> <span class="${clase}">${estadoTexto}</span></p>
          <p><strong>Tú:</strong> ${estadoDonador}</p>
          <p><strong>Beneficiario:</strong> ${estadoBeneficiario}</p>

          <div class="productos-box">
            <h4><i class="fa-solid fa-box-open"></i> Productos</h4>
            <ul class="lista-productos">
              ${(d.productos || [])
            .map(
              (p) =>
                `<li><i class="fa-solid fa-leaf icono-prod"></i>
                      <span class="prod-nombre">${p.nombre}</span>
                      <span class="prod-cant">(${p.cantidad} ${p.unidad})</span></li>`
            )
            .join("")}
            </ul>
          </div>

          ${estadoGlobal === "en curso"
            ? `<div class="acciones">
      <button class="btn-aceptar"
        data-id="${d.id}"
        data-tipo="${d.tipo}"
        data-entrega="true"
        ${(!d.estatusEntregaDonador || d.estatusEntregaDonador === "pendiente") ? "" : "disabled"}>
        <i class="fa-solid fa-check"></i> Entregada
      </button>
      <button class="btn-rechazar"
        data-id="${d.id}"
        data-tipo="${d.tipo}"
        data-entrega="false"
        ${(!d.estatusEntregaDonador || d.estatusEntregaDonador === "pendiente") ? "" : "disabled"}>
        <i class="fa-solid fa-xmark"></i> No entregada
      </button>
    </div>`
            : ""}


        </div>`;
      })
      .join("");
  }

  // Acciones
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const tipo = btn.dataset.tipo;
    const entrega = btn.dataset.entrega;

    // Aprobación o rechazo
    if (tipo === "aprobar" || tipo === "rechazar") {
      const aprobado = tipo === "aprobar";
      const { value: comentario, isConfirmed } = await Swal.fire({
        title: aprobado ? "¿Aprobar solicitud?" : "¿Rechazar solicitud?",
        input: "text",
        inputPlaceholder: "Comentario (opcional)",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      });

      if (!isConfirmed) return;

      await fetch(`/api/donador/revisar-solicitud/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobado, comentario }),
      });

      Swal.fire("Listo", "Estado actualizado correctamente", "success");
      cargarListas();
      return;
    }

    // Confirmar entrega
    if (entrega) {
      const entregada = entrega === "true";
      const { value: comentario, isConfirmed } = await Swal.fire({
        title: entregada ? "¿Confirmas la entrega?" : "¿No se pudo entregar?",
        input: "text",
        inputPlaceholder: "Comentario (opcional)",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      });

      if (!isConfirmed) return;

      await fetch(`/api/donador/confirmar-entrega/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entregada, comentarios: comentario, tipo }),
      });

      Swal.fire("Actualizado", "Estado de entrega actualizado", "success");
      cargarListas();
    }
  });
});
