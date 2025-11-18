import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

// const socketNotif = io("http://localhost:3000");
// Detectar si estamos en producción o desarrollo
const backendURL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://ecomarket-app-875050427327.us-central1.run.app";

// Importante: usar wss:// en producción automáticamente
const socketNotif = io(backendURL, {
  transports: ["websocket"],
  withCredentials: true,
});

const userData = JSON.parse(localStorage.getItem("userData")) || {};
const userId = userData.uid;
const userRol = userData.rol || "desconocido";
const userNombre = userData.nombre || "Usuario";

socketNotif.on("connect", () => {
  if (userId) {
    socketNotif.emit("registrarUsuario", { uid: userId });
    // console.log(`[Notificaciones] Usuario ${userNombre} (${userRol}) registrado`);
  } else {
    // console.warn("No hay UID disponible para registrar en notificaciones");
  }
});

socketNotif.io.on("reconnect", () => {
  if (userId) socketNotif.emit("registrarUsuario", { uid: userId });
});

let historialNotif = JSON.parse(localStorage.getItem("historialNotif")) || [];

async function cargarNotificacionesDesdeServidor() {
  try {
    const res = await fetch(`/api/notificaciones/${userId}`);
    const data = await res.json();

    if (data.status === "success") {
      historialNotif = data.data || [];
      localStorage.setItem("historialNotif", JSON.stringify(historialNotif));
      renderNotificaciones(false);
      if (typeof actualizarNotificacion === "function") actualizarNotificacion();
    }
  } catch (err) {
    // console.error("Error al cargar notificaciones:", err);
  }
}

if (userId) cargarNotificacionesDesdeServidor();

const badgeNotificaciones = document.getElementById("badgeNotificaciones");
const listaNotif = document.getElementById("listaNotificaciones");

function renderNotificaciones(nueva = false) {
  if (!badgeNotificaciones) return;
  const cantidad = historialNotif.filter((n) => !n.visto).length;

  if (cantidad > 0) {
    badgeNotificaciones.textContent = cantidad;
    badgeNotificaciones.classList.add("visible");
    if (nueva) {
      badgeNotificaciones.classList.add("blink");
      setTimeout(() => badgeNotificaciones.classList.remove("blink"), 2500);
    }
  } else {
    badgeNotificaciones.classList.remove("visible");
  }

  if (listaNotif) {
    listaNotif.innerHTML = "";
    historialNotif.forEach((n) => {
      const item = document.createElement("div");
      item.classList.add("notif-item", n.estado);
      item.innerHTML = `
        <p><strong>${n.mensaje}</strong></p>
        <small>${new Date(n.fechaRevision || n.fechaCreacion).toLocaleString("es-MX")}</small>
      `;
      listaNotif.appendChild(item);
    });
  }
}

// ---------------- AGREGAR NUEVA NOTIFICACIÓN ----------------
function agregarNotificacion(nueva) {
  const notifCompleta = { ...nueva, visto: false };
  historialNotif.unshift(notifCompleta);
  localStorage.setItem("historialNotif", JSON.stringify(historialNotif));
  renderNotificaciones(true);
  if (typeof actualizarNotificacion === "function") actualizarNotificacion();
}

// ---------------- EVENTOS DE SOCKET ----------------
socketNotif.on("solicitudActualizada", async (data) => {
  // console.log("Notificación recibida:", data);

  const { tipo, nuevoEstado, observacion } = data;
  const icon = nuevoEstado === "aprobado" ? "success" : "error";

  const msgBase = tipo === "beneficiario"
    ? "Tu solicitud de alimentos"
    : "Tu donación de alimentos";

  const mensaje =
    nuevoEstado === "aprobado"
      ? `${msgBase} ha sido aprobada`
      : `${msgBase} fue rechazada`;

  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: mensaje,
    text: observacion ? `Motivo: ${observacion}` : "",
    timer: 4000,
    showConfirmButton: false,
    background: "#fffef8",
  });

  // Efecto visual en icono principal
  const notif = document.getElementById("notif");
  if (notif) {
    notif.classList.add("blink");
    setTimeout(() => notif.classList.remove("blink"), 2500);
  }


  await cargarNotificacionesDesdeServidor();

  const evento = new CustomEvent("solicitudActualizadaRealtime", { detail: data });
  document.dispatchEvent(evento);
});

socketNotif.on("nuevaSolicitud", (data) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: data.mensaje,
    timer: 3500,
    showConfirmButton: false,
  });

  const notif = document.getElementById("notif");
  if (notif) {
    notif.classList.add("blink");
    setTimeout(() => notif.classList.remove("blink"), 2500);
  }

  const evento = new CustomEvent("solicitudNuevaRealtime", { detail: data });
  document.dispatchEvent(evento);
});

socketNotif.on("solicitudEliminada", (data) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    title: data.mensaje,
    timer: 3500,
    showConfirmButton: false,
  });

  const notif = document.getElementById("notif");
  if (notif) {
    notif.classList.add("blink");
    setTimeout(() => notif.classList.remove("blink"), 2500);
  }

  const evento = new CustomEvent("solicitudEliminadaRealtime", { detail: data });
  document.dispatchEvent(evento);
});

// ---------------- PANEL DE NOTIFICACIONES ----------------
const btnNotificaciones = document.getElementById("btnNotificaciones");

btnNotificaciones?.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!historialNotif || historialNotif.length === 0) {
    Swal.fire("Sin notificaciones", "No tienes notificaciones nuevas.", "info");
    return;
  }

  const listaHTML = historialNotif
    .map(
      (n) => `
      <div class="notif-item ${n.estado}">
        <p><strong>${n.mensaje}</strong></p>
        ${n.comentarios ? `<p><em>${n.comentarios}</em></p>` : ""}
        <small>${new Date(n.fechaRevision || n.fechaCreacion).toLocaleString("es-MX")}</small>
      </div>`
    )
    .join("");

  Swal.fire({
    title: "Notificaciones",
    html: `<div class="lista-notif">${listaHTML}</div>`,
    showConfirmButton: false,
    showCloseButton: true,
    width: 380,
  });

  //Marcar como vistas en Firestore
  await fetch(`/api/notificaciones/marcar-vistas/${userId}`, { method: "PATCH" });

  //Actualizar local y UI
  historialNotif = historialNotif.map((n) => ({ ...n, visto: true }));
  localStorage.setItem("historialNotif", JSON.stringify(historialNotif));
  renderNotificaciones(false);
  if (typeof actualizarNotificacion === "function") actualizarNotificacion();
});